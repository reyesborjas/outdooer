# app/api/activities/controllers.py

from flask import jsonify, request
from datetime import datetime
from app import db
from app.models.activity import Activity
from app.models.location import Location
from app.models.activity_type import ActivityType
from flask_jwt_extended import get_jwt_identity

def get_all_activities():
    """Get all activities from the database"""
    try:
        activities = Activity.query.all()
        activities_list = [activity.to_dict() for activity in activities]
        return jsonify({'activities': activities_list}), 200
    except Exception as e:
        print(f"Error fetching activities: {str(e)}")
        return jsonify({'error': 'Failed to fetch activities'}), 500

def get_activity_by_id(activity_id):
    """Get a specific activity by ID"""
    try:
        activity = Activity.query.get(activity_id)
        if not activity:
            return jsonify({'error': 'Activity not found'}), 404
        return jsonify({'activity': activity.to_dict()}), 200
    except Exception as e:
        print(f"Error fetching activity {activity_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch activity details'}), 500

def get_activities_by_user(user_id=None):
    """Get activities created by a specific user or the current user's team"""
    try:
        if user_id is None:
            user_id = get_jwt_identity()  # Obtener el ID del usuario desde el JWT

        # Obtener el equipo del usuario
        user_team = Team.query.filter_by(master_guide_id=user_id).first()
        user_team_id = user_team.team_id if user_team else None

        # Obtener actividades creadas por el usuario o por su equipo
        activities = Activity.query.filter(
            (Activity.created_by == user_id) | 
            (Activity.team_id == user_team_id) | 
            (Activity.leader_id == user_id)  # Incluir actividades donde el usuario es líder
        ).all()

        print(f"Found {len(activities)} activities for user {user_id}.")
        for activity in activities:
            print(f"Activity: {activity.to_dict()}")

        activities_list = [activity.to_dict() for activity in activities]
        return jsonify({'activities': activities_list}), 200
    except Exception as e:
        print(f"Error fetching user activities: {str(e)}")
        return jsonify({'error': 'Failed to fetch user activities'}), 500

def create_activity():
    """Create a new activity"""
    try:
        data = request.get_json()
        if 'created_by' not in data:
            data['created_by'] = get_jwt_identity()

        # Check for duplicate activity title in the same team
        existing_activity = Activity.query.filter_by(
            team_id=data.get('team_id'),
            title=data.get('title')
        ).first()
        if existing_activity:
            return jsonify({"error": "An activity with this name already exists in your team"}), 400

        # Validate location exists
        location_id = data.get('location_id')
        if location_id:
            location = Location.query.get(location_id)
            if not location:
                return jsonify({"error": f"Location with ID {location_id} not found"}), 400

        # Validate activity type exists
        activity_type_id = data.get('activity_type_id')
        if activity_type_id:
            activity_type = ActivityType.query.get(activity_type_id)
            if not activity_type:
                return jsonify({"error": f"Activity type with ID {activity_type_id} not found"}), 400

        new_activity = Activity(
            title=data.get('title'),
            team_id=data.get('team_id'),
            description=data.get('description'),
            location_id=location_id,
            difficulty_level=data.get('difficulty_level'),
            price=data.get('price'),
            min_participants=data.get('min_participants'),
            max_participants=data.get('max_participants'),
            activity_type_id=activity_type_id,
            leader_id=data.get('leader_id'),
            activity_status=data.get('activity_status', 'active'),
            created_by=data.get('created_by')
        )

        db.session.add(new_activity)
        db.session.commit()
        db.session.refresh(new_activity)

        return jsonify({
            "message": "Activity created successfully",
            "activity_id": new_activity.activity_id,
            "activity": new_activity.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating activity: {str(e)}")
        return jsonify({"error": f"Failed to create activity: {str(e)}"}), 500

def update_activity(activity_id):
    """Update an existing activity"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        activity = Activity.query.get_or_404(activity_id)

        # Check authorization
        if activity.created_by != current_user_id and activity.leader_id != current_user_id:
            return jsonify({"error": "You are not authorized to edit this activity"}), 403

        # Check for duplicate title if changed
        if 'title' in data and data['title'] != activity.title:
            existing_activity = Activity.query.filter_by(
                team_id=activity.team_id,
                title=data['title']
            ).first()
            if existing_activity:
                return jsonify({"error": "An activity with this name already exists in your team"}), 400

        # Validate location if updated
        if 'location_id' in data and data['location_id'] != activity.location_id:
            location = Location.query.get(data['location_id'])
            if not location:
                return jsonify({"error": f"Location with ID {data['location_id']} not found"}), 400

        # Validate activity type if updated
        if 'activity_type_id' in data and data['activity_type_id'] != activity.activity_type_id:
            activity_type = ActivityType.query.get(data['activity_type_id'])
            if not activity_type:
                return jsonify({"error": f"Activity type with ID {data['activity_type_id']} not found"}), 400

        # Apply updates
        for field in [
            'title', 'description', 'location_id', 'difficulty_level',
            'price', 'min_participants', 'max_participants',
            'activity_type_id', 'leader_id', 'activity_status'
        ]:
            if field in data:
                setattr(activity, field, data[field])

        activity.updated_at = datetime.utcnow()
        db.session.commit()
        db.session.refresh(activity)

        return jsonify({
            "message": "Activity updated successfully",
            "activity_id": activity.activity_id,
            "activity": activity.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating activity {activity_id}: {str(e)}")
        return jsonify({"error": f"Failed to update activity: {str(e)}"}), 500
