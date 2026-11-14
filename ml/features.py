"""
Feature engineering for the Vietnamese job-recommendation heterogeneous graph.

Builds, for every node type, an input feature matrix and saves the fitted
TF-IDF / label encoders / scalers so the serving pipeline can reuse them.

  X_user : numeric(4) + categorical(5) + tfidf(256)  -> 265
  X_job  : numeric(4) + categorical(5) + tfidf(256)  -> 265

Attribute nodes (experience / location / salary / degree) get one-hot identity
features (learned through a Linear projection inside the GNN / Transformer encoder).
"""

from __future__ import annotations

import os
import pickle
from typing import Dict, Tuple

import numpy as np
import pandas as pd
import torch
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder, RobustScaler

from . import dataset as D

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROC_DIR = os.path.join(BASE_DIR, "data", "processed")


def get_user_text(row: pd.Series) -> str:
    summary = str(row.get("target_summary") or "")
    if summary == "nan":
        summary = ""
    parts = [
        str(row.get("desired_job") or ""),
        str(row.get("industry") or ""),
        str(row.get("province") or ""),
        str(row.get("degree") or ""),
        str(row.get("skills") or ""),
        summary
    ]
    return " ".join([p for p in parts if p]).lower()


def get_job_text(row: pd.Series) -> str:
    desc = str(row.get("job_description") or "")
    if desc == "nan":
        desc = ""
    parts = [
        str(row.get("job_title") or ""),
        str(row.get("industry") or ""),
        str(row.get("province") or ""),
        str(row.get("degree") or ""),
        str(row.get("skills") or ""),
        desc[:400]
    ]
    return " ".join([p for p in parts if p]).lower()


def _fit_encoders(jobs: pd.DataFrame, users: pd.DataFrame):
    loc_vocab = D.build_location_vocab(jobs, users)
    le_deg = LabelEncoder().fit(list(D.DEGREE_LEVELS))
    le_exp = LabelEncoder().fit(list(D.EXP_BUCKETS))
    all_inds = sorted(list(set(jobs["industry"].dropna().unique()) | set(users["industry"].dropna().unique())))
    le_ind = LabelEncoder().fit(all_inds if all_inds else ["Ngành nghề khác"])
    le_loc = LabelEncoder().fit(list(loc_vocab.keys()))
    all_emps = sorted(list(set(jobs["employment_type"].dropna().unique()) | set(users["employment_type"].dropna().unique())))
    le_emp = LabelEncoder().fit(all_emps if all_emps else ["Toàn thời gian"])
    le_reloc = LabelEncoder().fit([0, 1])

    return {
        "le_deg": le_deg, "le_exp": le_exp, "le_ind": le_ind,
        "le_loc": le_loc, "le_emp": le_emp, "le_reloc": le_reloc,
    }


def _safe_transform(le: LabelEncoder, vals, default_class: str):
    classes = set(le.classes_)
    fallback = default_class if default_class in classes else list(classes)[0]
    return le.transform([v if v in classes else fallback for v in vals])


def build_features(jobs: pd.DataFrame, users: pd.DataFrame) -> Dict:
    print("Fitting feature encoders and TF-IDF...")
    encs = _fit_encoders(jobs, users)

    # 1. Text TF-IDF (256 dims)
    print("Computing TF-IDF on job and user texts...")
    desc_series = jobs["job_description"].fillna("").astype(str).str[:400]
    job_texts = (
        jobs["job_title"].fillna("").astype(str) + " " +
        jobs["industry"].fillna("").astype(str) + " " +
        jobs["province"].fillna("").astype(str) + " " +
        jobs["degree"].fillna("").astype(str) + " " +
        jobs["skills"].fillna("").astype(str) + " " +
        desc_series
    ).str.lower().tolist()

    user_texts = (
        users["desired_job"].fillna("").astype(str) + " " +
        users["industry"].fillna("").astype(str) + " " +
        users["province"].fillna("").astype(str) + " " +
        users["degree"].fillna("").astype(str) + " " +
        users["skills"].fillna("").astype(str) + " " +
        users["target_summary"].fillna("").astype(str)
    ).str.lower().tolist()

    tfidf = TfidfVectorizer(max_features=256, ngram_range=(1, 2), sublinear_tf=True,
                            min_df=2, max_df=0.95)
    tfidf.fit(job_texts + user_texts)
    job_tfidf = tfidf.transform(job_texts).toarray().astype(np.float32)
    user_tfidf = tfidf.transform(user_texts).toarray().astype(np.float32)

    # 2. Numeric features (4 dims)
    print("Scaling numeric features...")
    job_num_raw = jobs[["salary_min", "salary_max", "exp_min", "exp_max"]].fillna(0).values.astype(float)
    scaler_job = RobustScaler().fit(job_num_raw)
    job_num = scaler_job.transform(job_num_raw).astype(np.float32)

    user_num_raw = users[["salary_min", "salary_max", "exp_min", "exp_max"]].fillna(0).values.astype(float)
    scaler_user = RobustScaler().fit(user_num_raw)
    user_num = scaler_user.transform(user_num_raw).astype(np.float32)

    # 3. Categorical features (5 dims)
    print("Encoding categorical features...")
    job_cat = np.column_stack([
        _safe_transform(encs["le_deg"], jobs["degree"].fillna("Không yêu cầu"), "Không yêu cầu"),
        _safe_transform(encs["le_exp"], jobs["exp_bucket"].fillna("any"), "any"),
        _safe_transform(encs["le_ind"], jobs["industry"].fillna("Ngành nghề khác"), "Ngành nghề khác"),
        _safe_transform(encs["le_loc"], jobs["province"].fillna("Toàn quốc"), "Toàn quốc"),
        _safe_transform(encs["le_emp"], jobs["employment_type"].fillna("Toàn thời gian"), "Toàn thời gian"),
    ]).astype(np.float32)

    user_cat = np.column_stack([
        _safe_transform(encs["le_deg"], users["degree"].fillna("Đại học"), "Đại học"),
        _safe_transform(encs["le_exp"], users["exp_bucket"].fillna("0"), "0"),
        _safe_transform(encs["le_ind"], users["industry"].fillna("Ngành nghề khác"), "Ngành nghề khác"),
        _safe_transform(encs["le_loc"], users["province"].fillna("Toàn quốc"), "Toàn quốc"),
        _safe_transform(encs["le_reloc"], users["willing_relocate"].astype(int).fillna(0), 0),
    ]).astype(np.float32)

    # Final concatenated matrices
    X_job = np.hstack([job_num, job_cat, job_tfidf]).astype(np.float32)
    X_user = np.hstack([user_num, user_cat, user_tfidf]).astype(np.float32)

    # 4. Attribute nodes identity matrices
    loc_vocab = D.build_location_vocab(jobs, users)
    attr_feat = {
        "experience": np.eye(len(D.EXP_BUCKETS), dtype=np.float32),
        "location": np.eye(len(loc_vocab), dtype=np.float32),
        "salary": np.eye(len(D.SAL_BUCKETS), dtype=np.float32),
        "degree": np.eye(len(D.DEGREE_LEVELS), dtype=np.float32),
    }

    # Save artifacts for serving
    artifacts = {
        "tfidf": tfidf,
        "scaler_job": scaler_job,
        "scaler_user": scaler_user,
        "encoders": encs,
        "loc_vocab": loc_vocab,
        "dim_job": X_job.shape[1],
        "dim_user": X_user.shape[1],
    }
    with open(os.path.join(PROC_DIR, "feature_artifacts.pkl"), "wb") as f:
        pickle.dump(artifacts, f)
    print("Saved feature artifacts to feature_artifacts.pkl")

    return {
        "X_job": X_job,
        "X_user": X_user,
        "attr_feat": attr_feat,
    }


def load_all() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, HeteroData, Dict[str, HeteroData]]:
    jobs = pd.read_csv(os.path.join(PROC_DIR, "jobs.csv"), low_memory=False)
    users = pd.read_csv(os.path.join(PROC_DIR, "users.csv"), low_memory=False)
    applies = pd.read_csv(os.path.join(PROC_DIR, "applies.csv"), low_memory=False)
    graph = torch.load(os.path.join(PROC_DIR, "graph.pt"), weights_only=False)
    splits = torch.load(os.path.join(PROC_DIR, "splits.pt"), weights_only=False)
    return jobs, users, applies, graph, splits


def main():
    print("=" * 60)
    print("BUILDING NODE FEATURES FOR VIETNAMESE GRAPH")
    print("=" * 60)
    jobs = pd.read_csv(os.path.join(PROC_DIR, "jobs.csv"), low_memory=False)
    users = pd.read_csv(os.path.join(PROC_DIR, "users.csv"), low_memory=False)

    feats = build_features(jobs, users)
    print(f"X_job shape : {feats['X_job'].shape}")
    print(f"X_user shape: {feats['X_user'].shape}")
    for k, v in feats["attr_feat"].items():
        print(f"Attr '{k}' shape: {v.shape}")
    print("✅ Feature engineering complete!")


if __name__ == "__main__":
    main()
