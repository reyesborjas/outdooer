# app/api/teams/routes.py
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from . import teams_bp
from app.api.teams.controllers import get_my_teams
from app.models.team import TeamMember
from app.models.user import User, UserRole
from app import db 

@teams_bp.route('/my-teams', methods=['GET'])
@jwt_required()
def my_teams():
    """Get teams for the current user"""
    return get_my_teams()

# Add to app/api/teams/routes.py
@teams_bp.route('/<int:team_id>/members', methods=['GET'])
@jwt_required()
def get_team_members(team_id):
    """Get members of a specific team"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is a member of the team
        is_member = TeamMember.query.filter_by(
            team_id=team_id, 
            user_id=current_user_id
        ).first() is not None
        
        if not is_member:
            return jsonify({"error": "You are not a member of this team"}), 403
        
        # Get all team members with guide role
        team_members = (
            db.session.query(
                User.user_id,
                User.first_name,
                User.last_name,
                TeamMember.role_level
            )
            .join(TeamMember, TeamMember.user_id == User.user_id)
            .join(UserRole, UserRole.user_id == User.user_id)
            .filter(TeamMember.team_id == team_id)
            .filter(UserRole.role_type == 'guide')
            .all()
        )
        
        # Format response
        members_list = [{
            'user_id': member.user_id,
            'first_name': member.first_name,
            'last_name': member.last_name,
            'role_level': member.role_level
        } for member in team_members]
        
        return jsonify({'members': members_list}), 200
    except Exception as e:
        print(f"Error fetching team members: {str(e)}")
        return jsonify({'error': 'Failed to fetch team members'}), 500