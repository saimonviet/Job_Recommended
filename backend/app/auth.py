"""
auth.py — JWT helpers + role decorators

Cài đặt: pip install PyJWT bcrypt
Thêm vào config:
    SECRET_KEY = "your-secret-key-change-in-production"
    JWT_EXPIRY_HOURS = 24
"""

import jwt
import bcrypt
from functools import wraps
from datetime import datetime, timedelta
from flask import request, jsonify, current_app
from .models import User, Employer


# ---------------------------------------------------------------------------
# Password hashing  (bcrypt thay thế MD5)
# ---------------------------------------------------------------------------

def hash_password(raw_password: str) -> str:
    """Hash mật khẩu bằng bcrypt. Trả về string để lưu DB."""
    return bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def check_password(raw_password: str, hashed: str) -> bool:
    """So sánh mật khẩu nhập vào với hash trong DB."""
    try:
        return bcrypt.checkpw(raw_password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

def _secret() -> str:
    return current_app.config.get('SECRET_KEY', 'change-me')


def generate_token(subject_id: int, role: str) -> str:
    """
    Tạo JWT.
    role: 'seeker' | 'employer' | 'admin'
    """
    expiry_hours = current_app.config.get('JWT_EXPIRY_HOURS', 24)
    payload = {
        'sub': subject_id,
        'role': role,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=expiry_hours),
    }
    return jwt.encode(payload, _secret(), algorithm='HS256')


def decode_token(token: str) -> dict | None:
    """Giải mã JWT. Trả về payload dict hoặc None nếu không hợp lệ."""
    try:
        return jwt.decode(token, _secret(), algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def _extract_bearer() -> str | None:
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:]
    return None


# ---------------------------------------------------------------------------
# Decorators
# ---------------------------------------------------------------------------

def login_required(f):
    """Yêu cầu đăng nhập (bất kỳ role nào)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = _extract_bearer()
        if not token:
            return jsonify({"error": "Token không tồn tại"}), 401
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Token không hợp lệ hoặc đã hết hạn"}), 401
        request.current_user_id = payload['sub']
        request.current_role = payload['role']
        return f(*args, **kwargs)
    return decorated


def seeker_required(f):
    """Chỉ cho phép seeker."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = _extract_bearer()
        if not token:
            return jsonify({"error": "Token không tồn tại"}), 401
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Token không hợp lệ hoặc đã hết hạn"}), 401
        if payload['role'] != 'seeker':
            return jsonify({"error": "Chỉ seeker mới có quyền truy cập"}), 403
        request.current_user_id = payload['sub']
        request.current_role = payload['role']
        return f(*args, **kwargs)
    return decorated


def employer_required(f):
    """Chỉ cho phép employer."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = _extract_bearer()
        if not token:
            return jsonify({"error": "Token không tồn tại"}), 401
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Token không hợp lệ hoặc đã hết hạn"}), 401
        if payload['role'] != 'employer':
            return jsonify({"error": "Chỉ employer mới có quyền truy cập"}), 403
        request.current_user_id = payload['sub']
        request.current_role = payload['role']
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Chỉ cho phép admin."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = _extract_bearer()
        if not token:
            return jsonify({"error": "Token không tồn tại"}), 401
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Token không hợp lệ hoặc đã hết hạn"}), 401
        if payload['role'] != 'admin':
            return jsonify({"error": "Chỉ admin mới có quyền truy cập"}), 403
        request.current_user_id = payload['sub']
        request.current_role = payload['role']
        return f(*args, **kwargs)
    return decorated


def employer_or_admin(f):
    """Cho phép employer hoặc admin."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = _extract_bearer()
        if not token:
            return jsonify({"error": "Token không tồn tại"}), 401
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Token không hợp lệ hoặc đã hết hạn"}), 401
        if payload['role'] not in ('employer', 'admin'):
            return jsonify({"error": "Không có quyền truy cập"}), 403
        request.current_user_id = payload['sub']
        request.current_role = payload['role']
        return f(*args, **kwargs)
    return decorated