"""
Feature engineering for the job-recommendation graph.

Builds, for every node type, an input feature matrix and saves the fitted
TF-IDF / label encoders / scalers so the serving pipeline can reuse them.

  X_user : numeric(4) + categorical(5) + tfidf(256)  -> 265
  X_job  : numeric(4) + categorical(5) + tfidf(256)  -> 265

Attribute nodes (experience / location / salary / degree) get one-hot identity
features (learned through a Linear projection inside the encoder).

Dynamic-weight inputs (user preference p_u and relation compatibility phi(u,j))
are computed in dataset.py and stored directly on the graph:
  graph["user"].p_u          : (n_users, 3)
  graph["user","applies","job"].edge_attr : (n_applies, 4)  = phi(u,j)
"""

from __future__ import annotations

import os
import pickle
from typing import Dict

import numpy as np
import pandas as pd
import torch
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import RobustScaler, LabelEncoder

from . import dataset as D

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROC_DIR = os.path.join(BASE_DIR, "data", "processed")


def user_text(row: pd.Series) -> str:
    return (f"{row.get('industry','')} {row.get('state','')} {row.get('degree','')} "
            f"{row.get('exp_max',0)} years experience").lower()


def _fit_encoders(jobs: pd.DataFrame, users: pd.DataFrame):
    le_deg = LabelEncoder().fit(list(D.DEGREE_LEVELS))
    le_exp = LabelEncoder().fit(list(D.EXP_BUCKETS))
    le_ind = LabelEncoder().fit(pd.concat([jobs["industry"], users["industry"]]).fillna("Other").unique())
    le_loc = LabelEncoder().fit(list(D._location_vocab().keys()))
    le_emp = LabelEncoder().fit(jobs["employment_type"].fillna("Full-time").unique())
    le_reloc = LabelEncoder().fit([0, 1])
    return {
        "le_deg": le_deg, "le_exp": le_exp, "le_ind": le_ind,
        "le_loc": le_loc, "le_emp": le_emp, "le_reloc": le_reloc,
    }


def _safe_transform(le: LabelEncoder, vals, default: str):
    classes = set(le.classes_)
    return le.transform([v if v in classes else default for v in vals])


def build_features(jobs: pd.DataFrame, users: pd.DataFrame) -> Dict:
    encs = _fit_encoders(jobs, users)

    # ---- text TF-IDF ----
    job_text = jobs["job_text"].fillna("").tolist()
    u_text = users.apply(user_text, axis=1).tolist()
    tfidf = TfidfVectorizer(max_features=256, ngram_range=(1, 2), sublinear_tf=True,
                            min_df=3, max_df=0.9)
    tfidf.fit(job_text + u_text)
    job_tfidf = tfidf.transform(job_text).toarray().astype(np.float32)
    user_tfidf = tfidf.transform(u_text).toarray().astype(np.float32)

    # ---- job numeric ----
    job_num_raw = jobs[["salary_min", "salary_max", "exp_min", "exp_max"]].fillna(0).values
    scaler_job = RobustScaler().fit(job_num_raw)
    job_num = scaler_job.transform(job_num_raw).astype(np.float32)

    # ---- user numeric ----
    user_num_raw = users[["exp_min", "exp_max", "salary_min", "salary_max"]].fillna(0).values
    scaler_user = RobustScaler().fit(user_num_raw)
    user_num = scaler_user.transform(user_num_raw).astype(np.float32)

    # ---- job categorical ----
    job_cat = np.column_stack([
        _safe_transform(encs["le_deg"], jobs["degree_req"].fillna("any"), "any"),
        _safe_transform(encs["le_exp"], jobs["exp_bucket"].fillna("any"), "any"),
        _safe_transform(encs["le_ind"], jobs["industry"].fillna("Other"), "Other"),
        _safe_transform(encs["le_loc"], jobs["state"].fillna("National"), "National"),
        _safe_transform(encs["le_emp"], jobs["employment_type"].fillna("Full-time"), "Full-time"),
    ]).astype(np.float32)

    # ---- user categorical ----
    user_cat = np.column_stack([
        _safe_transform(encs["le_deg"], users["degree"].fillna("any"), "any"),
        _safe_transform(encs["le_exp"], users["exp_bucket"].fillna("any"), "any"),
        _safe_transform(encs["le_ind"], users["industry"].fillna("Other"), "Other"),
        _safe_transform(encs["le_loc"], users["state"].fillna("National"), "National"),
        _safe_transform(encs["le_reloc"], users["willing_relocate"].astype(int).fillna(0), 0),
    ]).astype(np.float32)

    X_job = np.hstack([job_num, job_cat, job_tfidf]).astype(np.float32)
    X_user = np.hstack([user_num, user_cat, user_tfidf]).astype(np.float32)
    print(f"X_user {X_user.shape} | X_job {X_job.shape}")

    # ---- attribute node features (identity one-hot) ----
    n_exp = len(D.EXP_BUCKETS)
    n_sal = len(D.SAL_BUCKETS)
    n_deg = len(D.DEGREE_LEVELS)
    n_loc = len(D._location_vocab())
    attr_feat = {
        "experience": np.eye(n_exp, dtype=np.float32),
        "salary": np.eye(n_sal, dtype=np.float32),
        "degree": np.eye(n_deg, dtype=np.float32),
        "location": np.eye(n_loc, dtype=np.float32),
    }

    artifacts = {
        "tfidf": tfidf,
        "encs": encs,
        "scaler_job": scaler_job,
        "scaler_user": scaler_user,
    }
    with open(os.path.join(PROC_DIR, "feature_artifacts.pkl"), "wb") as f:
        pickle.dump(artifacts, f)

    return {
        "X_user": X_user,
        "X_job": X_job,
        "attr_feat": attr_feat,
        "artifacts": artifacts,
    }


def load_all():
    jobs = pd.read_csv(os.path.join(PROC_DIR, "jobs.csv"))
    users = pd.read_csv(os.path.join(PROC_DIR, "users.csv"))
    applies = pd.read_csv(os.path.join(PROC_DIR, "applies.csv"))
    graph = torch.load(os.path.join(PROC_DIR, "graph.pt"), weights_only=False)
    splits = torch.load(os.path.join(PROC_DIR, "splits.pt"), weights_only=False)
    return jobs, users, applies, graph, splits


if __name__ == "__main__":
    jobs, users, applies, graph, splits = load_all()
    feats = build_features(jobs, users)
    print("attr feats:", {k: v.shape for k, v in feats["attr_feat"].items()})
    print("p_u", graph["user"].p_u.shape, "phi", graph["user", "applies", "job"].edge_attr.shape)
