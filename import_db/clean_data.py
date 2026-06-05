#!/usr/bin/env python
"""
Script để làm sạch dữ liệu dữ liệu:
1. Xóa các job trùng nhau (dựa trên job_id/job_embedding)
2. Xóa các job có deadline rỗng hoặc khác năm 2026 (Xóa kèm employer liên đới)
3. Cập nhật các job có deadline trước 13/06/2026 (cộng thêm ngày để dời về nửa cuối năm 2026)
4. Xóa các user có trường industries = 'Khác' trong bảng infor_user và bảng user
5. Xóa các job có trường industry = 'Khác' trong bảng job
6. Xóa các job có địa chỉ = 'Khác'
"""

import os
import sys
import random
from datetime import datetime, timedelta
from flask import Flask

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

from app.models import db, Job
from app.config import Config


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


def remove_duplicate_jobs(app):
    """Xóa các job trùng nhau dựa trên job_embedding (dùng SQL DELETE)"""
    with app.app_context():
        print("🔍 Tìm các job trùng nhau...")
        from sqlalchemy import text
        
        count_result = db.session.execute(text("""
            SELECT COUNT(DISTINCT job_embedding) as count
            FROM job
            WHERE job_embedding IS NOT NULL
            GROUP BY job_embedding
            HAVING COUNT(*) > 1
        """)).fetchall()
        
        dup_count = len(count_result)
        if dup_count == 0:
            print("✅ Không có job trùng nhau")
            return 0
        
        print(f"⚠️  Tìm thấy {dup_count} job_embedding bị trùng")
        
        delete_query = text("""
            DELETE FROM job WHERE id IN (
                SELECT * FROM (
                    SELECT j.id FROM job j
                    INNER JOIN (
                        SELECT job_embedding, MAX(id) as keep_id
                        FROM job
                        WHERE job_embedding IS NOT NULL
                        GROUP BY job_embedding
                        HAVING COUNT(*) > 1
                    ) dup ON j.job_embedding = dup.job_embedding
                    WHERE j.id != dup.keep_id
                ) AS temp
            )
        """)
        
        result = db.session.execute(delete_query)
        deleted_count = result.rowcount
        db.session.commit()
        
        print(f"✅ Đã xóa {deleted_count} job trùng (1 query SQL)")
        return deleted_count


def fix_deadline_years(app):
    """
    Xử lý deadline:
    1. Xóa các employer (và toàn bộ job của họ) nếu có deadline rỗng hoặc khác 2026.
    2. Cộng thêm ngày vào các job có deadline trước 13/06/2026 để đảm bảo nằm trong [13/06/2026, 31/12/2026].
    """
    with app.app_context():
        print("\n📅 Đang tiến hành lọc và cập nhật deadline...")
        from sqlalchemy import text
        
        # --- BƯỚC 1: Xóa job và employer nếu deadline Rỗng hoặc Khác năm 2026 ---
        select_employers_query = text("""
            SELECT DISTINCT employer_id 
            FROM job 
            WHERE deadline IS NULL 
               OR EXTRACT(YEAR FROM deadline) != 2026
        """)
        
        try:
            employer_ids = [row[0] for row in db.session.execute(select_employers_query).fetchall() if row[0] is not None]
        except Exception:
            # Fallback cho SQLite
            select_employers_query_sqlite = text("""
                SELECT DISTINCT employer_id 
                FROM job 
                WHERE deadline IS NULL 
                   OR strftime('%Y', deadline) != '2026'
            """)
            employer_ids = [row[0] for row in db.session.execute(select_employers_query_sqlite).fetchall() if row[0] is not None]
            
        deleted_jobs_count = 0
        deleted_employers_count = 0
        
        if employer_ids:
            employer_ids_tuple = tuple(employer_ids) if len(employer_ids) > 1 else (employer_ids[0],)
            
            job_res = db.session.execute(text("DELETE FROM job WHERE employer_id IN :ids"), {"ids": employer_ids_tuple})
            deleted_jobs_count = job_res.rowcount
            
            emp_res = db.session.execute(text("DELETE FROM employer WHERE id IN :ids"), {"ids": employer_ids_tuple})
            deleted_employers_count = emp_res.rowcount
            
            db.session.commit()
            print(f"✅ Bước 1: Đã xóa {deleted_employers_count} nhà tuyển dụng và {deleted_jobs_count} job liên đới (do sai năm/rỗng)")
        else:
            print("✅ Bước 1: Không có job nào vi phạm điều kiện năm 2026 hoặc rỗng.")

        # --- BƯỚC 2: Cập nhật deadline cho các job trước ngày 13/06/2026 ---
        # Lấy các job thuộc năm 2026 nhưng có deadline nhỏ hơn 13/06
        jobs_to_update = Job.query.filter(Job.deadline < datetime(2026, 6, 13)).all()
        updated_count = 0
        
        for job in jobs_to_update:
            # Cộng thêm một số ngày ngẫu nhiên (từ 150 - 200 ngày, tương đương 5-6 tháng) 
            # Việc dùng ngẫu nhiên giúp dữ liệu dãn cách tự nhiên hơn thay vì dồn cục vào 1 ngày
            added_days = random.randint(150, 200)
            new_deadline = job.deadline + timedelta(days=added_days)
            
            # Đảm bảo cận dưới là 13/06/2026 và cận trên là 31/12/2026
            if new_deadline < datetime(2026, 6, 13):
                new_deadline = datetime(2026, 6, 13)
            elif new_deadline > datetime(2026, 12, 31):
                new_deadline = datetime(2026, 12, 31)
                
            job.deadline = new_deadline
            updated_count += 1
            
        if updated_count > 0:
            db.session.commit()
            print(f"✅ Bước 2: Đã cộng thêm ngày và cập nhật thành công {updated_count} job về sau ngày 13/06/2026.")
        else:
            print("✅ Bước 2: Không có job nào bị đặt deadline trước ngày 13/06/2026.")
            
        return deleted_jobs_count, updated_count


def remove_users_with_other_industry(app):
    """Xóa các user có trường industries = 'Khác' trong bảng infor_user và bảng user"""
    with app.app_context():
        print("\n👥 Xóa các user có ngành nghề (industries) là 'Khác'...")
        from sqlalchemy import text
        
        select_query = text("SELECT id FROM infor_user WHERE industry = 'Khác'")
        user_ids = [row[0] for row in db.session.execute(select_query).fetchall() if row[0] is not None]
        
        if not user_ids:
            print("✅ Không tìm thấy user nào có industry = 'Khác'")
            return 0
            
        print(f"⚠️  Tìm thấy {len(user_ids)} user cần xóa khỏi hệ thống")
        user_ids_tuple = tuple(user_ids) if len(user_ids) > 1 else (user_ids[0],)
        
        db.session.execute(
            text("DELETE FROM infor_user WHERE id IN :ids"),
            {"ids": user_ids_tuple}
        )
        
        result = db.session.execute(
            text("DELETE FROM user WHERE id IN :ids"),
            {"ids": user_ids_tuple}
        )
        
        deleted_count = result.rowcount
        db.session.commit()
        
        print(f"✅ Đã xóa {deleted_count} user thành công ở cả 2 bảng (user & infor_user)")
        return deleted_count


def remove_jobs_with_other_industry(app):
    """Xóa các job có trường industry = 'Khác' trong bảng job"""
    with app.app_context():
        print("\n💼 Xóa các job có ngành nghề (industry) là 'Khác'...")
        from sqlalchemy import text
        
        delete_query = text("DELETE FROM job WHERE industries = 'Khác'")
        result = db.session.execute(delete_query)
        deleted_count = result.rowcount
        
        db.session.commit()
        print(f"✅ Đã xóa {deleted_count} job có industry = 'Khác'")
        return deleted_count


def remove_jobs_with_other_address(app):
    """Xóa các job có địa chỉ là 'Khác'"""
    with app.app_context():
        from sqlalchemy import text
        
        delete_query = text("DELETE FROM job WHERE job_address = 'Khác'")
        result = db.session.execute(delete_query)
        deleted_count = result.rowcount
        
        db.session.commit()
        print(f"✅ Đã xóa {deleted_count} job có job_address = 'Khác'")
        return deleted_count


def main():
    app = _build_db_app()
    
    with app.app_context():
        print("=" * 60)
        print("🧹 BẮT ĐẦU LÀM SẠCH VÀ CHUẨN HÓA DỮ LIỆU")
        print("=" * 60)
        
        # Thống kê ban đầu
        total_jobs_before = Job.query.count()
        print(f"\n📊 Thống kê ban đầu: {total_jobs_before} job")
        
        # Bước 1: Xóa duplicate job
        deleted_dups = remove_duplicate_jobs(app)
        
        # Bước 2: Xử lý deadline (Xóa job sai năm + dời ngày job sớm)
        deleted_deadline_jobs, updated_deadline_jobs = fix_deadline_years(app)
        
        # Bước 3: Xóa các user thuộc ngành 'Khác'
        deleted_users = remove_users_with_other_industry(app)
        
        # Bước 4: Xóa các job thuộc ngành 'Khác'
        deleted_khac_jobs = remove_jobs_with_other_industry(app)

        # Bước 5: Xóa các job có địa chỉ 'Khác'
        deleted_khac_address_jobs = remove_jobs_with_other_address(app)
        
        # Thống kê sau khi dọn dẹp
        total_jobs_after = Job.query.count()
        print(f"\n📊 Thống kê cuối cùng: {total_jobs_after} job còn lại")
        print(f"   - Đã xóa: {deleted_dups} job trùng lặp")
        print(f"   - Đã xóa: {deleted_deadline_jobs} job do vi phạm năm (rỗng / khác năm 2026)")
        print(f"   - Đã cập nhật: {updated_deadline_jobs} job được cộng thêm ngày về khoảng 13/06 - 31/12/2026")
        print(f"   - Đã xóa: {deleted_users} tài khoản user ngành 'Khác'")
        print(f"   - Đã xóa: {deleted_khac_jobs} job ngành 'Khác'")
        print(f"   - Đã xóa: {deleted_khac_address_jobs} job có địa chỉ 'Khác'")
        print("=" * 60)
        print("✅ HOÀN TẤT QUÁ TRÌNH LÀM SẠCH VÀ CHUẨN HÓA DỮ LIỆU!")
        print("=" * 60)


if __name__ == '__main__':
    main()