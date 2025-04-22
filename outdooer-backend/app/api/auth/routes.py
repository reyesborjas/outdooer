from flask import jsonify, request
from . import auth_bp
from app.services.auth_service import AuthService
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember  # Añade esta línea de importación
from app import db

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({"error": "Invalid credentials"}), 401
        
    access_token = create_access_token(identity=user.user_id)
    return jsonify({
        "access_token": access_token,
        "user_id": user.user_id
    }), 200

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

# Actualización para la función get_current_user en app/api/auth/routes.py

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info from JWT token"""
    current_user_id = get_jwt_identity()
    
    try:
        # Obtener información básica del usuario
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Preparar datos básicos del usuario (sin información sensible)
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
        
        # Obtener roles del usuario de forma segura
        try:
            user_roles = UserRole.query.filter_by(user_id=current_user_id).all()
            user_data["roles"] = [role.role_type for role in user_roles] if user_roles else []
        except Exception as role_error:
            print(f"Error fetching user roles: {str(role_error)}")
            # Continuar con la ejecución y devolver los roles como lista vacía
        
        # Obtener pertenencias a equipos de forma segura
        try:
            team_memberships = []
            
            # Buscar membresías de equipo
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
                    # Continuar con el siguiente equipo
            
            user_data["teams"] = team_memberships
        except Exception as teams_error:
            print(f"Error fetching team memberships: {str(teams_error)}")
            # Continuar con la ejecución y devolver los equipos como lista vacía
        
        return jsonify(user_data), 200
        
    except Exception as e:
        print(f"Error retrieving user data: {str(e)}")
        return jsonify({"error": "Error retrieving user data"}), 500