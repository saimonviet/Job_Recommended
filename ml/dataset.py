"""
Dataset builder for the Vietnamese Heterogeneous Job-Recommendation Graph.

Node types (6 types):
  - user (MedaJob users)
  - job (MedaJob + VietJob standardized postings)
  - experience (6 buckets: '0', '1-2', '3-5', '6-10', '10+', 'any')
  - location (47 Vietnamese provinces + Remote + Toàn quốc + Khác)
  - salary (6 buckets: '<10tr', '10-20tr', '20-35tr', '35-50tr', '50tr+', 'thoa_thuan')
  - degree (7 levels: 'Không yêu cầu', 'THPT', 'Trung cấp', 'Cao đẳng', 'Đại học', 'Thạc sĩ', 'Tiến sĩ')

Edge types:
  - ('user', 'applies', 'job')  (+ reverse 'rev_applies')
  - ('user', 'has_exp', 'experience'),    ('job', 'requires_exp', 'experience')
  - ('user', 'prefers_loc', 'location'),   ('job', 'located_in', 'location')
  - ('user', 'expects_sal', 'salary'),     ('job', 'offers_sal', 'salary')
  - ('user', 'holds_degree', 'degree'),    ('job', 'requires_degree', 'degree')
  - ('experience', 'near', 'experience')   (adjacent experience buckets)
  - ('salary', 'near', 'salary')           (adjacent salary buckets)
  - ('degree', 'near', 'degree')           (adjacent degree levels)
  - ('location', 'near', 'location')       (provinces in the same region: Bắc, Trung, Nam)

Produces:
  - processed/graph.pt      - PyG HeteroData with 6 node types & attributes
  - processed/splits.pt     - train/val/test HeteroData (with 50% hard negatives)
  - processed/applies.csv   - (user_id, job_id) interaction edge list
  - processed/meta.json     - metadata and node vocabs
"""

from __future__ import annotations

import json
import os
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
import torch
from torch_geometric.data import HeteroData

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROC_DIR = os.path.join(BASE_DIR, "data", "processed")
os.makedirs(PROC_DIR, exist_ok=True)

JOBS_PATH = os.path.join(PROC_DIR, "jobs.csv")
USERS_PATH = os.path.join(PROC_DIR, "users.csv")
RATINGS_PATH = os.path.join(PROC_DIR, "ratings_standardized.csv")

SEED = 42
rng = np.random.default_rng(SEED)

# ---------------------------------------------------------------------------
# Vocabularies & Buckets for Vietnam
# ---------------------------------------------------------------------------
EXP_BUCKETS = ["0", "1-2", "3-5", "6-10", "10+", "any"]
SAL_BUCKETS = ["<10tr", "10-20tr", "20-35tr", "35-50tr", "50tr+", "thoa_thuan"]
DEGREE_LEVELS = ["Không yêu cầu", "THPT", "Trung cấp", "Cao đẳng", "Đại học", "Thạc sĩ", "Tiến sĩ"]
DEGREE_RANK = {"Không yêu cầu": 0, "THPT": 1, "Trung cấp": 2, "Cao đẳng": 3, "Đại học": 4, "Thạc sĩ": 5, "Tiến sĩ": 6}

VN_REGIONS = {
    "Bắc Bộ": [
        "Hà Nội", "Hải Phòng", "Quảng Ninh", "Bắc Ninh", "Hưng Yên", "Hải Dương",
        "Vĩnh Phúc", "Phú Thọ", "Thái Nguyên", "Nam Định", "Ninh Bình", "Hà Nam",
        "Thái Bình", "Bắc Giang", "Lạng Sơn", "Tuyên Quang", "Hà Giang", "Cao Bằng",
        "Bắc Kạn", "Lào Cai", "Yên Bái", "Hòa Bình", "Sơn La", "Điện Biên", "Lai Châu"
    ],
    "Trung Bộ": [
        "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Thừa Thiên Huế",
        "Đà Nẵng", "Quảng Nam", "Quảng Ngãi", "Bình Định", "Phú Yên", "Khánh Hòa",
        "Ninh Thuận", "Bình Thuận", "Kon Tum", "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng"
    ],
    "Nam Bộ": [
        "Hồ Chí Minh", "Bình Dương", "Đồng Nai", "Bà Rịa - Vũng Tàu", "Tây Ninh",
        "Bình Phước", "Long An", "Tiền Giang", "Bến Tre", "Trà Vinh", "Vĩnh Long",
        "Đồng Tháp", "An Giang", "Kiên Giang", "Cần Thơ", "Hậu Giang", "Sóc Trăng",
        "Bạc Liêu", "Cà Mau"
    ]
}

PROVINCE_TO_REGION = {prov: region for region, prov_list in VN_REGIONS.items() for prov in prov_list}


def load_raw() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    print(f"Loading jobs from {JOBS_PATH}...")
    jobs = pd.read_csv(JOBS_PATH, low_memory=False)
    print(f"Loading users from {USERS_PATH}...")
    users = pd.read_csv(USERS_PATH, low_memory=False)
    print(f"Loading ratings from {RATINGS_PATH}...")
    ratings = pd.read_csv(RATINGS_PATH, low_memory=False) if os.path.exists(RATINGS_PATH) else pd.DataFrame()
    return jobs, users, ratings


def build_location_vocab(jobs: pd.DataFrame, users: pd.DataFrame) -> Dict[str, int]:
    provs = sorted(list(set(jobs["province"].dropna().unique()) | set(users["province"].dropna().unique())))
    vocab = {p: i for i, p in enumerate(provs)}
    if "Toàn quốc" not in vocab:
        vocab["Toàn quốc"] = len(vocab)
    if "Remote" not in vocab:
        vocab["Remote"] = len(vocab)
    if "Khác" not in vocab:
        vocab["Khác"] = len(vocab)
    return vocab


# ---------------------------------------------------------------------------
# Interaction Generation (Real ratings + Profile Feasibility Matching)
# ---------------------------------------------------------------------------
def generate_applies(jobs: pd.DataFrame, users: pd.DataFrame, ratings: pd.DataFrame,
                     min_edges_per_user: int = 20) -> pd.DataFrame:
    """Combines ground-truth MedaJob ratings with feasibility candidate edges."""
    print("Generating interaction edges...")
    job_id_to_idx = {jid: idx for idx, jid in enumerate(jobs["job_id"])}
    user_id_to_idx = {uid: idx for idx, uid in enumerate(users["user_id"])}

    applies_edges = set()

    # 1. Real ground-truth ratings
    if not ratings.empty:
        for _, r in ratings.iterrows():
            uid = r.get("user_id")
            jid = r.get("job_id")
            if uid in user_id_to_idx and jid in job_id_to_idx:
                applies_edges.add((user_id_to_idx[uid], job_id_to_idx[jid]))

    print(f"Added {len(applies_edges)} real interaction edges from MedaJob ratings.")

    # 2. Feasibility matching for each user to form robust candidate edges
    job_provinces = jobs["province"].values
    job_industries = jobs["industry"].values
    job_exp_mins = jobs["exp_min"].fillna(0).values.astype(float)
    job_sal_mins = jobs["salary_min"].values.astype(float)
    job_sal_maxs = jobs["salary_max"].values.astype(float)
    job_degrees = jobs["degree"].fillna("Không yêu cầu").values
    n_jobs = len(jobs)

    for u_idx, u in users.iterrows():
        existing_for_u = sum(1 for (ui, _) in applies_edges if ui == u_idx)
        needed = max(0, min_edges_per_user - existing_for_u)

        u_prov = str(u.get("province") or "Hồ Chí Minh")
        u_ind = str(u.get("industry") or "Công nghệ thông tin / Phần mềm")
        u_exp_max = float(u.get("exp_max") or 1.0)
        u_sal_min = float(u.get("salary_min") or 10.0) if pd.notna(u.get("salary_min")) else 10.0
        u_degree = str(u.get("degree") or "Đại học")
        u_relocate = bool(u.get("willing_relocate") or False)

        # Candidates filtered by same industry
        ind_mask = (job_industries == u_ind)
        cand_indices = np.where(ind_mask)[0]
        if len(cand_indices) < needed * 2:
            cand_indices = np.arange(n_jobs)

        rng.shuffle(cand_indices)
        chosen = 0
        for j_idx in cand_indices:
            if chosen >= needed:
                break
            # Feasibility score
            score = _feasibility_score(u_prov, u_exp_max, u_sal_min, u_degree, u_relocate,
                                       job_provinces[j_idx], job_exp_mins[j_idx],
                                       job_sal_mins[j_idx], job_sal_maxs[j_idx], job_degrees[j_idx])
            if rng.random() < score:
                applies_edges.add((u_idx, j_idx))
                chosen += 1

    applies_list = [{"user_id": u, "job_id": j} for u, j in applies_edges]
    df_applies = pd.DataFrame(applies_list).drop_duplicates()
    print(f"Total positive interaction edges: {len(df_applies)} (avg {len(df_applies)/len(users):.1f}/user)")
    return df_applies


def _feasibility_score(u_prov: str, u_exp_max: float, u_sal_min: float, u_degree: str, u_relocate: bool,
                       j_prov: str, j_exp_min: float, j_sal_min: float, j_sal_max: float, j_degree: str) -> float:
    s = 0.3
    # Province match
    if j_prov == u_prov or j_prov in ("Remote", "Toàn quốc") or u_relocate:
        s += 0.35
    else:
        s -= 0.25

    # Experience match: user exp >= job exp_min - 1
    if u_exp_max >= j_exp_min - 1.0:
        s += 0.25
    else:
        s -= 0.30

    # Salary match
    if pd.notna(j_sal_max) and j_sal_max > 0:
        if j_sal_max >= u_sal_min * 0.7:
            s += 0.15
        else:
            s -= 0.15

    # Degree match
    dr_job = DEGREE_RANK.get(j_degree, 0)
    dr_user = DEGREE_RANK.get(u_degree, 4)
    if dr_job <= dr_user:
        s += 0.15
    else:
        s -= 0.20

    return float(np.clip(s, 0.05, 0.95))


# ---------------------------------------------------------------------------
# Compatibility Features phi(u,j) & User Preference Vector p_u
# ---------------------------------------------------------------------------
def _compute_phi(jobs: pd.DataFrame, users: pd.DataFrame, applies: pd.DataFrame) -> np.ndarray:
    """Relation compatibility features phi(u,j) of shape (n_edges, 4)."""
    job_prov = jobs["province"].values
    job_exp_min = jobs["exp_min"].fillna(0).values.astype(float)
    job_sal_min = jobs["salary_min"].values.astype(float)
    job_sal_max = jobs["salary_max"].values.astype(float)
    job_deg = jobs["degree"].fillna("Không yêu cầu").values

    user_prov = users["province"].values
    user_exp_max = users["exp_max"].fillna(1).values.astype(float)
    user_sal_min = users["salary_min"].fillna(10).values.astype(float)
    user_deg = users["degree"].fillna("Đại học").values
    user_reloc = users["willing_relocate"].values

    u_ids = applies["user_id"].values.astype(int)
    j_ids = applies["job_id"].values.astype(int)
    n = len(u_ids)

    # 1. Location compatibility
    same_prov = np.array([
        1.0 if (job_prov[j] == user_prov[u] or job_prov[j] in ("Remote", "Toàn quốc") or user_reloc[u]) else 0.0
        for u, j in zip(u_ids, j_ids)
    ], dtype=float)

    # 2. Experience gap
    exp_gap = (job_exp_min[j_ids] - user_exp_max[u_ids]) / 5.0

    # 3. Salary overlap
    sal_overlap = np.zeros(n, dtype=float)
    for k in range(n):
        lo = job_sal_min[j_ids[k]]
        hi = job_sal_max[j_ids[k]]
        u_sal = user_sal_min[u_ids[k]]
        if pd.isna(lo) or pd.isna(hi) or lo <= 0:
            sal_overlap[k] = 0.5  # Neutral for negotiable salaries
        else:
            ov = min(hi, u_sal * 1.5) - max(lo, u_sal * 0.7)
            sal_overlap[k] = float(np.clip(ov / (max(hi - lo, 1.0) + 1e-6), 0.0, 1.0))

    # 4. Degree gap
    deg_gap = np.array([
        (DEGREE_RANK.get(job_deg[j], 0) - DEGREE_RANK.get(user_deg[u], 4)) / 6.0
        for u, j in zip(u_ids, j_ids)
    ], dtype=float)

    return np.column_stack([same_prov, exp_gap, sal_overlap, deg_gap]).astype(np.float32)


def _compute_p_u(users: pd.DataFrame) -> np.ndarray:
    """User preference vector p_u of shape (n_users, 3)."""
    sal_min = users["salary_min"].fillna(15.0).values.astype(float)
    sal_norm = (sal_min - sal_min.mean()) / (sal_min.std() + 1e-6)
    deg_rank = users["degree"].map(lambda d: DEGREE_RANK.get(d, 4)).values.astype(float)
    deg_norm = deg_rank / 6.0
    reloc = users["willing_relocate"].astype(float).values
    return np.column_stack([reloc, sal_norm, deg_norm]).astype(np.float32)


# ---------------------------------------------------------------------------
# Heterogeneous Graph Construction
# ---------------------------------------------------------------------------
def build_graph(jobs: pd.DataFrame, users: pd.DataFrame, applies: pd.DataFrame) -> HeteroData:
    data = HeteroData()
    n_users = len(users)
    n_jobs = len(jobs)
    loc_vocab = build_location_vocab(jobs, users)

    # 1. Node positional IDs
    data["user"].node_id = torch.arange(n_users)
    data["job"].node_id = torch.arange(n_jobs)
    data["experience"].node_id = torch.arange(len(EXP_BUCKETS))
    data["location"].node_id = torch.arange(len(loc_vocab))
    data["salary"].node_id = torch.arange(len(SAL_BUCKETS))
    data["degree"].node_id = torch.arange(len(DEGREE_LEVELS))

    # User preference vector p_u
    data["user"].p_u = torch.tensor(_compute_p_u(users), dtype=torch.float32)

    # 2. Target applies edges
    ei = torch.tensor(np.vstack([applies["user_id"].values, applies["job_id"].values]), dtype=torch.long)
    data["user", "applies", "job"].edge_index = ei
    data["user", "applies", "job"].edge_attr = torch.tensor(_compute_phi(jobs, users, applies), dtype=torch.float32)

    # 3. Attribute edges
    exp_idx_map = {b: i for i, b in enumerate(EXP_BUCKETS)}
    sal_idx_map = {b: i for i, b in enumerate(SAL_BUCKETS)}
    deg_idx_map = {d: i for i, d in enumerate(DEGREE_LEVELS)}

    # Experience edges
    data["user", "has_exp", "experience"].edge_index = torch.stack([
        torch.arange(n_users),
        torch.tensor([exp_idx_map.get(b, exp_idx_map["any"]) for b in users["exp_bucket"]], dtype=torch.long),
    ])
    data["job", "requires_exp", "experience"].edge_index = torch.stack([
        torch.arange(n_jobs),
        torch.tensor([exp_idx_map.get(b, exp_idx_map["any"]) for b in jobs["exp_bucket"]], dtype=torch.long),
    ])

    # Location edges
    data["user", "prefers_loc", "location"].edge_index = torch.stack([
        torch.arange(n_users),
        torch.tensor([loc_vocab.get(p, loc_vocab["Toàn quốc"]) for p in users["province"]], dtype=torch.long),
    ])
    data["job", "located_in", "location"].edge_index = torch.stack([
        torch.arange(n_jobs),
        torch.tensor([loc_vocab.get(p, loc_vocab["Toàn quốc"]) for p in jobs["province"]], dtype=torch.long),
    ])

    # Salary edges
    data["user", "expects_sal", "salary"].edge_index = torch.stack([
        torch.arange(n_users),
        torch.tensor([sal_idx_map.get(b, sal_idx_map["thoa_thuan"]) for b in users["salary_bucket"]], dtype=torch.long),
    ])
    data["job", "offers_sal", "salary"].edge_index = torch.stack([
        torch.arange(n_jobs),
        torch.tensor([sal_idx_map.get(b, sal_idx_map["thoa_thuan"]) for b in jobs["salary_bucket"]], dtype=torch.long),
    ])

    # Degree edges
    data["user", "holds_degree", "degree"].edge_index = torch.stack([
        torch.arange(n_users),
        torch.tensor([deg_idx_map.get(d, deg_idx_map["Đại học"]) for d in users["degree"]], dtype=torch.long),
    ])
    data["job", "requires_degree", "degree"].edge_index = torch.stack([
        torch.arange(n_jobs),
        torch.tensor([deg_idx_map.get(d, deg_idx_map["Không yêu cầu"]) for d in jobs["degree"]], dtype=torch.long),
    ])

    # 4. Attribute-to-attribute adjacency
    # Experience adjacent
    exp_adj = []
    for i in range(len(EXP_BUCKETS) - 2):
        exp_adj.extend([(i, i + 1), (i + 1, i)])
    data["experience", "near", "experience"].edge_index = torch.tensor(exp_adj, dtype=torch.long).t()

    # Salary adjacent
    sal_adj = []
    for i in range(len(SAL_BUCKETS) - 2):
        sal_adj.extend([(i, i + 1), (i + 1, i)])
    data["salary", "near", "salary"].edge_index = torch.tensor(sal_adj, dtype=torch.long).t()

    # Degree adjacent
    deg_adj = []
    for i in range(1, len(DEGREE_LEVELS) - 1):
        deg_adj.extend([(i, i + 1), (i + 1, i)])
    data["degree", "near", "degree"].edge_index = torch.tensor(deg_adj, dtype=torch.long).t()

    # Location in same region
    loc_adj = set()
    for p1, idx1 in loc_vocab.items():
        r1 = PROVINCE_TO_REGION.get(p1)
        for p2, idx2 in loc_vocab.items():
            if idx1 == idx2:
                continue
            r2 = PROVINCE_TO_REGION.get(p2)
            if r1 is not None and r1 == r2:
                loc_adj.add((idx1, idx2))
    if loc_adj:
        data["location", "near", "location"].edge_index = torch.tensor(sorted(loc_adj), dtype=torch.long).t()

    # 5. Reverse edges for message passing
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


# ---------------------------------------------------------------------------
# Train / Val / Test Splits with Hard Negatives
# ---------------------------------------------------------------------------
def build_splits(data: HeteroData, jobs: pd.DataFrame, users: pd.DataFrame,
                 val_ratio: float = 0.1, test_ratio: float = 0.1) -> Dict[str, HeteroData]:
    edge_index = data["user", "applies", "job"].edge_index
    n_edges = edge_index.shape[1]
    idx = rng.permutation(n_edges)
    n_test = max(1, int(test_ratio * n_edges))
    n_val = max(1, int(val_ratio * n_edges))

    test_idx = idx[:n_test]
    val_idx = idx[n_test:n_test + n_val]
    train_idx = idx[n_test + n_val:]

    job_provs = jobs["province"].values
    job_exp_mins = jobs["exp_min"].fillna(0).values.astype(float)
    job_inds = jobs["industry"].values
    n_jobs = len(jobs)
    n_users = len(users)
    user_provs = users["province"].values
    user_inds = users["industry"].values
    user_exp_maxs = users["exp_max"].fillna(1).values.astype(float)

    # Train message passing edges
    mp_edge = data["user", "applies", "job"].edge_index[:, train_idx]
    mp_attr = (data["user", "applies", "job"].edge_attr[train_idx]
               if "edge_attr" in data["user", "applies", "job"] else None)

    splits = {}
    for name, pos_idx in [("train", train_idx), ("val", val_idx), ("test", test_idx)]:
        pos_edge = data["user", "applies", "job"].edge_index[:, pos_idx]
        n_pos = pos_edge.shape[1]

        # Negatives: 50% hard, 50% random
        neg_u, neg_j = [], []
        hard_neg = rng.random(n_pos) < 0.5
        for k in range(n_pos):
            u = int(pos_edge[0, k])
            if hard_neg[k]:
                # Hard negative: same industry but different province or requiring more exp
                if rng.random() < 0.5:
                    cand = np.where((job_inds == user_inds[u]) & (job_provs != user_provs[u]))[0]
                else:
                    cand = np.where(job_exp_mins > user_exp_maxs[u] + 2.0)[0]
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
        split["user", "applies", "job"].edge_index = mp_edge
        if ("job", "rev_applies", "user") in split.edge_types:
            split["job", "rev_applies", "user"].edge_index = mp_edge.flip(0)
        if mp_attr is not None:
            split["user", "applies", "job"].edge_attr = mp_attr
        splits[name] = split

    return splits


def save_artifacts(jobs: pd.DataFrame, users: pd.DataFrame, applies: pd.DataFrame,
                   graph: HeteroData, splits: Dict[str, HeteroData]) -> None:
    applies.to_csv(os.path.join(PROC_DIR, "applies.csv"), index=False)
    torch.save(graph, os.path.join(PROC_DIR, "graph.pt"))
    torch.save(splits, os.path.join(PROC_DIR, "splits.pt"))
    meta = {
        "n_users": len(users),
        "n_jobs": len(jobs),
        "n_applies": len(applies),
        "exp_buckets": EXP_BUCKETS,
        "sal_buckets": SAL_BUCKETS,
        "degree_levels": DEGREE_LEVELS,
        "location_vocab": build_location_vocab(jobs, users),
    }
    with open(os.path.join(PROC_DIR, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


def main():
    print("=" * 60)
    print("BUILDING VIETNAMESE HETEROGENEOUS RECSYS GRAPH")
    print("=" * 60)

    jobs, users, ratings = load_raw()
    print(f"Jobs: {len(jobs)}, Users: {len(users)}, Ratings: {len(ratings)}")

    applies = generate_applies(jobs, users, ratings, min_edges_per_user=20)
    graph = build_graph(jobs, users, applies)
    print("\nConstructed HeteroData Graph:")
    print(graph)

    splits = build_splits(graph, jobs, users)
    for name, s in splits.items():
        print(f"  Split '{name}': {s['user', 'applies', 'job'].edge_label.shape[0]} labeled edges "
              f"({(s['user', 'applies', 'job'].edge_label == 1).sum()} pos, "
              f"{(s['user', 'applies', 'job'].edge_label == 0).sum()} neg)")

    save_artifacts(jobs, users, applies, graph, splits)
    print("\n✅ Successfully saved graph.pt, splits.pt, applies.csv, meta.json into", PROC_DIR)


if __name__ == "__main__":
    main()
