# app/api/activities/routes.py
from flask import jsonify, request
from . import activities_bp
from app.api.activities.controllers import get_all_activities, get_activity_by_id
from app.models.activity import Activity

@activities_bp.route('/team/<int:id>', methods=['GET'])
def get_activities_by_team(id):
    try:
        # Buscar actividades asociadas al team_id
        activities = Activity.query.filter_by(team_id=id).all()
        if activities:
            return jsonify([activity.to_dict() for activity in activities]), 200
        else:
            return jsonify({"error": "No activities found for this team"}), 404
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