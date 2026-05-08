from flask import Flask
from app.models import db
from app.routes import main, _ensure_user_recommendations_column, _ensure_user_saved_jobs_column, _get_recommendation_model
from app.config import Config
from flask_cors import CORS

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
CORS(app)

app.register_blueprint(main)

with app.app_context():
    _ensure_user_recommendations_column()
    _ensure_user_saved_jobs_column()
    _get_recommendation_model()

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)