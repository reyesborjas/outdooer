# app/api/permissions/routes.py
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.permission_service import PermissionService
from app.models.team_role_configuration import TeamRoleConfiguration
from app.models.team_role_permissions import TeamRolePermissions
from app.models.expedition import Expedition
from app.models.activity import Activity
from app.models.team_member import TeamMember
from app.models.team import Team
from app.database import db
from app.models.user import UserRole

# Import the blueprint from __init__.py
from app.api.permissions import permissions_bp

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
        
        # Get permissions using the service
        user_permissions = PermissionService.get_user_permissions(current_user_id)
        
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
    Get all global role configurations (defaults for all teams)
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

@permissions_bp.route('/team/<int:team_id>/permissions', methods=['GET'])
@jwt_required()
def get_team_permissions(team_id):
    """
    Get all permission settings for a specific team
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is a member of the team
        team_membership = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=team_id
        ).first()
        
        if not team_membership:
            return jsonify({'error': 'You are not a member of this team'}), 403
        
        # Only Master Guide and Tactical Guide can view team permissions
        if team_membership.role_level > 2:
            return jsonify({'error': 'Only Master Guides and Tactical Guides can view team permissions'}), 403
        
        # Get team permissions
        team_permissions = PermissionService.get_team_permissions(team_id)
        
        # Get team's role configuration names
        team = Team.query.get_or_404(team_id)
        role_config = team.role_config
        
        role_names = {
            1: role_config.level_1_name if role_config else 'Master Guide',
            2: role_config.level_2_name if role_config else 'Tactical Guide',
            3: role_config.level_3_name if role_config else 'Technical Guide',
            4: role_config.level_4_name if role_config else 'Base Guide'
        }
        
        result = {
            'team_id': team_id,
            'team_name': team.team_name,
            'role_names': role_names,
            'permissions': team_permissions,
            'can_edit': team_membership.role_level == 1  # Only Master Guide can edit
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@permissions_bp.route('/team/<int:team_id>/permissions', methods=['POST'])
@jwt_required()
def update_team_permissions(team_id):
    """
    Update permission settings for a specific team
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Check if user is a Master Guide for this team
        team_membership = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=team_id
        ).first()
        
        if not team_membership or team_membership.role_level != 1:
            return jsonify({'error': 'Only Master Guides can update team permissions'}), 403
        
        # Validate data format
        if not isinstance(data, dict) or 'permissions' not in data:
            return jsonify({'error': 'Invalid data format. Expected "permissions" object'}), 400
        
        permissions = data.get('permissions', {})
        
        # Update the permissions
        updated_count = 0
        
        for role_level_str, role_permissions in permissions.items():
            try:
                role_level = int(role_level_str)
                if role_level < 1 or role_level > 4:
                    return jsonify({'error': f'Invalid role level: {role_level}'}), 400
            except ValueError:
                return jsonify({'error': f'Invalid role level: {role_level_str}'}), 400
            
            for permission_key, is_enabled in role_permissions.items():
                # Find or create the permission
                permission = TeamRolePermissions.query.filter_by(
                    team_id=team_id,
                    role_level=role_level,
                    permission_key=permission_key
                ).first()
                
                if permission:
                    # Update existing permission
                    if permission.is_enabled != is_enabled:
                        permission.is_enabled = is_enabled
                        permission.modified_by = current_user_id
                        permission.modified_at = db.func.now()
                        updated_count += 1
                else:
                    # Create new permission
                    new_permission = TeamRolePermissions(
                        team_id=team_id,
                        role_level=role_level,
                        permission_key=permission_key,
                        is_enabled=is_enabled,
                        modified_by=current_user_id
                    )
                    db.session.add(new_permission)
                    updated_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully updated {updated_count} team permissions',
            'team_id': team_id,
            'updated_count': updated_count
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@permissions_bp.route('/sync-permissions', methods=['POST'])
@jwt_required()
def sync_permissions():
    """
    Sync the permissions in the database with the default configuration
    This is useful for updating the permissions after a new version is released
    """
    try:
        # Ensure user is an admin
        current_user_id = get_jwt_identity()
        admin_role = UserRole.query.filter_by(user_id=current_user_id, role_type='admin').first()
        
        if not admin_role:
            return jsonify({'error': 'Only administrators can sync permissions'}), 403
        
        # Import the setup function
        from app.scripts.setup_role_configurations import setup_role_configurations
        
        # Re-run the setup to create or update configurations
        setup_role_configurations()
        
        return jsonify({'message': 'Permissions synchronized successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500