#!/usr/bin/env python
"""
Script để tạo tables trong database từ models
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

from run import app
from app.models import db

if __name__ == '__main__':
    with app.app_context():
        print("🔧 Đang tạo tables từ models...")
        db.create_all()
        print("✅ Database tables đã được tạo thành công!")
        print("   - User table")
        print("   - InforUser table")
        print("   - Job table")
