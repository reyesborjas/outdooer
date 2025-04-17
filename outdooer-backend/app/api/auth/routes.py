from flask import jsonify, request
from . import auth_bp
from app.services.auth_service import AuthService
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app import db

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
    
    # Check for invitation code
    invitation_code = data.get('invitation_code')
    
    # Use register_with_code instead of register
    result, error = AuthService.register_with_code(
        data['email'],
        data['password'],
        data['first_name'],
        data['last_name'],
        date_of_birth,
        invitation_code
    )
    
    if error:
        return jsonify({"error": error}), 400
    
    return jsonify(result), 201

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info from JWT token"""
    current_user_id = get_jwt_identity()
    
    try:
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Return user data (excluding sensitive information)
        return jsonify({
            "user_id": user.user_id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "profile_image_url": user.profile_image_url,
            "account_status": user.account_status
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error retrieving user data: {str(e)}"}), 500