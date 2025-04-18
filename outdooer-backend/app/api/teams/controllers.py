# app/api/teams/controllers.py
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app import db
from app.models.team import Team, TeamMember
from app.models.user import User

def get_my_teams():
    """Get teams for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Find team memberships for the user
        team_memberships = TeamMember.query.filter_by(user_id=current_user_id).all()
        
        if not team_memberships:
            return jsonify({'teams': []}), 200
        
        # Get team details
        teams_list = []
        for membership in team_memberships:
            team = Team.query.get(membership.team_id)
            
            if team:
                # Get master guide name
                master_guide = User.query.get(team.master_guide_id) if team.master_guide_id else None
                
                teams_list.append({
                    'team_id': team.team_id,
                    'team_name': team.team_name,
                    'role_level': membership.role_level,
                    'is_master_guide': team.master_guide_id == current_user_id,
                    'master_guide_name': f"{master_guide.first_name} {master_guide.last_name}" if master_guide else None,
                    'member_count': TeamMember.query.filter_by(team_id=team.team_id).count(),
                    'team_status': team.team_status
                })
        
        return jsonify({'teams': teams_list}), 200
    except Exception as e:
        print(f"Error fetching user teams: {str(e)}")
        return jsonify({'error': 'Failed to fetch teams'}), 500