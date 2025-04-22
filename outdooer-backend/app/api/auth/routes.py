# app/api/auth/routes.py
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from datetime import datetime
from app import db
from app.utils.security import check_password_hash
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app.services.auth_service import AuthService
from . import auth_bp

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        # Get request data
        data = request.get_json()
        
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({"error": "Email and password are required"}), 400
        
        # Find user by email
        user = User.query.filter_by(email=data['email']).first()
        
        # Validate credentials
        if not user or not check_password_hash(user.password_hash, data['password']):
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Create access token
        access_token = create_access_token(identity=user.user_id)
        
        # Update last login timestamp
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Return token and user ID
        return jsonify({
            "access_token": access_token,
            "user_id": user.user_id
        }), 200
    except Exception as e:
        # Log the error
        print(f"Login error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "An error occurred during login"}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        # Get request data
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
        
        # Use auth service to register user
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
    except Exception as e:
        # Log the error
        print(f"Registration error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "An error occurred during registration"}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info from JWT token"""
    try:
        # Get user ID from JWT token
        current_user_id = get_jwt_identity()
        
        # Get user from database
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Prepare basic user data (without sensitive information)
        user_data = {
            "user_id": user.user_id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "profile_image_url": user.profile_image_url,
            "account_status": user.account_status,
            "roles": [],
            "teams": []
        }
        
        # Safely get user roles
        try:
            user_roles = UserRole.query.filter_by(user_id=current_user_id).all()
            user_data["roles"] = [role.role_type for role in user_roles] if user_roles else []
        except Exception as role_error:
            print(f"Error fetching user roles: {str(role_error)}")
        
        # Safely get team memberships
        try:
            team_memberships = []
            
            # Query team memberships
            for membership in TeamMember.query.filter_by(user_id=current_user_id).all():
                try:
                    team = Team.query.get(membership.team_id)
                    if team:
                        team_memberships.append({
                            'team_id': team.team_id,
                            'team_name': team.team_name,
                            'role_level': membership.role_level,
                            'is_master_guide': team.master_guide_id == current_user_id
                        })
                except Exception as team_error:
                    print(f"Error processing team {membership.team_id}: {str(team_error)}")
            
            user_data["teams"] = team_memberships
        except Exception as teams_error:
            print(f"Error fetching team memberships: {str(teams_error)}")
        
        return jsonify(user_data), 200
    except Exception as e:
        print(f"Error retrieving user data: {str(e)}")
        return jsonify({"error": "Error retrieving user data"}), 500