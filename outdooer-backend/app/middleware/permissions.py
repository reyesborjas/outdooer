# app/middleware/permissions.py
from functools import wraps
from flask import request, jsonify, g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.team_member import TeamMember
from app.models.team_role_configuration import TeamRoleConfiguration
from app.models.team_role_permissions import TeamRolePermissions
from app.models.expedition import Expedition
from app.models.activity import Activity

def check_role_permission(operation):
    """
    Middleware decorator that checks if a user has permission to perform
    a specific operation based on their role level in the team.
    
    Args:
        operation (str): The operation to check permission for (e.g., 'create_expedition')
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Verify JWT
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            
            # Get team_id from request data
            data = request.get_json() or {}
            
            # For creation operations, team_id is in the request body
            team_id = data.get('team_id')
            
            # For update/delete operations, get the resource first to find the team_id
            resource_id = kwargs.get('id') or kwargs.get('expedition_id') or kwargs.get('activity_id')
            if resource_id and not team_id:
                if 'expedition' in operation:
                    resource = Expedition.query.get_or_404(resource_id)
                    team_id = resource.team_id
                elif 'activity' in operation:
                    resource = Activity.query.get_or_404(resource_id)
                    team_id = resource.team_id
            
            if not team_id:
                return jsonify({'error': 'Team ID not provided or resource not found'}), 400
            
            # Get user's role level in this team
            team_membership = TeamMember.query.filter_by(
                user_id=current_user_id,
                team_id=team_id
            ).first()
            
            if not team_membership:
                return jsonify({'error': 'You are not a member of this team'}), 403
            
            role_level = team_membership.role_level
            
            # First check team-specific permissions
            permission_key = operation
            team_permission = TeamRolePermissions.query.filter_by(
                team_id=team_id,
                role_level=role_level,
                permission_key=permission_key
            ).first()
            
            # If team-specific permission exists, use it
            if team_permission:
                has_permission = team_permission.is_enabled
            else:
                # Fall back to global role configuration
                global_permission = TeamRoleConfiguration.query.filter_by(
                    role_level=role_level,
                    operation=operation
                ).first()
                
                has_permission = global_permission.is_permitted if global_permission else False
            
            # Special case for update operations - Technical Guides can update their own resources
            if not has_permission and operation in ['update_expedition', 'update_activity'] and role_level == 3:
                if 'expedition' in operation:
                    resource = Expedition.query.get_or_404(resource_id)
                else:
                    resource = Activity.query.get_or_404(resource_id)
                
                # Technical Guides can update their own creations or ones they lead
                if resource.created_by == current_user_id or getattr(resource, 'leader_id', None) == current_user_id:
                    has_permission = True
            
            if not has_permission:
                role_names = {1: 'Master Guide', 2: 'Tactical Guide', 3: 'Technical Guide', 4: 'Base Guide'}
                role_name = role_names.get(role_level, f'Level {role_level} Guide')
                
                return jsonify({
                    'error': f'{role_name}s do not have permission to {operation.replace("_", " ")}'
                }), 403
            
            # Store role_level in flask.g for the route function
            g.role_level = role_level
            g.team_id = team_id
            
            return func(*args, **kwargs)
        return wrapper
    return decorator