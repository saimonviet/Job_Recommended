"""
routes_admin.py — Admin: quản lý user, employer, job, thống kê

Endpoints:
    GET    /admin/dashboard
    GET    /admin/users
    GET    /admin/users/<user_id>
    PUT    /admin/users/<user_id>
    DELETE /admin/users/<user_id>
    GET    /admin/employers
    GET    /admin/employers/<employer_id>
    PUT    /admin/employers/<employer_id>
    DELETE /admin/employers/<employer_id>
    PUT    /admin/employers/<employer_id>/verify
    GET    /admin/jobs
    DELETE /admin/jobs/<job_id>
    PUT    /admin/jobs/<job_id>/toggle
    GET    /admin/applications
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from .models import db, User, InforUser, Employer, Job, Application
from .auth import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    """Thống kê tổng quan toàn hệ thống."""
    total_seekers = User.query.filter_by(role='seeker').count()
    total_employers = Employer.query.count()
    total_jobs = Job.query.count()
    active_jobs = Job.query.filter_by(is_active=True).count()
    total_applications = Application.query.count()

    status_stats = {}
    for status in ('pending', 'reviewed', 'interview', 'accepted', 'rejected'):
        status_stats[status] = Application.query.filter_by(status=status).count()

    # 5 employer có nhiều job nhất
    top_employers = (
        db.session.query(Employer, db.func.count(Job.id).label('job_count'))
        .join(Job, Job.employer_id == Employer.id, isouter=True)
        .group_by(Employer.id)
        .order_by(db.desc('job_count'))
        .limit(5)
        .all()
    )

    return jsonify({
        "total_seekers": total_seekers,
        "total_employers": total_employers,
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "inactive_jobs": total_jobs - active_jobs,
        "total_applications": total_applications,
        "application_by_status": status_stats,
        "top_employers": [
            {
                "id": e.id,
                "company_name": e.company_name,
                "job_count": count,
                "is_verified": e.is_verified,
            }
            for e, count in top_employers
        ],
    })


# ---------------------------------------------------------------------------
# Quản lý Seeker
# ---------------------------------------------------------------------------

@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    """Danh sách tất cả seeker (có tìm kiếm và phân trang)."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '').strip()
    status = request.args.get('status', '')  # 'active' | 'inactive'

    query = User.query.filter(User.role != 'admin')

    if search:
        query = query.filter(
            User.username.ilike(f'%{search}%') | User.email.ilike(f'%{search}%')
        )
    if status == 'active':
        query = query.filter_by(is_active=True)
    elif status == 'inactive':
        query = query.filter_by(is_active=False)

    query = query.order_by(User.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page)

    users = []
    for u in pagination.items:
        app_count = Application.query.filter_by(user_id=u.id).count()
        users.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "total_applications": app_count,
        })

    return jsonify({
        "users": users,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    })


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    """Chi tiết một seeker."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user"}), 404

    infor = InforUser.query.get(user.id)
    applications = Application.query.filter_by(user_id=user.id).order_by(
        Application.applied_at.desc()
    ).limit(10).all()

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "profile": {
            "phone": infor.phone if infor else None,
            "desired_job": infor.desired_job if infor else None,
            "workplace_desired": infor.workplace_desired if infor else None,
            "skills": infor.skills if infor else None,
            "degree": infor.degree if infor else None,
        } if infor else None,
        "recent_applications": [
            {
                "id": a.id,
                "job_id": a.job_id,
                "status": a.status,
                "applied_at": a.applied_at.isoformat() if a.applied_at else None,
            }
            for a in applications
        ],
    })


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Admin cập nhật thông tin user (bao gồm khoá/mở khoá)."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user"}), 404

    data = request.get_json(silent=True) or {}

    if 'is_active' in data:
        user.is_active = bool(data['is_active'])
    if 'role' in data and data['role'] in ('seeker', 'admin'):
        user.role = data['role']
    if 'email' in data:
        new_email = data['email'].strip().lower()
        conflict = User.query.filter(User.email == new_email, User.id != user_id).first()
        if conflict:
            return jsonify({"error": "Email đã được dùng bởi tài khoản khác"}), 409
        user.email = new_email

    try:
        db.session.commit()
        return jsonify({"message": "Cập nhật user thành công"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Admin xóa user (kéo theo infor và applications)."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user"}), 404

    if user.role == 'admin':
        return jsonify({"error": "Không thể xóa tài khoản admin"}), 403

    InforUser.query.filter_by(id=user.id).delete()
    Application.query.filter_by(user_id=user.id).delete()
    db.session.delete(user)
    try:
        db.session.commit()
        return jsonify({"message": "Xóa user thành công"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Quản lý Employer
# ---------------------------------------------------------------------------

@admin_bp.route('/employers', methods=['GET'])
@admin_required
def list_employers():
    """Danh sách tất cả employer."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '').strip()
    verified = request.args.get('verified', '')  # 'true' | 'false'

    query = Employer.query
    if search:
        query = query.filter(
            Employer.company_name.ilike(f'%{search}%') | Employer.email.ilike(f'%{search}%')
        )
    if verified == 'true':
        query = query.filter_by(is_verified=True)
    elif verified == 'false':
        query = query.filter_by(is_verified=False)

    query = query.order_by(Employer.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page)

    employers = []
    for e in pagination.items:
        job_count = Job.query.filter_by(employer_id=e.id).count()
        employers.append({
            "id": e.id,
            "company_name": e.company_name,
            "email": e.email,
            "phone": e.phone,
            "industry": e.industry,
            "is_active": e.is_active,
            "is_verified": e.is_verified,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "total_jobs": job_count,
        })

    return jsonify({
        "employers": employers,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    })


@admin_bp.route('/employers/<int:employer_id>', methods=['GET'])
@admin_required
def get_employer(employer_id):
    """Chi tiết employer."""
    employer = Employer.query.get(employer_id)
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    jobs = Job.query.filter_by(employer_id=employer.id).order_by(Job.created_at.desc()).limit(5).all()

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
        "is_active": employer.is_active,
        "is_verified": employer.is_verified,
        "created_at": employer.created_at.isoformat() if employer.created_at else None,
        "recent_jobs": [
            {
                "id": j.id,
                "job_title": j.job_title,
                "is_active": j.is_active,
                "created_at": j.created_at.isoformat() if j.created_at else None,
            }
            for j in jobs
        ],
    })


@admin_bp.route('/employers/<int:employer_id>', methods=['PUT'])
@admin_required
def update_employer(employer_id):
    """Admin cập nhật / khoá employer."""
    employer = Employer.query.get(employer_id)
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    data = request.get_json(silent=True) or {}
    for field in ('company_name', 'phone', 'address', 'website', 'industry'):
        if field in data:
            setattr(employer, field, (data[field] or '').strip() or None)

    if 'is_active' in data:
        employer.is_active = bool(data['is_active'])

    try:
        db.session.commit()
        return jsonify({"message": "Cập nhật employer thành công"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/employers/<int:employer_id>', methods=['DELETE'])
@admin_required
def delete_employer(employer_id):
    """Admin xóa employer và toàn bộ job của họ."""
    employer = Employer.query.get(employer_id)
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    # Xóa application của các job thuộc employer này
    job_ids = [j.id for j in Job.query.filter_by(employer_id=employer.id).all()]
    if job_ids:
        Application.query.filter(Application.job_id.in_(job_ids)).delete(synchronize_session=False)
        Job.query.filter_by(employer_id=employer.id).delete()

    db.session.delete(employer)
    try:
        db.session.commit()
        return jsonify({"message": "Xóa employer thành công"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/employers/<int:employer_id>/verify', methods=['PUT'])
@admin_required
def verify_employer(employer_id):
    """Admin xác thực / huỷ xác thực employer."""
    employer = Employer.query.get(employer_id)
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    data = request.get_json(silent=True) or {}
    employer.is_verified = bool(data.get('is_verified', True))
    db.session.commit()
    status_text = "đã xác thực" if employer.is_verified else "đã huỷ xác thực"
    return jsonify({"message": f"Employer {status_text}", "is_verified": employer.is_verified})


# ---------------------------------------------------------------------------
# Quản lý Job
# ---------------------------------------------------------------------------

@admin_bp.route('/jobs', methods=['GET'])
@admin_required
def list_jobs():
    """Admin xem toàn bộ job trong hệ thống."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '').strip()
    is_active = request.args.get('is_active', '')
    employer_id = request.args.get('employer_id', None, type=int)

    query = Job.query

    if search:
        query = query.filter(
            Job.job_title.ilike(f'%{search}%') | Job.company_name.ilike(f'%{search}%')
        )
    if is_active == 'true':
        query = query.filter_by(is_active=True)
    elif is_active == 'false':
        query = query.filter_by(is_active=False)
    if employer_id:
        query = query.filter_by(employer_id=employer_id)

    query = query.order_by(Job.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page)

    jobs = []
    for j in pagination.items:
        app_count = j.applications.count()
        jobs.append({
            "id": j.id,
            "job_title": j.job_title,
            "company_name": j.company_name,
            "job_address": j.job_address,
            "employment_type": j.employment_type,
            "employer_id": j.employer_id,
            "is_active": j.is_active,
            "deadline": j.deadline.isoformat() if j.deadline else None,
            "created_at": j.created_at.isoformat() if j.created_at else None,
            "total_applications": app_count,
        })

    return jsonify({
        "jobs": jobs,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    })


@admin_bp.route('/jobs/<int:job_id>', methods=['DELETE'])
@admin_required
def admin_delete_job(job_id):
    """Admin xóa job vi phạm (kéo theo toàn bộ application)."""
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Không tìm thấy job"}), 404

    Application.query.filter_by(job_id=job.id).delete()
    db.session.delete(job)
    try:
        db.session.commit()
        return jsonify({"message": "Xóa job thành công"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/jobs/<int:job_id>/toggle', methods=['PUT'])
@admin_required
def toggle_job(job_id):
    """Admin bật/tắt hiển thị job."""
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Không tìm thấy job"}), 404

    job.is_active = not job.is_active
    db.session.commit()
    return jsonify({
        "message": f"Job {'đã bật' if job.is_active else 'đã ẩn'}",
        "is_active": job.is_active,
    })


# ---------------------------------------------------------------------------
# Quản lý Application
# ---------------------------------------------------------------------------

@admin_bp.route('/applications', methods=['GET'])
@admin_required
def list_applications():
    """Admin xem tất cả đơn ứng tuyển."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status_filter = request.args.get('status', '')

    query = Application.query
    if status_filter:
        query = query.filter_by(status=status_filter)
    query = query.order_by(Application.applied_at.desc())

    pagination = query.paginate(page=page, per_page=per_page)

    applications = []
    for a in pagination.items:
        user = User.query.get(a.user_id)
        job = Job.query.get(a.job_id)
        applications.append({
            "id": a.id,
            "status": a.status,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None,
            "seeker": {
                "id": user.id if user else None,
                "username": user.username if user else None,
                "email": user.email if user else None,
            },
            "job": {
                "id": job.id if job else None,
                "job_title": job.job_title if job else None,
                "company_name": job.company_name if job else None,
            },
        })

    return jsonify({
        "applications": applications,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    })


# ---------------------------------------------------------------------------
# Embedding Status
# ---------------------------------------------------------------------------

@admin_bp.route('/embedding-status', methods=['GET'])
@admin_required
def embedding_status():
    """Admin xem trạng thái cache embedding của jobs."""
    try:
        total_jobs  = Job.query.count()
        cached_jobs = Job.query.filter(
            (Job.job_embedding != None) & (Job.job_embedding != '')
        ).count()
        return jsonify({
            "total_jobs": total_jobs,
            "cached_jobs": cached_jobs,
            "uncached_jobs": total_jobs - cached_jobs,
            "cache_percentage": round(100 * cached_jobs / total_jobs, 2) if total_jobs > 0 else 0,
            "note": "job_embedding cache không còn dùng cho inference chính (đã chuyển sang subgraph).",
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500