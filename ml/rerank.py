"""
Constraint filtering + multi-criteria re-ranking + violation-rate measurement.

All functions are vectorized over job indices using pre-computed numpy arrays
(see :func:`prepare_job_arrays`) to keep full-corpus evaluation fast.

Hard constraints (filter out):
  - location : job.state not in {user.state, Remote, National} AND not willing_relocate
  - experience : job.exp_min > user.exp_max + 1

Soft constraints (penalty, not filter):
  - salary : job.salary_max < user.salary_min * 0.7   (pay too low)
  - degree : job.degree_rank > user.degree_rank

Re-rank score:
  score = w_gnn * s_gnn + sum_k lambda_k * phi_k - penalty
"""

from __future__ import annotations

from typing import Dict

import numpy as np
import pandas as pd

from . import dataset as D

DEFAULT_WEIGHTS = {
    "gnn": 1.0,
    "location": 0.30,
    "experience": 0.25,
    "salary": 0.20,
    "degree": 0.15,
}

REMOTE_OR_NATIONAL = {"Remote", "National"}


def prepare_job_arrays(jobs: pd.DataFrame) -> Dict[str, np.ndarray]:
    return {
        "state": jobs["state"].values.astype(str),
        "exp_min": jobs["exp_min"].values.astype(float),
        "salary_min": jobs["salary_min"].values.astype(float),  # NaN == negotiable
        "salary_max": jobs["salary_max"].values.astype(float),
        "degree_rank": np.array([D.DEGREE_RANK.get(str(d), -1) for d in jobs["degree_req"].values],
                                dtype=float),
    }


def violations(ja: Dict[str, np.ndarray], u: pd.Series, job_ids: np.ndarray) -> Dict[str, np.ndarray]:
    """Return per-constraint boolean arrays (True == violation)."""
    ids = np.asarray(job_ids, dtype=int)
    state = ja["state"][ids]
    same_state = (state == str(u["state"])) | np.isin(state, list(REMOTE_OR_NATIONAL))
    if bool(u["willing_relocate"]):
        loc_viol = np.zeros(len(ids), dtype=bool)
    else:
        loc_viol = ~same_state

    exp_viol = ja["exp_min"][ids] > float(u["exp_max"]) + 1.0

    sal_lo = ja["salary_min"][ids]
    sal_hi = ja["salary_max"][ids]
    has_sal = ~(np.isnan(sal_lo) & np.isnan(sal_hi))
    sal_viol = has_sal & (np.nan_to_num(sal_hi, nan=0.0) < float(u["salary_min"]) * 0.7)

    deg_viol = ja["degree_rank"][ids] > float(D.DEGREE_RANK.get(str(u["degree"]), -1))

    return {"location": loc_viol, "experience": exp_viol,
            "salary": sal_viol, "degree": deg_viol}


def hard_violated(ja: Dict[str, np.ndarray], u: pd.Series, job_ids: np.ndarray) -> np.ndarray:
    v = violations(ja, u, job_ids)
    return v["location"] | v["experience"]


def hard_filter(ja: Dict[str, np.ndarray], u: pd.Series, job_ids: np.ndarray) -> np.ndarray:
    ids = np.asarray(job_ids, dtype=int)
    keep = ~hard_violated(ja, u, ids)
    return ids[keep]


def rerank_scores(ja: Dict[str, np.ndarray], gnn_scores: np.ndarray, job_ids: np.ndarray,
                  u: pd.Series, weights: Dict[str, float] = None) -> np.ndarray:
    w = {**DEFAULT_WEIGHTS, **(weights or {})}
    ids = np.asarray(job_ids, dtype=int)
    v = violations(ja, u, ids)
    bonus = (w["location"] * (~v["location"])
             + w["experience"] * (~v["experience"])
             + w["salary"] * (~v["salary"])
             + w["degree"] * (~v["degree"]))
    penalty = (v["location"] | v["experience"]).astype(float) * 1.0
    return w["gnn"] * np.asarray(gnn_scores, dtype=float) + bonus - penalty


def violation_rate(ja: Dict[str, np.ndarray], u: pd.Series, top_k_ids: np.ndarray) -> float:
    ids = np.asarray(top_k_ids, dtype=int)
    if len(ids) == 0:
        return 0.0
    v = violations(ja, u, ids)
    any_viol = v["location"] | v["experience"] | v["salary"] | v["degree"]
    return float(any_viol.mean())


def violation_breakdown(ja: Dict[str, np.ndarray], u: pd.Series, top_k_ids: np.ndarray) -> Dict[str, float]:
    ids = np.asarray(top_k_ids, dtype=int)
    if len(ids) == 0:
        return {"location": 0.0, "experience": 0.0, "salary": 0.0, "degree": 0.0}
    v = violations(ja, u, ids)
    return {k: float(arr.mean()) for k, arr in v.items()}
