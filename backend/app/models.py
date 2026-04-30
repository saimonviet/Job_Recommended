from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50))
    email = db.Column(db.String(100))

class InforUser(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # user_id = db.Column(db.Integer)
    username = db.Column(db.String(255), unique=True)
    industry = db.Column(db.String(255))
    desired_job = db.Column(db.String(255))
    workplace_desired = db.Column(db.String(255))
    desired_salary= db.Column(db.String(50))
    gender = db.Column(db.String(50))
    marriage = db.Column(db.String(100))
    age = db.Column(db.Integer)
    target = db.Column(db.Text)
    skills = db.Column(db.Text)
    degree = db.Column(db.Text)
    exp_min = db.Column(db.String(50))
    exp_max = db.Column(db.String(50))

class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # job_id = db.Column(db.String(100), unique=True, nullable=False)
    job_title = db.Column(db.String(255), nullable=False)
    company_name = db.Column(db.String(255), nullable=False)
    salary_min = db.Column(db.String(50))
    salary_max = db.Column(db.String(50))
    job_address = db.Column(db.String(300))
    deadline = db.Column(db.DateTime)
    exp_min = db.Column(db.String(50))
    exp_max = db.Column(db.String(50))
    benefits = db.Column(db.Text)
    employment_type = db.Column(db.String(100))
    job_function = db.Column(db.String(255))
    industries = db.Column(db.Text)
    job_description = db.Column(db.Text)
    job_requirement = db.Column(db.Text)
