from app import create_app, db
from models import User
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("🔧 STARTING DATABASE SETUP...")
    
    # 1. Force Delete Old Tables (To fix the column size issue)
    print("🗑️ Dropping old tables...")
    db.drop_all()
    
    # 2. Create New Tables (With 500 char limit)
    print("✨ Creating new tables...")
    db.create_all()
    
    # 3. Create Admin User
    print("👤 Creating Admin...")
    if not User.query.filter_by(username='admin').first():
        admin = User(enrollment_id='AD001', username='admin', email='admin@exam.com', role='admin')
        admin.set_password('adminpass')
        db.session.add(admin)
        db.session.commit()
        print("✅ Admin Created: admin / adminpass")
    else:
        print("ℹ️ Admin already exists.")
        
    print("🎉 SETUP COMPLETE. You can now run 'python app.py'")