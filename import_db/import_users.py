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
from flask import Flask

# Add the backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

from app.models import db, User, InforUser  # type: ignore
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

def import_users_from_csv(app, csv_file):
    """Reset và nhập dữ liệu người dùng từ file CSV"""

    def get_optional(row, column_name):
        value = row.get(column_name)
        if pd.notna(value):
            return str(value).strip()
        return None
    
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
            
            df = pd.read_csv(csv_file, sep=',', on_bad_lines='skip', engine='python')
            
            print(f"📊 Tổng số người dùng: {len(df)}", flush=True)
            print(f"📋 Các cột: {list(df.columns)}", flush=True)
            
            # Kiểm tra user_id trùng lặp
            user_ids = df['UserID'].dropna().astype(int)
            duplicate_ids = user_ids[user_ids.duplicated(keep=False)].sort_values()
            unique_duplicates = duplicate_ids.unique()
            
            if len(unique_duplicates) > 0:
                print("\n⚠️  PHÁT HIỆN USER_ID TRÙNG LẶP:", flush=True)
                for uid in unique_duplicates:
                    count = (user_ids == uid).sum()
                    print(f"  - UserID {uid}: xuất hiện {count} lần", flush=True)
                print(f"\n📊 Tổng unique UserID: {user_ids.nunique()}/{len(df)} dòng", flush=True)
            else:
                print(f"\n✓ Không có UserID trùng lặp. Unique: {user_ids.nunique()}/{len(df)}", flush=True)
            
            print("\n⏳ Đang nhập dữ liệu...\n", flush=True)
            
            success_count = 0
            error_count = 0
            COMMIT_BATCH = 200
            
            for idx, row in df.iterrows():
                try:
                    # Lấy username từ cột "User Name" (fallback dùng index)
                    username = str(row.get('User Name', f'user_{idx}')).strip()

                    # Tạo User mới - để DB tự gán id (1,2,3...)
                    user = User(
                        username=username,
                        email=f'user_temp_{idx}@local.test',
                        password='tmp_password',
                        role='seeker',
                    )
                    db.session.add(user)
                    # flush để DB gán `user.id`
                    db.session.flush()

                    # Cập nhật email/password dựa trên id thực tế
                    user.email = f'user{user.id}@local.test'
                    user.password = hashlib.sha256(f'user-{user.id}'.encode('utf-8')).hexdigest()
                    db.session.flush()

                    # Tạo InforUser với id = user.id để đồng bộ 2 bảng
                    infor_user = InforUser(
                        id=user.id,
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
    app = _build_db_app()
    print("=" * 50)
    print("🚀 Khởi động script import_users.py...")
    print("=" * 50, flush=True)
    
    # Lấy đường dẫn file CSV
    csv_file = os.path.join(os.path.dirname(__file__), 'USER_DATA_PROCESSED1.csv')
    print(f"📁 CSV file path: {csv_file}", flush=True)
    
    try:
        import_users_from_csv(app, csv_file)
        print("\n✅ Script hoàn tất thành công!", flush=True)
    except Exception as e:
        print(f"\n❌ Lỗi không mong muốn: {e}", flush=True)
        traceback.print_exc()
        sys.exit(1)
