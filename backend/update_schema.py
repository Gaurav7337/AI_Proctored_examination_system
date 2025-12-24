from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        print("🛠️  Attempting to add 'end_date' column to 'exam' table...")
        
        # This raw SQL command adds the missing column
        # We set a default value (NOW) so existing exams don't crash
        sql = text("ALTER TABLE exam ADD COLUMN end_date TIMESTAMP DEFAULT NOW();")
        
        db.session.execute(sql)
        db.session.commit()
        
        print("✅ Success! Column 'end_date' added.")
        print("🚀 You can now run 'python app.py' without errors.")
        
    except Exception as e:
        print(f"⚠️  Error (Column might already exist): {e}")