from flask import Flask
from flask_cors import CORS
from config import Config
from models import db
from students_routes import student_bp
from admin_routes import admin_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize Database
    db.init_app(app)
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {
        "origins": "*",
        "allow_headers": ["Content-Type", "user-id"], 
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }})

    # Import Blueprints
    from routes import auth_bp, exam_bp
    from question_routes import question_bp
    from attempt_routes import attempt_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(exam_bp, url_prefix='/api/exams')
    app.register_blueprint(question_bp, url_prefix='/api/exams')
    app.register_blueprint(attempt_bp, url_prefix='/api/attempts')
    app.register_blueprint(student_bp, url_prefix='/api/students')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    return app

if __name__ == '__main__':
    # ✅ CLEAN STARTUP (No database operations here)
    app = create_app()
    print("🚀 Server Starting on Port 5000...")
    app.run(debug=True, host='0.0.0.0', port=5000)