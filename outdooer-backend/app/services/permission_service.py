# app/services/permission_service.py - Updated to use the new models
from app.models.team_member import TeamMember
from app.models.team_role_permissions import TeamRolePermissions
from app.models.team_role_permissions import TeamRolePermissions
from app.database import db

class PermissionService:
    """
    Service class for handling permission checks throughout the application.
    This centralizes permission logic to ensure consistent enforcement across all controllers.
    """
    
    @staticmethod
    def get_role_level(user_id, team_id):
        """
        Get a user's role level in a specific team
        
        Args:
            user_id: The ID of the user
            team_id: The ID of the team
            
        Returns:
            int or None: The user's role level, or None if not a team member
        """
        team_membership = TeamMember.query.filter_by(
            user_id=user_id,
            team_id=team_id
        ).first()
        
        return team_membership.role_level if team_membership else None
    
    @staticmethod
    def check_permission(user_id, team_id, permission_key):
        """
        Check if a user has permission to perform an operation based on role configuration
        
        Args:
            user_id: The ID of the user
            team_id: The ID of the team
            permission_key: The operation to check (e.g., 'create_expedition')
            
        Returns:
            tuple: (has_permission, role_level, error_message)
        """
        # Get user's role level in this team
        role_level = PermissionService.get_role_level(user_id, team_id)
        
        if role_level is None:
            return False, None, "You are not a member of this team"
        
        # Check if this role level has the permission enabled for this team
        team_permission = TeamRolePermissions.query.filter_by(
            team_id=team_id,
            role_level=role_level,
            permission_key=permission_key
        ).first()
        
        # If team-specific permission exists, use it
        if team_permission:
            has_permission = team_permission.is_enabled
        else:
            # Fall back to global role permission
            global_permission = TeamRolePermissions.query.filter_by(
                team_id=None,
                role_level=role_level,
                permission_key=permission_key
            ).first()
            
            has_permission = global_permission.is_enabled if global_permission else False
        
        if not has_permission:
            # Get role name for better error message
            role_names = {1: 'Master Guide', 2: 'Tactical Guide', 3: 'Technical Guide', 4: 'Base Guide'}
            role_name = role_names.get(role_level, f'Level {role_level}')
            
            return False, role_level, f"{role_name}s do not have permission to {permission_key.replace('_', ' ')}"
        
        return True, role_level, None
    
    @staticmethod
    def can_user_create_expedition(user_id, team_id):
        """
        Check if a user can create an expedition for a team
        
        Args:
            user_id: The ID of the user
            team_id: The ID of the team
            
        Returns:
            bool: True if allowed, False otherwise
        """
        has_permission, _, _ = PermissionService.check_permission(user_id, team_id, 'create_expedition')
        return has_permission
    
    @staticmethod
    def can_user_update_expedition(user_id, expedition):
        """
        Check if a user can update an expedition
        
        Args:
            user_id: The ID of the user
            expedition: The expedition object
            
        Returns:
            bool: True if allowed, False otherwise
        """
        has_permission, role_level, _ = PermissionService.check_permission(
            user_id, 
            expedition.team_id, 
            'update_expedition'
        )
        
        # Special case for Technical Guides (Level 3)
        if role_level == 3:
            # Technical Guides can only edit expeditions they created or lead
            return has_permission and (
                expedition.created_by == user_id or 
                expedition.leader_id == user_id
            )
        
        return has_permission
    
    @staticmethod
    def can_user_delete_expedition(user_id, expedition):
        """
        Check if a user can delete an expedition
        
        Args:
            user_id: The ID of the user
            expedition: The expedition object
            
        Returns:
            bool: True if allowed, False otherwise
        """
        has_permission, _, _ = PermissionService.check_permission(
            user_id, 
            expedition.team_id, 
            'delete_expedition'
        )
        return has_permission
    
    @staticmethod
    def setup_default_permissions(team_id, creator_id):
        """
        Set up default permissions for a new team
        
        Args:
            team_id: The ID of the new team
            creator_id: The ID of the creator (master guide)
        """
        # Define default permissions for each role level
        default_permissions = {
            # Master Guide (Level 1) - Full access
            1: [
                {'key': 'create_expedition', 'enabled': True},
                {'key': 'update_expedition', 'enabled': True},
                {'key': 'delete_expedition', 'enabled': True},
                {'key': 'create_activity', 'enabled': True},
                {'key': 'update_activity', 'enabled': True},
                {'key': 'delete_activity', 'enabled': True},
                {'key': 'manage_team', 'enabled': True},
                {'key': 'manage_team_members', 'enabled': True},
                {'key': 'manage_resources', 'enabled': True},
                {'key': 'manage_revenue', 'enabled': True}
            ],
            # Tactical Guide (Level 2) - Can manage most things except deletion
            2: [
                {'key': 'create_expedition', 'enabled': True},
                {'key': 'update_expedition', 'enabled': True},
                {'key': 'delete_expedition', 'enabled': False},
                {'key': 'create_activity', 'enabled': True},
                {'key': 'update_activity', 'enabled': True},
                {'key': 'delete_activity', 'enabled': False},
                {'key': 'manage_team', 'enabled': False},
                {'key': 'manage_team_members', 'enabled': True},
                {'key': 'manage_resources', 'enabled': True},
                {'key': 'manage_revenue', 'enabled': False}
            ],
            # Technical Guide (Level 3) - Can create and update their own
            3: [
                {'key': 'create_expedition', 'enabled': False},
                {'key': 'update_expedition', 'enabled': True},  # Own expeditions only
                {'key': 'delete_expedition', 'enabled': False},
                {'key': 'create_activity', 'enabled': True},
                {'key': 'update_activity', 'enabled': True},  # Own activities only
                {'key': 'delete_activity', 'enabled': False},
                {'key': 'manage_team', 'enabled': False},
                {'key': 'manage_team_members', 'enabled': False},
                {'key': 'manage_resources', 'enabled': True},
                {'key': 'manage_revenue', 'enabled': False}
            ],
            # Base Guide (Level 4) - Limited permissions
            4: [
                {'key': 'create_expedition', 'enabled': False},
                {'key': 'update_expedition', 'enabled': False},
                {'key': 'delete_expedition', 'enabled': False},
                {'key': 'create_activity', 'enabled': True},
                {'key': 'update_activity', 'enabled': True},  # Own activities only
                {'key': 'delete_activity', 'enabled': False},
                {'key': 'manage_team', 'enabled': False},
                {'key': 'manage_team_members', 'enabled': False},
                {'key': 'manage_resources', 'enabled': False},
                {'key': 'manage_revenue', 'enabled': False}
            ]
        }
        
        # Create permissions for each role level
        for role_level, permissions in default_permissions.items():
            for perm in permissions:
                permission = TeamRolePermissions(
                    team_id=team_id,
                    role_level=role_level,
                    permission_key=perm['key'],
                    is_enabled=perm['enabled'],
                    modified_by=creator_id
                )
                db.session.add(permission)
        
        db.session.commit()
    
    @staticmethod
    def get_team_permissions(team_id):
        """
        Get all permissions for a team, organized by role level
        
        Args:
            team_id: The ID of the team
            
        Returns:
            dict: Permissions organized by role level
        """
        permissions = TeamRolePermissions.query.filter_by(team_id=team_id).all()
        
        result = {1: {}, 2: {}, 3: {}, 4: {}}
        
        for permission in permissions:
            if permission.role_level not in result:
                result[permission.role_level] = {}
            
            result[permission.role_level][permission.permission_key] = permission.is_enabled
        
        return result
    
    @staticmethod
    def get_global_permissions():
        """
        Get all global permissions, organized by role level
        
        Returns:
            dict: Permissions organized by role level
        """
        permissions = TeamRolePermissions.query.filter_by(team_id=None).all()
        
        result = {1: {}, 2: {}, 3: {}, 4: {}}
        
        for permission in permissions:
            if permission.role_level not in result:
                result[permission.role_level] = {}
            
            result[permission.role_level][permission.permission_key] = permission.is_enabled
        
        return result
    
    @staticmethod
    def get_user_permissions(user_id):
        """
        Get all permissions for a user across all their teams
        
        Args:
            user_id: The ID of the user
            
        Returns:
            dict: Permissions by team
        """
        # Get all teams the user is a member of
        team_memberships = TeamMember.query.filter_by(user_id=user_id).all()
        
        if not team_memberships:
            return {}
        
        result = {}
        
        for membership in team_memberships:
            team_id = membership.team_id
            role_level = membership.role_level
            
            # Get permissions for this role level in this team
            permissions = TeamRolePermissions.query.filter_by(
                team_id=team_id,
                role_level=role_level,
                is_enabled=True
            ).all()
            
            if team_id not in result:
                result[team_id] = []
            
            for permission in permissions:
                result[team_id].append(permission.permission_key)
            
            # Add fallback to global permissions if no team-specific permission exists
            global_permissions = TeamRolePermissions.query.filter_by(
                team_id=None,
                role_level=role_level,
                is_enabled=True
            ).all()
            
            for permission in global_permissions:
                if permission.permission_key not in result[team_id]:
                    result[team_id].append(permission.permission_key)
        
        return result