"""
Recommendation API backed by the heterogeneous GNN + dynamic weights + rerank (B4).

Endpoints:
  GET  /api/recommend/user/<int:user_id>?top_k=20      -> recommendations for an existing seeker
  POST /api/recommend/profile                           -> cold-start recommendations from a profile
  GET  /api/recommend/health                            -> model load status

The model is loaded lazily (first call) and cached in-process.
"""

import os
import sys

from flask import Blueprint, jsonify, request

# make the project root importable so `from ml import serve` works
_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from ml import serve  # noqa: E402

recommend_bp = Blueprint("recommend", __name__)


@recommend_bp.route("/api/recommend/health", methods=["GET"])
def health():
    try:
        c = serve._load_all()
        return jsonify({
            "loaded": True,
            "n_users": int(len(c["users"])),
            "n_jobs": int(len(c["jobs"])),
            "model": "B4 (B3 + dynamic weights + constraint rerank)",
        })
    except Exception as e:  # pragma: no cover
        return jsonify({"loaded": False, "error": str(e)}), 500


@recommend_bp.route("/api/recommend/user/<int:user_id>", methods=["GET"])
def recommend_user(user_id):
    top_k = request.args.get("top_k", default=20, type=int)
    top_k = max(1, min(100, top_k))
    rerank = request.args.get("rerank", default="1") in ("1", "true", "True")
    try:
        recs = serve.recommend_by_user_id(user_id, top_k=top_k, apply_rerank=rerank)
        return jsonify({"user_id": user_id, "top_k": top_k, "rerank": rerank,
                        "recommendations": recs})
    except Exception as e:  # pragma: no cover
        return jsonify({"error": str(e)}), 400


@recommend_bp.route("/api/recommend/profile", methods=["POST"])
def recommend_profile():
    body = request.get_json(silent=True) or {}
    top_k = int(body.get("top_k", 20))
    top_k = max(1, min(100, top_k))
    rerank = body.get("rerank", True)
    profile = {
        "state": body.get("state", "National"),
        "degree": body.get("degree", "any"),
        "exp_min": int(body.get("exp_min", 0)),
        "exp_max": int(body.get("exp_max", 0)),
        "salary_min": float(body.get("salary_min", 40000)),
        "salary_max": float(body.get("salary_max", 60000)),
        "industry": body.get("industry", "Other"),
        "willing_relocate": bool(body.get("willing_relocate", False)),
    }
    try:
        recs = serve.recommend_by_profile(profile, top_k=top_k, apply_rerank=rerank)
        return jsonify({"profile": profile, "top_k": top_k, "rerank": rerank,
                        "recommendations": recs})
    except Exception as e:  # pragma: no cover
        return jsonify({"error": str(e)}), 400
