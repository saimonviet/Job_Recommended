#!/usr/bin/env python
"""
Script để nhập dữ liệu người dùng từ file CSV vào database
Sử dụng: python import_users.py
"""

import pandas as pd
import sys
import os

# Add the backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

def import_users_from_csv(csv_file):
    """Nhập dữ liệu người dùng từ file CSV"""

    def get_optional(row, column_name):
        value = row.get(column_name)
        if pd.notna(value):
            return str(value).strip()
        return None
    
    # Import Flask app từ run.py
    from run import app  # type: ignore
    from app.models import db, InforUser  # type: ignore
    
    with app.app_context():
        try:
            # Đọc file CSV
            print(f"📁 Đang đọc file: {csv_file}")
            df = pd.read_csv(csv_file, sep=';', on_bad_lines='skip', engine='python')
            
            print(f"📊 Tổng số người dùng: {len(df)}")
            print(f"📋 Các cột: {list(df.columns)}")
            
            # Không xóa dữ liệu cũ, chỉ thêm dữ liệu mới
            print("\n⏳ Đang cập nhật dữ liệu (không xóa dữ liệu cũ)...\n")
            
            # Nhập dữ liệu mới
            success_count = 0
            error_count = 0
            skipped_count = 0
            
            for idx, row in df.iterrows():
                try:
                    # Lấy username từ cột "User Name"
                    username = str(row.get('User Name', f'user_{idx}')).strip()
                    
                    # Kiểm tra người dùng đã tồn tại hay chưa
                    existing = InforUser.query.filter_by(username=username).first()
                    if existing:
                        skipped_count += 1
                        continue
                    
                    # Tạo đối tượng InforUser mới với tất cả dữ liệu từ CSV
                    infor_user = InforUser(
                        user_id=int(row.get('UserID', idx)) if pd.notna(row.get('UserID')) else None,
                        username=username,
                        industry=get_optional(row, 'industry_group'),
                        desired_job=get_optional(row, 'Desired Job'),
                        workplace_desired=get_optional(row, 'Workplace Desired'),
                        desired_salary=get_optional(row, 'Desired Salary'),
                        gender=get_optional(row, 'Gender'),
                        marriage=get_optional(row, 'Marriage'),
                        age=int(row.get('Age', 0)) if pd.notna(row.get('Age')) else None,
                        target=get_optional(row, 'Target'),
                        skills=get_optional(row, 'Skills'),
                        degree=get_optional(row, 'Degree'),
                        exp_min = get_optional(row, 'exp_min'),
                        exp_max = get_optional(row, 'exp_max'),
                    )
                    
                    db.session.add(infor_user)
                    success_count += 1
                    
                    # In tiến độ
                    if (idx + 1) % 100 == 0:
                        print(f"  ✓ Đã nhập {idx + 1}/{len(df)} người dùng...")
                
                except Exception as e:
                    error_count += 1
                    print(f"  ❌ Lỗi tại dòng {idx + 1}: {str(e)}")
                    continue
            
            # Lưu vào database
            db.session.commit()
            
            # Kết quả
            print("\n" + "="*50)
            print("✅ HOÀN THÀNH NHẬP DỮ LIỆU")
            print("="*50)
            print(f"✓ Thành công: {success_count} người dùng")
            print(f"⊘ Bỏ qua (trùng lặp): {skipped_count} người dùng")
            print(f"❌ Lỗi: {error_count} người dùng")
            print(f"📊 Tổng cộng trong bảng infor_user: {InforUser.query.count()} người dùng")
            
        except FileNotFoundError:
            print(f"❌ Không tìm thấy file: {csv_file}")
        except Exception as e:
            print(f"❌ Lỗi: {str(e)}")
            db.session.rollback()

if __name__ == '__main__':
    # Lấy đường dẫn file CSV
    csv_file = os.path.join(os.path.dirname(__file__), 'USER_DATA_PROCESSED2.csv')
    import_users_from_csv(csv_file)
