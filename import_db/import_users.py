#!/usr/bin/env python
"""
Script để nhập dữ liệu người dùng từ file CSV vào database
Sử dụng: python import_users.py
"""

import pandas as pd
import sys
import os

# Add the backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

def import_users_from_csv(csv_file):
    """Nhập dữ liệu người dùng từ file CSV"""
    
    # Import Flask app từ run.py
    from run import app
    from app.models import db, InforUser
    
    with app.app_context():
        try:
            # Đọc file CSV
            print(f"📁 Đang đọc file: {csv_file}")
            df = pd.read_csv(csv_file)
            
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
                        industry=str(row.get('Industry', '')).strip() if pd.notna(row.get('Industry')) else None,
                        desired_job=str(row.get('Desired Job', '')).strip() if pd.notna(row.get('Desired Job')) else None,
                        workplace_desired=str(row.get('Workplace Desired', '')).strip() if pd.notna(row.get('Workplace Desired')) else None,
                        desired_salary=str(row.get('Desired Salary', '')).strip() if pd.notna(row.get('Desired Salary')) else None,
                        gender=str(row.get('Gender', '')).strip() if pd.notna(row.get('Gender')) else None,
                        marriage=str(row.get('Marriage', '')).strip() if pd.notna(row.get('Marriage')) else None,
                        age=int(row.get('Age', 0)) if pd.notna(row.get('Age')) else None,
                        target=str(row.get('Target', '')).strip() if pd.notna(row.get('Target')) else None,
                        skills=str(row.get('Skills', '')).strip() if pd.notna(row.get('Skills')) else None,
                        degree=str(row.get('Degree', '')).strip() if pd.notna(row.get('Degree')) else None,
                        work_experience=str(row.get('Work Experience', '')).strip() if pd.notna(row.get('Work Experience')) else None,
                        url_user=str(row.get('URL User', '')).strip() if pd.notna(row.get('URL User')) else None
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
    csv_file = os.path.join(os.path.dirname(__file__), 'USER_DATA_FINAL.csv')
    import_users_from_csv(csv_file)
