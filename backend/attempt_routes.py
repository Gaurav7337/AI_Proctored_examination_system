from flask import Blueprint, jsonify, request
from models import db, Result
from auth_middleware import auth_required

attempt_bp = Blueprint('attempts', __name__)

@attempt_bp.route('/my_attempts', methods=['GET'])
@auth_required
def get_my_attempts():
    student_id = request.headers.get('user-id')
    results = db.session.query(Result.exam_id).filter_by(student_id=student_id).all()
    return jsonify([r[0] for r in results]), 200