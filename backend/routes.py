from flask import Blueprint, request, jsonify, Response
from datetime import datetime
from models import db, User, Exam, Result
from camera import VideoCamera
# Import the new Auth Helper
from auth_middleware import auth_required

auth_bp = Blueprint('auth', __name__)
exam_bp = Blueprint('exam', __name__)

# --- LOGIN (No Token, Just User Data) ---
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = db.session.execute(db.select(User).filter_by(username=data.get('username'))).scalar_one_or_none()

        if user and user.check_password(data.get('password')):
            # RETURN PURE USER DATA
            return jsonify(user={'id': user.id, 'username': user.username, 'role': user.role}), 200
        return jsonify(message='Invalid credentials'), 401
    except Exception as e:
        print(f"LOGIN ERROR: {e}")
        return jsonify(message="Login failed"), 500

# --- CREATE EXAM (FIXED: Now saves end_date) ---
@exam_bp.route('', methods=['POST'])
@auth_required 
def create_exam():
    try:
        data = request.get_json()
        # Get creator ID from header directly
        creator_id = request.headers.get('user-id') 

        # 1. Parse Dates safely
        start_dt = datetime.now()
        end_dt = None

        if 'start_date' in data:
            try: start_dt = datetime.fromisoformat(data['start_date'])
            except: pass
        
        # FIX: Capture end_date from frontend
        if 'end_date' in data:
            try: end_dt = datetime.fromisoformat(data['end_date'])
            except: pass

        new_exam = Exam(
            title=data.get('title', 'Untitled'),
            duration_minutes=int(data.get('duration', 60)),
            start_date=start_dt,
            end_date=end_dt, # <--- FIX: Save the end date to DB
            is_visible=True,
            creator_id=creator_id
        )
        db.session.add(new_exam)
        db.session.commit()
        return jsonify(message='Exam created!', exam_id=new_exam.id), 201
    except Exception as e:
        return jsonify(message=str(e)), 500

# --- GET EXAMS (FIXED: Now sends end_date) ---
@exam_bp.route('', methods=['GET'])
@auth_required
def get_exams():
    try:
        user_id = request.headers.get('user-id')
        user = db.session.get(User, user_id)

        exams = db.session.execute(db.select(Exam)).scalars().all()
        exams_list = []
        
        for e in exams:
            has_attempted = False
            if user.role == 'student':
                if db.session.query(Result).filter_by(student_id=user.id, exam_id=e.id).first():
                    has_attempted = True
            
            # FIX: Include end_date in the response
            # We check "if e.end_date" exists before calling .isoformat() to prevent crashes on old data
            exams_list.append({
                'id': e.id, 
                'title': e.title, 
                'duration': e.duration_minutes,
                'start_date': e.start_date.isoformat() if e.start_date else None,
                'end_date': e.end_date.isoformat() if e.end_date else None, # <--- FIX: Send end_date to frontend
                'attempted': has_attempted
            })
        
        return jsonify(exams_list), 200
    except Exception as e:
        print(f"GET EXAMS ERROR: {e}")
        return jsonify(message="Error"), 500

# --- DELETE EXAM ---
@exam_bp.route('/<int:exam_id>', methods=['DELETE'])
def delete_exam(exam_id):
    try:
        exam = db.session.get(Exam, exam_id)
        if exam:
            db.session.query(Result).filter_by(exam_id=exam_id).delete()
            db.session.delete(exam)
            db.session.commit()
            return jsonify(message="Deleted"), 200
        return jsonify(message="Not found"), 404
    except Exception as e:
        return jsonify(message=str(e)), 500

# --- VIDEO ---
def gen(camera):
    while True:
        frame = camera.get_frame()
        if frame: yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@exam_bp.route('/video_feed')
def video_feed():
    return Response(gen(VideoCamera()), mimetype='multipart/x-mixed-replace; boundary=frame')