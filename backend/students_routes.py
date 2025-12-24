from flask import Blueprint, request, jsonify
from models import db, User
from auth_middleware import auth_required

student_bp = Blueprint('students', __name__)

@student_bp.route('/bulk_add', methods=['POST'])
@auth_required
def bulk_add_students():
    try:
        data = request.get_json()
        students_list = data.get('students', [])
        
        added_count = 0
        errors = []

        print(f"--- 🚀 BULK ADDING {len(students_list)} STUDENTS ---")

        for s in students_list:
            username = s.get('username')
            password = s.get('password')
            enrollment_id = s.get('enrollment_id')
            
            if not username or not password:
                continue

            # Check if user exists
            if User.query.filter_by(username=username).first():
                errors.append(f"User '{username}' skipped (Exists)")
                continue

            # Create User
            email = f"{username}@student.com"
            new_user = User(username=username, email=email, enrollment_id=enrollment_id, role='student')
            new_user.set_password(password)
            db.session.add(new_user)
            added_count += 1

        db.session.commit()
        return jsonify({"message": f"Added {added_count} students.", "errors": errors}), 200

    except Exception as e:
        return jsonify(message=str(e)), 500

@student_bp.route('/list', methods=['GET'])
def list_students():
    try:
        students = db.session.execute(db.select(User).filter_by(role='student')).scalars().all()
        return jsonify([{
            'id': s.id, 'username': s.username, 'enrollment_id': s.enrollment_id
        } for s in students]), 200
    except:
        return jsonify(message="Error"), 500
    
# --- DELETE STUDENT ---
@student_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_student(user_id):
    try:
        # Find user
        user = db.session.get(User, user_id)
        if not user:
            return jsonify(message="User not found"), 404
            
        # Optional: Check if they have exam results before deleting? 
        # For now, we just delete them.
        db.session.delete(user)
        db.session.commit()
        
        return jsonify(message="Student deleted successfully"), 200
    except Exception as e:
        db.session.rollback()
        return jsonify(message=f"Error: {str(e)}"), 500