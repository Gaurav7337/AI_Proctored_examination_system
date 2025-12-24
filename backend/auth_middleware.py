from functools import wraps
from flask import request, jsonify
from models import User, db

def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 1. Look for 'user-id' in the request headers
        user_id = request.headers.get('user-id')

        if not user_id:
            return jsonify(message="Missing user-id header"), 401

        # 2. Check if this user actually exists in the DB
        try:
            user = db.session.get(User, int(user_id))
            if not user:
                return jsonify(message="Invalid User ID"), 401
        except:
            return jsonify(message="Invalid ID format"), 401

        # 3. If user exists, let the request pass!
        return f(*args, **kwargs)
    return decorated_function