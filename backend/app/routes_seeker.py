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

from .embedding_pipeline import score_jobs_for_user, _parse_salary_nums, _build_job_feat, _cosine_fallback_tfidf
from .models import db, User, InforUser, Job, Application, RecruitmentInvitation, SeekerSetting, EmployerNotification, SeekerNotificationRead

import numpy as np
from .auth import seeker_required, login_required
from .routes import (
    _get_infor_for_user, _get_user_context, _get_profile_missing_fields,
    _get_profile_completion,
    _deserialize_recommendations_cache,
    _save_recommendations_cache, _serialize_job, LOCKED_JOB_MESSAGE,
)
from .embedding_utils import generate_and_save_user_embedding


seeker_bp = Blueprint('seeker', __name__, url_prefix='/seeker')

# Configure logging
logger = logging.getLogger(__name__)

UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 'instance', 'uploads'
)


# ---------------------------------------------------------------------------
# Helper: Lọc jobs theo ngành nghề
# ---------------------------------------------------------------------------
def _filter_jobs_by_industry(infor, jobs):
    """
    Lọc danh sách jobs theo ngành nghề của user.
    Nếu user không có industry hoặc industries trống, trả về tất cả jobs.
    Ngược lại, chỉ giữ jobs có industries khớp (case-insensitive).
    
    Returns: (filtered_jobs, jobs_filtered_count)
    """
    if not infor or not infor.industry:
        return jobs, 0
    
    user_industry = (infor.industry or '').strip().lower()
    if not user_industry:
        return jobs, 0
    
    filtered = []
    for job in jobs:
        job_industry = (job.industries or '').strip().lower()
        if job_industry == user_industry:
            filtered.append(job)
    
    filtered_count = len(jobs) - len(filtered)
    return filtered, filtered_count


def _salary_range_from_text(sal_str):
    if not sal_str:
        return 0.0, 0.0
    return _parse_salary_nums(str(sal_str))


def _job_salary_matches_user(job, user_min, user_max):
    if user_min <= 0 or user_max <= 0:
        return False
    job_min, job_max = _parse_salary_nums(str(getattr(job, 'salary_min', '') or ''))
    parsed_max = _parse_salary_nums(str(getattr(job, 'salary_max', '') or ''))[1]
    if parsed_max > 0:
        job_max = parsed_max
    if job_max <= 0 and job_min > 0:
        job_max = job_min * 1.2
    if job_min <= 0 and job_max <= 0:
        return False
    return not (job_max < user_min or job_min > user_max)


def _salary_ranges_overlap(user_salary, job_salary):
    user_min, user_max = user_salary
    job_min, job_max = job_salary
    if user_min <= 0 or user_max <= 0 or job_min <= 0 or job_max <= 0:
        return False
    return not (job_max < user_min or job_min > user_max)


def _get_recent_applied_job_ids(user, limit=10):
    if not getattr(user, 'recent_applied_jobs', None):
        return []
    try:
        ids = json.loads(user.recent_applied_jobs)
        if not isinstance(ids, list):
            return []
        normalized = []
        for item in ids:
            if isinstance(item, int):
                normalized.append(item)
            elif isinstance(item, str) and item.isdigit():
                normalized.append(int(item))
        return normalized[:limit]
    except Exception:
        return []


def _append_recent_applied_job_id(user, job_id, limit=10):
    if not user:
        return []
    ids = _get_recent_applied_job_ids(user, limit)
    if job_id in ids:
        ids.remove(job_id)
    ids.insert(0, job_id)
    ids = ids[:limit]
    user.recent_applied_jobs = json.dumps(ids, ensure_ascii=False)
    return ids


def _remove_recent_applied_job_id(user, job_id):
    if not user:
        return []
    ids = _get_recent_applied_job_ids(user, limit=10)
    if job_id in ids:
        ids.remove(job_id)
    user.recent_applied_jobs = json.dumps(ids, ensure_ascii=False)
    return ids


def _score_jobs_against_recent_applied_jobs(recent_job_ids, candidate_jobs):
    if not recent_job_ids or not candidate_jobs:
        return np.zeros(len(candidate_jobs), dtype=np.float32)

    recent_jobs = Job.query.filter(Job.id.in_(recent_job_ids)).all()
    if not recent_jobs:
        return np.zeros(len(candidate_jobs), dtype=np.float32)

    recent_feats = []
    for job in recent_jobs:
        try:
            recent_feats.append(_build_job_feat(job).numpy())
        except Exception:
            recent_feats.append(np.zeros(265, dtype=np.float32))
    candidate_feats = []
    for job in candidate_jobs:
        try:
            candidate_feats.append(_build_job_feat(job).numpy())
        except Exception:
            candidate_feats.append(np.zeros(265, dtype=np.float32))

    recent_feats = np.stack(recent_feats).astype(np.float32)
    candidate_feats = np.stack(candidate_feats).astype(np.float32)

    recent_text = recent_feats[:, -256:]
    candidate_text = candidate_feats[:, -256:]

    recent_norm = recent_text / (np.linalg.norm(recent_text, axis=1, keepdims=True) + 1e-12)
    candidate_norm = candidate_text / (np.linalg.norm(candidate_text, axis=1, keepdims=True) + 1e-12)

    sims = candidate_norm @ recent_norm.T
    best_sim = np.max(sims, axis=1)
    scores = ((np.clip(best_sim, -1, 1) + 1.0) / 2.0).astype(np.float32)
    return scores

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


def _serialize_notification_item(item_type, title, message, created_at, job=None, status=None, source_id=None, is_read=False):
    notification_id = (
        f"{item_type}-{source_id}-{status}"
        if source_id is not None and status
        else f"{item_type}-{source_id}"
        if source_id is not None
        else f"{item_type}-{int(created_at.timestamp()) if created_at else 0}"
    )
    return {
        "id": notification_id,
        "type": item_type,
        "title": title,
        "message": message,
        "status": status,
        "is_read": bool(is_read),
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


def _ensure_seeker_notification_read_table():
    SeekerNotificationRead.__table__.create(db.engine, checkfirst=True)


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
    _ensure_seeker_notification_read_table()
    db.session.commit()
    read_ids = {
        item.notification_id
        for item in SeekerNotificationRead.query.filter_by(user_id=user_id).all()
    }

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
            is_read=f"application_status-{application.id}-{status}" in read_ids,
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
            is_read=f"invitation-{invitation.id}-{invitation.status}" in read_ids,
        ))

    notifications.sort(key=lambda item: item.get('created_at') or '', reverse=True)
    notifications = notifications[:50]

    return jsonify({
        "notifications": notifications,
        "unread_count": sum(1 for item in notifications if not item.get("is_read")),
    })


@seeker_bp.route('/notifications/<path:notification_id>/read', methods=['PUT'])
@seeker_required
def mark_notification_read(notification_id):
    user_id = request.current_user_id
    notification_id = (notification_id or '').strip()
    if not notification_id:
        return jsonify({"error": "notification_id khÃ´ng há»£p lá»‡"}), 400

    _ensure_seeker_notification_read_table()
    existing = SeekerNotificationRead.query.filter_by(
        user_id=user_id,
        notification_id=notification_id,
    ).first()
    if not existing:
        db.session.add(SeekerNotificationRead(
            user_id=user_id,
            notification_id=notification_id,
        ))
        db.session.commit()

    return jsonify({"message": "ÄÃ£ Ä‘Ã¡nh dáº¥u Ä‘Ã£ xem"})


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
        _append_recent_applied_job_id(seeker, job_id)
        seeker.recommendations = None
        db.session.commit()

        try:
            _create_new_application_notification(job, seeker)
            db.session.commit()
        except Exception as notification_error:
            db.session.rollback()
            logger.warning(
                "[seeker/apply] Failed to create employer notification after saving application: %s",
                notification_error,
            )

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

    seeker = User.query.get(request.current_user_id)
    if seeker:
        _remove_recent_applied_job_id(seeker, application.job_id)
        seeker.recommendations = None

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

        # --- TỰ ĐỘNG TÍNH exp_min (mặc định 0) và exp_max (số năm):
        # exp_max = (latest end date among experiences) - (earliest start date among experiences)
        try:
            experiences_list = None
            if isinstance(experience_payload, list):
                experiences_list = experience_payload
            else:
                # nếu lưu dưới dạng chuỗi JSON trong infor.experience
                try:
                    experiences_list = json.loads(infor.experience) if infor.experience else None
                except Exception:
                    experiences_list = None

            # Parse dates
            start_dates = []
            end_dates = []
            today = datetime.utcnow().date()
            if isinstance(experiences_list, list):
                for item in experiences_list:
                    if not isinstance(item, dict):
                        continue
                    s = item.get('startDate') or item.get('from') or item.get('start')
                    e = item.get('endDate') or item.get('to') or item.get('end')

                    # parse start
                    if isinstance(s, str) and len(s) >= 4 and s[:4].isdigit():
                        try:
                            if len(s) >= 10 and s[4] == '-':
                                sd = datetime.strptime(s[:10], '%Y-%m-%d').date()
                            else:
                                sd = datetime(int(s[:4]), 1, 1).date()
                            start_dates.append(sd)
                        except Exception:
                            pass

                    # parse end
                    if isinstance(e, str):
                        if e.strip().lower() in ('hiện tại', 'hien tai', 'present', 'current'):
                            end_dates.append(today)
                        elif len(e) >= 4 and e[:4].isdigit():
                            try:
                                if len(e) >= 10 and e[4] == '-':
                                    ed = datetime.strptime(e[:10], '%Y-%m-%d').date()
                                else:
                                    ed = datetime(int(e[:4]), 1, 1).date()
                                end_dates.append(ed)
                            except Exception:
                                pass
                    else:
                        # nếu không có end date, coi là hiện tại
                        if e in (None, '', []):
                            end_dates.append(today)

            # Compute exp_min and exp_max
            # exp_min mặc định 0
            computed_exp_min = 0
            computed_exp_max = 0
            if start_dates and end_dates:
                min_start = min(start_dates)
                max_end = max(end_dates)
                delta_days = (max_end - min_start).days
                years = max(0, int(delta_days // 365))
                computed_exp_max = years

            infor.exp_min = str(computed_exp_min)
            infor.exp_max = str(computed_exp_max)
        except Exception:
            infor.exp_min = infor.exp_min or '0'
            infor.exp_max = infor.exp_max or '0'

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
        all_jobs = Job.query.filter(
            Job.is_active == True,
            Job.is_locked == False,
            Job.is_deleted == False,
        ).order_by(Job.id.desc()).all()
        logger.info(f"[seeker/recommendations][{request_tag}] Total jobs in DB: {len(all_jobs)}")

        jobs, jobs_filtered_out = _filter_jobs_by_industry(infor, all_jobs)
        logger.info(f"[seeker/recommendations][{request_tag}] After industry filter: {len(jobs)} jobs (filtered out: {jobs_filtered_out})")
        
        applied_job_ids = {
            app.job_id
            for app in Application.query.filter_by(user_id=user.id).all()
            if app.job_id is not None
        }
        jobs = [job for job in jobs if job.id not in applied_job_ids]
        logger.info(
            f"[seeker/recommendations][{request_tag}] After removing applied jobs: {len(jobs)} jobs remain"
        )

        if not jobs:
            return jsonify({
                "profile_complete": True,
                "profile_completion_percentage": profile_completion["percentage"],
                "profile_completion": profile_completion,
                "recommendations": [],
            })

        # Ưu tiên jobs trùng khoảng lương mong muốn của seeker
        user_salary = _salary_range_from_text(infor.desired_salary if infor else '')
        salary_matched_jobs = [job for job in jobs if _job_salary_matches_user(job, *user_salary)]

        if salary_matched_jobs:
            logger.info(
                f"[seeker/recommendations][{request_tag}] Found {len(salary_matched_jobs)} jobs matching user's salary range; prioritizing these"
            )
            jobs_to_score = salary_matched_jobs
        else:
            if user_salary[0] > 0:
                logger.info(
                    f"[seeker/recommendations][{request_tag}] No jobs matched salary range; using all {len(jobs)} jobs after industry filter"
                )
            jobs_to_score = jobs

        # score_jobs_for_user tự build feature từ raw data — không cần đọc embedding từ DB
        BATCH_SIZE = 2000
        all_scored = []
        infor = _get_infor_for_user(user)

        recent_ids = _get_recent_applied_job_ids(user, limit=10)
        recent_scores = None
        if recent_ids:
            try:
                recent_scores = _score_jobs_against_recent_applied_jobs(recent_ids, jobs_to_score)
            except Exception as e:
                logger.warning(f"[seeker/recommendations][{request_tag}] Lỗi score với recent applied jobs: {e}")

        for i in range(0, len(jobs_to_score), BATCH_SIZE):
            batch = jobs_to_score[i:i + BATCH_SIZE]
            try:
                batch_scores = score_jobs_for_user(user, infor, batch)
                if recent_scores is not None:
                    batch_recent_scores = recent_scores[i:i + BATCH_SIZE]
                    batch_scores = 0.7 * batch_scores + 0.3 * batch_recent_scores
                all_scored.extend(zip(batch_scores.tolist(), batch))
            except Exception as e:
                logger.exception(f"[seeker/recommendations] Error scoring batch: {e}")
                fallback_scores = np.array([0.5] * len(batch), dtype=np.float32)
                if recent_scores is not None:
                    fallback_scores = 0.7 * fallback_scores + 0.3 * recent_scores[i:i + BATCH_SIZE]
                all_scored.extend([(float(score), job) for score, job in zip(fallback_scores.tolist(), batch)])
            logger.debug(
                f"[seeker/recommendations][{request_tag}] Progress: {min(i+BATCH_SIZE, len(jobs_to_score))}/{len(jobs_to_score)} jobs scored"
            )

        # Fallback nếu toàn bộ batch đều lỗi
        if not all_scored:
            all_scored = [(0.5, job) for job in jobs_to_score]

        # Sort descending và lấy top 5
        all_scored.sort(key=lambda x: x[0], reverse=True)
        top_5 = all_scored[:5]

        # Score * 100 để hiển thị dạng phần trăm
        recommendations = [_serialize_job(job, score=score * 100) for score, job in top_5]
        _save_recommendations_cache(user, recommendations)

        logger.info(f"[seeker/recommendations][{request_tag}] Top 5 jobs (from {len(jobs_to_score)} after salary prioritization and industry filter):")
        for score, job in top_5:
            logger.info(f"  [seeker/recommendations][{request_tag}] score={score * 100:.2f}% {job.job_title} @ {job.company_name} ({job.industries})")

        return jsonify({
            "profile_complete": True,
            "profile_completion_percentage": profile_completion["percentage"],
            "profile_completion": profile_completion,
            "user": {"id": user.id, "username": user.username, "email": user.email},
            "recommendations": recommendations,
            "total_jobs_considered": len(jobs_to_score),
            "cached": False,
        })

    except Exception as e:
        logger.error(f"[seeker/recommendations] CRITICAL ERROR: {str(e)}")
        logger.error(f"[seeker/recommendations] Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "message": "Failed to generate recommendations"}), 500
