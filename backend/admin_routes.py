from flask import Blueprint, request, jsonify
from models import db, User, Exam, Result
from auth_middleware import auth_required

admin_bp = Blueprint('admin', __name__)

# --- 1. GET ALL USERS ---
@admin_bp.route('/users', methods=['GET'])
@auth_required
def get_all_users():
    try:
        users = db.session.execute(db.select(User)).scalars().all()
        return jsonify([{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'role': u.role,
            'enrollment_id': u.enrollment_id
        } for u in users]), 200
    except Exception as e:
        return jsonify(message=str(e)), 500

# --- 2. CREATE USER (Any Role) ---
@admin_bp.route('/users', methods=['POST'])
@auth_required
def create_user():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'student') # Default to student
        enrollment_id = data.get('enrollment_id')

        # Checks
        if User.query.filter_by(username=username).first():
            return jsonify(message="Username already exists"), 400
        if enrollment_id and User.query.filter_by(enrollment_id=enrollment_id).first():
            return jsonify(message="Enrollment ID already exists"), 400

        # Create
        new_user = User(
            username=username,
            email=f"{username}@exam.com", # Auto-generate email
            role=role,
            enrollment_id=enrollment_id
        )
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify(message="User created successfully!"), 201
    except Exception as e:
        return jsonify(message=str(e)), 500

# --- 3. DELETE USER ---
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@auth_required
def delete_user(user_id):
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify(message="User not found"), 404
            
        # Optional: Prevent deleting yourself (Security)
        # requester_id = request.headers.get('user-id')
        # if str(requester_id) == str(user_id):
        #    return jsonify(message="Cannot delete yourself"), 403

        db.session.delete(user)
        db.session.commit()
        return jsonify(message="User deleted"), 200
    except Exception as e:
        return jsonify(message=str(e)), 500

# --- 4. SYSTEM STATS ---
@admin_bp.route('/stats', methods=['GET'])
def get_stats():
    try:
        total_users = db.session.query(User).count()
        total_exams = db.session.query(Exam).count()
        total_results = db.session.query(Result).count()
        
        return jsonify({
            "users": total_users,
            "exams": total_exams,
            "results": total_results
        }), 200
    except:
        return jsonify(message="Error"), 500