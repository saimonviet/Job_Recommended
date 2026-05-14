#!/usr/bin/env python
"""
Script để nhập dữ liệu người dùng từ file CSV vào database
Reset bảng User và InforUser, sau đó nhập từ đầu.

Sử dụng: python import_users.py
"""

import pandas as pd
import hashlib
import sys
import os
import traceback

# Add the backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

def import_users_from_csv(csv_file):
    """Reset và nhập dữ liệu người dùng từ file CSV"""

    def get_optional(row, column_name):
        value = row.get(column_name)
        if pd.notna(value):
            return str(value).strip()
        return None
    
    # Import Flask app từ run.py
    from run import app  # type: ignore
    from app.models import db, User, InforUser  # type: ignore
    
    with app.app_context():
        try:
            # Reset bảng
            print("🗑️  Xóa dữ liệu cũ...", flush=True)
            try:
                InforUser.query.delete()
                User.query.delete()
                db.session.commit()
                print("✓ Đã xóa dữ liệu cũ\n", flush=True)
            except Exception as e:
                print(f"⚠️  Lỗi xóa dữ liệu cũ: {e}", flush=True)
                db.session.rollback()
            
            # Đọc file CSV
            print(f"📁 Đang đọc file: {csv_file}", flush=True)
            if not os.path.exists(csv_file):
                raise FileNotFoundError(f"Không tìm thấy file {csv_file}")
            
            df = pd.read_csv(csv_file, sep=';', on_bad_lines='skip', engine='python')
            
            print(f"📊 Tổng số người dùng: {len(df)}", flush=True)
            print(f"📋 Các cột: {list(df.columns)}", flush=True)
            print("\n⏳ Đang nhập dữ liệu...\n", flush=True)
            
            success_count = 0
            error_count = 0
            COMMIT_BATCH = 200
            
            for idx, row in df.iterrows():
                try:
                    # Lấy username từ cột "User Name"
                    username = str(row.get('User Name', f'user_{idx}')).strip()
                    user_id = int(row.get('UserID', idx)) if pd.notna(row.get('UserID')) else None

                    if user_id is None:
                        raise ValueError('UserID không hợp lệ')

                    # Tạo User nếu chưa tồn tại
                    user = User.query.get(user_id)
                    if user is None:
                        user = User(
                            id=user_id,
                            username=username,
                            email=f'user{user_id}@local.test',
                            password=hashlib.sha256(f'user-{user_id}'.encode('utf-8')).hexdigest(),
                            role='seeker',
                        )
                        db.session.add(user)
                    
                    # Tạo InforUser
                    infor_user = InforUser(
                        user_id=user_id,
                        username=username,
                        avatar_path=None,
                        phone='',
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
                        exp_min=get_optional(row, 'exp_min'),
                        exp_max=get_optional(row, 'exp_max'),
                    )
                    
                    db.session.add(infor_user)
                    success_count += 1
                    
                    # In tiến độ
                    if (idx + 1) % 100 == 0:
                        print(f"  ✓ Đã xử lý {idx + 1}/{len(df)} người dùng...", flush=True)

                    # Commit in batches
                    if success_count % COMMIT_BATCH == 0:
                        db.session.commit()
                
                except Exception as e:
                    error_count += 1
                    db.session.rollback()
                    print(f"  ❌ Lỗi tại dòng {idx + 1}: {str(e)}", flush=True)
                    continue
            
            # Lưu vào database
            db.session.commit()
            
            # Kết quả
            print("\n" + "="*50, flush=True)
            print("✅ HOÀN THÀNH NHẬP DỮ LIỆU", flush=True)
            print("="*50, flush=True)
            print(f"✓ Thành công: {success_count} người dùng", flush=True)
            print(f"❌ Lỗi: {error_count} người dùng", flush=True)
            print(f"📊 Tổng cộng trong bảng infor_user: {InforUser.query.count()} người dùng", flush=True)
            
        except FileNotFoundError:
            print(f"❌ Không tìm thấy file: {csv_file}", flush=True)
        except Exception as e:
            print(f"❌ Lỗi: {str(e)}", flush=True)
            print("\nFull traceback:", flush=True)
            traceback.print_exc()
            db.session.rollback()

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Khởi động script import_users.py...")
    print("=" * 50, flush=True)
    
    # Lấy đường dẫn file CSV
    csv_file = os.path.join(os.path.dirname(__file__), 'USER_DATA_PROCESSED2.csv')
    print(f"📁 CSV file path: {csv_file}", flush=True)
    
    try:
        import_users_from_csv(csv_file)
        print("\n✅ Script hoàn tất thành công!", flush=True)
    except Exception as e:
        print(f"\n❌ Lỗi không mong muốn: {e}", flush=True)
        traceback.print_exc()
        sys.exit(1)
