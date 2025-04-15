# app/api/activities/routes.py
from flask import jsonify, request
from . import activities_bp
from app.api.activities.controllers import get_all_activities, get_activity_by_id

@activities_bp.route('', methods=['GET'])
def get_activities():
    """Get all activities endpoint"""
    return get_all_activities()

@activities_bp.route('/<int:activity_id>', methods=['GET'])
def get_activity(activity_id):
    """Get activity by ID endpoint"""
    return get_activity_by_id(activity_id)