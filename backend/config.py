import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database Configuration
    # We use a default fallback if no .env file is present
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'postgresql://postgres:gaurav73722@localhost:5432/intranet_exam_db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Security Configuration
    # CRITICAL FIX: We use a static string here so tokens don't expire on restart.
    # (In production, you would set these in your .env file)
    SECRET_KEY = 'super-secret-hardcoded-key-123'
    JWT_SECRET_KEY = 'super-secret-jwt-key-456'
    
    # Frontend/CORS Configuration
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')