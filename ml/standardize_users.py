"""
Standardization script for MedaJob Applicant Profiles and Interactions.

Produces:
1. data/processed/medajob_users_standardized.csv
2. data/processed/users.csv  (main user profiles dataset for GNN / RecSys)
3. data/processed/ratings_standardized.csv (ground-truth user-job interactions)
"""

import ast
import json
import os
import re
from typing import Tuple

import numpy as np
import pandas as pd

from .standardize_datasets import (
    clean_list_or_text,
    get_exp_bucket,
    get_salary_bucket,
    parse_degree,
    parse_employment_type,
    parse_meda_industry,
    standardize_province,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
PROC_DIR = os.path.join(BASE_DIR, "data", "processed")
os.makedirs(PROC_DIR, exist_ok=True)

USERS_RAW = os.path.join(RAW_DIR, "medajob_users.csv")
PROFILES_RAW = os.path.join(RAW_DIR, "medajob_user_profiles.csv")
RATINGS_RAW = os.path.join(RAW_DIR, "medajob_ratings.csv")
JOBS_STD = os.path.join(PROC_DIR, "jobs.csv")


def parse_user_salary(s_min, s_max) -> Tuple[float, float, str, str]:
    """Parse user expected salary in VND into million VND / month."""
    try:
        val_min = float(s_min) if pd.notna(s_min) else np.nan
    except Exception:
        val_min = np.nan
    try:
        val_max = float(s_max) if pd.notna(s_max) else np.nan
    except Exception:
        val_max = np.nan

    if (pd.isna(val_min) or val_min <= 0) and (pd.isna(val_max) or val_max <= 0):
        return np.nan, np.nan, "thoa_thuan", "Thỏa thuận"

    # Raw numbers are typically in VND (e.g. 7,000,000 to 15,000,000)
    v1_m = (val_min / 1_000_000.0) if pd.notna(val_min) and val_min > 0 else np.nan
    v2_m = (val_max / 1_000_000.0) if pd.notna(val_max) and val_max > 0 else np.nan

    if pd.notna(v1_m) and pd.isna(v2_m):
        v2_m = v1_m * 1.5
        text = f"Từ {v1_m:.1f} triệu"
    elif pd.isna(v1_m) and pd.notna(v2_m):
        v1_m = v2_m * 0.7
        text = f"Đến {v2_m:.1f} triệu"
    else:
        text = f"{v1_m:.1f} - {v2_m:.1f} triệu"

    v1_fin = min(v1_m, v2_m)
    v2_fin = max(v1_m, v2_m)
    bucket = get_salary_bucket(v1_fin, v2_fin)
    return v1_fin, v2_fin, bucket, text


def standardize_meda_users() -> Tuple[pd.DataFrame, pd.DataFrame]:
    u_path = USERS_RAW if os.path.exists(USERS_RAW) else os.path.join(BASE_DIR, "data", "medajob_raw", "users.csv")
    p_path = PROFILES_RAW if os.path.exists(PROFILES_RAW) else os.path.join(BASE_DIR, "data", "medajob_raw", "user_profiles.csv")
    r_path = RATINGS_RAW if os.path.exists(RATINGS_RAW) else os.path.join(BASE_DIR, "data", "medajob_raw", "ratings.csv")

    print(f"Loading MedaJob user files from {u_path}...")
    users_df = pd.read_csv(u_path)
    profiles_df = pd.read_csv(p_path)
    ratings_df = pd.read_csv(r_path)

    # Merge profiles with account info
    merged = pd.merge(profiles_df, users_df, left_on="user_id", right_on="id", how="left")
    print(f"Loaded {len(merged)} user profiles from MedaJob.")

    # Also include any user who has ratings but didn't create a formal profile
    rated_user_ids = set(ratings_df["user_id"].dropna().astype(int).unique())
    profiled_user_ids = set(merged["user_id"].dropna().astype(int).unique())
    extra_user_ids = rated_user_ids - profiled_user_ids

    out_users = []
    for idx, row in merged.iterrows():
        orig_u_id = str(row.get("user_id", idx))
        user_id = f"USER_{int(orig_u_id):05d}" if orig_u_id.isdigit() else f"USER_{idx:05d}"
        full_name = str(row.get("full_name") or row.get("username") or f"Ứng viên {orig_u_id}").strip()
        desired_job = str(row.get("title") or "Ứng viên").strip()

        raw_loc = str(row.get("preferred_location") or row.get("address") or "Hồ Chí Minh").strip()
        province = standardize_province(raw_loc)
        willing_relocate = bool("remote" in raw_loc.lower() or "," in raw_loc or ";" in raw_loc)

        s_min_raw = row.get("expected_salary_min")
        s_max_raw = row.get("expected_salary_max")
        sal_min, sal_max, sal_bucket, sal_text = parse_user_salary(s_min_raw, s_max_raw)

        try:
            exp_yrs = float(row.get("years_experience", 0))
        except Exception:
            exp_yrs = 0.0
        exp_min = max(0.0, exp_yrs - 0.5)
        exp_max = exp_yrs + 1.0
        exp_bucket = get_exp_bucket(exp_yrs)

        summary = str(row.get("user_summary") or "").strip()
        degree = parse_degree(summary)
        if degree == "Không yêu cầu":
            degree = "Đại học"  # MedaJob tech profiles typical education baseline

        emp_type = parse_employment_type(str(row.get("preferred_job_type") or ""))
        industry = parse_meda_industry(desired_job, "")
        skills = clean_list_or_text(row.get("user_skills"))

        out_users.append({
            "user_id": user_id,
            "source": "medajob",
            "original_user_id": orig_u_id,
            "username": str(row.get("username") or ""),
            "full_name": full_name,
            "email": str(row.get("email") or ""),
            "phone": str(row.get("phone") or ""),
            "desired_job": desired_job,
            "province": province,
            "job_location": raw_loc,
            "salary_min": sal_min,
            "salary_max": sal_max,
            "salary_text": sal_text,
            "salary_bucket": sal_bucket,
            "exp_years": exp_yrs,
            "exp_min": exp_min,
            "exp_max": exp_max,
            "exp_bucket": exp_bucket,
            "degree": degree,
            "employment_type": emp_type,
            "industry": industry,
            "skills": skills,
            "willing_relocate": willing_relocate,
            "target_summary": summary,
        })

    # Add extra rated users
    for extra_id in sorted(extra_user_ids):
        u_row = users_df[users_df["id"] == extra_id]
        if not u_row.empty:
            ur = u_row.iloc[0]
            raw_loc = str(ur.get("address") or "Đà Nẵng").strip()
            out_users.append({
                "user_id": f"USER_{extra_id:05d}",
                "source": "medajob",
                "original_user_id": str(extra_id),
                "username": str(ur.get("username") or ""),
                "full_name": str(ur.get("full_name") or ur.get("username") or f"Ứng viên {extra_id}").strip(),
                "email": str(ur.get("email") or ""),
                "phone": str(ur.get("phone") or ""),
                "desired_job": "Kỹ sư CNTT / AI",
                "province": standardize_province(raw_loc),
                "job_location": raw_loc,
                "salary_min": 10.0,
                "salary_max": 20.0,
                "salary_text": "10.0 - 20.0 triệu",
                "salary_bucket": "10-20tr",
                "exp_years": 1.0,
                "exp_min": 0.0,
                "exp_max": 2.0,
                "exp_bucket": "1-2",
                "degree": "Đại học",
                "employment_type": "Toàn thời gian",
                "industry": "Công nghệ thông tin / Phần mềm",
                "skills": "python; ai; data analysis",
                "willing_relocate": False,
                "target_summary": f"Tài khoản {ur.get('username')}",
            })

    df_users_std = pd.DataFrame(out_users)

    # Standardize Ratings (user-job interactions)
    print("Standardizing ratings / interactions...")
    out_ratings = []
    for _, row in ratings_df.iterrows():
        u_id = str(int(row["user_id"])) if pd.notna(row["user_id"]) else ""
        j_id = str(int(row["job_id"])) if pd.notna(row["job_id"]) else ""
        rating_val = float(row["rating"]) if pd.notna(row.get("rating")) else 5.0

        std_u_id = f"USER_{int(u_id):05d}"
        std_j_id = f"MEDA_{int(j_id):05d}"

        out_ratings.append({
            "user_id": std_u_id,
            "job_id": std_j_id,
            "original_user_id": u_id,
            "original_job_id": j_id,
            "rating": rating_val,
        })

    df_ratings_std = pd.DataFrame(out_ratings)
    return df_users_std, df_ratings_std


def main():
    print("=" * 60)
    print("STANDARDIZING MEDAJOB APPLICANT DATASET")
    print("=" * 60)

    users_std, ratings_std = standardize_meda_users()

    # Save outputs
    users_meda_out = os.path.join(PROC_DIR, "medajob_users_standardized.csv")
    users_main_out = os.path.join(PROC_DIR, "users.csv")
    ratings_out = os.path.join(PROC_DIR, "ratings_standardized.csv")

    users_std.to_csv(users_meda_out, index=False, encoding="utf-8-sig")
    users_std.to_csv(users_main_out, index=False, encoding="utf-8-sig")
    ratings_std.to_csv(ratings_out, index=False, encoding="utf-8-sig")

    print("\n✅ Successfully standardized MedaJob applicant data:")
    print(f"  1. MedaJob Users (Standardized): {users_meda_out} ({len(users_std)} profiles)")
    print(f"  2. Main Users Dataset          : {users_main_out} ({len(users_std)} profiles)")
    print(f"  3. Standardized Ratings        : {ratings_out} ({len(ratings_std)} ratings)")

    print("\n📊 User Profiles Overview:")
    print(f"  Total profiles: {len(users_std)}")
    print("\nTop Desired Roles:")
    print(users_std["desired_job"].value_counts().head(5).to_string())
    print("\nProvinces Distribution:")
    print(users_std["province"].value_counts().head(5).to_string())
    print("\nExperience Bucket Breakdown:")
    print(users_std["exp_bucket"].value_counts().to_string())
    print("\nSalary Bucket Breakdown:")
    print(users_std["salary_bucket"].value_counts().to_string())


if __name__ == "__main__":
    main()
