#!/usr/bin/env python
"""
Script để xóa tất cả tables cũ và tạo lại từ models
"""

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
        print("   - User table")
        print("   - InforUser table (infor_user)")
        print("   - Job table")
