#!/usr/bin/env python
"""
Migration script: create `employer` rows from distinct `job.company_name`/`job_detail_address`,
backup `job` table to CSV, then set `job.employer_id` accordingly.

Usage: python migrate_jobs_to_employers.py
"""

import csv
import os
import sys
import hashlib
import re
import unicodedata
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

from run import app
from app.models import db, Job, Employer


def _normalize_company_slug(value):
    normalized = unicodedata.normalize('NFKD', value)
    ascii_only = normalized.encode('ascii', 'ignore').decode('ascii').lower()
    slug = re.sub(r'[^a-z0-9]+', '', ascii_only)
    return slug[:40] or 'employer'


def _build_unique_placeholder_email(company_name, address, used_emails):
    base = _normalize_company_slug(company_name)
    fingerprint_source = f"{company_name}|{address or ''}"
    fingerprint = hashlib.sha1(fingerprint_source.encode('utf-8')).hexdigest()[:10]
    candidate = f"{base}-{fingerprint}@local.employer"

    if candidate not in used_emails:
        used_emails.add(candidate)
        return candidate

    # Extremely rare collision fallback
    counter = 2
    while True:
        candidate = f"{base}-{fingerprint}-{counter}@local.employer"
        if candidate not in used_emails:
            used_emails.add(candidate)
            return candidate
        counter += 1


# def backup_jobs(csv_path):
#     with app.app_context():
#         jobs = Job.query.order_by(Job.id).all()

#         with open(csv_path, 'w', newline='', encoding='utf-8') as f:
#             writer = csv.writer(f)
#             # Header
#             writer.writerow([
#                 'id', 'job_id', 'employer_id', 'job_title', 'company_name', 'salary_min', 'salary_max',
#                 'job_detail_address', 'job_detail_address', 'deadline', 'exp_min', 'exp_max', 'benefits',
#                 'employment_type', 'job_function', 'industries', 'job_description', 'job_requirement',
#                 'is_active', 'created_at'
#             ])

#             for j in jobs:
#                 writer.writerow([
#                     j.id, j.job_id, j.employer_id, j.job_title, j.company_name, j.salary_min, j.salary_max,
#                     j.job_detail_address, j.job_detail_address, j.deadline.isoformat() if j.deadline else None,
#                     j.exp_min, j.exp_max, j.benefits, j.employment_type, j.job_function, j.industries,
#                     j.job_description, j.job_requirement, j.is_active, j.created_at.isoformat() if j.created_at else None,
#                 ])


def migrate():
    with app.app_context():
        base_dir = os.path.dirname(os.path.abspath(__file__))
        backup_path = os.path.join(base_dir, 'backup_jobs_before_migration.csv')

        # print(f"Backing up job table to: {backup_path}")
        # backup_jobs(backup_path)

        # Build a map of (company_name, job_detail_address) -> employer
        print("Scanning distinct company_name/job_detail_address from job table...")
        distinct = db.session.query(Job.company_name, Job.job_detail_address).distinct().all()

        created = 0

        existing_employers = Employer.query.all()
        used_emails = {e.email for e in existing_employers if e.email}

        by_exact = {}
        by_name = {}
        for e in existing_employers:
            name_key = (e.company_name or '').strip()
            addr_key = (e.address or '').strip() or None
            if name_key:
                by_exact[(name_key, addr_key)] = e
                by_name.setdefault(name_key, e)

        for company_name, job_detail_address in distinct:
            if not company_name or str(company_name).strip() == '':
                continue

            company_name_clean = str(company_name).strip()
            addr = str(job_detail_address).strip() if job_detail_address else None

            employer = by_exact.get((company_name_clean, addr)) or by_name.get(company_name_clean)

            if not employer:
                # Provide placeholder email/password because Employer.email/password are NOT NULL.
                placeholder_email = _build_unique_placeholder_email(company_name_clean, addr, used_emails)
                placeholder_password = hashlib.sha256(placeholder_email.encode('utf-8')).hexdigest()[:64]

                employer = Employer(
                    company_name=company_name_clean,
                    address=addr,
                    email=placeholder_email,
                    password=placeholder_password,
                    created_at=datetime.utcnow()
                )
                db.session.add(employer)
                created += 1

                by_exact[(company_name_clean, addr)] = employer
                by_name.setdefault(company_name_clean, employer)

        # Commit new employers
        if created:
            print(f"Creating {created} new employer(s)...")
        db.session.commit()

        # Build lookup by company_name -> employer.id (prefer exact address match)
        employers = Employer.query.all()
        lookup = {}
        for e in employers:
            key = (e.company_name.strip() if e.company_name else '', e.address.strip() if e.address else None)
            # prefer address-specific key
            lookup[key] = e.id
            # also index by name alone if not present
            name_key = (e.company_name.strip() if e.company_name else '', None)
            if name_key not in lookup:
                lookup[name_key] = e.id

        # Update jobs in batches
        BATCH = 500
        total_updated = 0

        while True:
            batch = Job.query.filter(Job.employer_id.is_(None)).order_by(Job.id).limit(BATCH).all()
            if not batch:
                break

            for job in batch:
                name = job.company_name.strip() if job.company_name else ''
                addr = job.job_detail_address.strip() if job.job_detail_address else None
                emp_id = lookup.get((name, addr)) or lookup.get((name, None))
                if emp_id:
                    job.employer_id = emp_id
                    total_updated += 1

            db.session.commit()

        print(f"Migration complete. Employers created: {created}, jobs updated: {total_updated}")


if __name__ == '__main__':
    migrate()
