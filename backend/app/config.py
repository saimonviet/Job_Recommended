import os
import dotenv
dotenv.load_dotenv() 


class Config:
    # -------------------------------------------------------------------------
    # Bảo mật
    # -------------------------------------------------------------------------
    SECRET_KEY = os.environ.get('SECRET_KEY')

    JWT_EXPIRY_HOURS = int(os.environ.get('JWT_EXPIRY_HOURS'))

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False



    # -------------------------------------------------------------------------
    # Upload
    # -------------------------------------------------------------------------
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024   # 10 MB tối đa mỗi file upload

    # -------------------------------------------------------------------------
    # Flask
    # -------------------------------------------------------------------------
    DEBUG = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    TESTING = False


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False
    # Nên dùng PostgreSQL hoặc MySQL trên production
    # SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', '')
