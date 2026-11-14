"""
Inference / serving for the job-recommendation model (B4 = B3 + rerank).

Loads the trained B3 model, builds job/user embeddings once, and exposes
recommendation that scores the full corpus then applies hard-constraint
filtering + multi-criteria re-ranking.

Usage:
    from ml import serve
    recs = serve.recommend_by_user_id(user_id=123, top_k=20)
    recs = serve.recommend_by_profile({"state": "CA", "degree": "bachelor",
                                       "exp_max": 5, "salary_min": 80000, ...}, top_k=20)
"""

from __future__ import annotations

import os
import pickle
from typing import Dict, List

import numpy as np
import pandas as pd
import torch

from . import dataset as D
from . import features as FE
from . import models as M
from . import rerank as R

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROC_DIR = os.path.join(BASE_DIR, "data", "processed")
MODEL_PATH = os.path.join(PROC_DIR, "models", "B3.pt")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_cache: Dict = {}


def _load_all():
    if "jobs" in _cache:
        return _cache
    jobs, users, applies, graph, splits = FE.load_all()
    with open(os.path.join(PROC_DIR, "feature_artifacts.pkl"), "rb") as f:
        artifacts = pickle.load(f)

    feats = FE.build_features(jobs, users)
    node_feat_dims = {"user": feats["X_user"].shape[1], "job": feats["X_job"].shape[1]}
    for k, v in feats["attr_feat"].items():
        node_feat_dims[k] = v.shape[1]
    edge_types = list(graph.edge_types)

    model = M.build_model("B3", node_feat_dims, edge_types).to(device)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device, weights_only=False))
    model.encoder.set_p_u(graph["user"].p_u.to(device))
    model.eval()

    x_dict = {"user": torch.tensor(feats["X_user"], dtype=torch.float32, device=device),
              "job": torch.tensor(feats["X_job"], dtype=torch.float32, device=device)}
    for k, v in feats["attr_feat"].items():
        x_dict[k] = torch.tensor(v, dtype=torch.float32, device=device)

    edge_index_dict = {et: graph[et].edge_index.to(device) for et in edge_types}
    edge_attr_dict = {}
    if "edge_attr" in graph["user", "applies", "job"]:
        edge_attr_dict[("user", "applies", "job")] = graph["user", "applies", "job"].edge_attr.to(device)

    with torch.no_grad():
        z = model.encode(x_dict, edge_index_dict, edge_attr_dict)
    z_user = z["user"]
    z_job = z["job"]

    ja = R.prepare_job_arrays(jobs)
    _cache.update(dict(jobs=jobs, users=users, applies=applies, graph=graph,
                       model=model, feats=feats, artifacts=artifacts, ja=ja,
                       z_user=z_user, z_job=z_job))
    return _cache


def _score_for_embedding(zu: torch.Tensor, c) -> np.ndarray:
    n_jobs = c["z_job"].shape[0]
    ui = torch.zeros(n_jobs, dtype=torch.long, device=device)
    ji = torch.arange(n_jobs, device=device)
    with torch.no_grad():
        scores = c["model"].decoder(zu.unsqueeze(0).expand(n_jobs, -1), c["z_job"],
                                    torch.stack([ui, ji])).sigmoid().cpu().numpy()
    return scores


def _rank(c, scores: np.ndarray, urow: pd.Series, top_k: int, apply_rerank: bool):
    n_jobs = len(scores)
    job_ids = np.arange(n_jobs)
    if apply_rerank:
        keep = R.hard_filter(c["ja"], urow, job_ids)
        if len(keep) == 0:
            keep = job_ids
        reranked = R.rerank_scores(c["ja"], scores[keep], keep, urow)
        order = np.argsort(reranked)[::-1]
        top_ids = keep[order][:top_k]
    else:
        order = np.argsort(scores)[::-1]
        top_ids = job_ids[order][:top_k]
    return top_ids


def recommend_by_user_id(user_id: int, top_k: int = 20, apply_rerank: bool = True) -> List[Dict]:
    c = _load_all()
    u = int(user_id)
    urow = c["users"].iloc[u]
    scores = _score_for_embedding(c["z_user"][u], c)
    top_ids = _rank(c, scores, urow, top_k, apply_rerank)
    out = []
    jobs = c["jobs"]
    for j in top_ids:
        jr = jobs.iloc[int(j)]
        out.append({
            "job_id": int(j),
            "title": str(jr["title"]),
            "company": str(jr.get("company", "LinkedIn")),
            "state": str(jr["state"]),
            "salary_min": (None if pd.isna(jr["salary_min"]) else float(jr["salary_min"])),
            "salary_max": (None if pd.isna(jr["salary_max"]) else float(jr["salary_max"])),
            "exp_bucket": str(jr["exp_bucket"]),
            "degree_req": str(jr["degree_req"]),
            "industry": str(jr["industry"]),
            "score": round(float(scores[int(j)]), 4),
        })
    return out


def recommend_by_profile(profile: Dict, top_k: int = 20, apply_rerank: bool = True) -> List[Dict]:
    """Cold-start recommendation from an explicit seeker profile."""
    c = _load_all()
    # build a synthetic user row with the same column layout as users.csv
    urow = pd.Series({
        "state": profile.get("state", "National"),
        "degree": profile.get("degree", "any"),
        "exp_min": int(profile.get("exp_min", 0)),
        "exp_max": int(profile.get("exp_max", 0)),
        "salary_min": float(profile.get("salary_min", 40000)),
        "salary_max": float(profile.get("salary_max", 60000)),
        "industry": profile.get("industry", "Other"),
        "willing_relocate": bool(profile.get("willing_relocate", False)),
    }, dtype=object)
    zu = _encode_profile(urow, c)
    scores = _score_for_embedding(zu, c)
    top_ids = _rank(c, scores, urow, top_k, apply_rerank)
    out = []
    jobs = c["jobs"]
    for j in top_ids:
        jr = jobs.iloc[int(j)]
        out.append({
            "job_id": int(j),
            "title": str(jr["title"]),
            "company": str(jr.get("company", "LinkedIn")),
            "state": str(jr["state"]),
            "salary_min": (None if pd.isna(jr["salary_min"]) else float(jr["salary_min"])),
            "salary_max": (None if pd.isna(jr["salary_max"]) else float(jr["salary_max"])),
            "exp_bucket": str(jr["exp_bucket"]),
            "degree_req": str(jr["degree_req"]),
            "industry": str(jr["industry"]),
            "score": round(float(scores[int(j)]), 4),
        })
    return out


def _encode_profile(urow: pd.Series, c) -> torch.Tensor:
    """Build feature vector for a cold-start user and encode through linear layers."""
    feats, artifacts = c["feats"], c["artifacts"]
    encs, scaler = artifacts["encs"], artifacts["scaler_user"]
    tfidf = artifacts["tfidf"]

    text = FE.user_text(urow)
    text_emb = tfidf.transform([text]).toarray().astype(np.float32)

    num_raw = np.array([[urow["exp_min"], urow["exp_max"], urow["salary_min"], urow["salary_max"]]],
                       dtype=np.float32)
    num = scaler.transform(num_raw).astype(np.float32)

    def enc(le, val, default):
        return le.transform([val if val in set(le.classes_) else default])[0]

    cat = np.array([[
        enc(encs["le_deg"], urow["degree"], "any"),
        enc(encs["le_exp"], D.exp_bucket_from_years(int(urow["exp_min"]), int(urow["exp_max"])), "any"),
        enc(encs["le_ind"], urow["industry"], "Other"),
        enc(encs["le_loc"], urow["state"], "National"),
        enc(encs["le_reloc"], 1 if urow["willing_relocate"] else 0, 0),
    ]], dtype=np.float32)

    x = np.hstack([num, cat, text_emb]).astype(np.float32)
    xt = torch.tensor(x, dtype=torch.float32, device=device)
    model = c["model"]
    with torch.no_grad():
        h = torch.relu(model.encoder.proj["user"](xt))
        z = model.encoder.out_proj["user"](h)
    return z.squeeze(0)


if __name__ == "__main__":
    c = _load_all()
    print("Loaded. users", len(c["users"]), "jobs", len(c["jobs"]))
    print(recommend_by_user_id(0, top_k=10))
