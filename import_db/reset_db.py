#!/usr/bin/env python
"""
Script để xóa tất cả tables cũ và tạo lại từ models
"""

import sys
import os
from flask import Flask

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

from app.models import db
from app.config import Config
from run import app



if __name__ == '__main__':

    print("App context loaded successfully")
    with app.app_context():
        print("🔧 Đang xóa tất cả tables cũ...")
        db.drop_all()
        print("✓ Đã xóa tất cả tables")
        
        print("\n🔧 Đang tạo tables mới từ models...")
        db.create_all()
        print("✅ Database tables đã được tạo thành công!")
