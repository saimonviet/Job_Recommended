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

from .models import db, User, InforUser, Job, Application, RecruitmentInvitation, SeekerSetting, EmployerNotification
import numpy as np
from .auth import seeker_required, login_required
from .routes import (
    _get_infor_for_user, _get_user_context, _get_profile_missing_fields,
    _get_profile_completion,
    _deserialize_recommendations_cache,
    _save_recommendations_cache, _serialize_job, LOCKED_JOB_MESSAGE,
)
from .embedding_utils import generate_and_save_user_embedding

# Đã import thêm map_industry_group để phục vụ việc so sánh ngành nghề
from .embedding_pipeline import (
    score_jobs_for_user, 
    extract_province, 
    _parse_salary_nums,
    map_industry_group
)

NORTH_PROVINCES = [
    'Hà Nội', 'Hải Phòng', 'Bắc Giang', 'Bắc Kạn', 'Bắc Ninh', 'Cao Bằng', 
    'Điện Biên', 'Hà Giang', 'Hà Nam', 'Hải Dương', 'Hòa Bình', 'Hưng Yên', 
    'Lai Châu', 'Lạng Sơn', 'Lào Cai', 'Nam Định', 'Ninh Bình', 'Phú Thọ', 
    'Quảng Ninh', 'Sơn La', 'Thái Bình', 'Thái Nguyên', 'Tuyên Quang', 'Vĩnh Phúc', 'Yên Bái'
]

CENTRAL_PROVINCES = [
    'Đà Nẵng', 'Bình Định', 'Bình Thuận', 'Đắk Lắk', 'Đắk Nông', 'Gia Lai', 
    'Hà Tĩnh', 'Khánh Hòa', 'Kon Tum', 'Lâm Đồng', 'Nghệ An', 'Ninh Thuận', 
    'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Trị', 'Thanh Hóa', 'Thừa Thiên Huế'
]

SOUTH_PROVINCES = [
    'Hồ Chí Minh', 'Cần Thơ', 'An Giang', 'Bà Rịa - Vũng Tàu', 'Bạc Liêu', 
    'Bến Tre', 'Bình Dương', 'Bình Phước', 'Cà Mau', 'Đồng Nai', 'Đồng Tháp', 
    'Hậu Giang', 'Kiên Giang', 'Long An', 'Sóc Trăng', 'Tây Ninh', 'Tiền Giang', 'Trà Vinh', 'Vĩnh Long'
]

def get_region(province_name):
    if province_name in NORTH_PROVINCES:
        return 'North'
    if province_name in CENTRAL_PROVINCES:
        return 'Central'
    if province_name in SOUTH_PROVINCES:
        return 'South'
    return 'Other'

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
            "is_locked": bool(getattr(app.job, 'is_locked', False)),
            "job_warning": LOCKED_JOB_MESSAGE if getattr(app.job, 'is_locked', False) else None,
        } if app.job else None,
    }


def _serialize_notification_item(item_type, title, message, created_at, job=None, status=None, source_id=None):
    return {
        "id": f"{item_type}-{source_id}" if source_id is not None else f"{item_type}-{int(created_at.timestamp()) if created_at else 0}",
        "type": item_type,
        "title": title,
        "message": message,
        "status": status,
        "created_at": created_at.isoformat() if created_at else None,
        "job": {
            "id": job.id,
            "job_title": job.job_title,
            "company_name": job.company_name,
            "job_address": job.job_address,
            "is_locked": bool(getattr(job, 'is_locked', False)),
            "job_warning": LOCKED_JOB_MESSAGE if getattr(job, 'is_locked', False) else None,
        } if job else None,
    }


def _get_or_create_seeker_settings(user_id):
    settings = SeekerSetting.query.filter_by(user_id=user_id).first()
    if not settings:
        settings = SeekerSetting(user_id=user_id)
        db.session.add(settings)
        db.session.flush()
    return settings


def _ensure_employer_notification_table():
    EmployerNotification.__table__.create(db.engine, checkfirst=True)


def _create_new_application_notification(job, seeker):
    if not job or not job.employer_id:
        return

    _ensure_employer_notification_table()
    seeker_name = seeker.username if seeker else 'Một ứng viên'
    db.session.add(EmployerNotification(
        employer_id=job.employer_id,
        type='new_application',
        title='Có ứng viên mới',
        message=f"{seeker_name} vừa nộp hồ sơ vào vị trí {job.job_title}.",
    ))


def _serialize_seeker_settings(settings):
    return {
        "newJobNotifications": settings.application_review_notifications,
        "applicationReviewNotifications": settings.application_review_notifications,
        "recruiterContact": settings.recruiter_contact,
        "newsAndUpdates": settings.news_and_updates,
        "profileVisibility": settings.profile_visibility or "public",
        "updated_at": settings.updated_at.isoformat() if settings.updated_at else None,
    }


# ---------------------------------------------------------------------------
# Nộp đơn / Application
# ---------------------------------------------------------------------------

@seeker_bp.route('/settings', methods=['GET'])
@seeker_required
def get_settings():
    """Lấy cài đặt riêng của seeker hiện tại."""
    user = User.query.get(request.current_user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user"}), 404

    settings = _get_or_create_seeker_settings(user.id)
    db.session.commit()
    return jsonify(_serialize_seeker_settings(settings))


@seeker_bp.route('/settings', methods=['PUT'])
@seeker_required
def update_settings():
    """Cập nhật cài đặt thông báo và quyền riêng tư của seeker."""
    user = User.query.get(request.current_user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user"}), 404

    data = request.get_json(silent=True) or {}
    settings = _get_or_create_seeker_settings(user.id)

    if 'newJobNotifications' in data:
        settings.application_review_notifications = bool(data.get('newJobNotifications'))
    if 'applicationReviewNotifications' in data:
        settings.application_review_notifications = bool(data.get('applicationReviewNotifications'))
    if 'recruiterContact' in data:
        settings.recruiter_contact = bool(data.get('recruiterContact'))
    if 'newsAndUpdates' in data:
        settings.news_and_updates = bool(data.get('newsAndUpdates'))
    if 'profileVisibility' in data:
        visibility = (data.get('profileVisibility') or '').strip()
        if visibility not in ('public', 'private'):
            return jsonify({"error": "profileVisibility không hợp lệ"}), 400
        settings.profile_visibility = visibility

    try:
        db.session.commit()
        return jsonify({
            "message": "Cập nhật cài đặt thành công",
            "settings": _serialize_seeker_settings(settings),
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@seeker_bp.route('/account', methods=['DELETE'])
@seeker_required
def deactivate_account():
    """Vô hiệu hóa tài khoản seeker hiện tại."""
    user = User.query.get(request.current_user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user"}), 404

    user.is_active = False
    try:
        db.session.commit()
        return jsonify({"message": "Tài khoản đã được vô hiệu hóa"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@seeker_bp.route('/notifications', methods=['GET'])
@seeker_required
def get_notifications():
    """Thông báo cho seeker: được mời, được duyệt/phỏng vấn, hoặc bị từ chối."""
    user_id = request.current_user_id

    settings = _get_or_create_seeker_settings(user_id)
    db.session.commit()

    status_messages = {
        'reviewed': (
            'Hồ sơ đã được xem',
            'Nhà tuyển dụng đã xem hồ sơ ứng tuyển của bạn.',
            'reviewed',
        ),
        'interview': (
            'Bạn được mời phỏng vấn',
            'Nhà tuyển dụng muốn trao đổi thêm với bạn về vị trí này.',
            'interview',
        ),
        'accepted': (
            'Hồ sơ được duyệt',
            'Chúc mừng! Hồ sơ ứng tuyển của bạn đã được chấp nhận.',
            'accepted',
        ),
        'rejected': (
            'Hồ sơ bị từ chối',
            'Nhà tuyển dụng đã từ chối hồ sơ ứng tuyển của bạn.',
            'rejected',
        ),
    }

    notifications = []

    applications = [] if not settings.application_review_notifications else (
        Application.query
        .filter(Application.user_id == user_id)
        .filter(Application.status.in_(status_messages.keys()))
        .order_by(Application.updated_at.desc())
        .limit(50)
        .all()
    )
    for application in applications:
        title, message, status = status_messages.get(application.status)
        job_title = application.job.job_title if application.job else 'vị trí đã ứng tuyển'
        notifications.append(_serialize_notification_item(
            item_type='application_status',
            title=title,
            message=f"{message} ({job_title})",
            created_at=application.updated_at or application.applied_at,
            job=application.job,
            status=status,
            source_id=application.id,
        ))

    invitations = [] if not settings.recruiter_contact else (
        RecruitmentInvitation.query
        .filter_by(user_id=user_id)
        .order_by(RecruitmentInvitation.sent_at.desc())
        .limit(50)
        .all()
    )
    for invitation in invitations:
        job = Job.query.get(invitation.job_id)
        job_title = job.job_title if job else 'một vị trí tuyển dụng'
        company_name = job.company_name if job else 'nhà tuyển dụng'
        custom_message = (invitation.message or '').strip()
        message = custom_message or f"{company_name} đã mời bạn ứng tuyển vào {job_title}."
        notifications.append(_serialize_notification_item(
            item_type='invitation',
            title='Bạn được mời ứng tuyển',
            message=message,
            created_at=invitation.sent_at,
            job=job,
            status=invitation.status,
            source_id=invitation.id,
        ))

    notifications.sort(key=lambda item: item.get('created_at') or '', reverse=True)
    notifications = notifications[:50]

    return jsonify({
        "notifications": notifications,
        "unread_count": len(notifications),
    })


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

    if getattr(job, 'is_locked', False):
        return jsonify({"error": LOCKED_JOB_MESSAGE}), 423

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
        seeker = User.query.get(user_id)
        _create_new_application_notification(job, seeker)
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
    per_page = request.args.get('per_page', 6, type=int)
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

    profile_completion = _get_profile_completion(infor)

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
        "profile_completion_percentage": profile_completion["percentage"],
        "profile_completion": profile_completion,
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
        exp_min_value = (data['exp_min'] or '').strip()
        if exp_min_value:
            try:
                exp_min_int = int(exp_min_value)
            except (TypeError, ValueError):
                return jsonify({"error": "exp_min không hợp lệ"}), 400
            if exp_min_int < 0:
                return jsonify({"error": "exp_min phải lớn hơn hoặc bằng 0"}), 400
        infor.exp_min = exp_min_value or None
    if 'exp_max' in data:
        exp_max_value = (data['exp_max'] or '').strip()
        if exp_max_value:
            try:
                exp_max_int = int(exp_max_value)
            except (TypeError, ValueError):
                return jsonify({"error": "exp_max không hợp lệ"}), 400
            if exp_max_int < 0:
                return jsonify({"error": "exp_max phải lớn hơn hoặc bằng 0"}), 400
        infor.exp_max = exp_max_value or None

    if (data.get('exp_min') or data.get('exp_max')) and infor.exp_min and infor.exp_max:
        try:
            if int(infor.exp_max) < int(infor.exp_min):
                return jsonify({"error": "exp_max phải lớn hơn hoặc bằng exp_min"}), 400
        except (TypeError, ValueError):
            return jsonify({"error": "exp_min/exp_max không hợp lệ"}), 400

    # Xóa cache gợi ý khi profile thay đổi
    user.recommendations = None

    try:
        db.session.commit()
        generate_and_save_user_embedding(user, infor, commit=True)

        profile_completion = _get_profile_completion(infor)
        return jsonify({
            "message": "Cập nhật hồ sơ thành công",
            "profile_completion_percentage": profile_completion["percentage"],
            "profile_completion": profile_completion,
        })
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
                "is_locked": bool(getattr(job, 'is_locked', False)),
                "job_warning": LOCKED_JOB_MESSAGE if getattr(job, 'is_locked', False) else None,
            })

    return jsonify({"saved_jobs": jobs, "saved_job_ids": saved_ids})


@seeker_bp.route('/saved-jobs/<int:job_id>', methods=['POST'])
@seeker_required
def save_job(job_id):
    user = User.query.get(request.current_user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user"}), 404

    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Không tìm thấy job"}), 404

    if getattr(job, 'is_locked', False):
        return jsonify({"error": LOCKED_JOB_MESSAGE}), 423

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
        profile_completion = _get_profile_completion(infor)
        blocking_fields = [f for f in missing_fields if f in ('location', 'desired_job')]
        logger.info(f"[seeker/recommendations][{request_tag}] Profile missing fields: {missing_fields}")

        if blocking_fields:
            logger.warning(f"[seeker/recommendations][{request_tag}] Profile incomplete: {blocking_fields}")
            return jsonify({
                "profile_complete": False,
                "profile_missing_fields": missing_fields,
                "profile_completion_percentage": profile_completion["percentage"],
                "profile_completion": profile_completion,
                "recommendations": [],
                "message": "Profile incomplete",
            }), 200

        # --- Cache hit ---
        logger.info(f"[seeker/recommendations][{request_tag}] Profile complete, checking cache...")
        cached = _deserialize_recommendations_cache(user.recommendations)
        if cached is not None and len(cached) > 0:
            logger.info(f"[seeker/recommendations][{request_tag}] Cache hit! Returning {len(cached)} recommendations")
            return jsonify({
                "profile_complete": True,
                "profile_completion_percentage": profile_completion["percentage"],
                "profile_completion": profile_completion,
                "user": {"id": user.id, "username": user.username, "email": user.email},
                "recommendations": cached,
                "total_jobs_considered": 0,
                "cached": True,
            })
            
        # --- Cache miss: score all jobs via subgraph ---
        logger.info(f"[seeker/recommendations][{request_tag}] Cache miss, loading jobs from DB...")
        jobs = Job.query.filter(
            Job.is_active == True,
            Job.is_locked == False,
            Job.is_deleted == False,
        ).order_by(Job.id.desc()).all()
        logger.info(f"[seeker/recommendations][{request_tag}] Total raw jobs: {len(jobs)}")

        if not jobs:
            return jsonify({
                "profile_complete": True,
                "profile_completion_percentage": profile_completion["percentage"],
                "profile_completion": profile_completion,
                "recommendations": [],
            })

        # Chấm điểm toàn bộ Job bằng Cosine Similarity
        BATCH_SIZE = 5000
        all_scored = []
        infor = _get_infor_for_user(user)

        for i in range(0, len(jobs), BATCH_SIZE):
            batch = jobs[i:i + BATCH_SIZE]
            try:
                batch_scores = score_jobs_for_user(user, infor, batch)
                all_scored.extend(zip(batch_scores.tolist(), batch))
            except Exception as e:
                logger.exception(f"[seeker/recommendations] Error scoring batch: {e}")
                all_scored.extend([(0.5, job) for job in batch])
            logger.debug(
                f"[seeker/recommendations][{request_tag}] Progress: {min(i+BATCH_SIZE, len(jobs))}/{len(jobs)} jobs scored"
            )

        if not all_scored:
            all_scored = [(0.5, job) for job in jobs]

        # ==========================================
        # BƯỚC SẮP XẾP ƯU TIÊN ĐA TẦNG (MULTI-KEY SORT)
        # ==========================================
        user_province = extract_province(infor.workplace_desired)
        user_region = get_region(user_province)
        user_sal_min, _ = _parse_salary_nums(infor.desired_salary)
        user_industry = map_industry_group(infor.industry)

        enhanced_scores = []
        for score, job in all_scored:
            # 1. Khớp Ngành nghề
            job_industry = map_industry_group(job.industries)
            ind_match = 1 if (user_industry == 'Khác' or job_industry == 'Khác' or user_industry == job_industry) else 0

            # 2. Khớp Lương
            try:
                job_sal_min = float(job.salary_min) if job.salary_min not in (None, '') else 0.0
            except (ValueError, TypeError):
                job_sal_min, _ = _parse_salary_nums(str(job.salary_min or ''))

            try:
                job_sal_max = float(job.salary_max) if job.salary_max not in (None, '') else 0.0
            except (ValueError, TypeError):
                _, job_sal_max = _parse_salary_nums(str(job.salary_max or ''))

            if job_sal_max == 0 and job_sal_min > 0:
                job_sal_max = job_sal_min * 1.2

            sal_match = 1 if (user_sal_min == 0 or job_sal_max == 0 or job_sal_max >= user_sal_min) else 0

            # 3. Khớp Khu vực (Bắc/Trung/Nam)
            job_province = extract_province(job.job_address)
            job_region = get_region(job_province)
            loc_match = 1 if (
                user_region == 'Other' or
                job_region == 'Other' or
                job_province in ['Toàn quốc', 'Tại Nhà', 'Nước ngoài'] or
                user_region == job_region
            ) else 0

            enhanced_scores.append({
                'score': score,
                'job': job,
                'ind_match': ind_match,
                'sal_match': sal_match,
                'loc_match': loc_match
            })

        # Sắp xếp theo tuple (A, B, C, D, E)
        # Bằng cách làm tròn score 1 chữ số thập phân (vd: 0.86 và 0.92 đều -> 0.9),
        # hệ thống sẽ gom các job có độ phù hợp từ AI gần bằng nhau vào cùng một nhóm.
        # Trong cùng nhóm đó, nó ưu tiên: Ngành -> Lương -> Khu vực -> Điểm Cosine chính xác.
        enhanced_scores.sort(
            key=lambda x: (
                round(x['score'], 1),  
                x['ind_match'],        
                x['sal_match'],        
                x['loc_match'],       
                x['score']             
            ),
            reverse=True
        )

        # Lấy top 5 sau khi đã qua bộ lọc ưu tiên
        top_5 = [(x['score'], x['job']) for x in enhanced_scores[:5]]

        recommendations = [_serialize_job(job, score=score * 100) for score, job in top_5]
        _save_recommendations_cache(user, recommendations)

        logger.info(f"[seeker/recommendations][{request_tag}] Top 5 jobs after priority sorting:")
        for score, job in top_5:
            logger.info(f"  [seeker/recommendations][{request_tag}] score={score * 100:.2f}% {job.job_title} @ {job.company_name}")

        return jsonify({
            "profile_complete": True,
            "profile_completion_percentage": profile_completion["percentage"],
            "profile_completion": profile_completion,
            "user": {"id": user.id, "username": user.username, "email": user.email},
            "recommendations": recommendations,
            "total_jobs_considered": len(jobs),
            "cached": False,
        })

    except Exception as e:
        logger.error(f"[seeker/recommendations] CRITICAL ERROR: {str(e)}")
        logger.error(f"[seeker/recommendations] Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "message": "Failed to generate recommendations"}), 500
