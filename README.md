# PBL7

cd backend
pip install -r requirements.txt

cd import_db
python .\create_db.py

pip install --upgrade pandas numpy

python .\import_users.py
python .\import_jobs.py
