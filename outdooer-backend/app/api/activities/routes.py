# app/api/activities/routes.py
from flask import jsonify, request
from . import activities_bp
from app.models.activity import Activity
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from .controllers import (
    get_all_activities, 
    get_activity_by_id, 
    get_my_activities as get_my_activities_controller,
    create_activity as create_activity_controller,
    update_activity as update_activity_controller,
    delete_activity as delete_activity_controller
)
from .similar_activities import find_similar_activities, check_similar_activities_endpoint

@activities_bp.route('/', methods=['GET'])
def get_all_activities_route():
    """Get all activities endpoint"""
    return get_all_activities()

@activities_bp.route('/team/<int:team_id>', methods=['GET'])
@jwt_required()
def get_activities_by_team(team_id):
    """Get all activities for a specific team (respects permission levels)"""
    try:
        current_user_id = get_jwt_identity()
        
        # Find user's role in this team
        from app.models.team import TeamMember
        membership = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=team_id
        ).first()
        
        if not membership:
            return jsonify({"error": "You are not a member of this team"}), 403
        
        # Filter activities based on role level
        if membership.role_level <= 2:  # Master Guide and Tactical Guide
            activities = Activity.query.filter_by(team_id=team_id).all()
        elif membership.role_level == 3:  # Technical Guide
            activities = Activity.query.filter(
                Activity.team_id == team_id,
                (Activity.created_by == current_user_id) | (Activity.leader_id == current_user_id)
            ).all()
        else:  # Base Guide
            activities = Activity.query.filter(
                Activity.team_id == team_id,
                Activity.created_by == current_user_id
            ).all()
        
        return jsonify({'activities': [activity.to_dict() for activity in activities]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@activities_bp.route('/<int:activity_id>', methods=['GET'])
def get_activity_by_id_route(activity_id):
    """Get a specific activity by ID"""
    return get_activity_by_id(activity_id)

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
    return check_similar_activities_endpoint()

@activities_bp.route('/', methods=['POST'])
@jwt_required()
def create_activity_route():
    """Create a new activity endpoint"""
    return create_activity_controller()

@activities_bp.route('/<int:activity_id>', methods=['PUT'])
@jwt_required()
def update_activity_route(activity_id):
    """Update an existing activity"""
    return update_activity_controller(activity_id)

@activities_bp.route('/<int:activity_id>', methods=['DELETE'])
@jwt_required()
def delete_activity_route(activity_id):
    """Delete an activity"""
    return delete_activity_controller(activity_id)

@activities_bp.route('/my-activities', methods=['GET'])
@jwt_required()
def get_my_activities():
    """Get activities based on user's role"""
    return get_my_activities_controller()

# New routes for activity dates

@activities_bp.route('/<int:activity_id>/dates', methods=['GET'])
@jwt_required()
def get_activity_dates(activity_id):
    """Get all available dates for an activity"""
    try:
        from app.models.activity_date import GuideActivityInstance, ActivityAvailableDate
        
        # Verify if activity exists
        activity = Activity.query.get_or_404(activity_id)
        
        # Get all instances for this activity
        instances = GuideActivityInstance.query.filter_by(activity_id=activity_id, is_active=True).all()
        
        # Get all dates from all instances
        all_dates = []
        for instance in instances:
            dates = ActivityAvailableDate.query.filter_by(activity_instance_id=instance.instance_id).all()
            
            for date_obj in dates:
                date_dict = date_obj.to_dict()
                date_dict['guide_id'] = instance.guide_id
                date_dict['guide_name'] = f"{instance.guide.first_name} {instance.guide.last_name}" if instance.guide else "Unknown"
                all_dates.append(date_dict)
        
        return jsonify({"dates": all_dates}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@activities_bp.route('/<int:activity_id>/dates', methods=['POST'])
@jwt_required()
def add_activity_date(activity_id):
    """Add a new available date for an activity"""
    try:
        # Redirect to activity_dates_bp endpoint
        from app.api.activity_dates.routes import add_activity_date as add_date_handler
        return add_date_handler(activity_id)
    except Exception as e:
        return jsonify({"error": str(e)}), 500