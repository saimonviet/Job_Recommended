"""
Train B0-B4 and evaluate with:
  - link-prediction AUC (continuity with the original B0 baseline)
  - ranking on the FULL job corpus: Recall@K, NDCG@K, MRR, Hit@K
  - violation rate (the thesis' primary metric)

B4 == B3 model + hard-constraint filter + multi-criteria re-ranking.
"""

from __future__ import annotations

import json
import os
import time

import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F

from . import dataset as D
from . import features as FE
from . import models as M
from . import rerank as R

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROC_DIR = os.path.join(BASE_DIR, "data", "processed")
MODEL_DIR = os.path.join(PROC_DIR, "models")
RESULT_DIR = os.path.join(BASE_DIR, "results")
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

APPLIES = ("user", "applies", "job")
REV_APPLIES = ("job", "rev_applies", "user")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[train] device = {device}")


# ---------------------------------------------------------------------------
# data prep
# ---------------------------------------------------------------------------
def build_x_dict(feats, six_node: bool) -> dict:
    x = {"user": torch.tensor(feats["X_user"], dtype=torch.float32),
         "job": torch.tensor(feats["X_job"], dtype=torch.float32)}
    if six_node:
        for k, v in feats["attr_feat"].items():
            x[k] = torch.tensor(v, dtype=torch.float32)
    return x


def edge_dict(split, edge_types):
    return {et: split[et].edge_index.to(device) for et in edge_types}


def edge_attr_dict(split):
    d = {}
    if "edge_attr" in split[APPLIES]:
        d[APPLIES] = split[APPLIES].edge_attr.to(device)
    return d


def make_io(model_id, graph, split, feats):
    spec = M.MODEL_SPECS[model_id]
    six_node = spec["six_node"]
    if six_node:
        edge_types = list(graph.edge_types)
        node_feat_dims = {"user": feats["X_user"].shape[1], "job": feats["X_job"].shape[1]}
        for k, v in feats["attr_feat"].items():
            node_feat_dims[k] = v.shape[1]
    else:
        edge_types = [APPLIES, REV_APPLIES]
        node_feat_dims = {"user": feats["X_user"].shape[1], "job": feats["X_job"].shape[1]}

    x_dict = build_x_dict(feats, six_node)
    return node_feat_dims, edge_types, x_dict


# ---------------------------------------------------------------------------
# training
# ---------------------------------------------------------------------------
def train_model(model_id, graph, splits, feats, epochs=40, lr=0.005, k_values=(5, 10, 20)):
    spec = M.MODEL_SPECS[model_id]
    node_feat_dims, edge_types, x_dict = make_io(model_id, graph, splits["train"], feats)
    x_dict = {k: v.to(device) for k, v in x_dict.items()}

    model = M.build_model(model_id, node_feat_dims, edge_types).to(device)
    if spec.get("dynamic", False):
        model.encoder.set_p_u(graph["user"].p_u.to(device))

    train_edge_index = edge_dict(splits["train"], edge_types)
    train_edge_attr = edge_attr_dict(splits["train"])
    tr_label_index = splits["train"][APPLIES].edge_label_index.to(device)
    tr_labels = splits["train"][APPLIES].edge_label.float().to(device)

    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    best_auc = 0.0
    for epoch in range(1, epochs + 1):
        model.train()
        optimizer.zero_grad()
        logits = model(x_dict, train_edge_index, tr_label_index, train_edge_attr)
        loss = F.binary_cross_entropy_with_logits(logits, tr_labels)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()

        if epoch % 10 == 0 or epoch == epochs:
            val_auc = _auc(model, x_dict, splits["val"], edge_types)
            msg = f"[{model_id}] epoch {epoch:3d}/{epochs} loss={loss.item():.4f} val_auc={val_auc:.4f}"
            if val_auc > best_auc:
                best_auc = val_auc
                torch.save(model.state_dict(), os.path.join(MODEL_DIR, f"{model_id}.pt"))
                msg += "  *"
            print(msg)

    model.load_state_dict(torch.load(os.path.join(MODEL_DIR, f"{model_id}.pt"),
                                     map_location=device, weights_only=False))
    return model, edge_types, x_dict


@torch.no_grad()
def _auc(model, x_dict, split, edge_types):
    model.eval()
    ei = edge_dict(split, edge_types)
    ea = edge_attr_dict(split)
    li = split[APPLIES].edge_label_index.to(device)
    lb = split[APPLIES].edge_label.float().to(device)
    logits = model(x_dict, ei, li, ea)
    from sklearn.metrics import roc_auc_score
    return float(roc_auc_score(lb.cpu().numpy(), logits.sigmoid().cpu().numpy()))


# ---------------------------------------------------------------------------
# evaluation (ranking on full corpus + violation rate)
# ---------------------------------------------------------------------------
@torch.no_grad()
def evaluate(model, x_dict, edge_types, graph, splits, jobs, users,
             k_values=(5, 10, 20), rerank=False):
    model.eval()
    # embeddings from the TRAIN graph (message passing with train positive edges)
    z = model.encode(x_dict, edge_dict(splits["train"], edge_types), edge_attr_dict(splits["train"]))
    z_user = z["user"]
    z_job = z["job"]
    n_jobs = z_job.shape[0]

    # test positives per user
    li = splits["test"][APPLIES].edge_label_index
    lb = splits["test"][APPLIES].edge_label
    pos_mask = lb == 1
    pos_users = li[0][pos_mask].cpu().numpy()
    pos_jobs = li[1][pos_mask].cpu().numpy()

    # AUC on test labels
    from sklearn.metrics import roc_auc_score
    logits = model.decoder(z_user, z_job, li.to(device))
    auc = float(roc_auc_score(lb.cpu().numpy(), logits.sigmoid().cpu().numpy()))

    true_pos = {}
    for u, j in zip(pos_users, pos_jobs):
        true_pos.setdefault(int(u), set()).add(int(j))

    test_users = sorted(true_pos.keys())
    ja = R.prepare_job_arrays(jobs)

    all_job_ids = torch.arange(n_jobs, device=device)
    metrics = {f"recall@{k}": [] for k in k_values}
    metrics.update({f"ndcg@{k}": [] for k in k_values})
    metrics.update({f"hit@{k}": [] for k in k_values})
    metrics["mrr"] = []
    metrics["violation_rate"] = []
    viol_breakdown = {"location": [], "experience": [], "salary": [], "degree": []}

    for u in test_users:
        urow = users.iloc[u]
        ui = torch.full((n_jobs,), u, dtype=torch.long, device=device)
        scores = model.decoder(z_user, z_job, torch.stack([ui, all_job_ids]))
        scores = scores.sigmoid().cpu().numpy()
        job_ids = np.arange(n_jobs)

        if rerank:
            # hard filter then re-rank
            keep = R.hard_filter(ja, urow, job_ids)
            if len(keep) == 0:
                keep = job_ids
            kept_scores = scores[keep]
            reranked = R.rerank_scores(ja, kept_scores, keep, urow)
            order = np.argsort(reranked)[::-1]
            top_k_ids = keep[order][:max(k_values)]
        else:
            order = np.argsort(scores)[::-1]
            top_k_ids = job_ids[order][:max(k_values)]

        tp = true_pos[u]
        for k in k_values:
            tk = top_k_ids[:k]
            hits = sum(1 for j in tk if int(j) in tp)
            metrics[f"recall@{k}"].append(hits / len(tp) if tp else 0.0)
            metrics[f"hit@{k}"].append(1.0 if hits > 0 else 0.0)
            dcg = sum(1.0 / np.log2(i + 2) for i, j in enumerate(tk) if int(j) in tp)
            idcg = sum(1.0 / np.log2(i + 2) for i in range(min(len(tp), k)))
            metrics[f"ndcg@{k}"].append(dcg / idcg if idcg > 0 else 0.0)

        # MRR
        rr = 0.0
        for rank, j in enumerate(top_k_ids[:max(k_values)]):
            if int(j) in tp:
                rr = 1.0 / (rank + 1)
                break
        metrics["mrr"].append(rr)

        # violation rate (top-20)
        top20 = top_k_ids[:20]
        metrics["violation_rate"].append(R.violation_rate(ja, urow, top20))
        bd = R.violation_breakdown(ja, urow, top20)
        for kk in viol_breakdown:
            viol_breakdown[kk].append(bd[kk])

    out = {"auc": auc}
    for kk in metrics:
        if kk.startswith(("recall", "ndcg", "hit")) or kk in ("mrr", "violation_rate"):
            out[kk] = float(np.mean(metrics[kk]))
    out["violation_breakdown"] = {kk: float(np.mean(v)) for kk, v in viol_breakdown.items()}
    return out


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------
def main():
    t0 = time.time()
    torch.manual_seed(D.SEED)
    np.random.seed(D.SEED)
    jobs, users, applies, graph, splits = FE.load_all()
    feats = FE.build_features(jobs, users)

    results = {}
    for model_id in ["B0", "B1", "B2", "B3", "HGT"]:
        print(f"\n{'='*60}\nTraining {model_id}\n{'='*60}")
        model, edge_types, x_dict = train_model(model_id, graph, splits, feats, epochs=40)
        m = evaluate(model, x_dict, edge_types, graph, splits, jobs, users)
        results[model_id] = m
        print(f"[{model_id}] {json.dumps(m, indent=2)}")

    # B4 = B3 + rerank
    print(f"\n{'='*60}\nEvaluating B4 (B3 + rerank)\n{'='*60}")
    model, edge_types, x_dict = train_model("B3", graph, splits, feats, epochs=40)
    m = evaluate(model, x_dict, edge_types, graph, splits, jobs, users, rerank=True)
    results["B4"] = m
    print(f"[B4] {json.dumps(m, indent=2)}")

    with open(os.path.join(RESULT_DIR, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved results to {RESULT_DIR}/metrics.json (total {time.time()-t0:.1f}s)")


if __name__ == "__main__":
    main()
