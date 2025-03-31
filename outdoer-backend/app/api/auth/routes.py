# app/api/auth/routes.py
from flask import jsonify, request
from . import auth_bp
from app.services.auth_service import AuthService

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    # Just a placeholder for now
    return jsonify({"message": "Login endpoint - to be implemented"})

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    # Just a placeholder for now
    return jsonify({"message": "Registration endpoint - to be implemented"})