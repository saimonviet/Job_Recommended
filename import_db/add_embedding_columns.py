#!/usr/bin/env python
"""
Migration script to add embedding columns to job and infor_user tables.
Run this before importing embeddings.

Usage:
    python add_embedding_columns.py
"""

import os
import sys

# Add paths for imports
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND = os.path.join(ROOT, 'backend')
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
if BACKEND not in sys.path:
    sys.path.insert(0, BACKEND)

from run import create_app
from app.models import db
from sqlalchemy import text

app = create_app()

def migrate():
    """Add embedding columns if they don't exist"""
    with app.app_context():
        db_url = str(db.engine.url)
        
        if 'mysql' in db_url:
            print("🔧 Detected MySQL database, adding columns...")
            with db.engine.begin() as conn:
                # Add job_embedding column
                try:
                    conn.execute(text(
                        "ALTER TABLE job ADD COLUMN job_embedding LONGTEXT COMMENT 'JSON-encoded TF-IDF embedding'"
                    ))
                    print("✓ Added job_embedding column to job table")
                except Exception as e:
                    if "Duplicate column" in str(e) or "already exists" in str(e):
                        print("⊘ job_embedding column already exists")
                    else:
                        print(f"❌ Error adding job_embedding: {e}")
                
                # Add user_embedding column
                try:
                    conn.execute(text(
                        "ALTER TABLE infor_user ADD COLUMN user_embedding LONGTEXT COMMENT 'JSON-encoded TF-IDF embedding'"
                    ))
                    print("✓ Added user_embedding column to infor_user table")
                except Exception as e:
                    if "Duplicate column" in str(e) or "already exists" in str(e):
                        print("⊘ user_embedding column already exists")
                    else:
                        print(f"❌ Error adding user_embedding: {e}")
        
        elif 'sqlite' in db_url:
            print("🔧 Detected SQLite database, adding columns...")
            with db.engine.begin() as conn:
                try:
                    conn.execute(text("ALTER TABLE job ADD COLUMN job_embedding TEXT"))
                    print("✓ Added job_embedding column to job table")
                except Exception as e:
                    if "Duplicate column" in str(e) or "already exists" in str(e):
                        print("⊘ job_embedding column already exists")
                    else:
                        print(f"❌ Error adding job_embedding: {e}")
                
                try:
                    conn.execute(text("ALTER TABLE infor_user ADD COLUMN user_embedding TEXT"))
                    print("✓ Added user_embedding column to infor_user table")
                except Exception as e:
                    if "Duplicate column" in str(e) or "already exists" in str(e):
                        print("⊘ user_embedding column already exists")
                    else:
                        print(f"❌ Error adding user_embedding: {e}")
        else:
            print(f"❌ Unknown database type: {db_url}")
        
        print("\n✅ Migration complete!")

if __name__ == '__main__':
    migrate()
