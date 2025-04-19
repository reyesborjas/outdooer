from flask import jsonify, request
from . import activities_bp
from app.models.activity import Activity, find_similar_activities
from flask_jwt_extended import jwt_required
from app import db

@activities_bp.route('/', methods=['GET'])
def get_all_activities():
    try:
        activities = Activity.query.all()
        return jsonify([activity.to_dict() for activity in activities]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@activities_bp.route('/team/<int:team_id>', methods=['GET'])
def get_activities_by_team(team_id):
    try:
        activities = Activity.query.filter_by(team_id=team_id).all()
        return jsonify([activity.to_dict() for activity in activities]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@activities_bp.route('/<int:activity_id>', methods=['GET'])
def get_activity_by_id(activity_id):
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
    title = request.args.get('title')
    team_id = request.args.get('team_id')
    activity_id = request.args.get('activity_id')
    
    if not title or not team_id:
        return jsonify({"error": "Missing title or team_id parameter"}), 400
    
    query = Activity.query.filter_by(team_id=team_id, title=title)
    if activity_id:
        query = query.filter(Activity.activity_id != activity_id)
    
    return jsonify({"unique": query.first() is None}), 200

@activities_bp.route('/check-similar', methods=['GET'])
@jwt_required()
def check_similar_activities():
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
def create_new_activity():
    """Create a new activity endpoint"""
    try:
        data = request.get_json()
        # Create a simplified activity for testing
        new_activity = Activity(
            title=data.get('title', 'Test Activity'),
            team_id=data.get('team_id', 1),
            description=data.get('description', 'Test description'),
            location_id=data.get('location_id'),
            price=data.get('price', 0),
            min_participants=data.get('min_participants', 1),
            max_participants=data.get('max_participants', 10),
        )
        db.session.add(new_activity)
        db.session.commit()
        return jsonify({"message": "Activity created successfully", "activity_id": new_activity.activity_id}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating activity: {str(e)}")
        return jsonify({"error": f"Failed to create activity: {str(e)}"}), 500

@activities_bp.route('/<int:activity_id>', methods=['PUT'])
@jwt_required()
def update_activity(activity_id):
    """Update an existing activity"""
    from .controllers import update_activity as update_activity_controller
    return update_activity_controller(activity_id)
