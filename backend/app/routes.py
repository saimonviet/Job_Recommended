import os
import json
import hashlib
import re
import unicodedata
import logging
import traceback
import time
from datetime import datetime

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import pandas as pd
from sqlalchemy import inspect, text
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from .models import db, User, Job, InforUser, Employer
import pickle

from .embedding_pipeline import (
    score_jobs_for_user,
    _build_user_feat,
    _build_job_feat,
    _load_artifacts,
    advanced_clean_text,
    extract_province,
    map_industry_group,
)


# Blueprint & logging
main = Blueprint('main', __name__)
logger = logging.getLogger(__name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'uploads')
LOGOS_FOLDER  = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'logos')
LOCKED_JOB_MESSAGE = "Bài đăng này đã bị Admin khóa. Ứng viên không thể xem chi tiết hoặc tiếp tục ứng tuyển."


# ---------------------------------------------------------------------------
# User / profile helpers
# ---------------------------------------------------------------------------
def _get_user_context(user_id):
    user = User.query.get(user_id)
    if not user:
        return None, None
    infor = _get_infor_for_user(user)
    return user, infor

def _get_infor_for_user(user):
    if not user:
        return None
    infor = None
    if user.id is not None:
        infor = InforUser.query.get(user.id)
    if not infor and user.username:
        infor = InforUser.query.filter_by(username=user.username).first()
    # Do not attempt to set non-existent `user_id` field; prefer id matching.
    return infor

def _get_profile_missing_fields(infor):
    if not infor:
        return ['location', 'desired_job', 'experience']
    missing = []
    if not (infor.workplace_desired or '').strip():
        missing.append('location')
    if not (infor.desired_job or '').strip():
        missing.append('desired_job')
    if not (infor.experience or '').strip():
        missing.append('experience')
    return missing

PROFILE_COMPLETION_FIELDS = [
    ("avatar_path", "avatar"),
    ("phone", "phone"),
    ("workplace_desired", "location"),
    ("desired_job", "desired_job"),
    ("target", "bio"),
    ("experience", "experience"),
    # ("skills", "skills"),
    ("age", "age"),
    ("gender", "gender"),
    ("degree", "degree"),
    ("industry", "industry"),
    ("desired_salary", "desired_salary"),
]

def _has_profile_value(value):
    if value is None:
        return False
    if isinstance(value, str):
        stripped = value.strip()
        return bool(stripped and stripped not in ('[]', '{}', 'null'))
    return True

def _get_profile_completion(infor):
    total = len(PROFILE_COMPLETION_FIELDS)
    if total == 0:
        return {"percentage": 0, "completed_fields": 0, "total_fields": 0, "missing_fields": []}
    if not infor:
        return {
            "percentage": 0,
            "completed_fields": 0,
            "total_fields": total,
            "missing_fields": [label for _, label in PROFILE_COMPLETION_FIELDS],
        }

    missing = []
    completed = 0
    for field, label in PROFILE_COMPLETION_FIELDS:
        if _has_profile_value(getattr(infor, field, None)):
            completed += 1
        else:
            missing.append(label)

    return {
        "percentage": round((completed / total) * 100),
        "completed_fields": completed,
        "total_fields": total,
        "missing_fields": missing,
    }

def _profile_debug_snapshot(infor):
    if not infor:
        return {"exists": False}
    return {
        "exists": True,
        "id": infor.id,
        "username": infor.username,
        "workplace_desired": infor.workplace_desired,
        "desired_job": infor.desired_job,
        "experience": infor.experience,
        "exp_min": infor.exp_min,
        "exp_max": infor.exp_max,
        "skills": infor.skills,
        "age": infor.age,
        "gender": infor.gender,
        "degree": infor.degree,
        "marriage": infor.marriage,
        "avatar_path": infor.avatar_path,
        "phone": infor.phone,
        "target": infor.target,
    }

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
    infor = None
    if user_id:
        infor = InforUser.query.get(user_id)
    if not infor:
        infor = InforUser.query.filter_by(username=username).first()
    if not infor:
        # Create a new InforUser; do not set primary key here.
        infor = InforUser(username=username)
        db.session.add(infor)
    else:
        # If an infor exists and user_id provided but different, leave as-is.
        if username and not (infor.username or '').strip():
            infor.username = username
    return infor

def _extract_experience_range_and_skills(experiences):
    years = []
    skills = []
    for i, exp in enumerate(experiences):
        start_date = exp.get('startDate')
        end_date   = exp.get('endDate')
        logger.debug(f"[_extract_experience_range_and_skills] exp {i}: start={start_date}, end={end_date}")

        if isinstance(start_date, str) and len(start_date) >= 4 and start_date[:4].isdigit():
            years.append(int(start_date[:4]))

        if end_date == 'Hiện tại':
            years.append(datetime.now().year)
        elif isinstance(end_date, str) and len(end_date) >= 4 and end_date[:4].isdigit():
            years.append(int(end_date[:4]))

        for skill in (exp.get('skills') or []):
            if isinstance(skill, str) and skill.strip():
                skills.append(skill.strip())

    unique_skills = list(dict.fromkeys(skills))
    exp_min = str(min(years)) if years else None
    exp_max = str(max(years)) if years else None
    return exp_min, exp_max, unique_skills

def _normalize_text(value):
    if value is None:
        return ''
    text = unicodedata.normalize('NFKD', str(value).lower())
    text = text.encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^a-z0-9]+', ' ', text).strip()

def _format_salary(job):
    salary_min = (getattr(job, 'salary_min', '') or '').strip() if isinstance(getattr(job, 'salary_min', ''), str) else getattr(job, 'salary_min', '')
    salary_max = (getattr(job, 'salary_max', '') or '').strip() if isinstance(getattr(job, 'salary_max', ''), str) else getattr(job, 'salary_max', '')
    if salary_min and salary_max:
        return f'{salary_min} - {salary_max}'
    return salary_min or salary_max or 'Thoả thuận'

def _job_logo_seed(job):
    return getattr(job, 'company_name', None) or getattr(job, 'job_title', None) or str(getattr(job, 'id', ''))

def _serialize_job(job, score=None):
    company_name = getattr(job, 'employer', None)
    if company_name and getattr(job.employer, 'company_name', None):
        company_name = job.employer.company_name
    else:
        company_name = job.company_name

    payload = {
        'id': job.id,
        'title': job.job_title,
        'company': company_name,
        'employer_id': job.employer_id,
        'location': job.job_address,
        'job_detail_address': getattr(job, 'job_detail_address', None),
        'benefits': getattr(job, 'benefits', None),
        'salary': _format_salary(job),
        'logo': f"https://api.dicebear.com/7.x/icons/svg?seed={_normalize_text(_job_logo_seed(job)).replace(' ', '-') or job.id}",
        'deadline': job.deadline.isoformat() if job.deadline else None,
        'employmentType': getattr(job, 'employment_type', None),
        'jobFunction': getattr(job, 'job_function', None),
        'industries': getattr(job, 'industries', None),
        'description': getattr(job, 'job_description', None),
        'requirement': getattr(job, 'job_requirement', None),
        'is_locked': bool(getattr(job, 'is_locked', False)),
        'job_warning': LOCKED_JOB_MESSAGE if getattr(job, 'is_locked', False) else None,
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

# ---------------------------------------------------------------------------
# Routes — users (legacy public GET only)
# ---------------------------------------------------------------------------
@main.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{"id": u.id, "username": u.username, "email": u.email} for u in users])

# ---------------------------------------------------------------------------
# Routes — jobs
# ---------------------------------------------------------------------------
@main.route('/jobs', methods=['GET'])
def get_jobs():
    page            = request.args.get('page', 1, type=int)
    per_page        = request.args.get('per_page', 6, type=int)
    search          = request.args.get('search', '', type=str)
    location        = request.args.get('location', '', type=str)
    salary_min      = request.args.get('salary_min', None)
    salary_max      = request.args.get('salary_max', None)
    employment_type = request.args.get('employment_type', '', type=str)
    industries      = request.args.get('industries', '', type=str)
    exp_min         = request.args.get('exp_min', None)

    query = Job.query.filter(
        Job.is_active == True,
        Job.is_locked == False,
        Job.is_deleted == False,
    ).order_by(Job.deadline.desc(), Job.id.desc())

    if search:
        query = query.filter(
            (Job.job_title.ilike(f'%{search}%')) | (Job.company_name.ilike(f'%{search}%'))
        )
    if location:
        query = query.filter(Job.job_address.ilike(f'%{location}%'))
    if salary_min:
        try:
            query = query.filter(Job.salary_min >= int(salary_min))
        except (ValueError, TypeError):
            pass
    if salary_max:
        try:
            query = query.filter(Job.salary_max <= int(salary_max))
        except (ValueError, TypeError):
            pass
    if employment_type:
        query = query.filter(Job.employment_type.ilike(f'%{employment_type}%'))
    if industries:
        tokens = [t.strip() for t in re.split(r'\W+', industries) if t.strip()]
        for tok in tokens:
            pattern = f'%{tok}%'
            query = query.filter(
                Job.industries.ilike(pattern) |
                Job.job_title.ilike(pattern) |
                Job.job_description.ilike(pattern)
            )
    if exp_min:
        try:
            query = query.filter(Job.exp_min <= int(exp_min))
        except (ValueError, TypeError):
            pass

    pagination = query.paginate(page=page, per_page=per_page)
    jobs = [{
        "id": job.id, "job_title": job.job_title,
        "company_name": job.company_name, "salary_min": job.salary_min,
        "salary_max": job.salary_max, "job_address": job.job_address,
        "deadline": job.deadline.isoformat() if job.deadline else None,
        "exp_min": job.exp_min, "exp_max": job.exp_max, "benefits": job.benefits,
        "employment_type": job.employment_type, "job_function": job.job_function,
        "industries": job.industries, "job_description": job.job_description,
        "job_requirement": job.job_requirement,
    } for job in pagination.items]

    return jsonify({
        "jobs": jobs, "total": pagination.total,
        "pages": pagination.pages, "current_page": page,
    })

@main.route('/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if getattr(job, 'is_locked', False):
        return jsonify({
            "error": LOCKED_JOB_MESSAGE,
            "is_locked": True,
            "job_id": job.id,
        }), 423
    if not job.is_active or getattr(job, 'is_deleted', False):
        return jsonify({"error": "Job not found"}), 404
    return jsonify({
        **_serialize_job(job),
        "salary_min": job.salary_min, "salary_max": job.salary_max,
        "exp_min": job.exp_min, "exp_max": job.exp_max, "benefits": job.benefits,
    })

@main.route('/companies', methods=['GET'])
def get_companies():
    """
    Get list of companies with filtering
    Query parameters:
    - page: page number (default: 1)
    - per_page: items per page (default: 12)
    - search: search by company name
    - industry: filter by industry
    - location: filter by location/address
    - sort: sort by ('hiring' = most job openings, 'newest' = recently created)
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 6, type=int)
    search = request.args.get('search', '', type=str)
    industry = request.args.get('industry', '', type=str)
    location = request.args.get('location', '', type=str)
    sort = request.args.get('sort', 'newest', type=str)

    # Base query: active employers only
    query = Employer.query.filter(Employer.is_active == True)

    # Apply filters
    if search:
        query = query.filter(Employer.company_name.ilike(f'%{search}%'))
    if industry:
        query = query.filter(Employer.industry.ilike(f'%{industry}%'))
    if location:
        query = query.filter(Employer.address.ilike(f'%{location}%'))

    # Apply sorting
    if sort == 'hiring':
        # Sort by number of active job openings (most to least)
        query = query.outerjoin(Job).filter(
            ((Job.is_active == True) & (Job.is_locked == False) & (Job.is_deleted == False)) | (Job.id == None)
        ).group_by(Employer.id).order_by(db.func.count(Job.id).desc())
    else:  # default: 'newest'
        query = query.order_by(Employer.created_at.desc())

    # Paginate
    pagination = query.paginate(page=page, per_page=per_page)

    # Serialize companies with job count
    companies = []
    for employer in pagination.items:
        # Count active jobs for this employer
        job_count = Job.query.filter(
            Job.employer_id == employer.id,
            Job.is_active == True,
            Job.is_locked == False,
            Job.is_deleted == False,
        ).count()

        companies.append({
            "id": employer.id,
            "company_name": employer.company_name,
            "industry": employer.industry,
            "address": employer.address,
            "description": employer.description,
            "logo_path": employer.logo_path,
            "website": employer.website,
            "email": employer.email,
            "phone": employer.phone,
            "job_count": job_count,
            "created_at": employer.created_at.isoformat() if employer.created_at else None,
        })

    return jsonify({
        "companies": companies,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    })

@main.route('/companies/<int:company_id>', methods=['GET'])
def get_company(company_id):
    employer = Employer.query.get(company_id)
    if not employer or not employer.is_active:
        return jsonify({"error": "Company not found"}), 404

    job_count = Job.query.filter(
        Job.employer_id == employer.id,
        Job.is_active == True,
        Job.is_locked == False,
        Job.is_deleted == False,
    ).count()

    return jsonify({
        "company": {
            "id": employer.id,
            "company_name": employer.company_name,
            "industry": employer.industry,
            "address": employer.address,
            "description": employer.description,
            "logo_path": employer.logo_path,
            "website": employer.website,
            "email": employer.email,
            "phone": employer.phone,
            "job_count": job_count,
            "created_at": employer.created_at.isoformat() if employer.created_at else None,
        }
    })

@main.route('/companies/<int:company_id>/jobs', methods=['GET'])
def get_company_jobs(company_id):
    employer = Employer.query.get(company_id)
    if not employer or not employer.is_active:
        return jsonify({"error": "Company not found"}), 404

    jobs_query = Job.query.filter(
        Job.employer_id == employer.id,
        Job.is_active == True,
        Job.is_locked == False,
        Job.is_deleted == False,
    ).order_by(Job.created_at.desc())

    jobs = [{
        "id": job.id,
        "job_title": job.job_title,
        "company_name": job.company_name,
        "job_address": job.job_address,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "deadline": job.deadline.isoformat() if job.deadline else None,
        "employment_type": job.employment_type,
        "experience_required": job.exp_min,
        "experience": job.exp_min,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "industries": job.industries,
        "job_description": job.job_description,
    } for job in jobs_query]

    return jsonify({
        "jobs": jobs,
    })

# Recommendations endpoint moved to routes_seeker.py: GET /seeker/recommendations

# ---------------------------------------------------------------------------
# Routes — user profile
# ---------------------------------------------------------------------------
@main.route('/user-profile/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    infor = _get_infor_for_user(user)
    if not infor:
        return jsonify({"error": "User profile not found"}), 404

    missing_fields = _get_profile_missing_fields(infor)
    profile_completion = _get_profile_completion(infor)

    try:
        experience_value = json.loads(infor.experience) if infor.experience else []
    except Exception:
        experience_value = infor.experience

    return jsonify({
        "fullName": user.username,
        "email": user.email,
        "avatar_path": infor.avatar_path,
        "phone": infor.phone,
        "location": infor.workplace_desired,
        "bio": infor.target,
        "experience": experience_value,
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
        "profile_completion_percentage": profile_completion["percentage"],
        "profile_completion": profile_completion,
    })

# ---------------------------------------------------------------------------
# Routes — uploads / saved jobs
# ---------------------------------------------------------------------------
@main.route('/uploads/<path:filename>', methods=['GET'])
def uploaded_avatar(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@main.route('/logos/<path:filename>', methods=['GET'])
def uploaded_logo(filename):
    return send_from_directory(LOGOS_FOLDER, filename)

# Saved-jobs routes moved to routes_seeker.py: /seeker/saved-jobs (GET, POST, DELETE)

# Admin routes moved to routes_admin.py: /admin/embedding-status
