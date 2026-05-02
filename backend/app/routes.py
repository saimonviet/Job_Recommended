import os
import json
import hashlib
import re
import unicodedata

from flask import Blueprint, request, jsonify, send_from_directory
from .models import db, User, Job, InforUser
from datetime import datetime
from werkzeug.utils import secure_filename
from sqlalchemy import inspect, text

import torch
import torch.nn as nn

main = Blueprint('main', __name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'uploads')
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'best_model.pt')
_recommendation_model = None


class RecommendationScorer(nn.Module):
    def __init__(self):
        super().__init__()
        self.encoder = nn.Module()
        self.encoder.proj = nn.Module()
        self.encoder.proj.user = nn.Linear(267, 128)
        self.encoder.proj.job = nn.Linear(265, 128)
        self.encoder.out_proj = nn.Module()
        self.encoder.out_proj.user = nn.Linear(128, 64)
        self.encoder.out_proj.job = nn.Linear(128, 64)
        self.decoder = nn.Module()
        self.decoder.lin = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
        )


def _normalize_text(value):
    if value is None:
        return ''

    text = unicodedata.normalize('NFKD', str(value).lower())
    text = text.encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^a-z0-9]+', ' ', text).strip()


def _build_feature_vector(dimension, values, salt):
    vector = torch.zeros(dimension, dtype=torch.float32)

    for value in values:
        normalized = _normalize_text(value)
        if not normalized:
            continue

        tokens = [normalized]
        tokens.extend(normalized.split())

        for token in tokens:
            digest = hashlib.sha1(f'{salt}:{token}'.encode('utf-8')).hexdigest()
            vector[int(digest, 16) % dimension] += 1.0

    norm = torch.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm

    return vector


def _format_salary(job):
    salary_min = (job.salary_min or '').strip()
    salary_max = (job.salary_max or '').strip()

    if salary_min and salary_max:
        return f'{salary_min} - {salary_max}'
    return salary_min or salary_max or 'Thoả thuận'


def _job_logo_seed(job):
    return job.company_name or job.job_title or job.job_id or str(job.id)


def _serialize_job(job, score=None):
    payload = {
        'id': job.id,
        'title': job.job_title,
        'company': job.company_name,
        'location': job.job_address,
        'job_detail_address': job.job_detail_address,
        'benefits': job.benefits,
        'salary': _format_salary(job),
        'logo': f"https://api.dicebear.com/7.x/icons/svg?seed={_normalize_text(_job_logo_seed(job)).replace(' ', '-') or job.id}",
        'deadline': job.deadline.isoformat() if job.deadline else None,
        'employmentType': job.employment_type,
        'jobFunction': job.job_function,
        'industries': job.industries,
        'description': job.job_description,
        'requirement': job.job_requirement,
    }

    if score is not None:
        payload['matchScore'] = round(float(score), 2)

    return payload


def _deserialize_recommendations_cache(cached_value):
    if not cached_value:
        return None

    try:
        recommendations = json.loads(cached_value)
    except (TypeError, ValueError):
        return None

    return recommendations if isinstance(recommendations, list) else None


def _save_recommendations_cache(user, recommendations):
    user.recommendations = json.dumps(recommendations, ensure_ascii=False)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()


def _clear_recommendations_cache(user):
    user.recommendations = None


def _ensure_user_recommendations_column():
    inspector = inspect(db.engine)

    try:
        columns = {column['name'] for column in inspector.get_columns('user')}
    except Exception:
        return

    if 'recommendations' in columns:
        return

    with db.engine.begin() as connection:
        connection.execute(text('ALTER TABLE `user` ADD COLUMN recommendations LONGTEXT NULL'))


def _get_recommendation_model():
    global _recommendation_model

    if _recommendation_model is not None:
        return _recommendation_model

    try:
        # Prefer a safe weights-only load when possible (prevents arbitrary code execution).
        state_dict = torch.load(MODEL_PATH, map_location='cpu', weights_only=True)
    except Exception as e:
        # If weights-only loading fails (e.g. UnpicklingError due to UninitializedParameter),
        # fall back to a regular torch.load. This may execute pickled code, so only do this
        # for trusted checkpoint files (the project stores the checkpoint locally).
        try:
            print(f"Warning: weights_only load failed ({e}). Retrying without weights_only...")
            state_dict = torch.load(MODEL_PATH, map_location='cpu')
        except Exception:
            # Re-raise the original error if fallback also fails.
            raise

    model = RecommendationScorer()
    model.load_state_dict(state_dict, strict=False)
    model.eval()
    _recommendation_model = model
    return _recommendation_model


def _score_job_for_user(user, infor, job):
    user_features = _build_feature_vector(
        267,
        [
            user.username,
            user.email,
            infor.industry if infor else None,
            infor.desired_job if infor else None,
            infor.workplace_desired if infor else None,
            infor.desired_salary if infor else None,
            infor.gender if infor else None,
            infor.marriage if infor else None,
            infor.age if infor and infor.age is not None else None,
            infor.target if infor else None,
            infor.skills if infor else None,
            infor.degree if infor else None,
            infor.exp_min if infor else None,
            infor.exp_max if infor else None,
        ],
        'user',
    )

    job_features = _build_feature_vector(
        265,
        [
            job.job_id,
            job.job_title,
            job.company_name,
            job.salary_min,
            job.salary_max,
            job.job_address,
            job.exp_min,
            job.exp_max,
            job.benefits,
            job.employment_type,
            job.job_function,
            job.industries,
            job.job_description,
            job.job_requirement,
        ],
        'job',
    )

    model = _get_recommendation_model()
    with torch.no_grad():
        user_embedding = torch.relu(model.encoder.proj.user(user_features.unsqueeze(0)))
        user_embedding = torch.relu(model.encoder.out_proj.user(user_embedding))
        job_embedding = torch.relu(model.encoder.proj.job(job_features.unsqueeze(0)))
        job_embedding = torch.relu(model.encoder.out_proj.job(job_embedding))
        pair_embedding = torch.cat([user_embedding, job_embedding], dim=-1)
        raw_score = model.decoder.lin(pair_embedding).squeeze().item()

    return 100.0 * torch.sigmoid(torch.tensor(raw_score)).item()


def _get_user_context(user_id):
    user = User.query.get(user_id)
    if not user:
        return None, None

    infor = InforUser.query.filter_by(username=user.username).first()
    return user, infor

def _get_profile_missing_fields(infor):
    # Keep completion criteria aligned with the 2-step onboarding UX:
    # 1) Personal intent (location + desired job), 2) experience range.
    if not infor:
        return ['location', 'desired_job', 'experience']

    missing_fields = []
    if not (infor.workplace_desired or '').strip():
        missing_fields.append('location')
    if not (infor.desired_job or '').strip():
        missing_fields.append('desired_job')

    has_experience_range = (infor.exp_min or '').strip() and (infor.exp_max or '').strip()
    if not has_experience_range:
        missing_fields.append('experience')

    return missing_fields


def _is_profile_complete(infor):
    return len(_get_profile_missing_fields(infor)) == 0


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

    for i, exp in enumerate(experiences):
        start_date = exp.get('startDate')
        end_date = exp.get('endDate')
        print(f"[_extract_experience_range_and_skills] Experience {i}: startDate={start_date}, endDate={end_date}")

        if isinstance(start_date, str) and len(start_date) >= 4 and start_date[:4].isdigit():
            year = int(start_date[:4])
            print(f"[_extract_experience_range_and_skills] Added year from startDate: {year}")
            years.append(year)

        if end_date == 'Hiện tại':
            year = datetime.now().year
            print(f"[_extract_experience_range_and_skills] Added current year (Hiện tại): {year}")
            years.append(year)
        elif isinstance(end_date, str) and len(end_date) >= 4 and end_date[:4].isdigit():
            year = int(end_date[:4])
            print(f"[_extract_experience_range_and_skills] Added year from endDate: {year}")
            years.append(year)

        exp_skills = exp.get('skills') or []
        if isinstance(exp_skills, list):
            for skill in exp_skills:
                if isinstance(skill, str) and skill.strip():
                    skills.append(skill.strip())

    unique_skills = list(dict.fromkeys(skills))
    exp_min = str(min(years)) if years else None
    exp_max = str(max(years)) if years else None
    print(f"[_extract_experience_range_and_skills] Final result: exp_min={exp_min}, exp_max={exp_max}, skills={unique_skills}")
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
    industries = request.args.get('industries', '', type=str)
    exp_min = request.args.get('exp_min', None)

    query = Job.query.order_by(Job.deadline.desc(), Job.id.desc())

    if search:
        query = query.filter(
            (Job.job_title.ilike(f'%{search}%')) |
            (Job.company_name.ilike(f'%{search}%'))
        )

    if location:
        query = query.filter(Job.job_address.ilike(f'%{location}%'))

    if salary_min:
        try:
            salary_min = int(salary_min)
            query = query.filter(Job.salary_min >= salary_min)
        except (ValueError, TypeError):
            pass

    if salary_max:
        try:
            salary_max = int(salary_max)
            query = query.filter(Job.salary_max <= salary_max)
        except (ValueError, TypeError):
            pass

    if employment_type:
        query = query.filter(Job.employment_type.ilike(f'%{employment_type}%'))

    if industries:
        # tokenize the incoming industries string and broaden matching across
        # the industries column, job title and description to be more resilient
        # to formatting/diacritics differences from the source data.
        tokens = [t.strip() for t in re.split(r"\W+", industries) if t.strip()]
        for tok in tokens:
            pattern = f"%{tok}%"
            query = query.filter(
                (Job.industries.ilike(pattern)) |
                (Job.job_title.ilike(pattern)) |
                (Job.job_description.ilike(pattern))
            )

    if exp_min:
        try:
            exp_min = int(exp_min)
            query = query.filter(Job.exp_min <= exp_min)
        except (ValueError, TypeError):
            pass

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
        "job_requirement": job.job_requirement,
    } for job in pagination.items]

    return jsonify({
        "jobs": jobs,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    })


@main.route('/recommendations', methods=['GET'])
def get_recommendations():
    """Dự đoán 5 công việc phù hợp nhất cho người dùng hiện tại."""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    user, infor = _get_user_context(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    missing_fields = _get_profile_missing_fields(infor)
    if missing_fields:
        return jsonify({
            "profile_complete": False,
            "profile_missing_fields": missing_fields,
            "recommendations": [],
            "message": "Profile incomplete",
        }), 200

    cached_recommendations = _deserialize_recommendations_cache(user.recommendations)
    if cached_recommendations is not None:
        return jsonify({
            "profile_complete": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            "recommendations": cached_recommendations,
            "total_jobs_considered": 0,
            "cached": True,
        })

    jobs = Job.query.order_by(Job.id.desc()).all()
    if not jobs:
        return jsonify({"profile_complete": True, "recommendations": []})

    scored_jobs = []
    for job in jobs:
        try:
            score = _score_job_for_user(user, infor, job)
        except Exception:
            score = 0.0
        scored_jobs.append((score, job))

    scored_jobs.sort(key=lambda item: item[0], reverse=True)
    recommendations = [_serialize_job(job, score=score) for score, job in scored_jobs[:5]]

    _save_recommendations_cache(user, recommendations)

    return jsonify({
        "profile_complete": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
        "recommendations": recommendations,
        "total_jobs_considered": len(jobs),
    })


@main.route('/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Lấy chi tiết một công việc"""
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    return jsonify({
        **_serialize_job(job),
        "job_id": job.job_id,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "exp_min": job.exp_min,
        "exp_max": job.exp_max,
        "benefits": job.benefits,
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
    db.session.flush()

    avatar_file = request.files.get('avatar')
    if avatar_file and avatar_file.filename:
        infor.avatar_path = _save_avatar_file(avatar_file, user.username)

    if 'phone' in data:
        infor.phone = (data.get('phone') or '').strip() or None
    if 'location' in data or 'workplace_desired' in data:
        infor.workplace_desired = (data.get('workplace_desired') or data.get('location') or '').strip() or None
    if 'position' in data or 'desired_job' in data:
        infor.desired_job = (data.get('desired_job') or data.get('position') or '').strip() or None
    if 'bio' in data or 'target' in data:
        infor.target = (data.get('target') or data.get('bio') or '').strip() or None

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
    print(f"[save_user_profile] Raw experiences from request: {experiences}")
    print(f"[save_user_profile] Type of experiences: {type(experiences)}")
    
    if isinstance(experiences, str):
        try:
            experiences = json.loads(experiences)
        except Exception as e:
            print(f"[save_user_profile] Failed to parse experiences JSON: {e}")
            experiences = []
    
    print(f"[save_user_profile] Parsed experiences: {experiences}")
    print(f"[save_user_profile] Experiences is list: {isinstance(experiences, list)}")
    
    if isinstance(experiences, list):
        print(f"[save_user_profile] Processing {len(experiences)} experience entries")
        exp_min, exp_max, exp_skills = _extract_experience_range_and_skills(experiences)
        print(f"[save_user_profile] Extracted exp_min={exp_min}, exp_max={exp_max}, skills={exp_skills}")
        infor.exp_min = exp_min
        infor.exp_max = exp_max
        print(f"[save_user_profile] After assignment: infor.exp_min={infor.exp_min}, infor.exp_max={infor.exp_max}")
        if exp_skills:
            merged = []
            if infor.skills:
                merged.extend([s.strip() for s in infor.skills.split(',') if s.strip()])
            merged.extend(exp_skills)
            infor.skills = ', '.join(list(dict.fromkeys(merged)))

    try:
        db.session.commit()
        _clear_recommendations_cache(user)
        db.session.commit()
        return jsonify({"message": "Profile saved successfully", "username": user.username}), 200

    except Exception as e:
        db.session.rollback()
        print(f"[save_user_profile] Database error: {str(e)}")
        return jsonify({"error": f"Failed to save profile: {str(e)}"}), 500
    
        # Final verification - query the database to confirm what was saved
    print(f"[save_user_profile] Final verification - querying database...")
    saved_infor = InforUser.query.filter_by(username=user.username).first()
    if saved_infor:
        print(f"[save_user_profile] SAVED TO DB: exp_min={saved_infor.exp_min}, exp_max={saved_infor.exp_max}, skills={saved_infor.skills}")
    else:
        print(f"[save_user_profile] ERROR: Could not find saved infor in database")

@main.route('/user-profile/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    """Lấy thông tin hồ sơ từ infor_user, map bằng username"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    infor = InforUser.query.filter_by(username=user.username).first()
    if not infor:
        return jsonify({"error": "User profile not found"}), 404

    print(f"[get_user_profile] infor.exp_min={infor.exp_min}, infor.exp_max={infor.exp_max}, infor.skills={infor.skills}")
    missing_fields = _get_profile_missing_fields(infor)
    print(f"[get_user_profile] missing_fields={missing_fields}")

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
        "username": infor.username,
        "profile_complete": len(missing_fields) == 0,
        "profile_missing_fields": missing_fields,
    })


@main.route('/uploads/<path:filename>', methods=['GET'])
def uploaded_avatar(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)