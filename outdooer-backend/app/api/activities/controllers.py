# app/api/activities/controllers.py

from flask import jsonify, request
from datetime import datetime
from app import db
from app.models.activity import Activity

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

def create_activity():
    """Create a new activity"""
    data = request.get_json()

    # Check for duplicate activity name in the same team
    existing_activity = Activity.query.filter_by(
        team_id=data.get('team_id'),
        title=data.get('title')
    ).first()

    if existing_activity:
        return jsonify({"error": "An activity with this name already exists in your team"}), 400

    new_activity = Activity(
        title=data.get('title'),
        team_id=data.get('team_id'),
        description=data.get('description'),
        location_id=data.get('location_id'),
        difficulty_level=data.get('difficulty_level'),
        price=data.get('price'),
        min_participants=data.get('min_participants'),
        max_participants=data.get('max_participants'),
        activity_type_id=data.get('activity_type_id'),
        leader_id=data.get('leader_id'),
        activity_status=data.get('activity_status')
    )

    try:
        db.session.add(new_activity)
        db.session.commit()
        return jsonify({"message": "Activity created successfully", "activity_id": new_activity.activity_id}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating activity: {str(e)}")
        return jsonify({"error": "Failed to create activity"}), 500

def update_activity(activity_id):
    """Update an existing activity"""
    data = request.get_json()
    activity = Activity.query.get_or_404(activity_id)

    # Check for duplicate title if changed
    if 'title' in data and data['title'] != activity.title:
        existing_activity = Activity.query.filter_by(
            team_id=activity.team_id,
            title=data['title']
        ).first()

        if existing_activity:
            return jsonify({"error": "An activity with this name already exists in your team"}), 400

    try:
        if 'title' in data:
            activity.title = data['title']
        if 'description' in data:
            activity.description = data['description']
        if 'location_id' in data:
            activity.location_id = data['location_id']
        if 'difficulty_level' in data:
            activity.difficulty_level = data['difficulty_level']
        if 'price' in data:
            activity.price = data['price']
        if 'min_participants' in data:
            activity.min_participants = data['min_participants']
        if 'max_participants' in data:
            activity.max_participants = data['max_participants']
        if 'activity_type_id' in data:
            activity.activity_type_id = data['activity_type_id']
        if 'leader_id' in data:
            activity.leader_id = data['leader_id']
        if 'activity_status' in data:
            activity.activity_status = data['activity_status']

        activity.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({"message": "Activity updated successfully", "activity_id": activity.activity_id}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating activity {activity_id}: {str(e)}")
        return jsonify({"error": "Failed to update activity"}), 500
