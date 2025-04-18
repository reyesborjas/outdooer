# app/services/auth_service.py
from app import db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember, TeamRoleConfiguration
from app.models.invitation import InvitationCode, InvitationUsage
from app.utils.security import generate_password_hash, verify_password
from flask_jwt_extended import create_access_token, create_refresh_token
from datetime import datetime, timedelta

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
            "roles": roles
        }, None
    
    @staticmethod
    def register_with_code(email, password, first_name, last_name, date_of_birth, invitation_code=None):
        """Register a new user with optional invitation code"""
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return None, "Email already registered"
        
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
            
            # Default role
            role_type = 'explorer'
            team_id = None
            
            # If invitation code is provided, validate and process it
            if invitation_code:
                code = InvitationCode.query.filter_by(code=invitation_code, is_active=True).first()
                
                if not code:
                    return None, "Invalid invitation code"
                    
                if code.expires_at and code.expires_at < datetime.utcnow():
                    return None, "Invitation code has expired"
                    
                if code.used_count >= code.max_uses:
                    return None, "Invitation code has reached maximum usage"
                
                # Set role based on invitation type
                role_type = code.role_type if code.role_type in ['guide', 'master_guide'] else 'guide'
                
                # If this is a team leader code
                if code.role_type == 'master_guide':
                    # Create new team for the user
                    new_team = Team(
                        team_name=f"{first_name}'s Team",
                        master_guide_id=new_user.user_id
                    )
                    db.session.add(new_team)
                    db.session.flush()
                    
                    # Add user as master guide to the team
                    team_member = TeamMember(
                        team_id=new_team.team_id,
                        user_id=new_user.user_id,
                        role_level=1  # Master Guide level
                    )
                    db.session.add(team_member)
                    
                    # Set up team role configuration
                    role_config = TeamRoleConfiguration(
                        team_id=new_team.team_id
                    )
                    db.session.add(role_config)
                    
                    team_id = new_team.team_id
                else:
                    # For regular guides, add them to the specified team
                    if code.team_id:
                        team_member = TeamMember(
                            team_id=code.team_id,
                            user_id=new_user.user_id,
                            role_level=4  # Base Guide level by default
                        )
                        db.session.add(team_member)
                        team_id = code.team_id
                
                # Record invitation usage
                code.used_count += 1
                usage = InvitationUsage(code_id=code.code_id, user_id=new_user.user_id)
                db.session.add(usage)
            
            # Add user role
            user_role = UserRole(
                user_id=new_user.user_id,
                role_type=role_type
            )
            db.session.add(user_role)
            
            # Add explorer role if registering as guide (all guides are also explorers)
            if role_type != 'explorer':
                explorer_role = UserRole(
                    user_id=new_user.user_id,
                    role_type='explorer'
                )
                db.session.add(explorer_role)
            
            db.session.commit()
            
            # Get user roles for response
            user_roles = UserRole.query.filter_by(user_id=new_user.user_id).all()
            roles = [role.role_type for role in user_roles]
            
            # Create tokens for the new user
            access_token = create_access_token(identity=new_user.user_id)
            refresh_token = create_refresh_token(identity=new_user.user_id)
            
            return {
                "user_id": new_user.user_id,
                "first_name": new_user.first_name,
                "last_name": new_user.last_name,
                "email": new_user.email,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "roles": roles,
                "team_id": team_id
            }, None
            
        except Exception as e:
            import traceback
            traceback.print_exc()  # Esto imprimirá el traceback completo en consola
            db.session.rollback()
            return None, str(e)

