# PBL7


pip install --upgrade pandas numpy
cd import_db

python .\reset_db.py
python .\create_db.py



python .\import_users.py
python .\import_jobs.py


cd backend
pip install -r requirements.txt
python run.py

cd frontend
npm install 
npm start
