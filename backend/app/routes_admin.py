"""
routes_admin.py — Admin: quản lý user, employer, job, thống kê

Endpoints:
    POST   /admin/login
    GET    /admin/stats
    GET    /admin/users
    GET    /admin/users/<user_id>
    PUT    /admin/users/<user_id>
    DELETE /admin/users/<user_id>
    GET    /admin/employers
    GET    /admin/employers/<employer_id>
    PUT    /admin/employers/<employer_id>
    DELETE /admin/employers/<employer_id>
    PUT    /admin/employers/<employer_id>/verify
    GET    /admin/jobs/stats
    GET    /admin/jobs
    GET    /admin/jobs/<job_id>
    DELETE /admin/jobs/<job_id>
    PUT    /admin/jobs/<job_id>/lock
    PUT    /admin/jobs/<job_id>/hidden
    PUT    /admin/jobs/<job_id>/toggle
    GET    /admin/applications
"""
import os
from flask import send_from_directory
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify
from datetime import datetime
import hashlib
from .models import db, User, InforUser, Employer, Job, Application, SystemSetting, Admin
from .auth import admin_required, generate_token

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
AVT_FOLDER = os.path.join(BASE_DIR, "instance")
MAINTENANCE_KEY = 'maintenance_mode'
def _admin_avatar_url(admin):
    if not admin or not admin.avatar_path:
        return None

    avatar_path = admin.avatar_path.strip()

    if avatar_path.startswith("http"):
        return avatar_path

    return f"http://127.0.0.1:5000{avatar_path}"

def _get_bool_setting(key, default=False):
    setting = SystemSetting.query.get(key)
    if not setting:
        return default
    return setting.value == 'true'


def _set_bool_setting(key, value):
    setting = SystemSetting.query.get(key)
    if not setting:
        setting = SystemSetting(key=key, value='true' if value else 'false')
        db.session.add(setting)
    else:
        setting.value = 'true' if value else 'false'
    db.session.commit()
    return setting

def hash_admin_password(raw_password):
    return hashlib.sha256(raw_password.encode("utf-8")).hexdigest()


def check_admin_password(raw_password, hashed_password):
    return hash_admin_password(raw_password) == hashed_password

@admin_bp.route('/avatar', methods=['GET'])
@admin_required
def get_admin_avatar():
    admin = Admin.query.get(request.current_user_id)

    if not admin:
        return jsonify({"avatar_url": None}), 200

    avatar_url = _admin_avatar_url(admin)

    return jsonify({
        "avatar_url": avatar_url
    }), 200


@admin_bp.route('/avatar/file/<path:filename>', methods=['GET'])
def serve_admin_avatar(filename):
    return send_from_directory(AVT_FOLDER, filename)


@admin_bp.route('/avatar', methods=['POST'])
@admin_required
def upload_admin_avatar():
    if 'avatar' not in request.files:
        return jsonify({"error": "Không có file avatar"}), 400

    file = request.files['avatar']

    if file.filename == '':
        return jsonify({"error": "Tên file không hợp lệ"}), 400

    os.makedirs(AVT_FOLDER, exist_ok=True)

    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ['.png', '.jpg', '.jpeg', '.webp']:
        return jsonify({"error": "Chỉ hỗ trợ ảnh png, jpg, jpeg, webp"}), 400

    admin = Admin.query.get(request.current_user_id)

    if not admin:
        return jsonify({"error": "Không tìm thấy admin"}), 404

    avatar_filename = f"admin_{admin.id}{ext}"

    save_path = os.path.join(AVT_FOLDER, avatar_filename)

    file.save(save_path)

    admin.avatar_path = f"/admin/avatar/file/{avatar_filename}"

    db.session.commit()

    return jsonify({
        "message": "Cập nhật avatar admin thành công",
        "avatar_url": f"http://127.0.0.1:5000/admin/avatar/file/{avatar_filename}"
    }), 200

@admin_bp.route('/notifications', methods=['GET'])
@admin_required
def admin_notifications():
    pending_employers = Employer.query.filter_by(is_verified=False)\
        .order_by(Employer.created_at.desc())\
        .limit(10)\
        .all()

    notifications = []

    for employer in pending_employers:
        notifications.append({
            "id": employer.id,
            "type": "employer_pending",
            "title": "Nhà tuyển dụng mới đăng ký",
            "message": f"{employer.company_name} đang chờ duyệt tài khoản",
            "created_at": employer.created_at.isoformat() if employer.created_at else None,
        })

    return jsonify({
        "total_unread": len(notifications),
        "notifications": notifications,
    }), 200

# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    data = request.get_json(silent=True) or {}
    identity = (data.get('identity') or '').strip().lower()
    password = data.get('password', '').strip()

    if not identity or not password:
        return jsonify({
            "success": False,
            "error": "Thiếu tên đăng nhập/email hoặc mật khẩu"
        }), 400

    admin = Admin.query.filter(
        (Admin.username == identity) | (Admin.email == identity)
    ).first()

    if not admin or not check_admin_password(password, admin.password):
        return jsonify({
            "success": False,
            "error": "Thông tin đăng nhập không chính xác"
        }), 401

    if not admin.is_active:
        return jsonify({
            "success": False,
            "error": "Tài khoản admin đã bị khóa"
        }), 403

    token = generate_token(subject_id=admin.id, role='admin')

    return jsonify({
        "success": True,
        "token": token,
        "user": {
            "id": admin.id,
            "username": admin.username,
            "email": admin.email,
            "display_name": admin.display_name,
            "role": "admin",
            "avatar_path": admin.avatar_path,
        }
    }), 200

@admin_bp.route('/me', methods=['GET'])
@admin_required
def get_current_admin():
    admin = Admin.query.get(request.current_user_id)

    if not admin:
        return jsonify({"error": "Không tìm thấy admin"}), 404

    return jsonify({
        "id": admin.id,
        "username": admin.username,
        "email": admin.email,
        "display_name": admin.display_name,
        "avatar_path": admin.avatar_path,
        "avatar_url": _admin_avatar_url(admin),
        "is_active": admin.is_active,
        "created_at": admin.created_at.isoformat() if admin.created_at else None,
    }), 200

@admin_bp.route('/change-password', methods=['POST'])
@admin_required
def change_admin_password():
    admin = Admin.query.get(request.current_user_id)

    if not admin:
        return jsonify({"error": "Không tìm thấy admin"}), 404

    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password", "")

    if not current_password or not new_password or not confirm_password:
        return jsonify({"error": "Vui lòng nhập đầy đủ thông tin"}), 400

    if new_password != confirm_password:
        return jsonify({"error": "Mật khẩu xác nhận không khớp"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Mật khẩu mới phải có ít nhất 6 ký tự"}), 400

    if not check_admin_password(current_password, admin.password):
        return jsonify({"error": "Mật khẩu hiện tại không đúng"}), 400

    admin.password = hash_admin_password(new_password)

    try:
        db.session.commit()
        return jsonify({"message": "Đổi mật khẩu admin thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

@admin_bp.route('/settings', methods=['GET'])
@admin_required
def get_admin_settings():
    admin = Admin.query.get(request.current_user_id)

    if not admin:
        return jsonify({"error": "Không tìm thấy admin"}), 404

    return jsonify({
        "maintenanceMode": _get_bool_setting(MAINTENANCE_KEY, False),
        "admin": {
            "id": admin.id,
            "username": admin.username,
            "email": admin.email,
            "display_name": admin.display_name,
            "avatar_path": admin.avatar_path,
            "created_at": admin.created_at.isoformat() if admin.created_at else None,
        }
    }), 200


@admin_bp.route('/settings', methods=['PUT'])
@admin_required
def update_admin_settings():
    data = request.get_json(silent=True) or {}

    if 'maintenanceMode' not in data or not isinstance(data.get('maintenanceMode'), bool):
        return jsonify({"error": "maintenanceMode phai la boolean"}), 400

    _set_bool_setting(MAINTENANCE_KEY, data['maintenanceMode'])

    return jsonify({
        "message": "Cập nhật cài đặt thành công",
        "maintenanceMode": data['maintenanceMode'],
    }), 200


# ---------------------------------------------------------------------------
# Statistics
# ---------------------------------------------------------------------------

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    """Lấy thống kê tổng quan: số ứng viên, nhà tuyển dụng, etc."""
    total_seekers = User.query.filter(User.role == 'seeker').count()
    total_employers = Employer.query.count()  # Count from Employer table
    total_users = User.query.filter(User.role != 'admin').count()
    active_users = User.query.filter(User.role != 'admin', User.is_active == True).count()
    inactive_users = total_users - active_users

    return jsonify({
        "total_seekers": total_seekers,
        "total_employers": total_employers,
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
    }), 200


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

    query = User.query.filter(User.role == 'seeker')

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
                "job": {"id": a.job.id, "job_title": a.job.job_title} if a.job else None,
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
    """Admin duyệt employer. Sau khi duyệt thì không hủy duyệt nữa."""
    employer = Employer.query.get(employer_id)
    if not employer:
        return jsonify({"error": "Không tìm thấy employer"}), 404

    if employer.is_verified:
        return jsonify({
            "error": "Tài khoản này đã được duyệt. Nếu cần chặn truy cập, hãy khóa tài khoản."
        }), 400

    employer.is_verified = True
    employer.is_active = True

    try:
        db.session.commit()
        return jsonify({
            "message": "Duyệt employer thành công",
            "is_verified": employer.is_verified,
            "is_active": employer.is_active,
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Quản lý Job
# ---------------------------------------------------------------------------

@admin_bp.route('/jobs/stats', methods=['GET'])
@admin_required
def get_jobs_stats():
    """Thống kê job theo trạng thái."""
    total_jobs = Job.query.count()
    locked_jobs = Job.query.filter_by(is_locked=True).count() if hasattr(Job, 'is_locked') else 0
    hidden_jobs = Job.query.filter_by(is_hidden=True).count() if hasattr(Job, 'is_hidden') else 0

    return jsonify({
        "total_jobs": total_jobs,
        "locked_jobs": locked_jobs,
        "hidden_jobs": hidden_jobs,
    }), 200


@admin_bp.route('/jobs', methods=['GET'])
@admin_required
def list_jobs():
    """Admin xem toàn bộ job trong hệ thống."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '').strip()
    status = request.args.get('status', '')  # 'active' | 'locked' | 'hidden'
    employer_id = request.args.get('employer_id', None, type=int)

    query = Job.query

    if search:
        query = query.filter(
            Job.job_title.ilike(f'%{search}%') | Job.company_name.ilike(f'%{search}%')
        )
    
    # Status filter
    if status == 'locked':
        query = query.filter_by(is_locked=True)
    elif status == 'hidden':
        query = query.filter_by(is_hidden=True)
    elif status == 'active':
        query = query.filter(
            (Job.is_locked == False) & (Job.is_hidden == False)
        )
    
    if employer_id:
        query = query.filter_by(employer_id=employer_id)

    query = query.order_by(Job.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page)

    jobs = []
    for j in pagination.items:
        app_count = j.applications.count()
        jobs.append({
            "id": j.id,
            "title": j.job_title,
            "company": j.company_name,
            "job_address": j.job_address,
            "employment_type": j.employment_type,
            "employer_id": j.employer_id,
            "is_active": j.is_active,
            "is_locked": getattr(j, 'is_locked', False),
            "is_hidden": getattr(j, 'is_hidden', False),
            "is_deleted": getattr(j, 'is_deleted', False),
            "posted_date": j.created_at.isoformat() if j.created_at else None,
            "deadline": j.deadline.isoformat() if j.deadline else None,
            "total_applications": app_count,
        })

    return jsonify({
        "jobs": jobs,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    })


@admin_bp.route('/jobs/<int:job_id>', methods=['GET'])
@admin_required
def get_job_detail(job_id):
    """Chi tiết một job."""
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Không tìm thấy job"}), 404

    employer = Employer.query.get(job.employer_id)
    app_count = Application.query.filter_by(job_id=job.id).count()

    return jsonify({
        "id": job.id,
        "title": job.job_title,
        "company": job.company_name,
        "job_address": job.job_address,
        "employment_type": job.employment_type,
        "description": job.job_description,
        "experience_required": getattr(job, 'experience_required', None),
        "salary_min": getattr(job, 'salary_min', None),
        "salary_max": getattr(job, 'salary_max', None),
        "deadline": job.deadline.isoformat() if job.deadline else None,
        "posted_date": job.created_at.isoformat() if job.created_at else None,
        "is_active": job.is_active,
        "is_locked": getattr(job, 'is_locked', False),
        "is_hidden": getattr(job, 'is_hidden', False),
        "is_deleted": getattr(job, 'is_deleted', False),
        "total_applications": app_count,
        "employer": {
            "id": employer.id,
            "company_name": employer.company_name,
            "email": employer.email,
            "phone": employer.phone,
            "website": employer.website,
        } if employer else None,
    }), 200


@admin_bp.route('/jobs/<int:job_id>', methods=['DELETE'])
@admin_required
def admin_delete_job(job_id):
    """Admin xóa job (soft delete - đánh dấu is_deleted)."""
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Không tìm thấy job"}), 404

    if hasattr(job, 'is_deleted'):
        job.is_deleted = True
        db.session.commit()
        return jsonify({"message": "Xóa job thành công"}), 200
    else:
        # Fallback: xóa hoàn toàn nếu không có is_deleted
        Application.query.filter_by(job_id=job.id).delete()
        db.session.delete(job)
        try:
            db.session.commit()
            return jsonify({"message": "Xóa job thành công"})
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500


@admin_bp.route('/jobs/<int:job_id>/lock', methods=['PUT'])
@admin_required
def lock_job(job_id):
    """Admin khóa/mở khóa job."""
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Không tìm thấy job"}), 404

    data = request.get_json(silent=True) or {}
    if 'is_locked' in data:
        job.is_locked = bool(data['is_locked'])
    else:
        job.is_locked = not getattr(job, 'is_locked', False)

    db.session.commit()
    return jsonify({
        "message": f"Job {'đã khóa' if job.is_locked else 'đã mở khóa'}",
        "is_locked": job.is_locked,
    }), 200


@admin_bp.route('/jobs/<int:job_id>/hidden', methods=['PUT'])
@admin_required
def hidden_job(job_id):
    """Admin ẩn/hiển thị job."""
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Không tìm thấy job"}), 404

    data = request.get_json(silent=True) or {}
    if 'is_hidden' in data:
        job.is_hidden = bool(data['is_hidden'])
    else:
        job.is_hidden = not getattr(job, 'is_hidden', False)

    db.session.commit()
    return jsonify({
        "message": f"Job {'đã ẩn' if job.is_hidden else 'đã hiển thị'}",
        "is_hidden": job.is_hidden,
    }), 200


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
    
#Analytics
@admin_bp.route('/analytics', methods=['GET'])
@admin_required
def admin_analytics():
    total_seekers = User.query.filter_by(role='seeker').count()
    total_employers = Employer.query.count()
    total_jobs = Job.query.filter_by(is_deleted=False).count()
    total_applications = Application.query.count()

    accepted_count = Application.query.filter_by(status='accepted').count()
    success_rate = round((accepted_count / total_applications) * 100, 2) if total_applications > 0 else 0

    status_counts = db.session.query(
        Application.status,
        db.func.count(Application.id)
    ).group_by(Application.status).all()

    status_distribution = [
        {
            "status": status or "unknown",
            "count": count,
            "percentage": round((count / total_applications) * 100, 2) if total_applications > 0 else 0
        }
        for status, count in status_counts
    ]

    top_companies_query = db.session.query(
        Job.company_name,
        db.func.count(Job.id).label("job_count")
    ).filter(Job.is_deleted == False)\
     .group_by(Job.company_name)\
     .order_by(db.desc("job_count"))\
     .limit(5)\
     .all()

    top_companies = [
        {
            "name": company_name,
            "count": job_count
        }
        for company_name, job_count in top_companies_query
    ]

    top_jobs_query = db.session.query(
        Job.job_title,
        db.func.count(Job.id).label("count")
    ).filter(Job.is_deleted == False)\
     .group_by(Job.job_title)\
     .order_by(db.desc("count"))\
     .limit(5)\
     .all()

    top_jobs = [
        {
            "title": title,
            "count": count
        }
        for title, count in top_jobs_query
    ]

    monthly_users_query = db.session.query(
        db.func.date_format(
            User.created_at,
            '%Y-%m'
        ).label("month"),
        db.func.count(User.id)
    ).filter(User.role == 'seeker')\
    .group_by(
        db.func.date_format(User.created_at, '%Y-%m')
    )\
    .order_by(
        db.func.date_format(User.created_at, '%Y-%m')
    )\
    .all()

    monthly_users = [
        {
            "month": month,
            "count": count
        }
        for month, count in monthly_users_query
    ]

    return jsonify({
        "overview": {
            "total_seekers": total_seekers,
            "total_employers": total_employers,
            "total_jobs": total_jobs,
            "total_applications": total_applications,
            "success_rate": success_rate,
        },
        "status_distribution": status_distribution,
        "top_companies": top_companies,
        "top_jobs": top_jobs,
        "monthly_users": monthly_users,
    }), 200
