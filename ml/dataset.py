"""
Dataset builder for the heterogeneous job-recommendation graph.

Produces, from the raw LinkedIn job postings:
  1. processed/jobs.csv      - cleaned jobs (state, annualized salary, exp bucket, degree req, industry)
  2. processed/users.csv     - synthesized job seekers
  3. processed/applies.csv   - (user, job) positive interactions
  4. processed/graph.pt      - PyG HeteroData with 6 node types
  5. processed/splits.pt     - train/val/test HeteroData (with hard negatives)

Node types: user, job, experience, location, salary, degree
Edge types (user<->job target):
  ('user','applies','job')  (+ reverse 'rev_applies')
Attribute edges:
  ('user','has_exp','experience'),  ('job','requires_exp','experience')
  ('user','prefers_loc','location'),('job','located_in','location')
  ('user','expects_sal','salary'),  ('job','offers_sal','salary')
  ('user','holds_degree','degree'), ('job','requires_degree','degree')
Attribute adjacency (attribute nodes -> attribute nodes):
  experience-experience (adjacent buckets), location-location (same region),
  salary-salary (adjacent buckets), degree-degree (ordered levels)
"""

from __future__ import annotations

import json
import os
import re
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
import torch
from torch_geometric.data import HeteroData

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
PROC_DIR = os.path.join(BASE_DIR, "data", "processed")
os.makedirs(PROC_DIR, exist_ok=True)

RAW_JOBS = os.path.join(RAW_DIR, "job_postings.csv")

SEED = 42
rng = np.random.default_rng(SEED)

# ---------------------------------------------------------------------------
# Buckets / vocab
# ---------------------------------------------------------------------------
EXP_BUCKETS = ["0", "1-2", "3-5", "6-10", "10+", "any"]
SAL_BUCKETS = ["<40k", "40-60k", "60-80k", "80-120k", "120k+", "negotiable"]
DEGREE_LEVELS = ["highschool", "associate", "bachelor", "master", "phd", "any"]
# Rank for ordered comparison (higher == more qualified)
DEGREE_RANK = {"highschool": 0, "associate": 1, "bachelor": 2, "master": 3, "phd": 4, "any": -1}

US_STATES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
    "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
    "DC": "District of Columbia",
}
STATE_ABBREV = {v: k for k, v in US_STATES.items()}
# Census regions for location-location adjacency
US_REGIONS = {
    "Northeast": ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA"],
    "Midwest": ["OH", "MI", "IN", "IL", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"],
    "South": ["DE", "MD", "DC", "VA", "WV", "NC", "SC", "GA", "FL", "KY", "TN", "AL", "MS",
              "AR", "LA", "OK", "TX"],
    "West": ["MT", "ID", "WY", "CO", "NM", "AZ", "UT", "NV", "WA", "OR", "CA", "AK", "HI"],
}
STATE_REGION = {st: r for r, sts in US_REGIONS.items() for st in sts}

# Experience level -> (min, max) years
EXP_LEVEL_YEARS = {
    "Internship": (0, 0),
    "Entry level": (0, 2),
    "Associate": (2, 5),
    "Mid-Senior level": (3, 8),
    "Director": (7, 15),
    "Executive": (10, 25),
}

# Industry classifier (coarse, keyword based on job title)
INDUSTRY_KEYWORDS = [
    ("Technology / IT", ["software", "engineer", "developer", "data", "devops", "cloud", "it ", "network",
                         "security", "scientist", "analyst", "frontend", "backend", "full stack", "ml ", "ai ",
                         "system", "database", "cyber", "web", "ux", "product"]),
    ("Healthcare", ["nurse", "medical", "health", "clinic", "therapist", "pharmac", "physician", "dental",
                    "caregiver", "patient", "clinical", "counsel", "respiratory", "hospital"]),
    ("Finance / Banking", ["finance", "account", "bank", "audit", "tax", "insurance", "loan", "credit",
                           "investment", "underwrit", "treasury", "payroll", "controller", "bookkeep"]),
    ("Retail / Sales", ["sales", "retail", "store", "merchand", "cashier", "customer service", "account manager",
                        "business development", "associate", "territory"]),
    ("Manufacturing / Engineering", ["manufactur", "mechanic", "electric", "technician", "machin", "welder",
                                     "engineer", "quality", "production", "operator", "maintenance", "assembl"]),
    ("Education", ["teacher", "professor", "instructor", "tutor", "education", "school", "faculty", "academic",
                   "dean", "curriculum"]),
    ("Hospitality / Food", ["cook", "chef", "server", "restaurant", "hotel", "dishwash", "bartender", "kitchen",
                            "hospitality", "housekeep", "catering"]),
    ("Logistics / Transportation", ["driver", "truck", "logistics", "warehouse", "delivery", "shipping",
                                    "receiving", "forklift", "supply chain", "dispatch", "fleet"]),
    ("Marketing / Media", ["marketing", "media", "content", "social", "seo", "brand", "communications", "pr ",
                           "advertis", "copywrit", "editor", "public relations"]),
    ("Legal", ["legal", "attorney", "law", "paralegal", "counsel", "compliance", "contract"]),
    ("Administrative / HR", ["human resources", "hr ", "recruit", "administrat", "receptionist", "office",
                             "executive assistant", "coordinator", "clerk", "talent"]),
    ("Construction / Real Estate", ["construction", "real estate", "property", "architect", "civil", "carpenter",
                                    "electrician", "plumber", "hvac", "roof", "landscap"]),
]


def extract_state(location: str) -> str:
    if not isinstance(location, str):
        return "National"
    loc = location.strip()
    # "City, ST" or "City, ST, United States" or "State, United States"
    m = re.search(r",\s*([A-Z]{2})\s*(?:,|$)", loc)
    if m and m.group(1) in US_STATES:
        return m.group(1)
    # Full state name
    low = loc.lower()
    for name, abbr in STATE_ABBREV.items():
        if name.lower() in low:
            return abbr
    if "remote" in low:
        return "Remote"
    if "united states" in low or loc == "United States":
        return "National"
    return "National"


def annualize_salary(row: pd.Series) -> Tuple[float, float]:
    """Return (sal_min, sal_max) annualized USD, or (nan, nan)."""
    lo = row.get("min_salary")
    hi = row.get("max_salary")
    if pd.isna(lo) and pd.isna(hi):
        return float("nan"), float("nan")
    period = (row.get("pay_period") or "").upper()
    mult = {"YEARLY": 1.0, "ANNUAL": 1.0, "MONTHLY": 12.0, "WEEKLY": 52.0, "HOURLY": 2080.0, "ONCE": 1.0}.get(
        period, 1.0
    )
    lo = float(lo) if not pd.isna(lo) else float("nan")
    hi = float(hi) if not pd.isna(hi) else float("nan")
    if pd.isna(hi) or hi < lo:
        hi = lo * 1.25 if not pd.isna(lo) else float("nan")
    if pd.isna(lo):
        lo = hi * 0.75 if not pd.isna(hi) else float("nan")
    # sanity clip
    lo = max(0.0, lo * mult)
    hi = max(lo, hi * mult)
    return lo, hi


def exp_bucket_from_level(level: str) -> str:
    if not isinstance(level, str):
        return "any"
    years = EXP_LEVEL_YEARS.get(level)
    if years is None:
        return "any"
    lo, hi = years
    if hi <= 0:
        return "0"
    if hi <= 2:
        return "1-2"
    if hi <= 5:
        return "3-5"
    if hi <= 10:
        return "6-10"
    return "10+"


def salary_bucket(sal_min: float, sal_max: float) -> str:
    if pd.isna(sal_min) and pd.isna(sal_max):
        return "negotiable"
    mid = (sal_min + sal_max) / 2.0
    if mid < 40000:
        return "<40k"
    if mid < 60000:
        return "40-60k"
    if mid < 80000:
        return "60-80k"
    if mid < 120000:
        return "80-120k"
    return "120k+"


def extract_degree(text: str) -> str:
    if not isinstance(text, str):
        return "any"
    t = text.lower()
    if re.search(r"\bphd\b|doctorate|doctoral", t):
        return "phd"
    if re.search(r"\bmaster'?s?\b|\bms\b|\bma\b|\bmba\b", t):
        return "master"
    if re.search(r"\bbachelor'?s?\b|\bbs\b|\bba\b|undergraduate|b\.s\.|b\.a\.", t):
        return "bachelor"
    if re.search(r"\bassociate('?s)? degree\b|associate degree", t):
        return "associate"
    if re.search(r"high school|ged|diploma", t):
        return "highschool"
    return "any"


def map_industry(title: str) -> str:
    if not isinstance(title, str):
        return "Other"
    t = title.lower()
    for ind, kws in INDUSTRY_KEYWORDS:
        if any(k in t for k in kws):
            return ind
    return "Other"


def clean_jobs(df: pd.DataFrame) -> pd.DataFrame:
    jobs = df[["job_id", "title", "description", "min_salary", "max_salary", "pay_period",
               "formatted_work_type", "formatted_experience_level", "location", "skills_desc"]].copy()
    jobs["state"] = jobs["location"].apply(extract_state)

    sal = jobs.apply(annualize_salary, axis=1)
    jobs["salary_min"] = sal.apply(lambda x: x[0])
    jobs["salary_max"] = sal.apply(lambda x: x[1])
    jobs["salary_bucket"] = jobs.apply(lambda r: salary_bucket(r["salary_min"], r["salary_max"]), axis=1)

    jobs["exp_bucket"] = jobs["formatted_experience_level"].apply(exp_bucket_from_level)
    jobs["exp_min"] = jobs["formatted_experience_level"].apply(
        lambda l: EXP_LEVEL_YEARS.get(l, (0, 15))[0] if isinstance(l, str) else 0
    )
    jobs["exp_max"] = jobs["formatted_experience_level"].apply(
        lambda l: EXP_LEVEL_YEARS.get(l, (0, 15))[1] if isinstance(l, str) else 15
    )
    jobs["degree_req"] = jobs["description"].apply(extract_degree)
    jobs["industry"] = jobs["title"].apply(map_industry)
    jobs["employment_type"] = jobs["formatted_work_type"].fillna("Full-time")
    jobs["company"] = "LinkedIn"

    # requirement text = skills_desc if present else extract first lines of description
    jobs["requirement"] = jobs["skills_desc"].fillna("")
    jobs["description"] = jobs["description"].fillna("")
    jobs["job_text"] = (jobs["title"].fillna("") + " " + jobs["description"] + " " + jobs["requirement"]).str.lower()

    # reindex as contiguous 0..N-1 (job node id == row index)
    jobs = jobs.reset_index(drop=True)
    jobs["job_id"] = jobs.index
    return jobs


# ---------------------------------------------------------------------------
# User synthesis
# ---------------------------------------------------------------------------
def synthesize_users(jobs: pd.DataFrame, n_users: int = 8000) -> pd.DataFrame:
    state_counts = jobs["state"].value_counts()
    states = state_counts.index.tolist()
    state_probs = (state_counts / state_counts.sum()).values

    industry_counts = jobs["industry"].value_counts()
    industries = industry_counts.index.tolist()
    industry_probs = (industry_counts / industry_counts.sum()).values

    degree_probs = {"highschool": 0.20, "associate": 0.15, "bachelor": 0.40, "master": 0.20, "phd": 0.05}
    degree_list = list(degree_probs.keys())

    users = []
    for i in range(n_users):
        state = rng.choice(states, p=state_probs)
        industry = rng.choice(industries, p=industry_probs)
        degree = rng.choice(degree_list, p=[degree_probs[d] for d in degree_list])

        # experience years correlated with degree (roughly)
        base = {"highschool": 3, "associate": 3, "bachelor": 5, "master": 7, "phd": 9}[degree]
        exp_years = int(np.clip(rng.normal(base, 3.0), 0, 25))
        exp_min = max(0, exp_years - 1)
        exp_max = min(25, exp_years + 2)

        # salary expectation correlated with experience + degree
        sal_mid = 35000 + exp_years * 4000 + DEGREE_RANK[degree] * 5000 + rng.normal(0, 8000)
        sal_mid = max(20000, sal_mid)
        salary_min = int(sal_mid * 0.85)
        salary_max = int(sal_mid * 1.2)

        willing_relocate = bool(rng.random() < 0.25)

        users.append({
            "user_id": i,
            "state": state,
            "industry": industry,
            "degree": degree,
            "exp_min": exp_min,
            "exp_max": exp_max,
            "exp_bucket": exp_bucket_from_years(exp_min, exp_max),
            "salary_min": salary_min,
            "salary_max": salary_max,
            "salary_bucket": salary_bucket(salary_min, salary_max),
            "willing_relocate": willing_relocate,
        })
    return pd.DataFrame(users)


def exp_bucket_from_years(lo: int, hi: int) -> str:
    if hi <= 0:
        return "0"
    if hi <= 2:
        return "1-2"
    if hi <= 5:
        return "3-5"
    if hi <= 10:
        return "6-10"
    return "10+"


def _compute_phi(jobs: pd.DataFrame, users: pd.DataFrame, applies: pd.DataFrame) -> np.ndarray:
    """Relation compatibility features phi(u,j) of shape (n_edges, 4)."""
    job_state = jobs["state"].values
    job_exp_min = jobs["exp_min"].values.astype(float)
    job_sal_min = jobs["salary_min"].values
    job_sal_max = jobs["salary_max"].values
    job_deg = jobs["degree_req"].values

    user_state = users["state"].values
    user_exp_max = users["exp_max"].values.astype(float)
    user_sal_min = users["salary_min"].values.astype(float)
    user_deg = users["degree"].values

    u_ids = applies["user_id"].values.astype(int)
    j_ids = applies["job_id"].values.astype(int)
    n = len(u_ids)

    same_state = (job_state[j_ids] == user_state[u_ids]).astype(float)
    exp_gap = (job_exp_min[j_ids] - user_exp_max[u_ids]) / 10.0
    sal_overlap = np.zeros(n, dtype=float)
    for k in range(n):
        lo = job_sal_min[j_ids[k]]
        hi = job_sal_max[j_ids[k]]
        if pd.isna(lo) or pd.isna(hi):
            sal_overlap[k] = 0.5
        else:
            ov = min(hi, user_sal_min[u_ids[k]] * 1.5) - max(lo, user_sal_min[u_ids[k]] * 0.5)
            sal_overlap[k] = float(np.clip(ov / (hi - lo + 1e-8), 0.0, 1.0))
    deg_gap = np.array([DEGREE_RANK.get(job_deg[j], -1) - DEGREE_RANK.get(user_deg[u], -1)
                        for u, j in zip(u_ids, j_ids)], dtype=float) / 4.0

    return np.column_stack([same_state, exp_gap, sal_overlap, deg_gap]).astype(np.float32)


def _compute_p_u(users: pd.DataFrame) -> np.ndarray:
    """User preference vector p_u of shape (n_users, 3)."""
    sal_min = users["salary_min"].values.astype(float)
    sal_norm = (sal_min - sal_min.mean()) / (sal_min.std() + 1e-8)
    deg_rank = users["degree"].map(DEGREE_RANK).fillna(-1).values.astype(float)
    deg_norm = deg_rank / 4.0
    return np.column_stack([
        users["willing_relocate"].astype(float).values,
        sal_norm,
        deg_norm,
    ]).astype(np.float32)


# ---------------------------------------------------------------------------
# Interaction generation
# ---------------------------------------------------------------------------
def generate_applies(jobs: pd.DataFrame, users: pd.DataFrame, avg_per_user: int = 10) -> pd.DataFrame:
    """Positive (user, job) edges using a feasibility model + noise."""
    job_states = jobs["state"].values
    job_exp_min = jobs["exp_min"].values.astype(int)
    job_exp_max = jobs["exp_max"].values.astype(int)
    job_sal_min = jobs["salary_min"].values
    job_sal_max = jobs["salary_max"].values
    job_deg = jobs["degree_req"].values
    job_ind = jobs["industry"].values
    n_jobs = len(jobs)

    rows = []
    for _, u in users.iterrows():
        n_apply = int(rng.integers(max(1, avg_per_user - 3), avg_per_user + 4))
        # candidate pool biased to matching industry + state
        ind_mask = job_ind == u["industry"]
        cand = np.where(ind_mask)[0]
        if len(cand) < n_apply * 2:
            cand = np.arange(n_jobs)
        cand = rng.choice(cand, size=min(len(cand), n_apply * 40), replace=False)

        chosen = []
        for jid in cand:
            if len(chosen) >= n_apply:
                break
            score = _feasibility(u, jid, job_states, job_exp_min, job_exp_max,
                                 job_sal_min, job_sal_max, job_deg)
            # deterministic-ish acceptance
            if rng.random() < score * 0.55:
                chosen.append(jid)
        if not chosen:
            chosen = [int(rng.integers(0, n_jobs))]
        for jid in chosen:
            rows.append({"user_id": int(u["user_id"]), "job_id": int(jid)})

    return pd.DataFrame(rows).drop_duplicates()


def _feasibility(u, jid, job_states, job_exp_min, job_exp_max, job_sal_min, job_sal_max, job_deg) -> float:
    s = 0.2  # base chance
    # location
    if job_states[jid] == u["state"] or job_states[jid] in ("Remote", "National") or u["willing_relocate"]:
        s += 0.35
    else:
        s -= 0.2
    # experience: user exp_max >= job exp_min - 1
    if u["exp_max"] >= job_exp_min[jid] - 1:
        s += 0.25
    else:
        s -= 0.25
    # salary overlap
    jlo, jhi = job_sal_min[jid], job_sal_max[jid]
    if not (pd.isna(jlo) and pd.isna(jhi)):
        if not pd.isna(jhi) and jhi >= u["salary_min"] * 0.7:
            s += 0.15
        else:
            s -= 0.15
    # degree
    dr = DEGREE_RANK.get(job_deg[jid], -1)
    if dr <= DEGREE_RANK[u["degree"]]:
        s += 0.15
    else:
        s -= 0.25
    return float(np.clip(s, 0.0, 1.0))


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------
def build_graph(jobs: pd.DataFrame, users: pd.DataFrame, applies: pd.DataFrame) -> HeteroData:
    data = HeteroData()

    n_user = len(users)
    n_job = len(jobs)

    # node ids are positional
    data["user"].node_id = torch.arange(n_user)
    data["job"].node_id = torch.arange(n_job)

    # user preference vector p_u (for dynamic weights, B3)
    data["user"].p_u = torch.tensor(_compute_p_u(users), dtype=torch.float32)

    # attribute node vocabs
    data["experience"].node_id = torch.arange(len(EXP_BUCKETS))
    data["location"].node_id = torch.arange(len(_location_vocab()))
    data["salary"].node_id = torch.arange(len(SAL_BUCKETS))
    data["degree"].node_id = torch.arange(len(DEGREE_LEVELS))

    # ---- applies edges ----
    ei = torch.tensor(np.vstack([applies["user_id"].values, applies["job_id"].values]), dtype=torch.long)
    data["user", "applies", "job"].edge_index = ei
    # dynamic-weight compatibility features phi(u,j) for every applies edge
    data["user", "applies", "job"].edge_attr = torch.tensor(
        _compute_phi(jobs, users, applies), dtype=torch.float32
    )

    # ---- attribute edges user/job -> attribute node ----
    loc_vocab = _location_vocab()
    data["user", "has_exp", "experience"].edge_index = torch.stack([
        torch.arange(n_user),
        torch.tensor([EXP_BUCKETS.index(b) for b in users["exp_bucket"]], dtype=torch.long),
    ])
    data["job", "requires_exp", "experience"].edge_index = torch.stack([
        torch.arange(n_job),
        torch.tensor([EXP_BUCKETS.index(b) for b in jobs["exp_bucket"]], dtype=torch.long),
    ])
    data["user", "prefers_loc", "location"].edge_index = torch.stack([
        torch.arange(n_user),
        torch.tensor([loc_vocab.get(s, loc_vocab["National"]) for s in users["state"]], dtype=torch.long),
    ])
    data["job", "located_in", "location"].edge_index = torch.stack([
        torch.arange(n_job),
        torch.tensor([loc_vocab.get(s, loc_vocab["National"]) for s in jobs["state"]], dtype=torch.long),
    ])
    data["user", "expects_sal", "salary"].edge_index = torch.stack([
        torch.arange(n_user),
        torch.tensor([SAL_BUCKETS.index(b) for b in users["salary_bucket"]], dtype=torch.long),
    ])
    data["job", "offers_sal", "salary"].edge_index = torch.stack([
        torch.arange(n_job),
        torch.tensor([SAL_BUCKETS.index(b) for b in jobs["salary_bucket"]], dtype=torch.long),
    ])
    data["user", "holds_degree", "degree"].edge_index = torch.stack([
        torch.arange(n_user),
        torch.tensor([DEGREE_LEVELS.index(d) for d in users["degree"]], dtype=torch.long),
    ])
    data["job", "requires_degree", "degree"].edge_index = torch.stack([
        torch.arange(n_job),
        torch.tensor([DEGREE_LEVELS.index(d) for d in jobs["degree_req"]], dtype=torch.long),
    ])

    # ---- attribute attribute adjacency (undirected) ----
    data = _add_attr_adjacency(data)

    # ---- reverse edges for message passing ----
    data = _add_reverse_edges(data)

    return data


def _add_reverse_edges(data: HeteroData) -> HeteroData:
    """Add (dst, 'rev_'+rel, src) for each directed edge type (skip near/self)."""
    directed = [
        ("user", "applies", "job"),
        ("user", "has_exp", "experience"),
        ("job", "requires_exp", "experience"),
        ("user", "prefers_loc", "location"),
        ("job", "located_in", "location"),
        ("user", "expects_sal", "salary"),
        ("job", "offers_sal", "salary"),
        ("user", "holds_degree", "degree"),
        ("job", "requires_degree", "degree"),
    ]
    for src, rel, dst in directed:
        key = (src, rel, dst)
        if key in data.edge_types:
            ei = data[key].edge_index
            data[dst, "rev_" + rel, src].edge_index = ei.flip(0)
    return data


def _location_vocab() -> Dict[str, int]:
    states = sorted(US_STATES.keys())
    vocab = {s: i for i, s in enumerate(states)}
    vocab["Remote"] = len(vocab)
    vocab["National"] = len(vocab)
    return vocab


def _add_attr_adjacency(data: HeteroData) -> HeteroData:
    # experience: adjacent buckets
    exp_edges = []
    for i in range(len(EXP_BUCKETS) - 1):
        exp_edges.append((i, i + 1))
        exp_edges.append((i + 1, i))
    if exp_edges:
        data["experience", "near", "experience"].edge_index = torch.tensor(exp_edges, dtype=torch.long).t()

    # salary: adjacent buckets
    sal_edges = []
    for i in range(len(SAL_BUCKETS) - 1):
        sal_edges.append((i, i + 1))
        sal_edges.append((i + 1, i))
    if sal_edges:
        data["salary", "near", "salary"].edge_index = torch.tensor(sal_edges, dtype=torch.long).t()

    # degree: ordered adjacent levels
    deg_edges = []
    for i in range(len(DEGREE_LEVELS) - 1):
        deg_edges.append((i, i + 1))
        deg_edges.append((i + 1, i))
    if deg_edges:
        data["degree", "near", "degree"].edge_index = torch.tensor(deg_edges, dtype=torch.long).t()

    # location: same census region
    loc_vocab = _location_vocab()
    rev = {i: s for s, i in loc_vocab.items()}
    loc_edges = set()
    for s1, i1 in loc_vocab.items():
        r1 = STATE_REGION.get(s1)
        for s2, i2 in loc_vocab.items():
            if s1 == s2:
                continue
            r2 = STATE_REGION.get(s2)
            if r1 is not None and r1 == r2:
                loc_edges.add((i1, i2))
                loc_edges.add((i2, i1))
    if loc_edges:
        data["location", "near", "location"].edge_index = torch.tensor(sorted(loc_edges), dtype=torch.long).t()

    return data


# ---------------------------------------------------------------------------
# Splitting with hard negatives
# ---------------------------------------------------------------------------
def build_splits(data: HeteroData, jobs: pd.DataFrame, users: pd.DataFrame,
                 val_ratio: float = 0.1, test_ratio: float = 0.1) -> Dict[str, HeteroData]:
    """Split applies edges; sample negatives (50% random, 50% hard)."""
    edge_index = data["user", "applies", "job"].edge_index
    n_edges = edge_index.shape[1]
    idx = rng.permutation(n_edges)
    n_test = int(test_ratio * n_edges)
    n_val = int(val_ratio * n_edges)
    test_idx = idx[:n_test]
    val_idx = idx[n_test:n_test + n_val]
    train_idx = idx[n_test + n_val:]

    job_states = jobs["state"].values
    job_exp_min = jobs["exp_min"].values.astype(int)
    job_ind = jobs["industry"].values
    n_jobs = len(jobs)
    n_users = len(users)
    user_state = users["state"].values
    user_ind = users["industry"].values
    user_exp_max = users["exp_max"].values.astype(int)

    # Message-passing edges = TRAIN positives only, shared across all splits so
    # val/test positives are never leaked into the graph.
    mp_edge = data["user", "applies", "job"].edge_index[:, train_idx]
    mp_attr = (data["user", "applies", "job"].edge_attr[train_idx]
               if "edge_attr" in data["user", "applies", "job"] else None)

    splits = {}
    for name, pos_idx in [("train", train_idx), ("val", val_idx), ("test", test_idx)]:
        split = _make_split(data, pos_idx, mp_edge, mp_attr, n_users, n_jobs,
                            job_states, job_exp_min, job_ind, user_state, user_ind, user_exp_max)
        splits[name] = split
    return splits


def _make_split(data: HeteroData, pos_idx, mp_edge, mp_attr, n_users, n_jobs,
                job_states, job_exp_min, job_ind, user_state, user_ind, user_exp_max) -> HeteroData:
    pos_edge = data["user", "applies", "job"].edge_index[:, pos_idx]
    n_pos = pos_edge.shape[1]

    # negatives
    neg_u, neg_j = [], []
    hard_neg = rng.random(n_pos) < 0.5
    for k in range(n_pos):
        u = int(pos_edge[0, k])
        if hard_neg[k]:
            # same industry, different state, OR experience mismatch
            if rng.random() < 0.5:
                cand = np.where((job_ind == user_ind[u]) & (job_states != user_state[u]))[0]
            else:
                cand = np.where(job_exp_min > user_exp_max[u] + 2)[0]
            if len(cand) == 0:
                cand = np.arange(n_jobs)
            j = int(rng.choice(cand))
        else:
            j = int(rng.integers(0, n_jobs))
        neg_u.append(u)
        neg_j.append(j)

    label_index = torch.cat([pos_edge, torch.tensor([neg_u, neg_j], dtype=torch.long)], dim=1)
    labels = torch.cat([torch.ones(n_pos), torch.zeros(n_pos)]).long()

    split = data.clone()
    split["user", "applies", "job"].edge_label_index = label_index
    split["user", "applies", "job"].edge_label = labels
    # message passing = shared train positives (no leakage of val/test positives)
    split["user", "applies", "job"].edge_index = mp_edge
    if ("job", "rev_applies", "user") in split.edge_types:
        split["job", "rev_applies", "user"].edge_index = mp_edge.flip(0)
    if mp_attr is not None:
        split["user", "applies", "job"].edge_attr = mp_attr
    return split


def save_artifacts(jobs: pd.DataFrame, users: pd.DataFrame, applies: pd.DataFrame,
                   graph: HeteroData, splits: Dict[str, HeteroData]) -> None:
    jobs.to_csv(os.path.join(PROC_DIR, "jobs.csv"), index=False)
    users.to_csv(os.path.join(PROC_DIR, "users.csv"), index=False)
    applies.to_csv(os.path.join(PROC_DIR, "applies.csv"), index=False)
    torch.save(graph, os.path.join(PROC_DIR, "graph.pt"))
    torch.save(splits, os.path.join(PROC_DIR, "splits.pt"))
    meta = {
        "n_users": len(users), "n_jobs": len(jobs), "n_applies": len(applies),
        "exp_buckets": EXP_BUCKETS, "sal_buckets": SAL_BUCKETS, "degree_levels": DEGREE_LEVELS,
        "location_vocab": _location_vocab(),
    }
    with open(os.path.join(PROC_DIR, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


def main() -> None:
    print("Loading raw jobs...")
    raw = pd.read_csv(RAW_JOBS, low_memory=False)
    print(f"Raw jobs: {raw.shape}")

    jobs = clean_jobs(raw)
    print(f"Cleaned jobs: {jobs.shape}")
    print("State dist (top):\n", jobs["state"].value_counts().head(10).to_string())
    print("Salary coverage:", int(jobs["salary_min"].notna().sum()), "/", len(jobs))
    print("Degree dist:\n", jobs["degree_req"].value_counts().to_string())
    print("Exp bucket dist:\n", jobs["exp_bucket"].value_counts().to_string())

    users = synthesize_users(jobs, n_users=8000)
    print(f"Users: {users.shape}")

    applies = generate_applies(jobs, users, avg_per_user=10)
    print(f"Applies edges: {len(applies)} (avg {len(applies)/len(users):.1f}/user)")

    graph = build_graph(jobs, users, applies)
    print("Graph:", graph)

    splits = build_splits(graph, jobs, users)
    for name, s in splits.items():
        print(f"{name}: pos edges {s['user','applies','job'].edge_index.shape[1]}, "
              f"labels {s['user','applies','job'].edge_label.shape[0]}")

    save_artifacts(jobs, users, applies, graph, splits)
    print("Saved artifacts to", PROC_DIR)


if __name__ == "__main__":
    main()
