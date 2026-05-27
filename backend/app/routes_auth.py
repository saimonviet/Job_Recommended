"""
Endpoints:
    POST /auth/seeker/register
    POST /auth/seeker/login
    POST /auth/employer/register
    POST /auth/employer/login
    POST /auth/change-password
    GET  /auth/me
"""

from flask import Blueprint, request, jsonify
from .models import db, User, InforUser, Employer
from .auth import (
    hash_password, check_password,
    generate_token, login_required,
)


auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


# ---------------------------------------------------------------------------
# Seeker
# ---------------------------------------------------------------------------

@auth_bp.route('/seeker/register', methods=['POST'])
def seeker_register():
    """Đăng ký tài khoản seeker."""
    data = request.get_json(silent=True) or {}
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    raw_password = data.get('password', '')

    if not username or not email or not raw_password:
        return jsonify({"error": "Thiếu username, email hoặc password"}), 400

    if len(raw_password) < 6:
        return jsonify({"error": "Mật khẩu phải có ít nhất 6 ký tự"}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "Username hoặc email đã tồn tại"}), 409

    user = User(
        username=username,
        email=email,
        password=hash_password(raw_password),
        role='seeker',
    )
    db.session.add(user)
    db.session.flush()

    infor = InforUser(id=user.id, username=username)
    db.session.add(infor)
    db.session.commit()



    token = generate_token(user.id, 'seeker')
    return jsonify({
        "message": "Đăng ký thành công",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        }
    }), 201


@auth_bp.route('/seeker/login', methods=['POST'])
def seeker_login():
    """Đăng nhập seeker, trả về JWT."""
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    raw_password = data.get('password', '')

    if not email or not raw_password:
        return jsonify({"error": "Thiếu email hoặc password"}), 400

    user = User.query.filter_by(email=email).first()

    # Hỗ trợ tài khoản cũ dùng MD5 — tự động migrate sang bcrypt
    if user and len(user.password) == 32:
        import hashlib
        md5_hash = hashlib.md5(raw_password.encode('utf-8')).hexdigest()
        if user.password != md5_hash:
            return jsonify({"error": "Email hoặc mật khẩu không đúng"}), 401
        # Migrate sang bcrypt
        user.password = hash_password(raw_password)
        db.session.commit()
    elif not user or not check_password(raw_password, user.password):
        return jsonify({"error": "Email hoặc mật khẩu không đúng"}), 401

    if not user.is_active:
        return jsonify({"error": "Tài khoản đã bị khoá"}), 403

    token = generate_token(user.id, user.role)
    return jsonify({
        "message": "Đăng nhập thành công",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        }
    })


# ---------------------------------------------------------------------------
# Employer
# ---------------------------------------------------------------------------

@auth_bp.route('/employer/register', methods=['POST'])
def employer_register():
    """Đăng ký tài khoản nhà tuyển dụng."""
    data = request.get_json(silent=True) or {}
    company_name = (data.get('company_name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    raw_password = data.get('password', '')
    phone = (data.get('phone') or '').strip() or None
    address = (data.get('address') or '').strip() or None
    website = (data.get('website') or '').strip() or None
    industry = (data.get('industry') or '').strip() or None

    if not company_name or not email or not raw_password:
        return jsonify({"error": "Thiếu company_name, email hoặc password"}), 400

    if len(raw_password) < 6:
        return jsonify({"error": "Mật khẩu phải có ít nhất 6 ký tự"}), 400

    if Employer.query.filter_by(email=email).first():
        return jsonify({"error": "Email đã được đăng ký"}), 409

    employer = Employer(
        company_name=company_name,
        email=email,
        password=hash_password(raw_password),
        phone=phone,
        address=address,
        website=website,
        industry=industry,
    )
    db.session.add(employer)
    db.session.commit()

    token = generate_token(employer.id, 'employer')
    return jsonify({
        "message": "Đăng ký thành công",
        "token": token,
        "employer": {
            "id": employer.id,
            "company_name": employer.company_name,
            "email": employer.email,
        }
    }), 201


@auth_bp.route('/employer/login', methods=['POST'])
def employer_login():
    """Đăng nhập employer, trả về JWT."""
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    raw_password = data.get('password', '')

    if not email or not raw_password:
        return jsonify({"error": "Thiếu email hoặc password"}), 400

    employer = Employer.query.filter_by(email=email).first()
    if not employer or not check_password(raw_password, employer.password):
        return jsonify({"error": "Email hoặc mật khẩu không đúng"}), 401

    if not employer.is_active:
        return jsonify({"error": "Tài khoản đã bị khoá"}), 403

    token = generate_token(employer.id, 'employer')
    return jsonify({
        "message": "Đăng nhập thành công",
        "token": token,
        "employer": {
            "id": employer.id,
            "company_name": employer.company_name,
            "email": employer.email,
            "is_verified": employer.is_verified,
        }
    })


# ---------------------------------------------------------------------------
# Chung
# ---------------------------------------------------------------------------

@auth_bp.route('/me', methods=['GET'])
@login_required
def me():
    """Lấy thông tin người dùng hiện tại từ token."""
    role = request.current_role
    uid = request.current_user_id

    if role == 'employer':
        employer = Employer.query.get(uid)
        if not employer:
            return jsonify({"error": "Không tìm thấy employer"}), 404
        return jsonify({
            "id": employer.id,
            "role": "employer",
            "company_name": employer.company_name,
            "email": employer.email,
            "phone": employer.phone,
            "address": employer.address,
            "website": employer.website,
            "industry": employer.industry,
            "logo_path": employer.logo_path,
            "is_verified": employer.is_verified,
        })

    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "Không tìm thấy user"}), 404
    return jsonify({
        "id": user.id,
        "role": user.role,
        "username": user.username,
        "email": user.email,
    })


@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """Đổi mật khẩu cho seeker hoặc employer."""
    data = request.get_json(silent=True) or {}
    old_password = data.get('old_password') or data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not old_password or not new_password:
        return jsonify({"error": "Thiếu old_password hoặc new_password"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Mật khẩu mới phải có ít nhất 6 ký tự"}), 400

    role = request.current_role
    uid = request.current_user_id

    if role == 'employer':
        entity = Employer.query.get(uid)
    else:
        entity = User.query.get(uid)

    if not entity:
        return jsonify({"error": "Không tìm thấy tài khoản"}), 404

    if not check_password(old_password, entity.password):
        return jsonify({"error": "Mật khẩu cũ không đúng"}), 400

    entity.password = hash_password(new_password)
    db.session.commit()
    return jsonify({"message": "Đổi mật khẩu thành công"})