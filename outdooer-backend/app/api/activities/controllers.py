# app/api/activities/controllers.py
from flask import jsonify, request
from app import db
from app.models.activity import Activity

def get_all_activities():
    """Get all activities from the database"""
    try:
        # Query all activities
        activities = Activity.query.all()
        
        # Convert to list of dictionaries
        activities_list = []
        for activity in activities:
            activities_list.append({
                'id': activity.activity_id,
                'title': activity.title,
                'description': activity.description,
                'location_name': activity.location.location_name if activity.location else None,
                'difficulty_level': activity.difficulty_level,
                'price': float(activity.price) if activity.price else 0,
                'min_participants': activity.min_participants,
                'max_participants': activity.max_participants,
                'status': activity.activity_status
            })
        
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
        
        activity_data = {
            'id': activity.activity_id,
            'title': activity.title,
            'description': activity.description,
            'location_name': activity.location.location_name if activity.location else None,
            'difficulty_level': activity.difficulty_level,
            'price': float(activity.price) if activity.price else 0,
            'start_date': activity.start_date.isoformat() if activity.start_date else None,
            'end_date': activity.end_date.isoformat() if activity.end_date else None,
            'min_participants': activity.min_participants,
            'max_participants': activity.max_participants,
            'status': activity.activity_status
        }
        
        return jsonify({'activity': activity_data}), 200
    except Exception as e:
        print(f"Error fetching activity {activity_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch activity details'}), 500