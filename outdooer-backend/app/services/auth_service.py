# app/services/auth_service.py
from app import db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember, TeamRoleConfiguration
from app.models.invitation import InvitationCode, InvitationUsage
from app.utils.security import generate_password_hash, verify_password
from flask_jwt_extended import create_access_token, create_refresh_token
from datetime import datetime, timedelta
from app.utils.generate_invitation import generate_code as generate_invitation_code


class AuthService:
    """Service for authentication-related operations"""
    
    @staticmethod
    def login(email, password):
        """Authenticate a user and generate access tokens"""
        user = User.query.filter_by(email=email).first()
        
        if not user or not verify_password(user.password_hash, password):
            return None, "Invalid email or password"
        
        # Get user roles
        user_roles = UserRole.query.filter_by(user_id=user.user_id).all()
        roles = [role.role_type for role in user_roles]
        
        # Get team memberships and role levels
        team_memberships = []
        memberships = TeamMember.query.filter_by(user_id=user.user_id).all()
        
        for membership in memberships:
            team = Team.query.get(membership.team_id)
            if team:
                team_memberships.append({
                    'team_id': team.team_id,
                    'team_name': team.team_name,
                    'role_level': membership.role_level,
                    'is_master_guide': team.master_guide_id == user.user_id
                })
        
        # Create tokens
        access_token = create_access_token(identity=user.user_id)
        refresh_token = create_refresh_token(identity=user.user_id)
        
        # Update last login timestamp
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "roles": roles,
            "teams": team_memberships
        }, None
    
@staticmethod
def register_with_code(email, password, first_name, last_name, date_of_birth, invitation_code=None):
    """Register a new user with optional invitation code"""
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return None, "Email already registered"

    # Determinar el rol por defecto o el del código
    role_type = 'explorer'
    invitation = None

    if invitation_code:
        invitation = InvitationCode.query.filter_by(code=invitation_code, is_active=True).first()
        if not invitation:
            return None, "Invalid or expired invitation code"
        role_type = invitation.role_type

    try:
        # Crear el nuevo usuario
        new_user = User(
            email=email,
            password_hash=generate_password_hash(password),
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            account_status='active'
        )
        db.session.add(new_user)
        db.session.flush()  # Para obtener el user_id antes de hacer commit

        # Asignar el rol
        user_role = UserRole(
            user_id=new_user.user_id,
            role_type=role_type
        )
        db.session.add(user_role)

        # Si se usó código, registrar el uso
        if invitation:
            # Incrementar contador de uso
            invitation.used_count += 1

            # Registrar el uso del código
            usage = InvitationUsage(
                invitation_code_id=invitation.code_id,
                user_id=new_user.user_id,
                usage_date=datetime.utcnow()
            )
            db.session.add(usage)

        db.session.commit()

        # Generar tokens
        access_token = create_access_token(identity=new_user.user_id)
        refresh_token = create_refresh_token(identity=new_user.user_id)

        return {
            "user_id": new_user.user_id,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "email": new_user.email,
            "access_token": access_token,
            "refresh_token": refresh_token
        }, None

    except Exception as e:
        db.session.rollback()
        return None, str(e)
