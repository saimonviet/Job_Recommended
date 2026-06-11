#!/usr/bin/env python
"""
Script để nhập dữ liệu công việc từ file Excel vào database MySQL
Sử dụng: python import_jobs.py
"""

import pandas as pd
from datetime import datetime
import sys
import os
import re
import unicodedata
from flask import Flask

# Add the backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

from app.models import db, Job, Employer  # type: ignore
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


def _normalize_company_name(value):
    if not value:
        return ''
    normalized = unicodedata.normalize('NFKD', str(value))
    ascii_only = normalized.encode('ascii', 'ignore').decode('ascii').lower()
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9]+', ' ', ascii_only)).strip()

def format_employment_type(value):
    if not value or pd.isna(value):
        return None

    mapping = {
        "full_time": "Full time",
        "part_time": "Part time",
        "internship": "Internship",
        "contract": "Contract",
        "temporary": "Temporary",
        "freelance": "Freelance",
        "remote": "Remote",
        "hybrid": "Hybrid",
        "onsite": "Onsite"
    }

    value = str(value).strip().lower()
    return mapping.get(value, value.replace('_', ' ').title())

def _build_employer_lookup():
    employers = Employer.query.all()
    lookup = {}
    for employer in employers:
        key = _normalize_company_name(employer.company_name)
        if key and key not in lookup:
            lookup[key] = employer.id
    return lookup

def import_jobs_from_excel(app, excel_file):
    """Nhập dữ liệu công việc từ file Excel"""

    def get_optional(row, *column_names):
        for column_name in column_names:
            value = row.get(column_name)
            if pd.notna(value):
                return str(value)
        return None
    
    with app.app_context():
        try:
            # Đọc file Excel
            print(f"📁 Đang đọc file: {excel_file}")
            df = pd.read_csv(excel_file)
            employer_lookup = _build_employer_lookup()
            
            print(f"📊 Tổng số công việc: {len(df)}")
            print("\n⏳ Đang cập nhật dữ liệu (không xóa dữ liệu cũ)...\n")
            
            # Không xóa dữ liệu cũ, chỉ thêm dữ liệu mới
            # Xóa dữ liệu cũ (tùy chọn)
            # confirm = input("Bạn có muốn xóa dữ liệu công việc cũ? (y/n): ").strip().lower()
            # if confirm == 'y':
            #     Job.query.delete()
            #     db.session.commit()
            #     print("✓ Đã xóa dữ liệu cũ")
            
            # Nhập dữ liệu mới
            success_count = 0
            error_count = 0
            
            for idx, row in df.iterrows():
                try:
                    # Xử lý ngày deadline
                    deadline = None
                    if pd.notna(row['deadline']):
                        if isinstance(row['deadline'], str):
                            deadline = datetime.strptime(row['deadline'], '%d/%m/%Y')
                        else:
                            deadline = pd.Timestamp(row['deadline']).to_pydatetime()
                    
                    # Tạo object Job
                    job = Job(
                        job_title=str(row['job_title']),
                        company_name=str(row['company_name']),
                        salary_min=get_optional(row, 'salary_min'),
                        salary_max=get_optional(row, 'salary_max'),
                        job_address=get_optional(row, 'province'),
                        job_detail_address=get_optional(row, 'job_detail_address'),
                        deadline=deadline,
                        exp_min = get_optional(row, 'exp_min'),
                        exp_max = get_optional(row, 'exp_max'),
                        benefits =get_optional(row, 'benefits'),
                        employment_type=format_employment_type(get_optional(row, 'employment_type')),
                        job_function=get_optional(row, 'job_function'),
                        industries=get_optional(row, 'industry_group'),
                        job_description=get_optional(row, 'job_description'),
                        job_requirement=get_optional(row, 'job_requirement'),
                    )

                    employer_id = employer_lookup.get(_normalize_company_name(job.company_name))
                    if employer_id:
                        job.employer_id = employer_id
                    
                    db.session.add(job)
                    success_count += 1
                    
                    # Commit mỗi 100 records
                    if success_count % 100 == 0:
                        db.session.commit()
                        print(f"  ✓ Đã nhập {success_count} công việc...")
                
                except Exception as e:
                    error_count += 1
                    print(f"  ✗ Lỗi tại dòng {idx + 2}: {str(e)[:100]}")
                    db.session.rollback()
                    continue
            
            # Commit các records cuối cùng
            db.session.commit()
            
            print(f"\n✅ Import hoàn tất!")
            print(f"   Thành công: {success_count}")
            print(f"   Lỗi/Bỏ qua: {error_count}")
            
            return True
            
        except Exception as e:
            print(f"❌ Lỗi chung: {str(e)}")
            return False

if __name__ == '__main__':
    app = _build_db_app()
    # Xác định đường dẫn file Excel
    current_dir = os.path.dirname(os.path.abspath(__file__))
    excel_file = os.path.join(current_dir, 'COMBINED_DATA_PROCESSED1.csv')
    
    # Kiểm tra file tồn tại
    if not os.path.exists(excel_file):
        print(f"❌ Không tìm thấy file: {excel_file}")
        sys.exit(1)
    
    print(f"✓ Tìm thấy file: {excel_file}\n")
    success = import_jobs_from_excel(app, excel_file)
    sys.exit(0 if success else 1)
