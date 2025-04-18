# app/api/teams/routes.py
from flask import jsonify
from flask_jwt_extended import jwt_required
from . import teams_bp
from app.api.teams.controllers import get_my_teams

@teams_bp.route('/my-teams', methods=['GET'])
@jwt_required()
def my_teams():
    """Get teams for the current user"""
    return get_my_teams()