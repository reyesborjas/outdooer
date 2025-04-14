from flask import jsonify, request
from . import auth_bp
from app.services.auth_service import AuthService
from datetime import datetime

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    data = request.get_json()
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"error": "Missing email or password"}), 400
    
    result, error = AuthService.login(data['email'], data['password'])
    
    if error:
        return jsonify({"error": error}), 401
    
    return jsonify(result), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'password', 'first_name', 'last_name', 'date_of_birth']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Parse date of birth
    try:
        date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"error": "Invalid date format for date_of_birth. Use YYYY-MM-DD"}), 400
    
    result, error = AuthService.register(
        data['email'],
        data['password'],
        data['first_name'],
        data['last_name'],
        date_of_birth
    )
    
    if error:
        return jsonify({"error": error}), 400
    
    return jsonify(result), 201

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current user info"""
    # This would typically use JWT to identify the user
    # For now, return a placeholder
    return jsonify({"error": "Not implemented yet"}), 501