# permissions/routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.permission_service import PermissionService
from models.team_role_configuration import TeamRoleConfiguration
from models.expedition import Expedition
from models.activity import Activity
from models.team_member import TeamMember
from app.database import db

# Create a blueprint for the permissions API
permissions_bp = Blueprint('permissions', __name__, url_prefix='/api/permissions')

@permissions_bp.route('/check', methods=['POST'])
@jwt_required()
def check_permission():
    """
    Endpoint to check if the current user has permission to perform an operation
    """
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        operation = data.get('operation')
        resource_id = data.get('resource_id')
        team_id = data.get('team_id')
        
        if not operation:
            return jsonify({'error': 'Operation is required'}), 400
        
        # If resource_id is provided, get the resource to determine team_id
        if resource_id and not team_id:
            if 'expedition' in operation:
                resource = Expedition.query.get_or_404(resource_id)
                team_id = resource.team_id
            elif 'activity' in operation:
                resource = Activity.query.get_or_404(resource_id)
                team_id = resource.team_id
            else:
                return jsonify({'error': 'Cannot determine team_id from resource'}), 400
        
        if not team_id:
            return jsonify({'error': 'Team ID is required'}), 400
        
        # Check permission using the service
        if 'expedition' in operation:
            if operation == 'update_expedition' and resource_id:
                expedition = Expedition.query.get_or_404(resource_id)
                has_permission = PermissionService.can_user_update_expedition(current_user_id, expedition)
            elif operation == 'delete_expedition' and resource_id:
                expedition = Expedition.query.get_or_404(resource_id)
                has_permission = PermissionService.can_user_delete_expedition(current_user_id, expedition)
            elif operation == 'create_expedition':
                has_permission = PermissionService.can_user_create_expedition(current_user_id, team_id)
            else:
                # Generic permission check for other expedition operations
                has_permission, _, _ = PermissionService.check_permission(current_user_id, team_id, operation)
        else:
            # For non-expedition operations, use the generic check
            has_permission, _, _ = PermissionService.check_permission(current_user_id, team_id, operation)
        
        return jsonify({
            'has_permission': has_permission,
            'operation': operation,
            'resource_id': resource_id,
            'team_id': team_id
        })
        
    except Exception as e:
        return jsonify({'error': str(e), 'has_permission': False}), 500


@permissions_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_permissions():
    """
    Get all permissions available to the current user across their teams
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get all teams the user is a member of
        team_memberships = TeamMember.query.filter_by(user_id=current_user_id).all()
        
        user_permissions = {}
        
        # For each team, get the permissions based on role level
        for membership in team_memberships:
            team_id = membership.team_id
            role_level = membership.role_level
            
            # Get all permissions for this role level
            permissions = TeamRoleConfiguration.query.filter_by(
                role_level=role_level,
                is_permitted=True
            ).all()
            
            # Store permissions by team
            if team_id not in user_permissions:
                user_permissions[team_id] = []
                
            for permission in permissions:
                user_permissions[team_id].append(permission.operation)
        
        return jsonify({
            'user_id': current_user_id,
            'permissions': user_permissions
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@permissions_bp.route('/role-configurations', methods=['GET'])
@jwt_required()
def get_role_configurations():
    """
    Get all role configurations
    """
    try:
        # Get all role configurations
        configurations = TeamRoleConfiguration.query.all()
        
        # Organize by role level and operation
        result = {}
        
        for config in configurations:
            role_level = config.role_level
            operation = config.operation
            is_permitted = config.is_permitted
            
            if role_level not in result:
                result[role_level] = {}
                
            result[role_level][operation] = is_permitted
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@permissions_bp.route('/sync-permissions', methods=['POST'])
@jwt_required()
def sync_permissions():
    """
    Sync the permissions in the database with the default configuration
    This is useful for updating the permissions after a new version is released
    """
    try:
        # Import the setup function
        from scripts.setup_role_configurations import setup_role_configurations
        
        # Re-run the setup to create or update configurations
        setup_role_configurations()
        
        return jsonify({'message': 'Permissions synchronized successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500