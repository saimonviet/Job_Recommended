import os
import json
import hashlib
import re
import unicodedata
import logging
import traceback
import time
from datetime import datetime

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import pandas as pd
from sqlalchemy import inspect, text
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from .models import db, User, Job, InforUser, Employer
import pickle

# ---> Pipeline khớp model_train.ipynb (Model 1: HeteroSAGE encoder + MLP decoder)

# Artifact paths (preprocessors, tfidf, model)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
_PREPROCESSORS_PATH = os.path.join(BASE_DIR, 'preprocessors.pkl')
_TFIDF_PATH = os.path.join(BASE_DIR, 'tfidf.pkl')
MODEL_PATH = os.path.join(BASE_DIR, 'best_model1.pt')

# Cache singletons
_prep = None
_tfidf = None
_recommendation_model = None

main = Blueprint('main', __name__)
logger = logging.getLogger(__name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'uploads')
LOGOS_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'logos')

def _load_artifacts():
    global _prep, _tfidf
    if _prep is None or _tfidf is None:
        try:
            with open(_PREPROCESSORS_PATH, 'rb') as f:
                _prep = pickle.load(f)
        except Exception:
            _prep = {}
        try:
            with open(_TFIDF_PATH, 'rb') as f:
                _tfidf = pickle.load(f)
        except Exception:
            _tfidf = None
    return _prep, _tfidf


# --- Model classes (match notebook) ---
from torch_geometric.data import HeteroData
from torch_geometric.nn import SAGEConv, HeteroConv

class GNNEncoder(nn.Module):
    def __init__(self, hidden_channels: int = 128, out_channels: int = 64, dropout: float = 0.3):
        super().__init__()
        self.dropout = dropout
        self.proj = nn.ModuleDict({
            'user': nn.Linear(267, hidden_channels),
            'job':  nn.Linear(265, hidden_channels),
        })
        self.conv1 = HeteroConv({
            ('user', 'applies',     'job'):  SAGEConv((-1, -1), hidden_channels),
            ('job',  'rev_applies', 'user'): SAGEConv((-1, -1), hidden_channels),
        }, aggr='mean')
        self.conv2 = HeteroConv({
            ('user', 'applies',     'job'):  SAGEConv((-1, -1), out_channels),
            ('job',  'rev_applies', 'user'): SAGEConv((-1, -1), out_channels),
        }, aggr='mean')
        self.out_proj = nn.ModuleDict({
            'user': nn.Linear(hidden_channels, out_channels),
            'job':  nn.Linear(hidden_channels, out_channels),
        })

    def forward(self, x_dict, edge_index_dict):
        proj_dict = {k: F.relu(self.proj[k](v)) for k, v in x_dict.items()}
        conv1_out = self.conv1(x_dict, edge_index_dict)
        x_dict_1 = {}
        for k in proj_dict:
            if k in conv1_out and conv1_out[k] is not None:
                x_dict_1[k] = F.relu(conv1_out[k])
            else:
                x_dict_1[k] = proj_dict[k]
        x_dict_1 = {k: F.dropout(v, p=self.dropout, training=self.training) for k, v in x_dict_1.items()}
        conv2_out = self.conv2(x_dict_1, edge_index_dict)
        x_dict_2 = {}
        for k in x_dict_1:
            if k in conv2_out and conv2_out[k] is not None:
                x_dict_2[k] = conv2_out[k]
            else:
                x_dict_2[k] = self.out_proj[k](x_dict_1[k])
        return x_dict_2


class EdgePredictor(nn.Module):
    def __init__(self, in_channels: int = 64):
        super().__init__()
        self.lin = nn.Sequential(
            nn.Linear(in_channels * 2, in_channels),
            nn.ReLU(),
            nn.Linear(in_channels, 1),
        )

    def forward(self, z_user, z_job, edge_label_index):
        u = z_user[edge_label_index[0]]
        j = z_job[edge_label_index[1]]
        return self.lin(torch.cat([u, j], dim=-1)).squeeze(-1)


class RecommendationScorer(nn.Module):
    def __init__(self, hidden_channels: int = 128, out_channels: int = 64, dropout: float = 0.3):
        super().__init__()
        self.encoder = GNNEncoder(hidden_channels, out_channels, dropout)
        self.decoder = EdgePredictor(out_channels)


def _get_recommendation_model():
    global _recommendation_model
    if _recommendation_model is not None:
        return _recommendation_model
    model = RecommendationScorer()
    try:
        state = torch.load(MODEL_PATH, map_location='cpu')
        model.load_state_dict(state, strict=False)
    except Exception:
        # Try loading as state_dict or fallback
        try:
            model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'), strict=False)
        except Exception:
            logger.warning(f"[_get_recommendation_model] Không thể load {MODEL_PATH}")
    model.eval()
    _recommendation_model = model
    return _recommendation_model


def _build_user_feat(user, infor):
    # ensure artifacts loaded
    global _prep, _tfidf
    _prep, _tfidf = _load_artifacts()
    # text
    user_text = ' '.join(filter(None, [
        infor.skills if infor else '',
        infor.target if infor else '',
        infor.desired_job if infor else '',
        infor.industry if infor else '',
    ]))
    text_emb = _tfidf.transform([user_text]).toarray().astype(np.float32) if _tfidf is not None else np.zeros((1,256), dtype=np.float32)
    # numerical
    age = float(infor.age or 0) if infor else 0.0
    exp_min = float(infor.exp_min or 0) if infor else 0.0
    exp_max = float(infor.exp_max or 0) if infor else 0.0
    sal_str = (infor.desired_salary or '') if infor else ''
    nums = [float(x) for x in re.findall(r'\d+\.?\d*', sal_str)]
    salary_min = nums[0] if nums else 0.0
    salary_max = nums[1] if len(nums) > 1 else salary_min * 1.2 or 0.0
    _user_input = [[age, exp_min, exp_max, salary_min, salary_max]]
    cols_user = getattr(_prep.get('scaler_user', None), 'feature_names_in_', None) if _prep else None
    if cols_user is not None:
        user_df = pd.DataFrame(_user_input, columns=cols_user)
        num = _prep['scaler_user'].transform(user_df).astype(np.float32)
    else:
        num = _prep['scaler_user'].transform(_user_input).astype(np.float32) if _prep and 'scaler_user' in _prep else np.array(_user_input, dtype=np.float32)
    province = (infor.workplace_desired if infor else '')
    cat = np.array([[
        _safe_encode(_prep['le_gender'], infor.gender if infor else None),
        _safe_encode(_prep['le_degree'], _extract_degree(infor.degree if infor else None)),
        _safe_encode(_prep['le_marr'], infor.marriage if infor else None),
        _safe_encode(_prep['le_ind'], infor.industry if infor else None),
        _safe_encode(_prep['le_prov'], province),
        _parse_salary_type(sal_str),
    ]], dtype=np.float32)
    X_user = np.hstack([num, cat, text_emb])
    return torch.tensor(X_user, dtype=torch.float32).squeeze(0)


def _extract_degree(text):
    if not text:
        return 'other'
    t = str(text).lower()
    if any(k in t for k in ['thạc sĩ', 'master']):     return 'master'
    if any(k in t for k in ['tiến sĩ', 'phd']):        return 'phd'
    if any(k in t for k in ['đại học', 'university']): return 'university'
    if any(k in t for k in ['cao đẳng', 'college']):   return 'college'
    if any(k in t for k in ['trung cấp', 'dạy nghề']): return 'vocational'
    if any(k in t for k in ['thpt', 'trung học']):     return 'highschool'
    return 'other'


def _safe_encode(le, val, default='Khác'):
    try:
        return int(le.transform([val or default])[0])
    except Exception:
        return 0


def _parse_salary_type(salary_str):
    if not salary_str or 'thoả' in str(salary_str).lower() or 'thoả thuận' in str(salary_str).lower():
        return 3
    return 1


def _build_job_feat(job):
    global _prep, _tfidf
    _prep, _tfidf = _load_artifacts()
    job_text = ' '.join(filter(None, [
        job.job_title, job.job_description, job.job_requirement, job.industries, job.job_function, job.employment_type
    ]))
    text_emb = _tfidf.transform([job_text]).toarray().astype(np.float32) if _tfidf is not None else np.zeros((1,256), dtype=np.float32)
    nums_min = [float(x) for x in re.findall(r'\d+\.?\d*', str(job.salary_min or ''))]
    nums_max = [float(x) for x in re.findall(r'\d+\.?\d*', str(job.salary_max or ''))]
    salary_min = nums_min[0] if nums_min else 0.0
    salary_max = nums_max[0] if nums_max else salary_min * 1.2 or 0.0
    exp_min = float(job.exp_min or 0)
    exp_max = float(job.exp_max or 0)
    _job_input = [[salary_min, salary_max, exp_min, exp_max]]
    cols_job = getattr(_prep.get('scaler_job', None), 'feature_names_in_', None) if _prep else None
    if cols_job is not None:
        job_df = pd.DataFrame(_job_input, columns=cols_job)
        num = _prep['scaler_job'].transform(job_df).astype(np.float32)
    else:
        num = _prep['scaler_job'].transform(_job_input).astype(np.float32) if _prep and 'scaler_job' in _prep else np.array(_job_input, dtype=np.float32)
    province = getattr(job, 'job_address', '')
    cat = np.array([[
        _parse_salary_type(job.salary_min),
        _safe_encode(_prep['le_emp'], job.employment_type),
        _safe_encode(_prep['le_func'], job.job_function),
        _safe_encode(_prep['le_ind'], job.industries),
        _safe_encode(_prep['le_prov'], province),
    ]], dtype=np.float32)
    X_job = np.hstack([num, cat, text_emb])
    return torch.tensor(X_job, dtype=torch.float32).squeeze(0)


# def _score_jobs_via_subgraph(user, infor, jobs):
#     """
#     Build a tiny subgraph with 1 user and K jobs, run encoder and decoder like notebook.
#     Returns numpy array shape (K,) with scores in [0,1].
#     """
#     from torch_geometric.data import HeteroData

#     # 1. User feature (267,)
#     user_feat = _build_user_feat(user, infor)

#     # 2. Job feature matrix (K, 265)
#     job_feats = [_build_job_feat(job) for job in jobs]
#     K = len(job_feats)

#     job_features_tensor = torch.stack(job_feats)       # (K, 265)
#     user_features_tensor = user_feat.unsqueeze(0)      # (1, 267)

#     # 3. Build subgraph
#     data = HeteroData()
#     data['user'].x = user_features_tensor
#     data['job'].x  = job_features_tensor
#     data['user', 'applies', 'job'].edge_index = torch.stack([
#         torch.zeros(K, dtype=torch.long),
#         torch.arange(K, dtype=torch.long),
#     ])
#     data['job', 'rev_applies', 'user'].edge_index = torch.stack([
#         torch.arange(K, dtype=torch.long),
#         torch.zeros(K, dtype=torch.long),
#     ])

#     rec_model = _get_recommendation_model()
#     with torch.no_grad():
#         z_dict = rec_model.encoder(data.x_dict, data.edge_index_dict)
#         z_user = z_dict['user']  # (1, 64)
#         z_job  = z_dict['job']   # (K, 64)
#         edge_label_index = torch.stack([
#             torch.zeros(K, dtype=torch.long),
#             torch.arange(K, dtype=torch.long),
#         ])
#         scores = rec_model.decoder(z_user, z_job, edge_label_index).sigmoid()
#         try:
#             scores_np = scores.cpu().numpy().flatten()
#             logger.debug(f"[_score_jobs_via_subgraph] z_user_norm={float(z_user.norm().item()):.6e}, z_job_norms_mean={float(z_job.norm(dim=1).mean().item()):.6e}")
#             logger.debug(f"[_score_jobs_via_subgraph] scores_stats min={scores_np.min():.6e}, max={scores_np.max():.6e}, mean={scores_np.mean():.6e}")
#         except Exception:
#             logger.exception("[_score_jobs_via_subgraph] Failed debug stats")

#     return scores.cpu().numpy()


def _score_jobs_via_embeddings(user_emb, job_embs):
    """
    Score jobs using provided embeddings only (no encoder run).

    Parameters
    - user_emb: torch.Tensor or numpy array with shape (64,) or (1,64) or (267,) etc
    - job_embs: torch.Tensor or numpy array with shape (K,64) or (K,512) etc

    Returns
    - numpy array shape (K,) with scores in [0,1]
    """
    try:
        # convert inputs to torch tensors
        if isinstance(user_emb, np.ndarray):
            z_user = torch.tensor(user_emb, dtype=torch.float32)
        else:
            z_user = user_emb.float() if torch.is_tensor(user_emb) else torch.tensor(user_emb, dtype=torch.float32)
        
        if isinstance(job_embs, np.ndarray):
            z_job = torch.tensor(job_embs, dtype=torch.float32)
        else:
            z_job = job_embs.float() if torch.is_tensor(job_embs) else torch.tensor(job_embs, dtype=torch.float32)

        if z_user.dim() == 1:
            z_user = z_user.unsqueeze(0)
        if z_job.dim() == 1:
            z_job = z_job.unsqueeze(0)

        # Check embedding dimensions
        user_dim = z_user.size(-1)
        job_dim = z_job.size(-1)
        logger.debug(f"[_score_jobs_via_embeddings] user_dim={user_dim}, job_dim={job_dim}")
        
        # If embeddings are not 64-dim, fall back to cosine similarity
        if user_dim != 64 or job_dim != 64:
            logger.warning(f"[_score_jobs_via_embeddings] Embeddings are {user_dim}D and {job_dim}D, not 64D. Using cosine similarity fallback.")
            raise ValueError("Embedding dimension mismatch, using fallback")
        
        model = _get_recommendation_model()
        K = z_job.size(0)
        edge_label_index = torch.stack([
            torch.zeros(K, dtype=torch.long),
            torch.arange(K, dtype=torch.long),
        ])

        with torch.no_grad():
            scores = model.decoder(z_user, z_job, edge_label_index).sigmoid()
            scores_np = scores.cpu().numpy().flatten()
            try:
                logger.debug(f"[_score_jobs_via_embeddings] scores_stats min={scores_np.min():.6e}, max={scores_np.max():.6e}, mean={scores_np.mean():.6e}")
            except Exception:
                pass
            return scores_np

    except Exception as e:
        logger.warning(f"[_score_jobs_via_embeddings] Failed to compute scores using decoder ({e}), falling back to cosine similarity")
        # Fallback: cosine similarity between embeddings -> map [-1,1] to [0,1]
        try:
            if torch.is_tensor(user_emb):
                u = user_emb.cpu().numpy()
            else:
                u = np.array(user_emb)
            if torch.is_tensor(job_embs):
                j = job_embs.cpu().numpy()
            else:
                j = np.array(job_embs)
            if u.ndim == 1:
                u = u.reshape(1, -1)
            if j.ndim == 1:
                j = j.reshape(1, -1)
            
            # Normalize
            u_norm = np.linalg.norm(u, axis=1, keepdims=True) + 1e-12
            j_norm = np.linalg.norm(j, axis=1, keepdims=True) + 1e-12
            u_normalized = u / u_norm
            j_normalized = j / j_norm
            
            # Cosine similarity: (j_normalized @ u_normalized.T).flatten()
            sims = (j_normalized @ u_normalized.T).flatten()
            sims = np.clip(sims, -1.0, 1.0)
            # Map from [-1, 1] to [0, 1]
            scores = ((sims + 1.0) / 2.0).astype(float)
            logger.info(f"[_score_jobs_via_embeddings] Cosine similarity fallback: min={scores.min():.4f}, max={scores.max():.4f}, mean={scores.mean():.4f}")
            return scores
        except Exception as ex:
            logger.exception(f"[_score_jobs_via_embeddings] Fallback cosine similarity also failed: {ex}")
            return np.zeros((0,), dtype=float)



# ---------------------------------------------------------------------------
# User / profile helpers
# ---------------------------------------------------------------------------
def _get_user_context(user_id):
    user = User.query.get(user_id)
    if not user:
        return None, None
    infor = _get_infor_for_user(user)
    return user, infor

def _get_infor_for_user(user):
    if not user:
        return None
    infor = None
    if user.id is not None:
        infor = InforUser.query.get(user.id)
    if not infor and user.username:
        infor = InforUser.query.filter_by(username=user.username).first()
    # Do not attempt to set non-existent `user_id` field; prefer id matching.
    return infor

def _get_profile_missing_fields(infor):
    if not infor:
        return ['location', 'desired_job', 'experience']
    missing = []
    if not (infor.workplace_desired or '').strip():
        missing.append('location')
    if not (infor.desired_job or '').strip():
        missing.append('desired_job')
    if not (infor.experience or '').strip():
        missing.append('experience')
    return missing

def _profile_debug_snapshot(infor):
    if not infor:
        return {"exists": False}
    return {
        "exists": True,
        "id": infor.id,
        "username": infor.username,
        "workplace_desired": infor.workplace_desired,
        "desired_job": infor.desired_job,
        "experience": infor.experience,
        "exp_min": infor.exp_min,
        "exp_max": infor.exp_max,
        "skills": infor.skills,
        "age": infor.age,
        "gender": infor.gender,
        "degree": infor.degree,
        "marriage": infor.marriage,
        "avatar_path": infor.avatar_path,
        "phone": infor.phone,
        "target": infor.target,
    }

def _is_profile_complete(infor):
    return len(_get_profile_missing_fields(infor)) == 0

def _save_avatar_file(avatar_file, username):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    original_name = secure_filename(avatar_file.filename or 'avatar')
    _, extension = os.path.splitext(original_name)
    filename = f"{username}_{datetime.now().strftime('%Y%m%d%H%M%S')}{extension or '.png'}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    avatar_file.save(file_path)
    return f"/uploads/{filename}"

def _find_or_create_infor_by_username(username, user_id=None):
    infor = None
    if user_id:
        infor = InforUser.query.get(user_id)
    if not infor:
        infor = InforUser.query.filter_by(username=username).first()
    if not infor:
        # Create a new InforUser; do not set primary key here.
        infor = InforUser(username=username)
        db.session.add(infor)
    else:
        # If an infor exists and user_id provided but different, leave as-is.
        if username and not (infor.username or '').strip():
            infor.username = username
    return infor

def _extract_experience_range_and_skills(experiences):
    years = []
    skills = []
    for i, exp in enumerate(experiences):
        start_date = exp.get('startDate')
        end_date   = exp.get('endDate')
        logger.debug(f"[_extract_experience_range_and_skills] exp {i}: start={start_date}, end={end_date}")

        if isinstance(start_date, str) and len(start_date) >= 4 and start_date[:4].isdigit():
            years.append(int(start_date[:4]))

        if end_date == 'Hiện tại':
            years.append(datetime.now().year)
        elif isinstance(end_date, str) and len(end_date) >= 4 and end_date[:4].isdigit():
            years.append(int(end_date[:4]))

        for skill in (exp.get('skills') or []):
            if isinstance(skill, str) and skill.strip():
                skills.append(skill.strip())

    unique_skills = list(dict.fromkeys(skills))
    exp_min = str(min(years)) if years else None
    exp_max = str(max(years)) if years else None
    return exp_min, exp_max, unique_skills

def _normalize_text(value):
    if value is None:
        return ''
    text = unicodedata.normalize('NFKD', str(value).lower())
    text = text.encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^a-z0-9]+', ' ', text).strip()

def _format_salary(job):
    salary_min = (getattr(job, 'salary_min', '') or '').strip() if isinstance(getattr(job, 'salary_min', ''), str) else getattr(job, 'salary_min', '')
    salary_max = (getattr(job, 'salary_max', '') or '').strip() if isinstance(getattr(job, 'salary_max', ''), str) else getattr(job, 'salary_max', '')
    if salary_min and salary_max:
        return f'{salary_min} - {salary_max}'
    return salary_min or salary_max or 'Thoả thuận'

def _job_logo_seed(job):
    return getattr(job, 'company_name', None) or getattr(job, 'job_title', None) or str(getattr(job, 'id', ''))

def _serialize_job(job, score=None):
    payload = {
        'id': job.id,
        'title': job.job_title,
        'company': job.company_name,
        'location': job.job_address,
        'job_detail_address': getattr(job, 'job_detail_address', None),
        'benefits': getattr(job, 'benefits', None),
        'salary': _format_salary(job),
        'logo': f"https://api.dicebear.com/7.x/icons/svg?seed={_normalize_text(_job_logo_seed(job)).replace(' ', '-') or job.id}",
        'deadline': job.deadline.isoformat() if job.deadline else None,
        'employmentType': getattr(job, 'employment_type', None),
        'jobFunction': getattr(job, 'job_function', None),
        'industries': getattr(job, 'industries', None),
        'description': getattr(job, 'job_description', None),
        'requirement': getattr(job, 'job_requirement', None),
    }
    if score is not None:
        payload['matchScore'] = round(float(score), 2)
    return payload

def _deserialize_recommendations_cache(cached_value):
    if not cached_value:
        return None
    try:
        recommendations = json.loads(cached_value)
    except (TypeError, ValueError):
        return None
    return recommendations if isinstance(recommendations, list) else None

def _save_recommendations_cache(user, recommendations):
    user.recommendations = json.dumps(recommendations, ensure_ascii=False)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

def _clear_recommendations_cache(user):
    user.recommendations = None

# ---------------------------------------------------------------------------
# Routes — users (legacy public GET only)
# ---------------------------------------------------------------------------
@main.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{"id": u.id, "username": u.username, "email": u.email} for u in users])

# ---------------------------------------------------------------------------
# Routes — jobs
# ---------------------------------------------------------------------------
@main.route('/jobs', methods=['GET'])
def get_jobs():
    page            = request.args.get('page', 1, type=int)
    per_page        = request.args.get('per_page', 12, type=int)
    search          = request.args.get('search', '', type=str)
    location        = request.args.get('location', '', type=str)
    salary_min      = request.args.get('salary_min', None)
    salary_max      = request.args.get('salary_max', None)
    employment_type = request.args.get('employment_type', '', type=str)
    industries      = request.args.get('industries', '', type=str)
    exp_min         = request.args.get('exp_min', None)

    query = Job.query.order_by(Job.deadline.desc(), Job.id.desc())

    if search:
        query = query.filter(
            (Job.job_title.ilike(f'%{search}%')) | (Job.company_name.ilike(f'%{search}%'))
        )
    if location:
        query = query.filter(Job.job_address.ilike(f'%{location}%'))
    if salary_min:
        try:
            query = query.filter(Job.salary_min >= int(salary_min))
        except (ValueError, TypeError):
            pass
    if salary_max:
        try:
            query = query.filter(Job.salary_max <= int(salary_max))
        except (ValueError, TypeError):
            pass
    if employment_type:
        query = query.filter(Job.employment_type.ilike(f'%{employment_type}%'))
    if industries:
        tokens = [t.strip() for t in re.split(r'\W+', industries) if t.strip()]
        for tok in tokens:
            pattern = f'%{tok}%'
            query = query.filter(
                Job.industries.ilike(pattern) |
                Job.job_title.ilike(pattern) |
                Job.job_description.ilike(pattern)
            )
    if exp_min:
        try:
            query = query.filter(Job.exp_min <= int(exp_min))
        except (ValueError, TypeError):
            pass

    pagination = query.paginate(page=page, per_page=per_page)
    jobs = [{
        "id": job.id, "job_title": job.job_title,
        "company_name": job.company_name, "salary_min": job.salary_min,
        "salary_max": job.salary_max, "job_address": job.job_address,
        "deadline": job.deadline.isoformat() if job.deadline else None,
        "exp_min": job.exp_min, "exp_max": job.exp_max, "benefits": job.benefits,
        "employment_type": job.employment_type, "job_function": job.job_function,
        "industries": job.industries, "job_description": job.job_description,
        "job_requirement": job.job_requirement,
    } for job in pagination.items]

    return jsonify({
        "jobs": jobs, "total": pagination.total,
        "pages": pagination.pages, "current_page": page,
    })

@main.route('/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify({
        **_serialize_job(job),
        "salary_min": job.salary_min, "salary_max": job.salary_max,
        "exp_min": job.exp_min, "exp_max": job.exp_max, "benefits": job.benefits,
    })

@main.route('/companies', methods=['GET'])
def get_companies():
    """
    Get list of companies with filtering
    Query parameters:
    - page: page number (default: 1)
    - per_page: items per page (default: 12)
    - search: search by company name
    - industry: filter by industry
    - location: filter by location/address
    - sort: sort by ('hiring' = most job openings, 'newest' = recently created)
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    search = request.args.get('search', '', type=str)
    industry = request.args.get('industry', '', type=str)
    location = request.args.get('location', '', type=str)
    sort = request.args.get('sort', 'newest', type=str)

    # Base query: active employers only
    query = Employer.query.filter(Employer.is_active == True)

    # Apply filters
    if search:
        query = query.filter(Employer.company_name.ilike(f'%{search}%'))
    if industry:
        query = query.filter(Employer.industry.ilike(f'%{industry}%'))
    if location:
        query = query.filter(Employer.address.ilike(f'%{location}%'))

    # Apply sorting
    if sort == 'hiring':
        # Sort by number of active job openings (most to least)
        query = query.outerjoin(Job).filter(
            (Job.is_active == True) | (Job.id == None)
        ).group_by(Employer.id).order_by(db.func.count(Job.id).desc())
    else:  # default: 'newest'
        query = query.order_by(Employer.created_at.desc())

    # Paginate
    pagination = query.paginate(page=page, per_page=per_page)

    # Serialize companies with job count
    companies = []
    for employer in pagination.items:
        # Count active jobs for this employer
        job_count = Job.query.filter(
            Job.employer_id == employer.id,
            Job.is_active == True
        ).count()

        companies.append({
            "id": employer.id,
            "company_name": employer.company_name,
            "industry": employer.industry,
            "address": employer.address,
            "description": employer.description,
            "logo_path": employer.logo_path,
            "website": employer.website,
            "email": employer.email,
            "phone": employer.phone,
            "job_count": job_count,
            "created_at": employer.created_at.isoformat() if employer.created_at else None,
        })

    return jsonify({
        "companies": companies,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    })

# Recommendations endpoint moved to routes_seeker.py: GET /seeker/recommendations

# ---------------------------------------------------------------------------
# Routes — user profile
# ---------------------------------------------------------------------------
@main.route('/user-profile/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    infor = _get_infor_for_user(user)
    if not infor:
        return jsonify({"error": "User profile not found"}), 404

    missing_fields = _get_profile_missing_fields(infor)

    try:
        experience_value = json.loads(infor.experience) if infor.experience else []
    except Exception:
        experience_value = infor.experience

    return jsonify({
        "fullName": user.username,
        "email": user.email,
        "avatar_path": infor.avatar_path,
        "phone": infor.phone,
        "location": infor.workplace_desired,
        "bio": infor.target,
        "experience": experience_value,
        "position": infor.desired_job,
        "skills": infor.skills,
        "exp_min": infor.exp_min,
        "exp_max": infor.exp_max,
        "age": infor.age,
        "gender": infor.gender,
        "marriage": infor.marriage,
        "degree": infor.degree,
        "username": infor.username,
        "profile_complete": len(missing_fields) == 0,
        "profile_missing_fields": missing_fields,
    })

# ---------------------------------------------------------------------------
# Routes — uploads / saved jobs
# ---------------------------------------------------------------------------
@main.route('/uploads/<path:filename>', methods=['GET'])
def uploaded_avatar(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@main.route('/logos/<path:filename>', methods=['GET'])
def uploaded_logo(filename):
    return send_from_directory(LOGOS_FOLDER, filename)

# Saved-jobs routes moved to routes_seeker.py: /seeker/saved-jobs (GET, POST, DELETE)

# Admin routes moved to routes_admin.py: /admin/embedding-status