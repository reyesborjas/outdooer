# app/api/activity_types/routes.py
from flask import jsonify
from . import activity_types_bp
from app.models.activity_type import ActivityType

@activity_types_bp.route('', methods=['GET'])
def get_activity_types():
    """Get all activity types endpoint"""
    try:
        # Query all activity types
        activity_types = ActivityType.query.all()
        
        # Convert to list of dictionaries
        types_list = []
        for activity_type in activity_types:
            types_list.append({
                'activity_type_id': activity_type.activity_type_id,
                'activity_type_name': activity_type.activity_type_name,
                'description': activity_type.description
            })
        
        return jsonify({'activity_types': types_list}), 200
    except Exception as e:
        print(f"Error fetching activity types: {str(e)}")
        return jsonify({'error': 'Failed to fetch activity types'}), 500