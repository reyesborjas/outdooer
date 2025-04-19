# app/api/activities/routes.py
from flask import jsonify, request
from . import activities_bp
from app.models.activity import Activity, find_similar_activities
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from .controllers import create_activity, update_activity as update_activity_controller



@activities_bp.route('/', methods=['GET'])
def get_all_activities():
    """Get all activities"""
    try:
        activities = Activity.query.all()
        return jsonify([activity.to_dict() for activity in activities]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


@activities_bp.route('/team/<int:team_id>', methods=['GET'])
def get_activities_by_team(team_id):
    """Get all activities for a specific team"""
    try:
        activities = Activity.query.filter_by(team_id=team_id).all()
        return jsonify([activity.to_dict() for activity in activities]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@activities_bp.route('/<int:activity_id>', methods=['GET'])
def get_activity_by_id(activity_id):
    """Get a specific activity by ID"""
    try:
        activity = Activity.query.get(activity_id)
        if activity:
            return jsonify(activity.to_dict()), 200
        return jsonify({"error": "Activity not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@activities_bp.route('/check-title', methods=['GET'])
@jwt_required()
def check_activity_title():
    """Check if an activity title is unique within a team"""
    try:
        title = request.args.get('title')
        team_id = request.args.get('team_id')
        activity_id = request.args.get('activity_id')
        
        if not title or not team_id:
            return jsonify({"error": "Missing title or team_id parameter"}), 400
        
        query = Activity.query.filter_by(team_id=team_id, title=title)
        if activity_id:
            query = query.filter(Activity.activity_id != activity_id)
        
        return jsonify({"unique": query.first() is None}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@activities_bp.route('/check-similar', methods=['GET'])
@jwt_required()
def check_similar_activities():
    """Check for similar activities based on type and location"""
    try:
        team_id = request.args.get('team_id', type=int)
        activity_type_id = request.args.get('activity_type_id', type=int)
        location_id = request.args.get('location_id', type=int)
        activity_id = request.args.get('activity_id', type=int)
        
        if None in [team_id, activity_type_id, location_id]:
            return jsonify({"error": "Missing required parameters"}), 400
        
        similar_activities = find_similar_activities(
            team_id, activity_type_id, location_id, activity_id
        )
        
        return jsonify({
            "has_similar": len(similar_activities) > 0,
            "similar_count": len(similar_activities),
            "similar_activities": [
                {
                    "activity_id": a.activity_id,
                    "title": a.title,
                    "difficulty_level": a.difficulty_level,
                    "price": float(a.price)
                } for a in similar_activities[:5]
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@activities_bp.route('/', methods=['POST'])
@jwt_required()
def create_new_activity():
    """Create a new activity endpoint"""
    try:
        # Get current user ID from JWT token
        current_user_id = get_jwt_identity()
        
        # Get data from request
        data = request.get_json()
        
        # Make sure required fields are set
        if 'created_by' not in data:
            data['created_by'] = current_user_id
            
        if 'leader_id' not in data:
            data['leader_id'] = current_user_id
        
        # Debug info
        print(f"Creating activity with data: {data}")
        print(f"User ID: {current_user_id}")
        
      
        
        # Call controller with the request context
        return create_activity()
    except Exception as e:
        db.session.rollback()
        print(f"Error creating activity: {str(e)}")
        return jsonify({"error": f"Failed to create activity: {str(e)}"}), 500


@activities_bp.route('/<int:activity_id>', methods=['PUT'])
@jwt_required()
def update_activity(activity_id):
    """Update an existing activity"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        return update_activity_controller(activity_id, current_user_id, data)
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update activity: {str(e)}"}), 500


@activities_bp.route('/my-activities', methods=['GET'])
@jwt_required()
def get_my_activities():
    """Get activities created by the current user"""
    try:
        current_user_id = get_jwt_identity()
        print("User identity:", current_user_id)
        activities = Activity.query.filter_by(created_by=current_user_id).all()
        return jsonify([activity.to_dict() for activity in activities]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    