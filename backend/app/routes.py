from flask import Blueprint, request, jsonify
from .models import db, User, Job

main = Blueprint('main', __name__)

# CREATE
@main.route('/users', methods=['POST'])
def create_user():
    data = request.json
    user = User(username=data['username'], email=data['email'])
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User created"})

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
        "job_experience_required": job.job_experience_required,
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
        "job_experience_required": job.job_experience_required,
        "employment_type": job.employment_type,
        "job_function": job.job_function,
        "industries": job.industries,
        "job_description": job.job_description,
        "job_requirement": job.job_requirement
    })