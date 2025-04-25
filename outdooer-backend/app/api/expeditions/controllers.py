# app/api/expeditions/controllers.py

from flask import jsonify, request
from app.database import db
from app.models.expedition import Expedition, ExpeditionActivity
from app.models.team_member import TeamMember
from flask_jwt_extended import get_jwt_identity
from datetime import datetime

# =======================
# Helpers
# =======================

def get_user_role_level(user_id, team_id):
    """Return the role level of a user within a team."""
    member = TeamMember.query.filter_by(user_id=user_id, team_id=team_id).first()
    return member.role_level if member else None

# =======================
# Expedition Endpoints
# =======================

def get_all_expeditions():
    try:
        expeditions = Expedition.query.all()
        return jsonify({'expeditions': [exp.to_dict() for exp in expeditions]}), 200
    except Exception as e:
        print(f"Error fetching expeditions: {e}")
        return jsonify({'error': 'Failed to fetch expeditions'}), 500

def get_expedition_by_id(expedition_id):
    try:
        expedition = Expedition.query.get_or_404(expedition_id)
        return jsonify({'expedition': expedition.to_dict()}), 200
    except Exception as e:
        print(f"Error fetching expedition {expedition_id}: {e}")
        return jsonify({'error': 'Failed to fetch expedition details'}), 500

def get_expeditions_by_creator(user_id):
    try:
        expeditions = Expedition.query.filter_by(created_by=user_id).all()
        return jsonify({'expeditions': [exp.to_dict() for exp in expeditions]}), 200
    except Exception as e:
        print(f"Error fetching expeditions for user {user_id}: {e}")
        return jsonify({'error': 'Failed to fetch expeditions'}), 500

def get_expeditions_by_leader(user_id):
    try:
        expeditions = Expedition.query.filter_by(leader_id=user_id).all()
        return jsonify({'expeditions': [exp.to_dict() for exp in expeditions]}), 200
    except Exception as e:
        print(f"Error fetching expeditions for leader {user_id}: {e}")
        return jsonify({'error': 'Failed to fetch expeditions'}), 500

def create_expedition():
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()

        if 'created_by' not in data:
            data['created_by'] = current_user_id

        if 'leader_id' not in data:
            data['leader_id'] = data['created_by']

        expedition = Expedition(
            team_id=data.get('team_id'),
            title=data['title'],
            description=data['description'],
            start_date=datetime.fromisoformat(data['start_date']),
            end_date=datetime.fromisoformat(data['end_date']),
            min_participants=data.get('min_participants', 1),
            max_participants=data['max_participants'],
            price=data['price'],
            created_by=data['created_by'],
            leader_id=data['leader_id'],
            expedition_status=data.get('expedition_status', 'active')
        )

        db.session.add(expedition)
        db.session.commit()
        db.session.refresh(expedition)

        return jsonify({
            'message': 'Expedition created successfully',
            'expedition_id': expedition.expedition_id,
            'expedition': expedition.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating expedition: {e}")
        return jsonify({'error': f'Failed to create expedition: {str(e)}'}), 500

def update_expedition(expedition_id):
    try:
        expedition = Expedition.query.get_or_404(expedition_id)
        data = request.get_json()

        for key, value in data.items():
            if hasattr(expedition, key):
                if key in ['start_date', 'end_date'] and value:
                    value = datetime.fromisoformat(value)
                setattr(expedition, key, value)

        expedition.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Expedition updated successfully',
            'expedition': expedition.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def delete_expedition(expedition_id):
    try:
        expedition = Expedition.query.get_or_404(expedition_id)

        db.session.delete(expedition)
        db.session.commit()
        
        return jsonify({'message': 'Expedition deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =======================
# Expedition Activities
# =======================

def get_expedition_activities(expedition_id):
    try:
        activities = ExpeditionActivity.query.filter_by(expedition_id=expedition_id).all()
        return jsonify({'activities': [a.to_dict() for a in activities]}), 200
    except Exception as e:
        print(f"Error fetching activities for expedition {expedition_id}: {e}")
        return jsonify({'error': 'Failed to fetch expedition activities'}), 500

def add_expedition_activities(expedition_id):
    try:
        data = request.get_json()
        expedition = Expedition.query.get_or_404(expedition_id)
        current_user_id = get_jwt_identity()

        # Clear existing activities first
        ExpeditionActivity.query.filter_by(expedition_id=expedition_id).delete()

        new_activities = []
        for activity_data in data.get('activities', []):
            ea = ExpeditionActivity(
                expedition_id=expedition_id,
                activity_id=activity_data.get('activity_id'),
                sequence_order=activity_data.get('sequence_order', 0),
                day_number=activity_data.get('day_number', 1),
                is_optional=activity_data.get('is_optional', False),
                notes=activity_data.get('notes')
            )
            db.session.add(ea)
            new_activities.append(ea)

        db.session.commit()

        return jsonify({
            'message': 'Expedition activities updated successfully',
            'activities': [a.to_dict() for a in new_activities]
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error adding activities to expedition {expedition_id}: {e}")
        return jsonify({'error': f'Failed to add activities: {str(e)}'}), 500