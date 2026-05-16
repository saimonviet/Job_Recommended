#!/usr/bin/env python
"""
Script để làm sạch dữ liệu job:
1. Xóa các job trùng nhau (dựa trên job_id)
2. Chỉnh lại deadline để năm nằm trong [2024, 2026]
"""

import os
import sys
from datetime import datetime
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
        
        # Đếm duplicates
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
        
        # SQL DELETE: xóa tất cả job trùng nhau (giữ lại cái có ID cao nhất)
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
    Chỉnh lại deadline:
    - Nếu deadline năm < 2024 → set thành 2024
    - Nếu deadline năm > 2026 → set thành 2026
    - Nếu deadline không có hoặc invalid → set thành 2026
    """
    with app.app_context():
        print("\n📅 Chỉnh lại deadline...")
        
        jobs = Job.query.all()
        updated_count = 0
        
        for job in jobs:
            old_deadline = job.deadline
            updated = False
            
            if job.deadline is None:
                # Nếu không có deadline, set thành 2026-12-31
                job.deadline = datetime(2026, 12, 31)
                updated = True
            else:
                year = job.deadline.year
                if year < 2024:
                    # Giữ nguyên tháng/ngày, chỉ đổi năm thành 2024
                    job.deadline = job.deadline.replace(year=2024)
                    updated = True
                elif year > 2026:
                    # Giữ nguyên tháng/ngày, chỉ đổi năm thành 2026
                    job.deadline = job.deadline.replace(year=2026)
                    updated = True
            
            if updated:
                updated_count += 1
                if updated_count <= 10:  # In ra 10 cái đầu tiên
                    print(f"  🔄 Job {job.id} ({job.job_title}): {old_deadline} → {job.deadline}")
                elif updated_count == 11:
                    print(f"  ... và {len(jobs) - 10} job khác")
        
        if updated_count > 0:
            db.session.commit()
            print(f"✅ Đã cập nhật {updated_count}/{len(jobs)} job")
        else:
            print("✅ Tất cả deadline đã trong khoảng [2024, 2026]")
        
        return updated_count


def main():
    app = _build_db_app()
    
    with app.app_context():
        print("=" * 60)
        print("🧹 BẮT ĐẦU LÀMS SẠCH DỮ LIỆU JOB")
        print("=" * 60)
        
        # Thống kê ban đầu
        total_jobs_before = Job.query.count()
        print(f"\n📊 Thống kê ban đầu: {total_jobs_before} job")
        
        # Bước 1: Xóa duplicate
        deleted = remove_duplicate_jobs(app)
        
        # Bước 2: Fix deadline
        updated = fix_deadline_years(app)
        
        # Thống kê sau
        total_jobs_after = Job.query.count()
        print(f"\n📊 Thống kê cuối cùng: {total_jobs_after} job")
        print(f"   - Xóa: {deleted} job trùng")
        print(f"   - Cập nhật: {updated} job deadline")
        print("=" * 60)
        print("✅ HOÀN TẤT!")
        print("=" * 60)


if __name__ == '__main__':
    main()
