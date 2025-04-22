# app/api/expeditions/controllers.py
from flask import jsonify, request
from app import db
from app.models.expedition import Expedition, ExpeditionActivity
from app.models.team import Team, TeamMember
from flask_jwt_extended import get_jwt_identity
from datetime import datetime

def get_all_expeditions():
    """Get all expeditions"""
    try:
        expeditions = Expedition.query.all()
        return jsonify({'expeditions': [exp.to_dict() for exp in expeditions]}), 200
    except Exception as e:
        print(f"Error fetching expeditions: {str(e)}")
        return jsonify({'error': 'Failed to fetch expeditions'}), 500

def get_expedition_by_id(expedition_id):
    """Get a specific expedition by ID"""
    try:
        expedition = Expedition.query.get_or_404(expedition_id)
        return jsonify({'expedition': expedition.to_dict()}), 200
    except Exception as e:
        print(f"Error fetching expedition {expedition_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch expedition details'}), 500

def get_expeditions_by_creator(user_id):
    """Get expeditions created by a specific user"""
    try:
        expeditions = Expedition.query.filter_by(created_by=user_id).all()
        return jsonify({'expeditions': [exp.to_dict() for exp in expeditions]}), 200
    except Exception as e:
        print(f"Error fetching expeditions created by user {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch expeditions'}), 500

def get_expeditions_by_leader(user_id):
    """Get expeditions led by a specific user"""
    try:
        expeditions = Expedition.query.filter_by(leader_id=user_id).all()
        return jsonify({'expeditions': [exp.to_dict() for exp in expeditions]}), 200
    except Exception as e:
        print(f"Error fetching expeditions led by user {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch expeditions'}), 500

def create_expedition():
    """Create a new expedition"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Set creator if not provided
        if 'created_by' not in data:
            data['created_by'] = current_user_id
        
        # Set leader to creator if not provided
        if 'leader_id' not in data:
            data['leader_id'] = data['created_by']
        
        # Check if user is allowed to create for this team
        if 'team_id' in data and data['team_id']:
            # Verify user is part of this team
            team_membership = TeamMember.query.filter_by(
                user_id=current_user_id,
                team_id=data['team_id']
            ).first()
            
            if not team_membership:
                return jsonify({'error': 'You are not a member of this team'}), 403
            
            # For now, allow any team member to create expeditions
            # In production, you might want to restrict by role_level
        
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
        
        return jsonify({'message': 'Expedition created successfully', 
                       'expedition_id': expedition.expedition_id, 
                       'expedition': expedition.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating expedition: {str(e)}")
        return jsonify({'error': f'Failed to create expedition: {str(e)}'}), 500

def update_expedition(expedition_id):
    """Update an existing expedition"""
    try:
        data = request.get_json()
        expedition = Expedition.query.get_or_404(expedition_id)
        
        # Check if user is authorized to update this expedition
        current_user_id = get_jwt_identity()
        if expedition.created_by != current_user_id and expedition.leader_id != current_user_id:
            # Check if user is a master guide or tactical guide of the team
            if expedition.team_id:
                team_member = TeamMember.query.filter_by(
                    team_id=expedition.team_id,
                    user_id=current_user_id,
                ).first()
                
                if not team_member or team_member.role_level > 2:  # Only level 1 and 2 can edit
                    return jsonify({'error': 'Unauthorized to update this expedition'}), 403
            else:
                return jsonify({'error': 'Unauthorized to update this expedition'}), 403
        
        # Update fields
        for field in [
            'title', 'description', 'start_date', 'end_date', 
            'min_participants', 'max_participants', 'price', 
            'leader_id', 'expedition_status'
        ]:
            if field in data:
                # Handle date fields
                if field in ['start_date', 'end_date'] and data[field]:
                    setattr(expedition, field, datetime.fromisoformat(data[field]) 
                            if isinstance(data[field], str) else data[field])
                else:
                    setattr(expedition, field, data[field])
        
        expedition.updated_at = datetime.utcnow()
        db.session.commit()
        db.session.refresh(expedition)
        
        return jsonify({'message': 'Expedition updated successfully', 
                       'expedition': expedition.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating expedition {expedition_id}: {str(e)}")
        return jsonify({'error': f'Failed to update expedition: {str(e)}'}), 500

def delete_expedition(expedition_id):
    """Delete an expedition"""
    try:
        expedition = Expedition.query.get_or_404(expedition_id)
        
        # Check if user is authorized to delete this expedition
        current_user_id = get_jwt_identity()
        
        # Only creator or team master guide can delete
        if expedition.created_by != current_user_id:
            if expedition.team_id:
                # Check if user is master guide of the team
                team = Team.query.get(expedition.team_id)
                if not team or team.master_guide_id != current_user_id:
                    return jsonify({'error': 'Unauthorized to delete this expedition'}), 403
            else:
                return jsonify({'error': 'Unauthorized to delete this expedition'}), 403
        
        db.session.delete(expedition)
        db.session.commit()
        
        return jsonify({'message': 'Expedition deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting expedition {expedition_id}: {str(e)}")
        return jsonify({'error': f'Failed to delete expedition: {str(e)}'}), 500

def get_expedition_activities(expedition_id):
    """Get activities for a specific expedition"""
    try:
        activities = ExpeditionActivity.query.filter_by(expedition_id=expedition_id).all()
        return jsonify({'activities': [activity.to_dict() for activity in activities]}), 200
    except Exception as e:
        print(f"Error fetching activities for expedition {expedition_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch expedition activities'}), 500

def add_expedition_activities(expedition_id):
    """Add or update activities for an expedition"""
    try:
        data = request.get_json()
        expedition = Expedition.query.get_or_404(expedition_id)
        
        # Check if user is authorized
        current_user_id = get_jwt_identity()
        if expedition.created_by != current_user_id and expedition.leader_id != current_user_id:
            # Check if user is a master guide or tactical guide of the team
            if expedition.team_id:
                team_member = TeamMember.query.filter_by(
                    team_id=expedition.team_id,
                    user_id=current_user_id,
                ).first()
                
                if not team_member or team_member.role_level > 2:  # Only level 1 and 2 can edit
                    return jsonify({'error': 'Unauthorized to update expedition activities'}), 403
            else:
                return jsonify({'error': 'Unauthorized to update expedition activities'}), 403
        
        # First delete existing activities
        ExpeditionActivity.query.filter_by(expedition_id=expedition_id).delete()
        
        # Now add the new activities
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