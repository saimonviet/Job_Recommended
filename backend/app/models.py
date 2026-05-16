from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(64), nullable=False)
    role = db.Column(db.String(20), default='seeker')  # 'seeker' | 'admin'
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    recommendations = db.Column(db.Text)
    saved_jobs = db.Column(db.Text)  # JSON array of job IDs

    # infor = db.relationship('InforUser', backref='user', uselist=False,
    #                         primaryjoin='User.id == foreign(InforUser.user_id)')
    # applications = db.relationship('Application', backref='seeker', lazy='dynamic')


class InforUser(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255))
    avatar_path = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    industry = db.Column(db.String(255))
    desired_job = db.Column(db.String(255))
    workplace_desired = db.Column(db.String(255))
    desired_salary = db.Column(db.String(50))
    gender = db.Column(db.String(50))
    marriage = db.Column(db.String(100))
    age = db.Column(db.Integer)
    target = db.Column(db.Text)
    experience = db.Column(db.Text)
    skills = db.Column(db.Text)
    degree = db.Column(db.Text)
    exp_min = db.Column(db.String(50))
    exp_max = db.Column(db.String(50))
    user_embedding = db.Column(db.Text)  # JSON-encoded embedding vector


class Employer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(64), nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.String(300))
    website = db.Column(db.String(255))
    description = db.Column(db.Text)
    logo_path = db.Column(db.String(255))
    industry = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    jobs = db.relationship('Job', backref='employer', lazy='dynamic')


class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.String(100), unique=True, nullable=False)
    employer_id = db.Column(db.Integer, db.ForeignKey('employer.id'), nullable=True)
    job_title = db.Column(db.String(255), nullable=False)
    company_name = db.Column(db.String(255), nullable=False)
    salary_min = db.Column(db.String(50))
    salary_max = db.Column(db.String(50))
    job_address = db.Column(db.String(300))
    job_detail_address = db.Column(db.Text)
    deadline = db.Column(db.DateTime)
    exp_min = db.Column(db.String(50))
    exp_max = db.Column(db.String(50))
    benefits = db.Column(db.Text)
    employment_type = db.Column(db.String(100))
    job_function = db.Column(db.String(255))
    industries = db.Column(db.Text)
    job_description = db.Column(db.Text)
    job_requirement = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    is_locked = db.Column(db.Boolean, default=False)
    is_hidden = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    job_embedding = db.Column(db.Text)  # JSON-encoded embedding vector

    applications = db.relationship('Application', backref='job', lazy='dynamic')


class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('job.id'), nullable=False)
    cover_letter = db.Column(db.Text)
    cv_path = db.Column(db.String(255))
    # pending | reviewed | interview | accepted | rejected
    status = db.Column(db.String(50), default='pending')
    employer_note = db.Column(db.Text)
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'job_id', name='uq_user_job_application'),
    )