# app/services/auth_service.py
from app import db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember, TeamRoleConfiguration
from app.models.invitation import InvitationCode, InvitationUsage
from app.utils.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token
from datetime import datetime, timedelta


class AuthService:
    """Service for authentication-related operations"""
    
    @staticmethod
    def login(email, password):
        """Authenticate a user and generate access tokens"""
        user = User.query.filter_by(email=email).first()
        
        if not user or not check_password_hash(user.password_hash, password):
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
                role_name = "Unknown"
                if membership.role_level == 1:
                    role_name = "Master Guide"
                elif membership.role_level == 2:
                    role_name = "Tactical Guide"
                elif membership.role_level == 3:
                    role_name = "Technical Guide"
                elif membership.role_level == 4:
                    role_name = "Base Guide"
                
                team_memberships.append({
                    'team_id': team.team_id,
                    'team_name': team.team_name,
                    'role_level': membership.role_level,
                    'role_name': role_name,
                    'is_master_guide': team.master_guide_id == user.user_id,
                    'team_status': team.team_status
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

        # Initialize variables
        role_type = 'explorer'  # Default role if no code
        invitation = None
        team_data = None

        # Validate invitation code if provided
        if invitation_code:
            invitation = InvitationCode.query.filter_by(code=invitation_code, is_active=True).first()
            if not invitation:
                return None, "Invalid or expired invitation code"
                
            # Check if invitation has reached max uses
            if invitation.used_count >= invitation.max_uses:
                return None, "Invitation code has reached maximum usage limit"
                
            # Check if invitation has expired
            if invitation.expires_at < datetime.utcnow():
                return None, "Invitation code has expired"
                
            # Set role_type based on invitation type
            if invitation.role_type == 'master_guide':
                role_type = 'guide'  # Master guides are also guides
            else:
                role_type = invitation.role_type

        try:
            # Create the new user
            new_user = User(
                email=email,
                password_hash=generate_password_hash(password),
                first_name=first_name,
                last_name=last_name,
                date_of_birth=date_of_birth,
                account_status='active'
            )
            db.session.add(new_user)
            db.session.flush()  # Get user_id without committing

            # Assign the explorer role by default
            explorer_role = UserRole(
                user_id=new_user.user_id,
                role_type='explorer'
            )
            db.session.add(explorer_role)
            
            # Add guide role if applicable
            if role_type == 'guide':
                guide_role = UserRole(
                    user_id=new_user.user_id,
                    role_type='guide'
                )
                db.session.add(guide_role)

            # If invitation was used, record its usage
            if invitation:
                # Increment usage counter
                invitation.used_count += 1
                
                # Record the invitation usage
                usage = InvitationUsage(
                    code_id=invitation.code_id,
                    user_id=new_user.user_id,
                    used_at=datetime.utcnow()
                )
                db.session.add(usage)
                
                # Handle team-related operations based on invitation type
                if invitation.role_type == 'master_guide':
                    # Create a new team for the master guide
                    team_name = f"{first_name}'s Team"
                    
                    # Check if this team name already exists
                    existing_team = Team.query.filter_by(team_name=team_name).first()
                    if existing_team:
                        team_name = f"{first_name}'s Team {new_user.user_id}"
                    
                    new_team = Team(
                        team_name=team_name,
                        master_guide_id=new_user.user_id,
                        team_status='active'
                    )
                    db.session.add(new_team)
                    db.session.flush()  # Get team_id without committing
                    
                    # Create default role configuration for the team - IMPORTANT
                    role_config = TeamRoleConfiguration(
                        team_id=new_team.team_id,
                        level_1_name="Master Guide",
                        level_2_name="Tactical Guide",
                        level_3_name="Technical Guide",
                        level_4_name="Base Guide"
                    )
                    db.session.add(role_config)
                    
                    # Add user as Master Guide (level 1) in the team - IMPORTANT
                    team_member = TeamMember(
                        team_id=new_team.team_id,
                        user_id=new_user.user_id,
                        role_level=1,  # Master Guide
                        joined_at=datetime.utcnow()
                    )
                    db.session.add(team_member)
                    
                    # Save team data for response
                    team_data = {
                        'team_id': new_team.team_id,
                        'team_name': new_team.team_name,
                        'role_level': 1,
                        'role_name': 'Master Guide',
                        'is_master_guide': True,
                        'team_status': 'active'
                    }
                    
                elif invitation.role_type == 'guide' and invitation.team_id:
                    # Add the user to the team specified in the invitation
                    team = Team.query.get(invitation.team_id)
                    if team:
                        # Default to level 4 (Base Guide) when joining a team
                        role_level = 4
                        
                        team_member = TeamMember(
                            team_id=team.team_id,
                            user_id=new_user.user_id,
                            role_level=role_level,
                            joined_at=datetime.utcnow()
                        )
                        db.session.add(team_member)
                        
                        # Save team data for response
                        team_data = {
                            'team_id': team.team_id,
                            'team_name': team.team_name,
                            'role_level': role_level,
                            'role_name': 'Base Guide',
                            'is_master_guide': False,
                            'team_status': team.team_status
                        }

            # Explicitly commit the transaction to ensure all records are saved
            db.session.commit()

            # Generate tokens
            access_token = create_access_token(identity=new_user.user_id)
            refresh_token = create_refresh_token(identity=new_user.user_id)

            # Create response
            roles = ['explorer']
            if role_type == 'guide':
                roles.append('guide')
            
            response = {
                "user_id": new_user.user_id,
                "first_name": new_user.first_name,
                "last_name": new_user.last_name,
                "email": new_user.email,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "roles": roles
            }
            
            # Add team info if created or joined
            if team_data:
                response["teams"] = [team_data]

            return response, None

        except Exception as e:
            db.session.rollback()
            return None, f"An error occurred during registration: {str(e)}"