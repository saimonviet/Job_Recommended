import argparse
import json
import numpy as np
import csv


import os
import sys
from flask import Flask

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

from app.models import db, Job, InforUser
from app.config import Config  # type: ignore


def _build_db_app():
    app = Flask(__name__)
    try:
        app.config.from_object(Config)
    except Exception:
        pass

    if not app.config.get('SQLALCHEMY_DATABASE_URI'):
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'sqlite:///data.db'

    if 'SQLALCHEMY_TRACK_MODIFICATIONS' not in app.config:
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    return app

BATCH = 500


def load_ids_from_csv(path):
    ids = []
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if not row:
                continue
            try:
                ids.append(int(row[0]))
            except Exception:
                try:
                    ids.append(int(row[0].strip()))
                except Exception:
                    continue
    return ids


def import_job_embeddings(app, emb_path, mapping_path=None):
    embs = np.load(emb_path)
    if embs.dtype != np.float32:
        embs = embs.astype(np.float32)

    with app.app_context():
        if mapping_path:
            job_ids = load_ids_from_csv(mapping_path)
            assert len(job_ids) == embs.shape[0], "Mapping length and embeddings rows mismatch"
            jobs = [Job.query.get(jid) for jid in job_ids]
        else:
            jobs = Job.query.order_by(Job.id).all()
            assert len(jobs) == embs.shape[0], f"Job count ({len(jobs)}) != embeddings rows ({embs.shape[0]})"

        for i, (job, emb) in enumerate(zip(jobs, embs)):
            if job is None:
                print(f"Skipping missing job for index {i}")
                continue
            job.job_embedding = json.dumps(emb.tolist(), ensure_ascii=False)
            if (i + 1) % BATCH == 0:
                db.session.commit()
                print(f"Committed {i+1} job embeddings")
        db.session.commit()
        print(f"Finished importing {len(jobs)} job embeddings")


def import_user_embeddings(app, emb_path, mapping_path=None):
    embs = np.load(emb_path)
    if embs.dtype != np.float32:
        embs = embs.astype(np.float32)

    with app.app_context():
        if mapping_path:
            print("⚠️  Lưu ý: mapping_path bị bỏ qua vì InforUser không có user_id nữa")
            print("   Sử dụng thứ tự id của InforUser để match embeddings")
        
        # Align by InforUser.id ascending
        infors = InforUser.query.order_by(InforUser.id).all()
        assert len(infors) == embs.shape[0], f"InforUser count ({len(infors)}) != embeddings rows ({embs.shape[0]})"

        for i, (infor, emb) in enumerate(zip(infors, embs)):
            if infor is None:
                print(f"Skipping missing InforUser for index {i}")
                continue
            infor.user_embedding = json.dumps(emb.tolist(), ensure_ascii=False)
            if (i + 1) % BATCH == 0:
                db.session.commit()
                print(f"Committed {i+1} user embeddings")
        db.session.commit()
        print(f"Finished importing {len(infors)} user embeddings")


def main():
    app = _build_db_app()
    with app.app_context():
        parser = argparse.ArgumentParser(description='Import job/user embeddings into DB')
        parser.add_argument('--jobs', help='Path to job_text_emb.npy')
        parser.add_argument('--users', help='Path to user_text_emb.npy')
        parser.add_argument('--job-mapping', help='CSV file with job_id per row (optional)')
        parser.add_argument('--user-mapping', help='CSV file with user_id per row (optional)')
        parser.add_argument('--backend-path', help='Path to backend folder (default: .)', default='.')
        args = parser.parse_args()   

        if args.jobs:
            if not os.path.exists(args.jobs):
                raise SystemExit(f"Jobs file not found: {args.jobs}")
            import_job_embeddings(app, args.jobs, args.job_mapping)

        if args.users:
            if not os.path.exists(args.users):
                raise SystemExit(f"Users file not found: {args.users}")
            import_user_embeddings(app, args.users, args.user_mapping)

if __name__ == '__main__':
    main()
