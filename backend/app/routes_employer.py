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
    PUT    /employer/applications/<app_id>/status
"""

import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from werkzeug.utils import secure_filename
from .models import db, Employer, Job, Application, User, InforUser
from .auth import employer_required, admin_required

employer_bp = Blueprint('employer', __name__, url_prefix='/employer')

UPLOAD_FOLDER_LOGOS = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 'instance', 'logos'
)
UPLOAD_FOLDER_CVS = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 'instance', 'cvs'
)


def _serialize_application(app: Application, include_job=False) -> dict:
    user = User.query.get(app.user_id)
    infor = InforUser.query.filter_by(user_id=app.user_id).first()
    result = {
        "id": app.id,
        "user_id": app.user_id,
        "job_id": app.job_id,
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
        } if user else None,
    }
    if include_job and app.job:
        result["job"] = {
            "id": app.job.id,
            "job_title": app.job.job_title,
            "company_name": app.job.company_name,
        }
    return result


# ---------------------------------------------------------------------------
# Hồ sơ Employer
# ---------------------------------------------------------------------------

@employer_bp.route('/profile', methods=['GET'])
@employer_required
def get_employer_profile():
    """Lấy thông tin hồ sơ employer."""
    employer = Employer.query.get(request.current_user_id)
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
    employer = Employer.query.get(request.current_user_id)
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
    employer = Employer.query.get(request.current_user_id)
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    data = request.get_json(silent=True) or {}

    job_title = (data.get('job_title') or '').strip()
    if not job_title:
        return jsonify({"error": "job_title là bắt buộc"}), 400

    deadline = None
    if data.get('deadline'):
        try:
            deadline = datetime.fromisoformat(data['deadline'])
        except (ValueError, TypeError):
            return jsonify({"error": "deadline không hợp lệ (dùng ISO 8601)"}), 400

    job = Job(
        job_id=str(uuid.uuid4()),
        employer_id=employer.id,
        job_title=job_title,
        company_name=employer.company_name,
        salary_min=data.get('salary_min'),
        salary_max=data.get('salary_max'),
        job_address=data.get('job_address'),
        job_detail_address=data.get('job_detail_address'),
        deadline=deadline,
        exp_min=data.get('exp_min'),
        exp_max=data.get('exp_max'),
        benefits=data.get('benefits'),
        employment_type=data.get('employment_type'),
        job_function=data.get('job_function'),
        industries=data.get('industries'),
        job_description=data.get('job_description'),
        job_requirement=data.get('job_requirement'),
        is_active=True,
    )
    db.session.add(job)
    try:
        db.session.commit()
        return jsonify({"message": "Tạo job thành công", "job_id": job.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@employer_bp.route('/jobs', methods=['GET'])
@employer_required
def get_employer_jobs():
    """Lấy danh sách job của employer hiện tại."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status', '')  # 'active' | 'inactive' | ''

    query = Job.query.filter_by(employer_id=request.current_user_id)
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
            "job_id": job.job_id,
            "job_title": job.job_title,
            "job_address": job.job_address,
            "employment_type": job.employment_type,
            "deadline": job.deadline.isoformat() if job.deadline else None,
            "is_active": job.is_active,
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
    job = Job.query.filter_by(id=job_id, employer_id=request.current_user_id).first()
    if not job:
        return jsonify({"error": "Không tìm thấy job hoặc bạn không có quyền"}), 404

    return jsonify({
        "id": job.id,
        "job_id": job.job_id,
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
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "total_applications": job.applications.count(),
    })


@employer_bp.route('/jobs/<int:job_id>', methods=['PUT'])
@employer_required
def update_job(job_id):
    """Employer cập nhật job."""
    job = Job.query.filter_by(id=job_id, employer_id=request.current_user_id).first()
    if not job:
        return jsonify({"error": "Không tìm thấy job hoặc bạn không có quyền"}), 404

    data = request.get_json(silent=True) or {}

    updatable = [
        'job_title', 'salary_min', 'salary_max', 'job_address',
        'job_detail_address', 'exp_min', 'exp_max', 'benefits',
        'employment_type', 'job_function', 'industries',
        'job_description', 'job_requirement',
    ]
    for field in updatable:
        if field in data:
            setattr(job, field, data[field])

    if 'deadline' in data:
        try:
            job.deadline = datetime.fromisoformat(data['deadline']) if data['deadline'] else None
        except (ValueError, TypeError):
            return jsonify({"error": "deadline không hợp lệ"}), 400

    if 'is_active' in data:
        job.is_active = bool(data['is_active'])

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
    job = Job.query.filter_by(id=job_id, employer_id=request.current_user_id).first()
    if not job:
        return jsonify({"error": "Không tìm thấy job hoặc bạn không có quyền"}), 404

    if job.applications.count() > 0:
        # Ẩn thay vì xóa để giữ lịch sử ứng viên
        job.is_active = False
        db.session.commit()
        return jsonify({"message": "Job đã có ứng viên nộp đơn, đã ẩn thay vì xóa"})

    db.session.delete(job)
    db.session.commit()
    return jsonify({"message": "Xóa job thành công"})


# ---------------------------------------------------------------------------
# Ứng viên
# ---------------------------------------------------------------------------

@employer_bp.route('/jobs/<int:job_id>/applicants', methods=['GET'])
@employer_required
def get_applicants(job_id):
    """Xem danh sách ứng viên đã nộp đơn vào job."""
    job = Job.query.filter_by(id=job_id, employer_id=request.current_user_id).first()
    if not job:
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
        "job_id": job_id,
        "job_title": job.job_title,
        "applicants": [_serialize_application(a) for a in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    })


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
    job = Job.query.filter_by(id=application.job_id, employer_id=request.current_user_id).first()
    if not job:
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