"""
routes_employer.py — Quản lý job và ứng viên cho Employer

Endpoints:
    GET    /employer/profile
    PUT    /employer/profile
    POST   /employer/jobs
    GET    /employer/jobs
    GET    /employer/jobs/<job_id>
    PUT    /employer/jobs/<job_id>
    DELETE /employer/jobs/<job_id>
    GET    /employer/jobs/<job_id>/applicants
    GET    /employer/applications/<app_id>
    PUT    /employer/applications/<app_id>/status
"""

import os
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from datetime import datetime, timedelta
from collections import Counter
from werkzeug.utils import secure_filename

from .models import db, Employer, Job, Application, User, InforUser, RecruitmentInvitation, SeekerSetting, EmployerNotification
from .auth import employer_required, admin_required
from .routes import _get_profile_completion
from sqlalchemy import or_
from .embedding_utils import generate_and_save_job_embedding


employer_bp = Blueprint('employer', __name__, url_prefix='/employer')

UPLOAD_FOLDER_LOGOS = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 'instance', 'logos'
)
UPLOAD_FOLDER_CVS = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 'instance', 'cvs'
)


def _serialize_application(app: Application, include_job=False) -> dict:
    user = User.query.get(app.user_id)
    infor = InforUser.query.get(app.user_id)
    profile_completion = _get_profile_completion(infor)
    result = {
        "id": app.id,
        "user_id": app.user_id,
        "status": app.status,
        "cover_letter": app.cover_letter,
        "cv_path": app.cv_path,
        "employer_note": app.employer_note,
        "applied_at": app.applied_at.isoformat() if app.applied_at else None,
        "updated_at": app.updated_at.isoformat() if app.updated_at else None,
        "seeker": {
            "id": user.id if user else None,
            "username": user.username if user else None,
            "email": user.email if user else None,
            "avatar_path": infor.avatar_path if infor else None,
            "phone": infor.phone if infor else None,
            "desired_job": infor.desired_job if infor else None,
            "skills": infor.skills if infor else None,
            "workplace_desired": infor.workplace_desired if infor else None,
            "desired_salary": infor.desired_salary if infor else None,
            "age": infor.age if infor else None,
            "gender": infor.gender if infor else None,
            "marriage": infor.marriage if infor else None,
            "degree": infor.degree if infor else None,
            "industry": infor.industry if infor else None,
            "target": infor.target if infor else None,
            "experience": infor.experience if infor else None,
            "exp_min": infor.exp_min if infor else None,
            "exp_max": infor.exp_max if infor else None,
            "profile_completion_percentage": profile_completion["percentage"],
            "profile_completion": profile_completion,
        } if user else None,
    }
    if include_job and app.job:
        result["job"] = {
            "id": app.job.id,
            "job_title": app.job.job_title,
            "company_name": app.job.company_name,
        }
    return result


def _serialize_candidate(user: User, infor: InforUser = None, job_id=None, employer_id=None) -> dict:
    profile_completion = _get_profile_completion(infor)
    invitation = None
    application = None
    if job_id and employer_id:
        invitation = RecruitmentInvitation.query.filter_by(
            employer_id=employer_id,
            user_id=user.id,
            job_id=job_id,
        ).first()
        application = Application.query.filter_by(user_id=user.id, job_id=job_id).first()

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_active": user.is_active,
        "avatar_path": infor.avatar_path if infor else None,
        "phone": infor.phone if infor else None,
        "desired_job": infor.desired_job if infor else None,
        "industry": infor.industry if infor else None,
        "workplace_desired": infor.workplace_desired if infor else None,
        "desired_salary": infor.desired_salary if infor else None,
        "skills": infor.skills if infor else None,
        "degree": infor.degree if infor else None,
        "age": infor.age if infor else None,
        "gender": infor.gender if infor else None,
        "marriage": infor.marriage if infor else None,
        "experience": infor.experience if infor else None,
        "target": infor.target if infor else None,
        "exp_min": infor.exp_min if infor else None,
        "exp_max": infor.exp_max if infor else None,
        "profile_completion_percentage": profile_completion["percentage"],
        "profile_completion": profile_completion,
        "invitation": {
            "id": invitation.id,
            "status": invitation.status,
            "sent_at": invitation.sent_at.isoformat() if invitation.sent_at else None,
        } if invitation else None,
        "application": {
            "id": application.id,
            "status": application.status,
            "applied_at": application.applied_at.isoformat() if application.applied_at else None,
        } if application else None,
    }


def _ensure_recruitment_invitation_table():
    try:
        RecruitmentInvitation.__table__.create(db.engine, checkfirst=True)
    except Exception:
        current_app.logger.exception("Could not ensure recruitment_invitation table exists")


def _ensure_seeker_setting_table():
    try:
        SeekerSetting.__table__.create(db.engine, checkfirst=True)
    except Exception:
        current_app.logger.exception("Could not ensure seeker_setting table exists")


def _ensure_employer_notification_table():
    try:
        EmployerNotification.__table__.create(db.engine, checkfirst=True)
    except Exception:
        current_app.logger.exception("Could not ensure employer_notification table exists")


def _serialize_employer_notification(notification):
    return {
        "id": notification.id,
        "type": notification.type,
        "title": notification.title,
        "message": notification.message,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
    }


def _is_public_candidate(user_id):
    settings = SeekerSetting.query.filter_by(user_id=user_id).first()
    return not settings or settings.profile_visibility == 'public'


def _get_current_employer():
    return Employer.query.get(request.current_user_id)


def _parse_deadline(raw_deadline):
    """Parse deadline from date input or ISO datetime safely."""
    if not raw_deadline:
        return None

    if isinstance(raw_deadline, datetime):
        return raw_deadline

    if isinstance(raw_deadline, str):
        value = raw_deadline.strip()
        if not value:
            return None

        # Accept `YYYY-MM-DD` directly from HTML date input.
        try:
            return datetime.strptime(value, "%Y-%m-%d")
        except ValueError:
            pass

        # Accept ISO with trailing `Z` by normalizing to UTC offset.
        if value.endswith('Z'):
            value = value[:-1] + '+00:00'

        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None

    return None


def _deadline_is_in_past(deadline_value):
    if not deadline_value:
        return False
    if isinstance(deadline_value, datetime):
        deadline_date = deadline_value.date()
    else:
        deadline_date = deadline_value
    return deadline_date < datetime.utcnow().date()


def _parse_positive_int(raw_value):
    if raw_value in (None, ''):
        return None
    try:
        parsed_value = int(raw_value)
    except (TypeError, ValueError):
        return None
    return parsed_value


def _parse_numeric(raw_value):
    if raw_value in (None, ''):
        return None
    cleaned = ''.join(ch for ch in str(raw_value) if ch.isdigit())
    if not cleaned:
        return None
    try:
        return int(cleaned)
    except (TypeError, ValueError):
        return None


def _empty_analytics_payload():
    return {
        "kpis": {
            "applications_growth_pct": 0,
            "applications_growth_count": 0,
            "processing_rate_pct": 0,
            "reviewed_applications_count": 0,
            "avg_hiring_days": None,
            "avg_salary": None,
        },
        "monthly_applications": {
            "labels": [],
            "values": [],
        },
        "weekly_applications": {
            "labels": [],
            "values": [],
        },
        "status_distribution": [],
        "top_positions": [],
        "top_companies": [],
    }


@employer_bp.route('/logos/<path:filename>', methods=['GET'])
def employer_logos(filename):
    """Serve uploaded employer logos."""
    try:
        return send_from_directory(UPLOAD_FOLDER_LOGOS, filename)
    except Exception:
        return jsonify({"error": "Logo not found"}), 404


def _job_belongs_to_employer(job: Job, employer: Employer) -> bool:
    if not job or not employer:
        return False

    employer_name = (employer.company_name or '').strip()
    job_name = (job.company_name or '').strip()

    return job.employer_id == employer.id or (employer_name and job_name == employer_name)


def _expire_past_jobs_for_employer(employer: Employer):
    """Mark jobs with deadline in the past as inactive for the given employer."""
    if not employer:
        return
    try:
        now = datetime.utcnow()
        employer_name = (employer.company_name or '').strip()
        expired_jobs = Job.query.filter(
            or_(Job.employer_id == employer.id, db.func.trim(Job.company_name) == employer_name),
            Job.deadline != None,
            Job.deadline < now,
            Job.is_active == True,
        ).all()

        if not expired_jobs:
            return

        for j in expired_jobs:
            j.is_active = False

        db.session.commit()
    except Exception:
        db.session.rollback()
        # Don't raise — expiry is a convenience operation called on requests


# ---------------------------------------------------------------------------
# Hồ sơ Employer
# ---------------------------------------------------------------------------

@employer_bp.route('/notifications', methods=['GET'])
@employer_required
def get_employer_notifications():
    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    _ensure_employer_notification_table()
    notifications = (
        EmployerNotification.query
        .filter_by(employer_id=employer.id)
        .order_by(EmployerNotification.created_at.desc())
        .limit(50)
        .all()
    )

    return jsonify({
        "notifications": [_serialize_employer_notification(item) for item in notifications],
        "unread_count": EmployerNotification.query.filter_by(
            employer_id=employer.id,
            is_read=False,
        ).count(),
    })


@employer_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@employer_required
def mark_employer_notification_read(notification_id):
    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    _ensure_employer_notification_table()
    notification = EmployerNotification.query.filter_by(
        id=notification_id,
        employer_id=employer.id,
    ).first()
    if not notification:
        return jsonify({"error": "Không tìm thấy thông báo"}), 404

    notification.is_read = True
    db.session.commit()
    return jsonify({"message": "Đã đánh dấu đã đọc"})


@employer_bp.route('/profile', methods=['GET'])
@employer_required
def get_employer_profile():
    """Lấy thông tin hồ sơ employer."""
    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    return jsonify({
        "id": employer.id,
        "company_name": employer.company_name,
        "email": employer.email,
        "phone": employer.phone,
        "address": employer.address,
        "website": employer.website,
        "description": employer.description,
        "logo_path": employer.logo_path,
        "industry": employer.industry,
        "is_verified": employer.is_verified,
        "created_at": employer.created_at.isoformat() if employer.created_at else None,
    })


@employer_bp.route('/profile', methods=['PUT'])
@employer_required
def update_employer_profile():
    """Cập nhật hồ sơ employer (kể cả upload logo)."""
    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})

    for field in ('company_name', 'phone', 'address', 'website', 'description', 'industry'):
        if field in data:
            setattr(employer, field, (data[field] or '').strip() or None)

    logo_file = request.files.get('logo')
    if logo_file and logo_file.filename:
        os.makedirs(UPLOAD_FOLDER_LOGOS, exist_ok=True)
        _, ext = os.path.splitext(secure_filename(logo_file.filename))
        filename = f"logo_{employer.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}{ext or '.png'}"
        logo_file.save(os.path.join(UPLOAD_FOLDER_LOGOS, filename))
        employer.logo_path = f"/logos/{filename}"

    try:
        db.session.commit()
        return jsonify({"message": "Cập nhật hồ sơ thành công"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Job CRUD
# ---------------------------------------------------------------------------

@employer_bp.route('/jobs', methods=['POST'])
@employer_required
def create_job():
    """Employer tạo job mới."""
    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    data = request.get_json(silent=True) or {}

    job_title = (data.get('job_title') or '').strip()
    if not job_title:
        return jsonify({"error": "job_title là bắt buộc"}), 400

    deadline = _parse_deadline(data.get('deadline'))
    if data.get('deadline') and deadline is None:
        return jsonify({"error": "deadline không hợp lệ (dùng YYYY-MM-DD hoặc ISO 8601)"}), 400
    if _deadline_is_in_past(deadline):
        return jsonify({"error": "deadline không được nhỏ hơn hôm nay"}), 400

    exp_min = _parse_positive_int(data.get('exp_min'))
    exp_max = _parse_positive_int(data.get('exp_max'))
    if data.get('exp_min') not in (None, '') and exp_min is None:
        return jsonify({"error": "exp_min không hợp lệ"}), 400
    if data.get('exp_max') not in (None, '') and exp_max is None:
        return jsonify({"error": "exp_max không hợp lệ"}), 400
    if exp_min is not None and exp_min < 0:
        return jsonify({"error": "exp_min phải lớn hơn hoặc bằng 0"}), 400
    if exp_max is not None and exp_max < 0:
        return jsonify({"error": "exp_max phải lớn hơn hoặc bằng 0  "}), 400
    if exp_min is not None and exp_max is not None and exp_max < exp_min:
        return jsonify({"error": "exp_max phải lớn hơn hoặc bằng exp_min"}), 400

    job = Job(
        employer_id=employer.id,
        job_title=job_title,
        company_name=employer.company_name,
        salary_min=data.get('salary_min'),
        salary_max=data.get('salary_max'),
        job_address=data.get('job_address'),
        job_detail_address=data.get('job_detail_address'),
        deadline=deadline,
        exp_min=exp_min,
        exp_max=exp_max,
        benefits=data.get('benefits'),
        employment_type=data.get('employment_type'),
        job_function=data.get('job_function'),
        industries=data.get('industries'),
        job_description=data.get('job_description'),
        job_requirement=data.get('job_requirement'),
        is_active=True,
    )
    db.session.add(job)
    generate_and_save_job_embedding(job)
    try:
        db.session.commit()
        return jsonify({"message": "Tạo job thành công", "job_id": job.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@employer_bp.route('/jobs', methods=['GET'])
@employer_required
def get_employer_jobs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status', '')  # 'active' | 'inactive' | ''

    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    # Expire past jobs before returning list
    _expire_past_jobs_for_employer(employer)

    employer_name = (employer.company_name or '').strip()

    query = Job.query.filter(
        or_(
            Job.employer_id == employer.id,
            db.func.trim(Job.company_name) == employer_name,
        )
    )
    if status == 'active':
        query = query.filter_by(is_active=True)
    elif status == 'inactive':
        query = query.filter_by(is_active=False)

    query = query.order_by(Job.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page)

    jobs = []
    for job in pagination.items:
        total_applications = job.applications.count()
        jobs.append({
            "id": job.id,
            "job_title": job.job_title,
            "job_address": job.job_address,
            "employment_type": job.employment_type,
            "deadline": job.deadline.isoformat() if job.deadline else None,
            "is_active": job.is_active,
            "is_locked": bool(getattr(job, 'is_locked', False)),
            "job_warning": "Bai dang nay da bi Admin khoa. Ban khong the chinh sua thong tin hoac trang thai hoat dong." if getattr(job, 'is_locked', False) else None,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "total_applications": total_applications,
        })

    return jsonify({
        "jobs": jobs,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    })


@employer_bp.route('/jobs/<int:job_id>', methods=['GET'])
@employer_required
def get_employer_job_detail(job_id):
    """Lấy chi tiết một job của employer."""
    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    # Expire past jobs before returning detail
    _expire_past_jobs_for_employer(employer)

    job = Job.query.filter_by(id=job_id).first()
    if not _job_belongs_to_employer(job, employer):
        return jsonify({"error": "Không tìm thấy job hoặc bạn không có quyền"}), 404

    return jsonify({
        "id": job.id,
        "job_title": job.job_title,
        "company_name": job.company_name,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "job_address": job.job_address,
        "job_detail_address": job.job_detail_address,
        "deadline": job.deadline.isoformat() if job.deadline else None,
        "exp_min": job.exp_min,
        "exp_max": job.exp_max,
        "benefits": job.benefits,
        "employment_type": job.employment_type,
        "job_function": job.job_function,
        "industries": job.industries,
        "job_description": job.job_description,
        "job_requirement": job.job_requirement,
        "is_active": job.is_active,
        "is_locked": bool(getattr(job, 'is_locked', False)),
        "job_warning": "Bai dang nay da bi Admin khoa. Ban khong the chinh sua thong tin hoac trang thai hoat dong." if getattr(job, 'is_locked', False) else None,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "total_applications": job.applications.count(),
    })


@employer_bp.route('/jobs/<int:job_id>', methods=['PUT'])
@employer_required
def update_job(job_id):
    """Employer cập nhật job."""
    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    job = Job.query.filter_by(id=job_id).first()
    if not _job_belongs_to_employer(job, employer):
        return jsonify({"error": "Không tìm thấy job hoặc bạn không có quyền"}), 404

    if getattr(job, 'is_locked', False):
        return jsonify({"error": "Bai dang nay da bi Admin khoa. Ban khong the chinh sua thong tin hoac trang thai hoat dong."}), 423

    data = request.get_json(silent=True) or {}

    exp_min = _parse_positive_int(data.get('exp_min')) if 'exp_min' in data else _parse_positive_int(job.exp_min)
    exp_max = _parse_positive_int(data.get('exp_max')) if 'exp_max' in data else _parse_positive_int(job.exp_max)
    if 'exp_min' in data and data.get('exp_min') not in (None, '') and exp_min is None:
        return jsonify({"error": "exp_min không hợp lệ"}), 400
    if 'exp_max' in data and data.get('exp_max') not in (None, '') and exp_max is None:
        return jsonify({"error": "exp_max không hợp lệ"}), 400
    if exp_min is not None and exp_min < 0:
        return jsonify({"error": "exp_min phải lớn hơn hoặc bằng 0"}), 400
    if exp_max is not None and exp_max < 0:
        return jsonify({"error": "exp_max phải lớn hơn hoặc bằng 0"}), 400
    if exp_min is not None and exp_max is not None and exp_max < exp_min:
        return jsonify({"error": "exp_max phải lớn hơn hoặc bằng exp_min"}), 400

    updatable = [
        'job_title', 'salary_min', 'salary_max', 'job_address',
        'job_detail_address', 'exp_min', 'exp_max', 'benefits',
        'employment_type', 'job_function', 'industries',
        'job_description', 'job_requirement',
    ]
    for field in updatable:
        if field in data:
            setattr(job, field, data[field])

    job.exp_min = exp_min
    job.exp_max = exp_max

    if 'deadline' in data:
        try:
            job.deadline = datetime.fromisoformat(data['deadline']) if data['deadline'] else None
            if _deadline_is_in_past(job.deadline):
                return jsonify({"error": "deadline không được nhỏ hơn hôm nay"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "deadline không hợp lệ"}), 400

    if 'is_active' in data:
        job.is_active = bool(data['is_active'])
    
    generate_and_save_job_embedding(job)

    try:
        db.session.commit()
        return jsonify({"message": "Cập nhật job thành công"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@employer_bp.route('/jobs/<int:job_id>', methods=['DELETE'])
@employer_required
def delete_job(job_id):
    """Employer xóa job (chỉ khi chưa có application)."""
    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    job = Job.query.filter_by(id=job_id).first()
    if not _job_belongs_to_employer(job, employer):
        return jsonify({"error": "Không tìm thấy job hoặc bạn không có quyền"}), 404

    if getattr(job, 'is_locked', False):
        return jsonify({"error": "Bai dang nay da bi Admin khoa. Ban khong the xoa hoac dong bai dang."}), 423

    if job.applications.count() > 0:
        # Ẩn thay vì xóa để giữ lịch sử ứng viên
        job.is_active = False
        db.session.commit()
        return jsonify({"message": "Job đã có ứng viên nộp đơn, đã đóng thay vì xóa"})

    db.session.delete(job)
    db.session.commit()
    return jsonify({"message": "Xóa job thành công"})


# ---------------------------------------------------------------------------
# Ứng viên
# ---------------------------------------------------------------------------

@employer_bp.route('/candidates/search', methods=['GET'])
@employer_required
def search_candidates():
    """Employer tìm kiếm hồ sơ seeker để gửi lời mời tuyển dụng."""
    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404
    _ensure_recruitment_invitation_table()
    _ensure_seeker_setting_table()

    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 12, type=int), 50)
    keyword = (request.args.get('q') or request.args.get('query') or '').strip()
    industry = (request.args.get('industry') or '').strip()
    location = (request.args.get('location') or '').strip()
    job_id = request.args.get('job_id', type=int)

    if job_id:
        job = Job.query.filter_by(id=job_id).first()
        if not _job_belongs_to_employer(job, employer):
            return jsonify({"error": "Không tìm thấy job hoặc bạn không có quyền"}), 404

    query = (
        db.session.query(User, InforUser)
        .outerjoin(InforUser, InforUser.id == User.id)
        .outerjoin(SeekerSetting, SeekerSetting.user_id == User.id)
        .filter(User.role == 'seeker', User.is_active == True)
        .filter(or_(
            SeekerSetting.id == None,
            SeekerSetting.profile_visibility == 'public',
        ))
    )

    if keyword:
        like = f"%{keyword}%"
        query = query.filter(or_(
            User.username.ilike(like),
            User.email.ilike(like),
            InforUser.desired_job.ilike(like),
            InforUser.skills.ilike(like),
            InforUser.degree.ilike(like),
            InforUser.industry.ilike(like),
            InforUser.target.ilike(like),
            InforUser.experience.ilike(like),
        ))
    if industry:
        like = f"%{industry}%"
        query = query.filter(or_(
            InforUser.industry.ilike(like),
            InforUser.desired_job.ilike(like),
        ))
    if location:
        like = f"%{location}%"
        query = query.filter(InforUser.workplace_desired.ilike(like))

    query = query.order_by(User.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page)

    return jsonify({
        "candidates": [
            _serialize_candidate(user, infor, job_id=job_id, employer_id=employer.id)
            for user, infor in pagination.items
        ],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    })


@employer_bp.route('/invitations', methods=['POST'])
@employer_required
def send_recruitment_invitation():
    """Employer gửi lời mời tuyển dụng đến seeker cho một job."""
    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404
    _ensure_recruitment_invitation_table()
    _ensure_seeker_setting_table()
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id')
    job_id = data.get('job_id')
    message = (data.get('message') or '').strip() or None

    if not user_id or not job_id:
        return jsonify({"error": "user_id và job_id là bắt buộc"}), 400

    user = User.query.filter_by(id=user_id, role='seeker', is_active=True).first()
    if not user:
        return jsonify({"error": "Không tìm thấy ứng viên"}), 404

    if not _is_public_candidate(user.id):
        return jsonify({"error": "Ứng viên đang để hồ sơ riêng tư"}), 403

    job = Job.query.filter_by(id=job_id).first()
    if not _job_belongs_to_employer(job, employer):
        return jsonify({"error": "Không tìm thấy job hoặc bạn không có quyền"}), 404
    if getattr(job, 'is_locked', False):
        return jsonify({"error": "Bai dang nay da bi Admin khoa. Khong the gui loi moi cho job nay."}), 423
    if not job.is_active:
        return jsonify({"error": "Job này đang đóng, không thể gửi lời mời"}), 400

    existing_application = Application.query.filter_by(user_id=user.id, job_id=job.id).first()
    if existing_application:
        return jsonify({"error": "Ứng viên đã ứng tuyển job này"}), 409

    existing_invitation = RecruitmentInvitation.query.filter_by(
        employer_id=employer.id,
        user_id=user.id,
        job_id=job.id,
    ).first()
    if existing_invitation:
        return jsonify({
            "message": "Đã gửi lời mời cho ứng viên này rồi",
            "invitation": {
                "id": existing_invitation.id,
                "status": existing_invitation.status,
                "sent_at": existing_invitation.sent_at.isoformat() if existing_invitation.sent_at else None,
            },
        }), 200

    invitation = RecruitmentInvitation(
        employer_id=employer.id,
        user_id=user.id,
        job_id=job.id,
        message=message,
        status='sent',
    )
    db.session.add(invitation)

    try:
        db.session.commit()
        return jsonify({
            "message": "Gửi lời mời tuyển dụng thành công",
            "invitation": {
                "id": invitation.id,
                "status": invitation.status,
                "sent_at": invitation.sent_at.isoformat() if invitation.sent_at else None,
            },
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@employer_bp.route('/jobs/<int:job_id>/applicants', methods=['GET'])
@employer_required
def get_applicants(job_id):
    """Xem danh sách ứng viên đã nộp đơn vào job."""
    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    job = Job.query.filter_by(id=job_id).first()
    if not _job_belongs_to_employer(job, employer):
        return jsonify({"error": "Không tìm thấy job hoặc bạn không có quyền"}), 404

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status_filter = request.args.get('status', '')

    query = Application.query.filter_by(job_id=job_id)
    if status_filter:
        query = query.filter_by(status=status_filter)
    query = query.order_by(Application.applied_at.desc())

    pagination = query.paginate(page=page, per_page=per_page)

    return jsonify({
        "id": job.id,
        "job_title": job.job_title,
        "applicants": [_serialize_application(a) for a in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    })


@employer_bp.route('/applications/<int:app_id>', methods=['GET'])
@employer_required
def get_application_detail(app_id):
    """Xem chi tiết một đơn ứng tuyển của employer."""
    application = Application.query.get(app_id)
    if not application:
        return jsonify({"error": "Không tìm thấy đơn ứng tuyển"}), 404

    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    job = Job.query.filter_by(id=application.job_id).first()
    if not _job_belongs_to_employer(job, employer):
        return jsonify({"error": "Bạn không có quyền xem đơn này"}), 403

    return jsonify(_serialize_application(application, include_job=True))


@employer_bp.route('/applications/<int:app_id>/status', methods=['PUT'])
@employer_required
def update_application_status(app_id):
    """
    Employer cập nhật trạng thái đơn ứng tuyển.
    status: pending | reviewed | interview | accepted | rejected
    """
    application = Application.query.get(app_id)
    if not application:
        return jsonify({"error": "Không tìm thấy đơn ứng tuyển"}), 404

    # Kiểm tra job thuộc employer này
    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    job = Job.query.filter_by(id=application.job_id).first()
    if not _job_belongs_to_employer(job, employer):
        return jsonify({"error": "Bạn không có quyền cập nhật đơn này"}), 403

    data = request.get_json(silent=True) or {}
    new_status = data.get('status', '').strip()
    allowed = {'pending', 'reviewed', 'interview', 'accepted', 'rejected'}

    if new_status not in allowed:
        return jsonify({"error": f"status phải là một trong: {', '.join(allowed)}"}), 400

    application.status = new_status
    if 'employer_note' in data:
        application.employer_note = data['employer_note']
    application.updated_at = datetime.utcnow()

    try:
        db.session.commit()
        return jsonify({
            "message": "Cập nhật trạng thái thành công",
            "application_id": app_id,
            "new_status": new_status,
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@employer_bp.route('/analytics', methods=['GET'])
@employer_required
def get_employer_analytics():
    """Thống kê analytics realtime cho employer hiện tại."""
    employer = _get_current_employer()
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    employer_name = (employer.company_name or '').strip()
    jobs = Job.query.filter(
        or_(
            Job.employer_id == employer.id,
            db.func.trim(Job.company_name) == employer_name,
        )
    ).all()

    if not jobs:
        return jsonify(_empty_analytics_payload())

    jobs_by_id = {job.id: job for job in jobs}
    job_ids = list(jobs_by_id.keys())

    applications = Application.query.filter(Application.job_id.in_(job_ids)).all()
    total_applications = len(applications)

    now = datetime.utcnow()
    last_30_start = now - timedelta(days=30)
    prev_30_start = now - timedelta(days=60)

    current_30 = 0
    previous_30 = 0
    for app in applications:
        applied_at = app.applied_at or app.updated_at
        if not applied_at:
            continue
        if applied_at >= last_30_start:
            current_30 += 1
        elif prev_30_start <= applied_at < last_30_start:
            previous_30 += 1

    if previous_30 == 0:
        growth_pct = 100.0 if current_30 > 0 else 0.0
    else:
        growth_pct = ((current_30 - previous_30) / previous_30) * 100.0

    processed_count = sum(1 for app in applications if (app.status or 'pending') != 'pending')
    processing_rate = (processed_count / total_applications * 100.0) if total_applications else 0.0

    accepted_durations = []
    for app in applications:
        if app.status != 'accepted' or not app.applied_at or not app.updated_at:
            continue
        delta_days = (app.updated_at - app.applied_at).total_seconds() / 86400.0
        if delta_days >= 0:
            accepted_durations.append(delta_days)
    avg_hiring_days = round(sum(accepted_durations) / len(accepted_durations), 1) if accepted_durations else None

    salary_midpoints = []
    for job in jobs:
        salary_min = _parse_numeric(job.salary_min)
        salary_max = _parse_numeric(job.salary_max)
        if salary_min is not None and salary_max is not None:
            salary_midpoints.append((salary_min + salary_max) / 2.0)
        elif salary_min is not None:
            salary_midpoints.append(float(salary_min))
        elif salary_max is not None:
            salary_midpoints.append(float(salary_max))
    avg_salary = int(round(sum(salary_midpoints) / len(salary_midpoints))) if salary_midpoints else None

    month_starts = []
    cursor = datetime(now.year, now.month, 1)
    for _ in range(12):
        month_starts.append(cursor)
        if cursor.month == 1:
            cursor = datetime(cursor.year - 1, 12, 1)
        else:
            cursor = datetime(cursor.year, cursor.month - 1, 1)
    month_starts.reverse()

    month_counts = {f"{month.year:04d}-{month.month:02d}": 0 for month in month_starts}
    for app in applications:
        applied_at = app.applied_at or app.updated_at
        if not applied_at:
            continue
        key = f"{applied_at.year:04d}-{applied_at.month:02d}"
        if key in month_counts:
            month_counts[key] += 1

    monthly_labels = [f"T{month.month}" for month in month_starts]
    monthly_values = [month_counts[f"{month.year:04d}-{month.month:02d}"] for month in month_starts]

    today_start = datetime(now.year, now.month, now.day)
    day_starts = [today_start - timedelta(days=offset) for offset in range(6, -1, -1)]
    weekly_counts = {day.strftime('%Y-%m-%d'): 0 for day in day_starts}
    for app in applications:
        applied_at = app.applied_at or app.updated_at
        if not applied_at:
            continue
        key = applied_at.strftime('%Y-%m-%d')
        if key in weekly_counts:
            weekly_counts[key] += 1

    weekly_labels = [day.strftime('%Y-%m-%d') for day in day_starts]
    weekly_values = [weekly_counts[label] for label in weekly_labels]

    status_order = ['accepted', 'interview', 'reviewed', 'pending', 'rejected']
    status_labels = {
        'accepted': 'Đã tuyển',
        'interview': 'Đang phỏng vấn',
        'reviewed': 'Xem xét',
        'pending': 'Mới',
        'rejected': 'Từ chối',
    }
    status_counts = Counter((app.status or 'pending') for app in applications)
    status_distribution = []
    for status in status_order:
        count = status_counts.get(status, 0)
        pct = (count / total_applications * 100.0) if total_applications else 0.0
        status_distribution.append({
            "status": status,
            "label": status_labels.get(status, status),
            "count": count,
            "value": round(pct, 1),
        })

    position_counter = Counter()
    for app in applications:
        job = jobs_by_id.get(app.job_id)
        if not job:
            continue
        title = (job.job_title or '').strip() or 'Khác'
        position_counter[title] += 1

    top_positions = [
        {"rank": index + 1, "title": title, "count": count}
        for index, (title, count) in enumerate(position_counter.most_common(5))
    ]

    top_companies_rows = (
        db.session.query(
            Job.company_name,
            db.func.count(Application.id).label('application_count')
        )
        .join(Application, Application.job_id == Job.id)
        .filter(Job.company_name.isnot(None))
        .filter(db.func.trim(Job.company_name) != '')
        .filter(db.func.trim(Job.company_name) != employer_name)
        .group_by(Job.company_name)
        .order_by(db.desc('application_count'))
        .limit(5)
        .all()
    )

    top_companies = [
        {"rank": index + 1, "name": row.company_name, "hires": int(row.application_count or 0)}
        for index, row in enumerate(top_companies_rows)
    ]

    return jsonify({
        "kpis": {
            "applications_growth_pct": round(growth_pct, 1),
            "applications_growth_count": current_30 - previous_30,
            "processing_rate_pct": round(processing_rate, 1),
            "reviewed_applications_count": processed_count,
            "avg_hiring_days": avg_hiring_days,
            "avg_salary": avg_salary,
        },
        "monthly_applications": {
            "labels": monthly_labels,
            "values": monthly_values,
        },
        "weekly_applications": {
            "labels": weekly_labels,
            "values": weekly_values,
        },
        "status_distribution": status_distribution,
        "top_positions": top_positions,
        "top_companies": top_companies,
    })
