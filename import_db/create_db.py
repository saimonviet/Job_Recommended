#!/usr/bin/env python
"""
Script để tạo tables trong database từ models
"""

import os
import sys
from flask import Flask

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

from app.models import db  # type: ignore
from app.config import Config  # type: ignore


def _build_db_app():
    app = Flask(__name__)
    try:
        app.config.from_object(Config)
    except Exception:
        pass

    if not app.config.get('SQLALCHEMY_DATABASE_URI'):
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'sqlite:///data.db'

    if 'SQLALCHEMY_TRACK_MODIFICATIONS' not in app.config:
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    return app

if __name__ == '__main__':
    app = _build_db_app()
    with app.app_context():
        print("🔧 Đang tạo tables từ models...")
        db.create_all()
        print("✅ Database tables đã được tạo thành công!")
        print("   - User table")
        print("   - InforUser table")
        print("   - Job table")
