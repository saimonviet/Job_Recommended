#!/usr/bin/env python
"""
Script để xóa tất cả tables cũ và tạo lại từ models
"""

import pandas as pd
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))


from run import app
from app.models import db

if __name__ == '__main__':
    with app.app_context():
        print("🔧 Đang xóa tất cả tables cũ...")
        db.drop_all()
        print("✓ Đã xóa tất cả tables")
        
        print("\n🔧 Đang tạo tables mới từ models...")
        db.create_all()
        print("✅ Database tables đã được tạo thành công!")
        print("   - InforUser table (infor_user)")
        print("   - Job table")
