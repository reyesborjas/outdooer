from flask import jsonify, request
from . import expeditions_bp
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models.expedition import Expedition, ExpeditionActivity
from app import db

@expeditions_bp.route('', methods=['GET'])
def get_all_expeditions():
    """Get all expeditions endpoint"""
    try:
        expeditions = Expedition.query.all()
        return jsonify({'expeditions': [exp.to_dict() for exp in expeditions]}), 200
    except Exception as e:
        print(f"Error fetching expeditions: {str(e)}")
        return jsonify({'error': 'Failed to fetch expeditions'}), 500

@expeditions_bp.route('/<int:expedition_id>', methods=['GET'])
def get_expedition(expedition_id):
    """Get a specific expedition by ID"""
    try:
        expedition = Expedition.query.get_or_404(expedition_id)
        return jsonify({'expedition': expedition.to_dict()}), 200
    except Exception as e:
        print(f"Error fetching expedition {expedition_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch expedition details'}), 500

@expeditions_bp.route('', methods=['POST'])
@jwt_required()
def create_expedition():
    """Create a new expedition"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()

        data['created_by'] = data.get('created_by', current_user_id)
        data['leader_id'] = data.get('leader_id', data['created_by'])

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
        print(f"Error creating expedition: {str(e)}")
        return jsonify({'error': f'Failed to create expedition: {str(e)}'}), 500

@expeditions_bp.route('/<int:expedition_id>', methods=['PUT'])
@jwt_required()
def update_expedition(expedition_id):
    """Update an existing expedition"""
    try:
        data = request.get_json()
        expedition = Expedition.query.get_or_404(expedition_id)

        current_user_id = get_jwt_identity()
        if expedition.created_by != current_user_id and expedition.leader_id != current_user_id:
            return jsonify({'error': 'Unauthorized to update this expedition'}), 403

        for field in [
            'title', 'description', 'start_date', 'end_date',
            'min_participants', 'max_participants', 'price',
            'leader_id', 'expedition_status']:
            if field in data:
                if field in ['start_date', 'end_date'] and data[field]:
                    setattr(expedition, field, datetime.fromisoformat(data[field])
                            if isinstance(data[field], str) else data[field])
                else:
                    setattr(expedition, field, data[field])

        expedition.updated_at = datetime.utcnow()
        db.session.commit()
        db.session.refresh(expedition)

        return jsonify({
            'message': 'Expedition updated successfully',
            'expedition': expedition.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating expedition {expedition_id}: {str(e)}")
        return jsonify({'error': f'Failed to update expedition: {str(e)}'}), 500

@expeditions_bp.route('/<int:expedition_id>', methods=['DELETE'])
@jwt_required()
def delete_expedition(expedition_id):
    """Delete an expedition"""
    try:
        expedition = Expedition.query.get_or_404(expedition_id)
        current_user_id = get_jwt_identity()

        if expedition.created_by != current_user_id:
            return jsonify({'error': 'Unauthorized to delete this expedition'}), 403

        db.session.delete(expedition)
        db.session.commit()

        return jsonify({'message': 'Expedition deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting expedition {expedition_id}: {str(e)}")
        return jsonify({'error': f'Failed to delete expedition: {str(e)}'}), 500

@expeditions_bp.route('/created-by/<int:user_id>', methods=['GET'])
def get_expeditions_by_creator(user_id):
    """Get expeditions created by a specific user"""
    try:
        expeditions = Expedition.query.filter_by(created_by=user_id).all()
        return jsonify({'expeditions': [exp.to_dict() for exp in expeditions]}), 200
    except Exception as e:
        print(f"Error fetching expeditions created by user {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch expeditions'}), 500

@expeditions_bp.route('/led-by/<int:user_id>', methods=['GET'])
def get_expeditions_by_leader(user_id):
    """Get expeditions led by a specific user"""
    try:
        expeditions = Expedition.query.filter_by(leader_id=user_id).all()
        return jsonify({'expeditions': [exp.to_dict() for exp in expeditions]}), 200
    except Exception as e:
        print(f"Error fetching expeditions led by user {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch expeditions'}), 500

@expeditions_bp.route('/<int:expedition_id>/activities', methods=['GET'])
def get_expedition_activities(expedition_id):
    """Get activities for a specific expedition"""
    try:
        expedition = Expedition.query.get_or_404(expedition_id)
        activities = ExpeditionActivity.query.filter_by(expedition_id=expedition_id).all()
        return jsonify({'activities': [activity.to_dict() for activity in activities]}), 200
    except Exception as e:
        print(f"Error fetching activities for expedition {expedition_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch expedition activities'}), 500

@expeditions_bp.route('/<int:expedition_id>/activities', methods=['POST'])
@jwt_required()
def add_expedition_activities(expedition_id):
    """Add activities to an expedition"""
    try:
        data = request.get_json()
        expedition = Expedition.query.get_or_404(expedition_id)

        current_user_id = get_jwt_identity()
        if expedition.created_by != current_user_id and expedition.leader_id != current_user_id:
            return jsonify({'error': 'Unauthorized to update this expedition'}), 403

        ExpeditionActivity.query.filter_by(expedition_id=expedition_id).delete()
        activities = data.get('activities', [])
        added_activities = []

        for activity_data in activities:
            expedition_activity = ExpeditionActivity(
                expedition_id=expedition_id,
                activity_id=activity_data.get('activity_id'),
                sequence_order=activity_data.get('sequence_order', 0),
                day_number=activity_data.get('day_number', 1),
                is_optional=activity_data.get('is_optional', False),
                notes=activity_data.get('notes')
            )
            db.session.add(expedition_activity)
            added_activities.append(expedition_activity)

        db.session.commit()

        return jsonify({
            'message': 'Expedition activities updated successfully',
            'activities': [activity.to_dict() for activity in added_activities]
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error adding activities to expedition {expedition_id}: {str(e)}")
        return jsonify({'error': f'Failed to add activities: {str(e)}'}), 500

@expeditions_bp.route('/<int:expedition_id>/activities', methods=['PUT'])
@jwt_required()
def update_expedition_activities(expedition_id):
    """Update activities for an expedition (same as POST for simplicity)"""
    return add_expedition_activities(expedition_id)