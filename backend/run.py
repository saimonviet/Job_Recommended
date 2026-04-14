from flask import Flask
from app.models import db
from app.routes import main
from app.config import Config
from flask_cors import CORS

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
CORS(app)

app.register_blueprint(main)

if __name__ == "__main__":
    app.run(debug=True)