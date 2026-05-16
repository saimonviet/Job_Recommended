
import bcrypt
import hashlib
from functools import wraps
from flask import request, jsonify, current_app
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
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
        if isinstance(hashed, str) and len(hashed) == 64:
            return hashlib.sha256(raw_password.encode('utf-8')).hexdigest() == hashed
        return bcrypt.checkpw(raw_password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

def _secret() -> str:
    return current_app.config.get('SECRET_KEY', 'change-me')


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(_secret(), salt='auth-token')


def generate_token(subject_id: int, role: str) -> str:
    """
    Tạo token đăng nhập có ký số.
    role: 'seeker' | 'employer' | 'admin'
    """
    expiry_hours = current_app.config.get('JWT_EXPIRY_HOURS', 24)
    payload = {
        'sub': subject_id,
        'role': role,
        'exp_seconds': expiry_hours * 3600,
    }
    return _serializer().dumps(payload)


def decode_token(token: str) -> dict | None:
    """Giải mã token. Trả về payload dict hoặc None nếu không hợp lệ."""
    try:
        payload = _serializer().loads(token, max_age=current_app.config.get('JWT_EXPIRY_HOURS', 24) * 3600)
        return payload if isinstance(payload, dict) else None
    except (BadSignature, SignatureExpired):
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