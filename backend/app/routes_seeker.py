"""
routes_seeker.py — Seeker: nộp đơn, xem đơn, quản lý profile

Endpoints:
    POST   /seeker/jobs/<job_id>/apply
    GET    /seeker/applications
    GET    /seeker/applications/<app_id>
    DELETE /seeker/applications/<app_id>          (rút đơn khi còn pending)
    GET    /seeker/profile
    POST   /seeker/profile
    GET    /seeker/saved-jobs
    POST   /seeker/saved-jobs/<job_id>
    DELETE /seeker/saved-jobs/<job_id>
"""

import os
import json
import time
import logging
import traceback
from flask import Blueprint, request, jsonify
from datetime import datetime
from werkzeug.utils import secure_filename
from .models import db, User, InforUser, Job, Application
import numpy as np
from .auth import seeker_required, login_required
from .routes import (
    _get_infor_for_user, _get_user_context, _get_profile_missing_fields, 
   _deserialize_recommendations_cache,
    _score_jobs_via_embeddings,
    _save_recommendations_cache, _serialize_job
)

seeker_bp = Blueprint('seeker', __name__, url_prefix='/seeker')

# Configure logging
logger = logging.getLogger(__name__)

UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 'instance', 'uploads'
)
CV_FOLDER = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 'instance', 'cvs'
)


def _save_file(file_obj, folder, prefix) -> str:
    os.makedirs(folder, exist_ok=True)
    original = secure_filename(file_obj.filename or 'file')
    _, ext = os.path.splitext(original)
    filename = f"{prefix}_{datetime.now().strftime('%Y%m%d%H%M%S')}{ext}"
    file_obj.save(os.path.join(folder, filename))
    return filename


def _serialize_application(app: Application) -> dict:
    return {
        "id": app.id,
        "status": app.status,
        "cover_letter": app.cover_letter,
        "cv_path": app.cv_path,
        "employer_note": app.employer_note,
        "applied_at": app.applied_at.isoformat() if app.applied_at else None,
        "updated_at": app.updated_at.isoformat() if app.updated_at else None,
        "job": {
            "id": app.job.id,
            "job_title": app.job.job_title,
            "company_name": app.job.company_name,
            "job_address": app.job.job_address,
            "deadline": app.job.deadline.isoformat() if app.job.deadline else None,
        } if app.job else None,
    }


# ---------------------------------------------------------------------------
# Nộp đơn / Application
# ---------------------------------------------------------------------------

@seeker_bp.route('/jobs/<int:job_id>/apply', methods=['POST'])
@seeker_required
def apply_job(job_id):
    """Seeker nộp đơn vào job. Hỗ trợ upload CV (multipart/form-data)."""
    user_id = request.current_user_id

    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Không tìm thấy job"}), 404

    if not job.is_active:
        return jsonify({"error": "Job này đã đóng tuyển dụng"}), 400

    if job.deadline and job.deadline < datetime.utcnow():
        return jsonify({"error": "Job này đã hết hạn nộp đơn"}), 400

    # Kiểm tra đã nộp chưa
    existing = Application.query.filter_by(user_id=user_id, job_id=job_id).first()
    if existing:
        return jsonify({"error": "Bạn đã nộp đơn vào job này rồi"}), 409

    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})
    cover_letter = (data.get('cover_letter') or '').strip() or None

    cv_path = None
    cv_file = request.files.get('cv')
    if cv_file and cv_file.filename:
        allowed_ext = {'.pdf', '.doc', '.docx'}
        _, ext = os.path.splitext(secure_filename(cv_file.filename))
        if ext.lower() not in allowed_ext:
            return jsonify({"error": "CV phải là file PDF, DOC hoặc DOCX"}), 400
        filename = _save_file(cv_file, CV_FOLDER, f"cv_{user_id}_{job_id}")
        cv_path = f"/cvs/{filename}"

    application = Application(
        user_id=user_id,
        job_id=job_id,
        cover_letter=cover_letter,
        cv_path=cv_path,
        status='pending',
    )
    db.session.add(application)
    try:
        db.session.commit()
        return jsonify({
            "message": "Nộp đơn thành công",
            "application_id": application.id,
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@seeker_bp.route('/applications', methods=['GET'])
@seeker_required
def get_my_applications():
    """Lấy danh sách đơn ứng tuyển của seeker hiện tại."""
    user_id = request.current_user_id
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status_filter = request.args.get('status', '')

    query = Application.query.filter_by(user_id=user_id)
    if status_filter:
        query = query.filter_by(status=status_filter)
    query = query.order_by(Application.applied_at.desc())

    pagination = query.paginate(page=page, per_page=per_page)

    return jsonify({
        "applications": [_serialize_application(a) for a in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    })


@seeker_bp.route('/applications/<int:app_id>', methods=['GET'])
@seeker_required
def get_application_detail(app_id):
    """Lấy chi tiết một đơn ứng tuyển."""
    application = Application.query.filter_by(
        id=app_id, user_id=request.current_user_id
    ).first()
    if not application:
        return jsonify({"error": "Không tìm thấy đơn ứng tuyển"}), 404

    return jsonify(_serialize_application(application))


@seeker_bp.route('/applications/<int:app_id>', methods=['DELETE'])
@seeker_required
def withdraw_application(app_id):
    """Rút đơn ứng tuyển (chỉ khi status còn 'pending')."""
    application = Application.query.filter_by(
        id=app_id, user_id=request.current_user_id
    ).first()
    if not application:
        return jsonify({"error": "Không tìm thấy đơn ứng tuyển"}), 404

    if application.status != 'pending':
        return jsonify({"error": "Chỉ có thể rút đơn khi trạng thái còn 'pending'"}), 400

    db.session.delete(application)
    db.session.commit()
    return jsonify({"message": "Rút đơn thành công"})


# ---------------------------------------------------------------------------
# Profile Seeker
# ---------------------------------------------------------------------------

@seeker_bp.route('/profile', methods=['GET'])
@seeker_required
def get_profile():
    user = User.query.get(request.current_user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user"}), 404

    infor = InforUser.query.get(user.id)
    if not infor:
        return jsonify({"error": "Chưa có hồ sơ"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar_path": infor.avatar_path,
        "phone": infor.phone,
        "location": infor.workplace_desired,
        "desired_job": infor.desired_job,
        "bio": infor.target,
        "experience": infor.experience,
        "skills": infor.skills,
        "exp_min": infor.exp_min,
        "exp_max": infor.exp_max,
        "age": infor.age,
        "gender": infor.gender,
        "marriage": infor.marriage,
        "degree": infor.degree,
        "industry": infor.industry,
        "desired_salary": infor.desired_salary,
    })


@seeker_bp.route('/profile', methods=['POST'])
@seeker_required
def save_profile():
    """Cập nhật hồ sơ seeker (kể cả avatar)."""
    user = User.query.get(request.current_user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user"}), 404

    infor = InforUser.query.get(user.id)
    if not infor:
        infor = InforUser(id=user.id, username=user.username)
        db.session.add(infor)
        db.session.flush()

    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})

    avatar_file = request.files.get('avatar')
    if avatar_file and avatar_file.filename:
        filename = _save_file(avatar_file, UPLOAD_FOLDER, user.username)
        infor.avatar_path = f"/uploads/{filename}"

    field_map = {
        'phone': 'phone',
        'workplace_desired': 'workplace_desired',
        'location': 'workplace_desired',
        'desired_job': 'desired_job',
        'position': 'desired_job',
        'target': 'target',
        'bio': 'target',
        'degree': 'degree',
        'gender': 'gender',
        'marriage': 'marriage',
        'industry': 'industry',
        'desired_salary': 'desired_salary',
    }
    for data_key, model_field in field_map.items():
        if data_key in data:
            setattr(infor, model_field, (data[data_key] or '').strip() or None)

    if 'age' in data:
        try:
            infor.age = int(data['age']) if data['age'] else None
        except (ValueError, TypeError):
            infor.age = None

    experience_payload = data.get('experience') or data.get('experiences')
    if experience_payload is None:
        legacy_skills_payload = data.get('skills')
        if legacy_skills_payload:
            try:
                parsed_legacy_skills = json.loads(legacy_skills_payload)
            except (TypeError, ValueError):
                parsed_legacy_skills = None
            if isinstance(parsed_legacy_skills, list):
                experience_payload = parsed_legacy_skills

    if experience_payload is not None:
        if isinstance(experience_payload, str):
            infor.experience = experience_payload.strip() or None
        else:
            infor.experience = json.dumps(experience_payload, ensure_ascii=False)

    if 'skills' in data:
        skills_value = (data['skills'] or '').strip()
        if skills_value and not skills_value.startswith('['):
            infor.skills = skills_value or None

    if 'exp_min' in data:
        infor.exp_min = (data['exp_min'] or '').strip() or None
    if 'exp_max' in data:
        infor.exp_max = (data['exp_max'] or '').strip() or None

    # Xóa cache gợi ý khi profile thay đổi
    user.recommendations = None

    try:
        db.session.commit()
        return jsonify({"message": "Cập nhật hồ sơ thành công"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Saved Jobs
# ---------------------------------------------------------------------------

def _get_saved_ids(user: User) -> list:
    if not user.saved_jobs:
        return []
    try:
        ids = json.loads(user.saved_jobs)
        return ids if isinstance(ids, list) else []
    except (TypeError, ValueError):
        return []


@seeker_bp.route('/saved-jobs', methods=['GET'])
@seeker_required
def get_saved_jobs():
    user = User.query.get(request.current_user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user"}), 404

    saved_ids = _get_saved_ids(user)
    jobs = []
    if saved_ids:
        for job in Job.query.filter(Job.id.in_(saved_ids)).all():
            salary = job.salary_min or ''
            if job.salary_max and job.salary_max != job.salary_min:
                salary = f"{salary} - {job.salary_max}" if salary else job.salary_max
            salary = salary.strip() or 'Thoả thuận'
            
            logo = f"https://api.dicebear.com/7.x/icons/svg?seed={job.company_name or job.job_title or str(job.id)}".replace(' ', '-')
            
            jobs.append({
                "id": job.id,
                "title": job.job_title,
                "company": job.company_name,
                "location": job.job_address,
                "salary": salary,
                "deadline": job.deadline.isoformat() if job.deadline else None,
                "employmentType": job.employment_type,
                "jobFunction": job.job_function,
                "industries": job.industries,
                "logo": logo,
                "description": job.job_description,
            })

    return jsonify({"saved_jobs": jobs, "saved_job_ids": saved_ids})


@seeker_bp.route('/saved-jobs/<int:job_id>', methods=['POST'])
@seeker_required
def save_job(job_id):
    user = User.query.get(request.current_user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user"}), 404

    if not Job.query.get(job_id):
        return jsonify({"error": "Không tìm thấy job"}), 404

    ids = _get_saved_ids(user)
    if job_id not in ids:
        ids.append(job_id)
        user.saved_jobs = json.dumps(ids)
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    return jsonify({"message": "Đã lưu job", "saved_job_ids": ids})


@seeker_bp.route('/saved-jobs/<int:job_id>', methods=['DELETE'])
@seeker_required
def unsave_job(job_id):
    user = User.query.get(request.current_user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user"}), 404

    ids = _get_saved_ids(user)
    if job_id in ids:
        ids.remove(job_id)
        user.saved_jobs = json.dumps(ids)
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    return jsonify({"message": "Đã bỏ lưu job", "saved_job_ids": ids})


# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------

@seeker_bp.route('/recommendations', methods=['GET'])
@seeker_required
def get_recommendations():
    """Gợi ý 5 công việc phù hợp nhất dùng GNNEncoder + subgraph inference."""
    try:
        user_id = request.current_user_id
        request_tag = f"user={user_id}|ts={int(time.time() * 1000)}"
        logger.info(f"[seeker/recommendations][{request_tag}] REQUEST: user_id={user_id}")

        user, infor = _get_user_context(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        logger.info(f"[seeker/recommendations][{request_tag}] User {user_id} found. Username: {user.username}")

        missing_fields  = _get_profile_missing_fields(infor)
        blocking_fields = [f for f in missing_fields if f in ('location', 'desired_job')]
        logger.info(f"[seeker/recommendations][{request_tag}] Profile missing fields: {missing_fields}")

        if blocking_fields:
            logger.warning(f"[seeker/recommendations][{request_tag}] Profile incomplete: {blocking_fields}")
            return jsonify({
                "profile_complete": False,
                "profile_missing_fields": missing_fields,
                "recommendations": [],
                "message": "Profile incomplete",
            }), 200

        # --- Cache hit ---
        logger.info(f"[seeker/recommendations][{request_tag}] Profile complete, checking cache...")
        cached = _deserialize_recommendations_cache(user.recommendations)
        if cached is not None:
            logger.info(f"[seeker/recommendations][{request_tag}] Cache hit! Returning {len(cached)} recommendations")
            return jsonify({
                "profile_complete": True,
                "user": {"id": user.id, "username": user.username, "email": user.email},
                "recommendations": cached,
                "total_jobs_considered": 0,
                "cached": True,
            })

        # --- Cache miss: score all jobs via subgraph ---
        logger.info(f"[seeker/recommendations][{request_tag}] Cache miss, loading jobs from DB...")
        jobs = Job.query.order_by(Job.id.desc()).all()
        logger.info(f"[seeker/recommendations][{request_tag}] Total jobs: {len(jobs)}")

        if not jobs:
            return jsonify({"profile_complete": True, "recommendations": []})

        BATCH_SIZE = 2000
        all_scored = []
        infor = _get_infor_for_user(user)
        
        for i in range(0, len(jobs), BATCH_SIZE):
            batch = jobs[i:i + BATCH_SIZE]
            
            if infor and infor.user_embedding:
                try:
                    user_emb = json.loads(infor.user_embedding)
                    # Collect embeddings for all jobs in batch
                    job_embs_list = []
                    valid_batch_jobs = []
                    for job in batch:
                        if job.job_embedding:
                            try:
                                job_emb = json.loads(job.job_embedding)
                                job_embs_list.append(job_emb)
                                valid_batch_jobs.append(job)
                            except Exception:
                                pass
                    
                    if job_embs_list:
                        batch_scores = _score_jobs_via_embeddings(user_emb, np.array(job_embs_list))
                        all_scored.extend(zip(batch_scores.tolist(), valid_batch_jobs))
                except Exception as e:
                    logger.exception(f"[seeker/recommendations] Error scoring batch: {e}")
        
            # Fall back to all jobs if no embeddings available
            if not all_scored:
                all_scored.extend([(0.5, job) for job in batch])
            logger.debug(
                f"[seeker/recommendations][{request_tag}] Progress: {min(i+BATCH_SIZE, len(jobs))}/{len(jobs)} jobs scored"
            )

        # Sort descending và lấy top 5
        all_scored.sort(key=lambda x: x[0], reverse=True)
        top_5 = all_scored[:5]

        # Score * 100 để hiển thị dạng phần trăm
        recommendations = [_serialize_job(job, score=score * 100) for score, job in top_5]
        _save_recommendations_cache(user, recommendations)

        logger.info(f"[seeker/recommendations][{request_tag}] Top 5 jobs:")
        for score, job in top_5:
            logger.info(f"  [seeker/recommendations][{request_tag}] score={score * 100:.2f}% {job.job_title} @ {job.company_name}")

        return jsonify({
            "profile_complete": True,
            "user": {"id": user.id, "username": user.username, "email": user.email},
            "recommendations": recommendations,
            "total_jobs_considered": len(jobs),
            "cached": False,
        })

    except Exception as e:
        logger.error(f"[seeker/recommendations] CRITICAL ERROR: {str(e)}")
        logger.error(f"[seeker/recommendations] Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "message": "Failed to generate recommendations"}), 500