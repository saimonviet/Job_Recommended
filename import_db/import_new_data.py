#!/usr/bin/env python
"""
Import the newly-built dataset (LinkedIn jobs + synthesized seekers) into SQLite.

Maps the new processed schema onto the existing SQLAlchemy models:
  jobs.csv  -> Job
  users.csv -> User + InforUser
Creates a single admin account and synthesizes employer rows.

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

COMPANY_POOL = [
    "TechVision", "DataBridge", "NovaHealth", "GreenLeaf", "Skyline", "PrimeLogistics",
    "BlueOcean", "Vertex Group", "Horizon Labs", "MetroWorks", "Apex Solutions",
    "CrestPoint", "IronGate", "Sunrise Foods", "GoldenGate", "NorthStar", "Redwood",
    "SilverLine", "CrystalClear", "Summit Partners", "Everest", "Pioneer", "Zenith",
]


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


def company_name(job_id: int, industry: str) -> str:
    base = COMPANY_POOL[job_id % len(COMPANY_POOL)]
    return f"{base} {industry.split('/')[0].strip()}"[:120]


def _norm(name):
    if not name:
        return ''
    return unicodedata.normalize('NFKD', str(name)).encode('ascii', 'ignore').decode('ascii').lower()


def import_all(app):
    jobs = pd.read_csv(os.path.join(PROC, "jobs.csv"))
    users = pd.read_csv(os.path.join(PROC, "users.csv"))
    print(f"jobs={len(jobs)} users={len(users)}")

    with app.app_context():
        print("Resetting DB...")
        db.drop_all()
        db.create_all()

        # ---- admin ----
        admin = Admin(
            username="admin", email="admin@local.test", display_name="Quản trị viên",
            password=hashlib.sha256("admin123".encode()).hexdigest(),
            avatar_path="/admin/avatar/file/admin-avatar.jpg", is_active=True,
        )
        db.session.add(admin)

        # ---- employers (one per distinct company) ----
        jobs["company"] = [company_name(i, j) for i, j in zip(jobs["job_id"], jobs["industry"])]
        emp_lookup = {}
        used_emails = set()
        for name in jobs["company"].unique():
            slug = _norm(name).replace(" ", "")[:40] or "employer"
            email = f"{slug}@local.employer"
            while email in used_emails:
                email = f"{slug}-{len(used_emails)}@local.employer"
            used_emails.add(email)
            e = Employer(company_name=name, email=email,
                         password=hashlib.sha256(email.encode()).hexdigest(),
                         industry="Khác", is_verified=True)
            db.session.add(e)
            db.session.flush()
            emp_lookup[name] = e.id
        db.session.commit()
        print(f"Employers: {len(emp_lookup)}")

        # ---- jobs ----
        COMMIT = 1000
        for i, r in jobs.iterrows():
            job = Job(
                job_title=str(r["title"])[:250],
                company_name=str(r["company"]),
                salary_min="" if pd.isna(r["salary_min"]) else str(r["salary_min"]),
                salary_max="" if pd.isna(r["salary_max"]) else str(r["salary_max"]),
                job_address=str(r["state"]),
                job_detail_address=str(r["state"]),
                exp_min=str(r["exp_min"]),
                exp_max=str(r["exp_max"]),
                benefits="",
                employment_type=str(r["employment_type"]),
                job_function=str(r["industry"]),
                industries=str(r["industry"]),
                job_description=str(r["description"])[:5000],
                job_requirement=str(r["requirement"])[:5000],
                is_active=True,
            )
            job.employer_id = emp_lookup.get(str(r["company"]))
            db.session.add(job)
            if (i + 1) % COMMIT == 0:
                db.session.commit()
                print(f"  jobs {i+1}/{len(jobs)}")
        db.session.commit()
        print(f"Jobs imported: {Job.query.count()}")

        # ---- users ----
        for i, r in users.iterrows():
            user = User(username=f"seeker{i}", email=f"user{i}@local.test",
                        password=hashlib.sha256(f"user-{i}".encode()).hexdigest(),
                        role="seeker")
            db.session.add(user)
            db.session.flush()
            infor = InforUser(
                id=user.id, username=f"seeker{i}", avatar_path=None, phone="",
                industry=str(r["industry"]),
                desired_job=str(r["industry"]),
                workplace_desired=str(r["state"]),
                desired_salary=str(r["salary_min"]),
                gender="Khác", marriage="Khác", age=30,
                target=str(r["industry"]), skills="", degree=str(r["degree"]),
                exp_min=str(r["exp_min"]), exp_max=str(r["exp_max"]),
            )
            db.session.add(infor)
            if (i + 1) % COMMIT == 0:
                db.session.commit()
                print(f"  users {i+1}/{len(users)}")
        db.session.commit()
        print(f"Users imported: {User.query.count()}, InforUser: {InforUser.query.count()}")

        print("DONE. DB:", db.engine.url)


if __name__ == "__main__":
    import_all(_build_db_app())
