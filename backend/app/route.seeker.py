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
from flask import Blueprint, request, jsonify
from datetime import datetime
from werkzeug.utils import secure_filename
from .models import db, User, InforUser, Job, Application
from .auth import seeker_required, login_required

seeker_bp = Blueprint('seeker', __name__, url_prefix='/seeker')

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
        "job_id": app.job_id,
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
    """Lấy hồ sơ seeker."""
    user = User.query.get(request.current_user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user"}), 404

    infor = InforUser.query.filter_by(user_id=user.id).first()
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

    infor = InforUser.query.filter_by(user_id=user.id).first()
    if not infor:
        infor = InforUser(user_id=user.id, username=user.username)
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
        'skills': 'skills',
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
            jobs.append({
                "id": job.id,
                "job_title": job.job_title,
                "company_name": job.company_name,
                "job_address": job.job_address,
                "deadline": job.deadline.isoformat() if job.deadline else None,
                "employment_type": job.employment_type,
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