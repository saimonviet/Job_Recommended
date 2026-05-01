import os
import json

from flask import Blueprint, request, jsonify, send_from_directory
from .models import db, User, Job, InforUser
import hashlib
from datetime import datetime
from werkzeug.utils import secure_filename

main = Blueprint('main', __name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'uploads')


def _save_avatar_file(avatar_file, username):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    original_name = secure_filename(avatar_file.filename or 'avatar')
    _, extension = os.path.splitext(original_name)
    filename = f"{username}_{datetime.now().strftime('%Y%m%d%H%M%S')}{extension or '.png'}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    avatar_file.save(file_path)
    return f"/uploads/{filename}"


def _find_or_create_infor_by_username(username, user_id=None):
    infor = InforUser.query.filter_by(username=username).first()
    if not infor:
        infor = InforUser(username=username, user_id=user_id)
        db.session.add(infor)
    elif user_id and not infor.user_id:
        infor.user_id = user_id
    return infor


def _extract_experience_range_and_skills(experiences):
    years = []
    skills = []

    for exp in experiences:
        start_date = exp.get('startDate')
        end_date = exp.get('endDate')

        if isinstance(start_date, str) and len(start_date) >= 4 and start_date[:4].isdigit():
            years.append(int(start_date[:4]))

        if end_date == 'Hiện tại':
            years.append(datetime.now().year)
        elif isinstance(end_date, str) and len(end_date) >= 4 and end_date[:4].isdigit():
            years.append(int(end_date[:4]))

        exp_skills = exp.get('skills') or []
        if isinstance(exp_skills, list):
            for skill in exp_skills:
                if isinstance(skill, str) and skill.strip():
                    skills.append(skill.strip())

    unique_skills = list(dict.fromkeys(skills))
    exp_min = str(min(years)) if years else None
    exp_max = str(max(years)) if years else None
    return exp_min, exp_max, unique_skills


@main.route('/register', methods=['POST'])
def register_seeker():
    data = request.get_json(silent=True) or {}
    username = (data.get('username') or data.get('email') or '').strip()
    email = (data.get('email') or '').strip()
    raw_password = data.get('password')
    password = hashlib.md5(raw_password.encode('utf-8')).hexdigest() if raw_password else ''

    if not username or not email or not password:
        return jsonify({"message": "Thiếu thông tin đăng ký"}), 400

    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"message": "Tài khoản đã tồn tại"}), 409

    user = User(username=username, email=email, password=password)
    db.session.add(user)
    db.session.flush()

    _find_or_create_infor_by_username(username=username, user_id=user.id)
    db.session.commit()

    return jsonify({
        "message": "Đăng ký thành công",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        }
    }), 201

# CREATE
@main.route('/users', methods=['POST'])
def create_user():
    data = request.get_json(silent=True) or {}
    raw_password = data.get('password')
    password = hashlib.md5(raw_password.encode('utf-8')).hexdigest() if raw_password else None
    user = User(username=data['username'], email=data['email'], password=password)
    db.session.add(user)
    db.session.flush()
    _find_or_create_infor_by_username(username=data['username'], user_id=user.id)
    db.session.commit()
    return jsonify({
        "message": "User created",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        }
    })

# READ
@main.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([
        {"id": u.id, "username": u.username, "email": u.email}
        for u in users
    ])

# JOB ENDPOINTS
@main.route('/jobs', methods=['GET'])
def get_jobs():
    """Lấy danh sách công việc với phân trang và bộ lọc"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    search = request.args.get('search', '', type=str)
    location = request.args.get('location', '', type=str)
    salary_min = request.args.get('salary_min', None)
    salary_max = request.args.get('salary_max', None)
    employment_type = request.args.get('employment_type', '', type=str)
    
    query = Job.query
    
    # Search by job title or company name
    if search:
        query = query.filter(
            (Job.job_title.ilike(f'%{search}%')) | 
            (Job.company_name.ilike(f'%{search}%'))
        )
    
    # Filter by location
    if location:
        query = query.filter(Job.job_address.ilike(f'%{location}%'))
    
    # Filter by minimum salary
    if salary_min:
        try:
            salary_min = int(salary_min)
            query = query.filter(Job.salary_min >= salary_min)
        except (ValueError, TypeError):
            pass
    
    # Filter by maximum salary
    if salary_max:
        try:
            salary_max = int(salary_max)
            query = query.filter(Job.salary_max <= salary_max)
        except (ValueError, TypeError):
            pass
    
    # Filter by employment type
    if employment_type:
        query = query.filter(Job.employment_type.ilike(f'%{employment_type}%'))
    
    pagination = query.paginate(page=page, per_page=per_page)
    
    jobs = [{
        "id": job.id,
        "job_id": job.job_id,
        "job_title": job.job_title,
        "company_name": job.company_name,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "job_address": job.job_address,
        "deadline": job.deadline.isoformat() if job.deadline else None,
        "exp_min": job.exp_min,
        "exp_max": job.exp_max,
        "benefits": job.benefits,
        "employment_type": job.employment_type,
        "job_function": job.job_function,
        "industries": job.industries,
        "job_description": job.job_description,
        "job_requirement": job.job_requirement
    } for job in pagination.items]
    
    return jsonify({
        "jobs": jobs,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    })

@main.route('/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Lấy chi tiết một công việc"""
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    return jsonify({
        "id": job.id,
        "job_id": job.job_id,
        "job_title": job.job_title,
        "company_name": job.company_name,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "job_address": job.job_address,
        "deadline": job.deadline.isoformat() if job.deadline else None,
        "exp_min": job.exp_min,
        "exp_max": job.exp_max,
        "benefits": job.benefits,
        "employment_type": job.employment_type,
        "job_function": job.job_function,
        "industries": job.industries,
        "job_description": job.job_description,
        "job_requirement": job.job_requirement,
    })

# USER PROFILE ENDPOINTS
@main.route('/user-profile/<int:user_id>', methods=['POST'])
def save_user_profile(user_id):
    """Lưu thông tin hồ sơ vào bảng infor_user, map bằng username"""
    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    infor = _find_or_create_infor_by_username(username=user.username, user_id=user.id)
    db.session.flush()  # Flush changes to detect constraint errors early

    avatar_file = request.files.get('avatar')
    if avatar_file and avatar_file.filename:
        infor.avatar_path = _save_avatar_file(avatar_file, user.username)

    if 'phone' in data:
        infor.phone = (data.get('phone') or '').strip() or None
    # support both old frontend keys and new model-backed keys
    if 'location' in data or 'workplace_desired' in data:
        infor.workplace_desired = (data.get('workplace_desired') or data.get('location') or '').strip() or None
    if 'position' in data or 'desired_job' in data:
        infor.desired_job = (data.get('desired_job') or data.get('position') or '').strip() or None
    if 'bio' in data or 'target' in data:
        infor.target = (data.get('target') or data.get('bio') or '').strip() or None

    # Additional profile fields
    if 'age' in data:
        age_val = (data.get('age') or '').strip()
        try:
            infor.age = int(age_val) if age_val else None
        except Exception:
            infor.age = None
    if 'gender' in data:
        infor.gender = (data.get('gender') or '').strip() or None
    if 'marriage' in data:
        infor.marriage = (data.get('marriage') or '').strip() or None
    if 'degree' in data:
        infor.degree = (data.get('degree') or '').strip() or None

    experiences = data.get('experiences')
    if isinstance(experiences, str):
        try:
            experiences = json.loads(experiences)
        except Exception:
            experiences = []
    if isinstance(experiences, list):
        exp_min, exp_max, exp_skills = _extract_experience_range_and_skills(experiences)
        infor.exp_min = exp_min
        infor.exp_max = exp_max
        if exp_skills:
            merged = []
            if infor.skills:
                merged.extend([s.strip() for s in infor.skills.split(',') if s.strip()])
            merged.extend(exp_skills)
            infor.skills = ', '.join(list(dict.fromkeys(merged)))

    try:
        db.session.commit()
        return jsonify({"message": "Profile saved successfully", "username": user.username}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Database error: {str(e)}")
        return jsonify({"error": f"Failed to save profile: {str(e)}"}), 500

@main.route('/user-profile/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    """Lấy thông tin hồ sơ từ infor_user, map bằng username"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    infor = InforUser.query.filter_by(username=user.username).first()
    if not infor:
        return jsonify({"error": "User profile not found"}), 404

    return jsonify({
        "fullName": user.username,
        "email": user.email,
        "avatar_path": infor.avatar_path,
        "phone": infor.phone,
        "location": infor.workplace_desired,
        "bio": infor.target,
        "position": infor.desired_job,
        "skills": infor.skills,
        "exp_min": infor.exp_min,
        "exp_max": infor.exp_max,
        "age": infor.age,
        "gender": infor.gender,
        "marriage": infor.marriage,
        "degree": infor.degree,
        "username": infor.username
    })


@main.route('/uploads/<path:filename>', methods=['GET'])
def uploaded_avatar(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)