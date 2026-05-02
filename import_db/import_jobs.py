#!/usr/bin/env python
"""
Script để nhập dữ liệu công việc từ file Excel vào database MySQL
Sử dụng: python import_jobs.py
"""

import pandas as pd
from datetime import datetime
import sys
import os

# Add the backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

def import_jobs_from_excel(excel_file):
    """Nhập dữ liệu công việc từ file Excel"""

    def get_optional(row, *column_names):
        for column_name in column_names:
            value = row.get(column_name)
            if pd.notna(value):
                return str(value)
        return None
    
    # Import Flask app từ run.py
    from run import app
    from app.models import db, Job
    
    with app.app_context():
        try:
            # Đọc file Excel
            print(f"📁 Đang đọc file: {excel_file}")
            df = pd.read_csv(excel_file)
            
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
                    # # Kiểm tra job_id đã tồn tại hay chưa
                    # existing = Job.query.filter_by(job_id=str(row['job_id'])).first()
                    # if existing:
                    #     error_count += 1
                    #     continue
                    
                    # Xử lý ngày deadline
                    deadline = None
                    if pd.notna(row['deadline']):
                        if isinstance(row['deadline'], str):
                            deadline = datetime.strptime(row['deadline'], '%d/%m/%Y')
                        else:
                            deadline = pd.Timestamp(row['deadline']).to_pydatetime()
                    
                    # Tạo object Job
                    job = Job(
                        job_id=str(row['job_id']),
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
                        employment_type=get_optional(row, 'employment_type'),
                        job_function=get_optional(row, 'job_function'),
                        industries=get_optional(row, 'industry_group'),
                        job_description=get_optional(row, 'job_description'),
                        job_requirement=get_optional(row, 'job_requirement'),
                    )
                    
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
    # Xác định đường dẫn file Excel
    current_dir = os.path.dirname(os.path.abspath(__file__))
    excel_file = os.path.join(current_dir, 'COMBINED_DATA_PROCESSED1.csv')
    
    # Kiểm tra file tồn tại
    if not os.path.exists(excel_file):
        print(f"❌ Không tìm thấy file: {excel_file}")
        sys.exit(1)
    
    print(f"✓ Tìm thấy file: {excel_file}\n")
    success = import_jobs_from_excel(excel_file)
    sys.exit(0 if success else 1)
