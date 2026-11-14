#!/usr/bin/env python
"""
Import the newly-built dataset (MedaJob + VietJob + MedaJob seekers) into SQLite.

Maps the new standardized schema onto the SQLAlchemy models:
  jobs.csv  -> Job
  users.csv -> User + InforUser
Creates an admin account and employer rows.

Usage: python import_new_data.py
"""

import hashlib
import os
import sys
import unicodedata

import numpy as np
import pandas as pd
from flask import Flask

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from app.models import db, User, InforUser, Job, Employer, Admin  # type: ignore
from app.config import Config  # type: ignore

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROC = os.path.join(ROOT, "data", "processed")


def _build_db_app():
    app = Flask(__name__)
    try:
        app.config.from_object(Config)
    except Exception:
        pass
    if not app.config.get('SQLALCHEMY_DATABASE_URI'):
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'sqlite:///data.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app


def _norm(name):
    if not name:
        return ''
    return unicodedata.normalize('NFKD', str(name)).encode('ascii', 'ignore').decode('ascii').lower()


def import_all(app):
    jobs_file = os.path.join(PROC, "jobs.csv")
    users_file = os.path.join(PROC, "users.csv")

    if not os.path.exists(jobs_file) or not os.path.exists(users_file):
        print(f"❌ Error: Required files not found in {PROC}")
        print("Please run data standardization first:")
        print("  python -m ml.standardize_datasets")
        print("  python -m ml.standardize_users")
        sys.exit(1)

    jobs = pd.read_csv(jobs_file, low_memory=False)
    users = pd.read_csv(users_file, low_memory=False)
    print(f"Loading datasets: jobs={len(jobs)}, users={len(users)}")

    with app.app_context():
        print("Resetting SQLite Database...")
        db.drop_all()
        db.create_all()

        # ---- 1. Admin Account ----
        admin = Admin(
            username="admin",
            email="admin@career.local",
            display_name="Quản trị viên",
            password=hashlib.sha256("admin123".encode()).hexdigest(),
            avatar_path="/admin/avatar/file/admin-avatar.jpg",
            is_active=True,
        )
        db.session.add(admin)

        # ---- 2. Employers ----
        print("Creating employer accounts...")
        company_col = "company_name" if "company_name" in jobs.columns else "company"
        jobs["company_clean"] = jobs[company_col].fillna("Doanh nghiệp tuyển dụng").astype(str)

        emp_lookup = {}
        used_emails = set()
        for idx, name in enumerate(jobs["company_clean"].unique()[:500]):  # Cap distinct employers
            slug = _norm(name).replace(" ", "")[:30] or f"employer{idx}"
            email = f"{slug}@career.local"
            counter = 1
            while email in used_emails:
                email = f"{slug}_{counter}@career.local"
                counter += 1
            used_emails.add(email)

            e = Employer(
                company_name=name[:250],
                email=email,
                password=hashlib.sha256("123456".encode()).hexdigest(),
                industry="Đa ngành",
                is_verified=True,
            )
            db.session.add(e)
            db.session.flush()
            emp_lookup[name] = e.id

        db.session.commit()
        default_emp_id = list(emp_lookup.values())[0] if emp_lookup else None
        print(f"Created {len(emp_lookup)} employer accounts.")

        # ---- 3. Jobs ----
        print("Importing jobs into database...")
        COMMIT = 1000
        for i, r in jobs.iterrows():
            title = str(r.get("job_title") or r.get("title") or "Tin tuyển dụng")[:250]
            c_name = str(r.get("company_name") or r.get("company") or "Doanh nghiệp tuyển dụng")
            prov = str(r.get("province") or r.get("state") or "Toàn quốc")
            loc_detail = str(r.get("job_location") or prov)
            sal_min = "" if pd.isna(r.get("salary_min")) else str(r.get("salary_min"))
            sal_max = "" if pd.isna(r.get("salary_max")) else str(r.get("salary_max"))
            exp_min = "" if pd.isna(r.get("exp_min")) else str(r.get("exp_min"))
            exp_max = "" if pd.isna(r.get("exp_max")) else str(r.get("exp_max"))
            emp_type = str(r.get("employment_type") or "Toàn thời gian")
            ind = str(r.get("industry") or "Ngành nghề khác")
            desc = str(r.get("job_description") or r.get("description") or "")[:5000]
            req = str(r.get("job_requirement") or r.get("requirement") or "")[:5000]
            bene = str(r.get("benefits") or "")[:1000]

            job = Job(
                job_title=title,
                company_name=c_name,
                salary_min=sal_min,
                salary_max=sal_max,
                job_address=prov,
                job_detail_address=loc_detail,
                exp_min=exp_min,
                exp_max=exp_max,
                benefits=bene,
                employment_type=emp_type,
                job_function=ind,
                industries=ind,
                job_description=desc,
                job_requirement=req,
                is_active=True,
                employer_id=emp_lookup.get(c_name, default_emp_id),
            )
            db.session.add(job)
            if (i + 1) % COMMIT == 0:
                db.session.commit()
                print(f"  -> Imported {i + 1}/{len(jobs)} jobs...")

        db.session.commit()
        print(f"✅ Total Jobs imported: {Job.query.count()}")

        # ---- 4. Users & InforUser ----
        print("Importing candidate profiles...")
        for i, r in users.iterrows():
            uname = str(r.get("username") or f"seeker{i}")
            email = str(r.get("email") or f"seeker{i}@career.local")
            pwd_hash = hashlib.sha256("123456".encode()).hexdigest()

            user = User(
                username=uname[:50],
                email=email[:100],
                password=pwd_hash,
                role="seeker",
                is_active=True,
            )
            db.session.add(user)
            db.session.flush()

            full_name = str(r.get("full_name") or uname)
            desired_job = str(r.get("desired_job") or "Kỹ sư phần mềm")
            prov = str(r.get("province") or "Đà Nẵng")
            sal_str = str(r.get("salary_text") or "10 - 20 triệu")
            skills = str(r.get("skills") or "")
            degree = str(r.get("degree") or "Đại học")
            exp_min_str = str(r.get("exp_min") or "0")
            exp_max_str = str(r.get("exp_max") or "2")
            summary = str(r.get("target_summary") or "")[:2000]
            phone = str(r.get("phone") or "")

            infor = InforUser(
                id=user.id,
                username=uname,
                avatar_path=None,
                phone=phone,
                industry=str(r.get("industry") or "Công nghệ thông tin / Phần mềm"),
                desired_job=desired_job,
                workplace_desired=prov,
                desired_salary=sal_str,
                gender="Khác",
                marriage="Độc thân",
                age=24,
                target=summary or desired_job,
                experience=f"{exp_min_str}-{exp_max_str} năm",
                skills=skills,
                degree=degree,
                exp_min=exp_min_str,
                exp_max=exp_max_str,
            )
            db.session.add(infor)

        db.session.commit()
        print(f"✅ Total Candidates imported: {User.query.count()}")
        print(f"✅ Database initialized successfully: {db.engine.url}")


if __name__ == "__main__":
    import_all(_build_db_app())
