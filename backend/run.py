
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import inspect, text

from app.models import db, SystemSetting, User
from app.config import Config

# Legacy routes (job listing, GNN, user-profile, saved-jobs cũ)
from app.routes import main
from app.embedding_pipeline import _get_recommendation_model

from app.routes_auth import auth_bp
from app.routes_seeker import seeker_bp
from app.routes_employer import employer_bp
from app.routes_admin import admin_bp


MAINTENANCE_KEY = 'maintenance_mode'


def _maintenance_mode_enabled():
    setting = db.session.get(SystemSetting, MAINTENANCE_KEY)
    return bool(setting and setting.value == 'true')


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    # Extensions
    db.init_app(app)
    CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

    @app.route('/maintenance-status', methods=['GET'])
    def maintenance_status():
        return jsonify({"maintenanceMode": _maintenance_mode_enabled()}), 200

    @app.before_request
    def block_requests_during_maintenance():
        if request.method == 'OPTIONS':
            return None

        path = request.path or ''
        if path == '/maintenance-status' or path == '/admin' or path.startswith('/admin/'):
            return None

        if _maintenance_mode_enabled():
            return jsonify({
                "maintenance": True,
                "message": "Website dang bao tri. Vui long quay lai sau.",
            }), 503

        return None

    # Đăng ký blueprint
    app.register_blueprint(main)           # /jobs, /recommendations, /user-profile, ...
    app.register_blueprint(auth_bp)        # /auth/seeker/login, /auth/employer/register, ...
    app.register_blueprint(seeker_bp)      # /seeker/jobs/<id>/apply, /seeker/applications, ...
    app.register_blueprint(employer_bp)    # /employer/jobs, /employer/applications/<id>/status, ...
    app.register_blueprint(admin_bp)       # /admin/dashboard, /admin/users, ...

    def _ensure_user_recent_applied_jobs_column():
        inspector = inspect(db.engine)
        if 'user' not in inspector.get_table_names():
            return
        columns = [col['name'] for col in inspector.get_columns('user')]
        if 'recent_applied_jobs' not in columns:
            db.engine.execute(text(
                'ALTER TABLE user ADD COLUMN recent_applied_jobs TEXT'
            ))

    with app.app_context():
        db.create_all()                    # Tạo bảng mới (Employer, Application)
        _ensure_user_recent_applied_jobs_column()
        _get_recommendation_model()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
