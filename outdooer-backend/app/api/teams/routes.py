# app/api/teams/routes.py
from flask import request
from flask_jwt_extended import jwt_required
from . import teams_bp
from .controllers import (
    get_my_teams,
    get_team_details,
    get_team_members,
    create_team,
    update_team,
    delete_team,
    update_team_role_config,
    update_member_role,
    remove_team_member,
    generate_invitation_code,
    get_team_invitations
)

@teams_bp.route('/my-teams', methods=['GET'])
@jwt_required()
def my_teams_route():
    """Get teams for the current user"""
    return get_my_teams()

@teams_bp.route('/<int:team_id>', methods=['GET'])
@jwt_required()
def get_team_details_route(team_id):
    """Get detailed information about a specific team"""
    return get_team_details(team_id)

@teams_bp.route('/<int:team_id>/members', methods=['GET'])
@jwt_required()
def get_team_members_route(team_id):
    """Get members of a specific team"""
    return get_team_members(team_id)

@teams_bp.route('', methods=['POST'])
@jwt_required()
def create_team_route():
    """Create a new team"""
    return create_team()

@teams_bp.route('/<int:team_id>', methods=['PUT'])
@jwt_required()
def update_team_route(team_id):
    """Update team information"""
    return update_team(team_id)

@teams_bp.route('/<int:team_id>', methods=['DELETE'])
@jwt_required()
def delete_team_route(team_id):
    """Delete a team"""
    return delete_team(team_id)

@teams_bp.route('/<int:team_id>/role-config', methods=['PUT'])
@jwt_required()
def update_role_config_route(team_id):
    """Update team role configuration"""
    return update_team_role_config(team_id)

@teams_bp.route('/<int:team_id>/members/<int:user_id>/role', methods=['PUT'])
@jwt_required()
def update_member_role_route(team_id, user_id):
    """Update a team member's role level"""
    return update_member_role(team_id, user_id)

@teams_bp.route('/<int:team_id>/members/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_member_route(team_id, user_id):
    """Remove a member from the team"""
    return remove_team_member(team_id, user_id)

@teams_bp.route('/<int:team_id>/invitations', methods=['POST'])
@jwt_required()
def generate_invitation_route(team_id):
    """Generate a new invitation code for the team"""
    return generate_invitation_code(team_id)

@teams_bp.route('/<int:team_id>/invitations', methods=['GET'])
@jwt_required()
def get_invitations_route(team_id):
    """Get all active invitation codes for a team"""
    return get_team_invitations(team_id)