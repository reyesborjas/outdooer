# app/services/auth_service.py
from app import db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember, TeamRoleConfiguration
from app.models.invitation import InvitationCode, InvitationUsage
from app.utils.security import generate_password_hash, verify_password
from flask_jwt_extended import create_access_token, create_refresh_token
from datetime import datetime, timedelta
from utils.generate_invitation import generate_invitation_code


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
        
        # Check invitation code validity before proceeding
        if invitation_code:
            code = InvitationCode.query.filter_by(code=invitation_code, is_active=True).first()
            if not code:
                return None, "Invalid invitation code"
            temp_role_type = 'guide'  # Set role based on invitation code or defaults
            temp_created_by = code.created_by  # Assign the user who generated the code
        else:
            temp_role_type = 'guide'  # Default role if no invitation code
            temp_created_by = 'temp_user'  # Temporary placeholder for user_id

        # Create transaction to ensure all operations succeed or fail together
        try:
            # Create new user
            new_user = User(
                email=email,
                password_hash=generate_password_hash(password),
                first_name=first_name,
                last_name=last_name,
                date_of_birth=date_of_birth,
                account_status='active'
            )
            
            db.session.add(new_user)
            db.session.flush()  # Get user ID without committing
            
            # If there was a valid invitation code, update the invitation with the real user ID
            if invitation_code:
                code.created_by = new_user.user_id  # Now we have the real user_id
                db.session.commit()  # Commit the changes to the invitation code

            # Add user role
            user_role = UserRole(
                user_id=new_user.user_id,
                role_type=temp_role_type  # The role may be updated later if needed
            )
            db.session.add(user_role)
            
            db.session.commit()
            
            # Create tokens for the new user
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
            return None, f"An unexpected error occurred: {str(e)}"
