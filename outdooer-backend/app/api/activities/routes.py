# app/api/activities/routes.py
from flask import jsonify, request
from . import activities_bp
from app.api.activities.controllers import get_all_activities, get_activity_by_id
from app.models.activity import Activity
from flask_jwt_extended import jwt_required
from app.models.activity import find_similar_activities

@activities_bp.route('/team/<int:team_id>', methods=['GET'])
def get_activities_by_team(team_id):
    try:
        # Find activities associated with the team_id
        activities = Activity.query.filter_by(team_id=team_id).all()
        if activities:
            return jsonify([activity.to_dict() for activity in activities]), 200
        else:
            return jsonify([]), 200  # Return empty array instead of 404 for easier frontend handling
    except Exception as e:
        return jsonify({"error": str(e)}), 500
def get_all_activities():
    try:
        activities = Activity.query.all()
        return jsonify([activity.to_dict() for activity in activities]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_activity_by_id(activity_id):
    try:
        activity = Activity.query.get(activity_id)
        if activity:
            return jsonify(activity.to_dict()), 200
        else:
            return jsonify({"error": "Activity not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@activities_bp.route('/check-title', methods=['GET'])
@jwt_required()
def check_activity_title():
    """Check if an activity title is unique within a team"""
    title = request.args.get('title')
    team_id = request.args.get('team_id')
    activity_id = request.args.get('activity_id')  # Optional, for excluding current activity when editing
    
    if not title or not team_id:
        return jsonify({"error": "Missing title or team_id parameter"}), 400
    
    query = Activity.query.filter_by(team_id=team_id, title=title)
    
    # Exclude the current activity when editing
    if activity_id:
        query = query.filter(Activity.activity_id != activity_id)
    
    existing_activity = query.first()
    
    return jsonify({
        "unique": existing_activity is None
    }), 200
    
    # app/api/activities/routes.py

@activities_bp.route('/check-similar', methods=['GET'])
@jwt_required()
def check_similar_activities():
    """Check if similar activities exist within a team"""
    team_id = request.args.get('team_id', type=int)
    activity_type_id = request.args.get('activity_type_id', type=int)
    location_id = request.args.get('location_id', type=int)
    activity_id = request.args.get('activity_id', type=int)  # For editing case
    
    if not all([team_id, activity_type_id, location_id]):
        return jsonify({"error": "Missing required parameters"}), 400
    
    similar_activities = find_similar_activities(
        team_id, activity_type_id, location_id, activity_id
    )
    
    # Return more detailed information about similar activities
    return jsonify({
        "has_similar": len(similar_activities) > 0,
        "similar_count": len(similar_activities),
        "similar_activities": [
            {
                "activity_id": activity.activity_id,
                "title": activity.title,
                "difficulty_level": activity.difficulty_level,
                "price": float(activity.price)
            } for activity in similar_activities[:5]  # Limit to 5 examples
        ]
    }), 200