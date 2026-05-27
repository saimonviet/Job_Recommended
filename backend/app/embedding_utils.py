"""
embedding_utils.py
==================
Public API để tính và lưu embedding vào DB.

Embedding được lưu là 64D (output của proj + out_proj — linear layers đã train),
KHÔNG phải TF-IDF 256D như trước.

Khi nào gọi:
  - generate_and_save_user_embedding: sau khi user cập nhật profile
  - generate_and_save_job_embedding:  sau khi employer tạo / cập nhật job

Embedding 64D này sau đó được score_jobs_for_user load ra và chấm điểm
qua EdgePredictor mà không cần build lại features từ đầu.
"""

import json
import logging
import numpy as np

from .embedding_pipeline import encode_user, encode_job

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 64  # out_channels của GNNEncoder


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_and_save_user_embedding(user, infor, commit=True):
    """
    Encode user → 64D embedding → lưu vào infor.user_embedding (JSON).

    Parameters
    ----------
    user   : User model instance
    infor  : InforUser model instance  (phải khác None)
    commit : nếu True thì db.session.commit() sau khi lưu

    Returns
    -------
    numpy array (64,) nếu thành công, None nếu lỗi.
    """
    if infor is None:
        logger.warning(
            f"[generate_user_embedding] user_id={getattr(user, 'id', '?')}: "
            "infor=None, bỏ qua."
        )
        return None

    try:
        try:
            from app.models import db
        except ImportError:
            from models import db

        embedding = encode_user(user, infor)  # numpy (64,) hoặc None

        if embedding is None:
            logger.warning(
                f"[generate_user_embedding] user_id={getattr(user, 'id', '?')}: "
                "encode_user trả None, bỏ qua lưu."
            )
            return None

        assert embedding.shape == (EMBEDDING_DIM,), (
            f"User embedding có shape {embedding.shape}, mong đợi ({EMBEDDING_DIM},)"
        )

        infor.user_embedding   = json.dumps(embedding.tolist())
        user.recommendations   = None  # xóa cache gợi ý cũ

        if commit:
            try:
                db.session.commit()
                logger.info(
                    f"[generate_user_embedding] user_id={user.id}: "
                    f"embedding {embedding.shape} đã lưu OK."
                )
            except Exception as commit_err:
                db.session.rollback()
                logger.exception(
                    f"[generate_user_embedding] user_id={user.id}: "
                    f"commit thất bại: {commit_err}"
                )
                return None

        return embedding

    except Exception as e:
        logger.exception(
            f"[generate_user_embedding] user_id={getattr(user, 'id', '?')}: "
            f"lỗi không xác định: {e}"
        )
        return None


def generate_and_save_job_embedding(job, commit=True):
    """
    Encode job → 64D embedding → lưu vào job.job_embedding (JSON).

    Parameters
    ----------
    job    : Job model instance
    commit : nếu True thì db.session.commit() sau khi lưu

    Returns
    -------
    numpy array (64,) nếu thành công, None nếu lỗi.
    """
    try:
        try:
            from app.models import db
        except ImportError:
            from models import db

        embedding = encode_job(job)  # numpy (64,) hoặc None

        if embedding is None:
            logger.warning(
                f"[generate_job_embedding] job_id={getattr(job, 'id', '?')}: "
                "encode_job trả None, bỏ qua lưu."
            )
            return None

        assert embedding.shape == (EMBEDDING_DIM,), (
            f"Job embedding có shape {embedding.shape}, mong đợi ({EMBEDDING_DIM},)"
        )

        job.job_embedding = json.dumps(embedding.tolist())

        if commit:
            try:
                db.session.commit()
                logger.info(
                    f"[generate_job_embedding] job_id={job.id}: "
                    f"embedding {embedding.shape} đã lưu OK."
                )
            except Exception as commit_err:
                db.session.rollback()
                logger.exception(
                    f"[generate_job_embedding] job_id={job.id}: "
                    f"commit thất bại: {commit_err}"
                )
                return None

        return embedding

    except Exception as e:
        logger.exception(
            f"[generate_job_embedding] job_id={getattr(job, 'id', '?')}: "
            f"lỗi không xác định: {e}"
        )
        return None