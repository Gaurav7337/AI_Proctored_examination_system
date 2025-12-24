from flask import Blueprint, request, jsonify
from models import db, Question, Result, User, Exam
from auth_middleware import auth_required

question_bp = Blueprint('questions', __name__)

@question_bp.route('/proctor_status', methods=['GET'])
def check_status():
    from camera import last_status
    return jsonify(status=last_status)

@question_bp.route('/<int:exam_id>/questions', methods=['POST'])
def add_question(exam_id):
    try:
        data = request.get_json()
        new_q = Question(exam_id=exam_id, text=data.get('text'), 
                         option_a=data.get('option_a'), option_b=data.get('option_b'),
                         option_c=data.get('option_c'), option_d=data.get('option_d'),
                         correct_option=data.get('correct_option'))
        db.session.add(new_q)
        db.session.commit()
        return jsonify(message="Added"), 201
    except Exception as e: return jsonify(message=str(e)), 500

# --- GET QUESTIONS (Standard GET) ---
@question_bp.route('/<int:exam_id>/questions', methods=['GET'])
@auth_required
def get_questions(exam_id):
    try:
        questions = db.session.execute(db.select(Question).filter_by(exam_id=exam_id)).scalars().all()
        return jsonify([{ 'id': q.id, 'text': q.text, 'options': {'A': q.option_a, 'B': q.option_b, 'C': q.option_c, 'D': q.option_d} } for q in questions]), 200
    except Exception as e: return jsonify(message="Error"), 500

@question_bp.route('/<int:exam_id>/submit', methods=['POST'])
@auth_required
def submit_exam(exam_id):
    try:
        student_id = request.headers.get('user-id') 
        data = request.get_json() 
        user_answers = data.get('answers', {})
        questions = db.session.execute(db.select(Question).filter_by(exam_id=exam_id)).scalars().all()
        score = sum(1 for q in questions if user_answers.get(str(q.id)) == q.correct_option)
        db.session.add(Result(exam_id=exam_id, student_id=student_id, score=score, total_questions=len(questions)))
        db.session.commit()
        return jsonify(message="Submitted"), 200
    except Exception as e: return jsonify(message=str(e)), 500

@question_bp.route('/<int:exam_id>/results', methods=['GET'])
def get_results(exam_id):
    results = db.session.query(Result, User).join(User, Result.student_id == User.id).filter(Result.exam_id == exam_id).all()
    output = [{ 'result_id': r.id, 'student_name': u.username, 'enrollment_id': u.enrollment_id, 'score': r.score, 'total': r.total_questions, 'date': r.date_taken.strftime("%Y-%m-%d") } for r, u in results]
    return jsonify(output), 200

@question_bp.route('/results/<int:result_id>', methods=['DELETE'])
def delete_result(result_id):
    db.session.query(Result).filter_by(id=result_id).delete()
    db.session.commit()
    return jsonify(message="Deleted"), 200

@question_bp.route('/question/<int:question_id>', methods=['DELETE'])
def delete_question(question_id):
    db.session.query(Question).filter_by(id=question_id).delete()
    db.session.commit()
    return jsonify(message="Deleted"), 200

@question_bp.route('/question/<int:question_id>', methods=['PUT'])
def update_question(question_id):
    q = db.session.get(Question, question_id)
    if q:
        data = request.get_json()
        q.text = data.get('text', q.text)
        q.option_a = data.get('option_a', q.option_a)
        q.option_b = data.get('option_b', q.option_b)
        q.option_c = data.get('option_c', q.option_c)
        q.option_d = data.get('option_d', q.option_d)
        q.correct_option = data.get('correct_option', q.correct_option)
        db.session.commit()
        return jsonify(message="Updated"), 200
    return jsonify(message="Error"), 500