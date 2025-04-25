# app/services/permission_service.py
from app.models.team_member import TeamMember
from app.models.team_role_configuration import TeamRoleConfiguration

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
    def check_permission(user_id, team_id, operation):
        """
        Check if a user has permission to perform an operation based on role configuration
        
        Args:
            user_id: The ID of the user
            team_id: The ID of the team
            operation: The operation to check (e.g., 'create_expedition')
            
        Returns:
            tuple: (has_permission, role_level, error_message)
        """
        # Get user's role level in this team
        role_level = PermissionService.get_role_level(user_id, team_id)
        
        if role_level is None:
            return False, None, "You are not a member of this team"
        
        # Check if this role level allows the operation
        permission = TeamRoleConfiguration.query.filter_by(
            role_level=role_level,
            operation=operation
        ).first()
        
        if not permission or not permission.is_permitted:
            return False, role_level, f"Your role level ({role_level}) does not have permission to {operation.replace('_', ' ')}"
        
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