# app/api/expeditions/controllers.py

from flask import jsonify, request
from app.database import db
from app.models.expedition import Expedition, ExpeditionActivity
from app.models.team_member import TeamMember
from app.models.team_role_permissions import TeamRolePermissions
from flask_jwt_extended import get_jwt_identity
from datetime import datetime

# =======================
# Helpers
# =======================

def get_user_role_level(user_id, team_id):
    """Return the role level of a user within a team."""
    member = TeamMember.query.filter_by(user_id=user_id, team_id=team_id).first()
    return member.role_level if member else None

def check_expedition_permission(user_id, team_id, permission_key):
    """Check if user has permission for expedition operation."""
    # Get the user's role level in this team
    role_level = get_user_role_level(user_id, team_id)
    if not role_level:
        return False, "You are not a member of this team"
    
    # First check team-specific permissions
    team_permission = TeamRolePermissions.query.filter_by(
        team_id=team_id,
        role_level=role_level,
        permission_key=permission_key
    ).first()
    
    # If team-specific permission exists, use it
    if team_permission:
        return team_permission.is_enabled, None
    
    # Fall back to global permissions
    global_permission = TeamRolePermissions.query.filter_by(
        team_id=None,
        role_level=role_level,
        permission_key=permission_key
    ).first()
    
    if global_permission:
        return global_permission.is_enabled, None
    
    # Default to no permission if no rules found
    return False, "Permission not defined"

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

        # Get team_id from request data
        team_id = data.get('team_id')
        if not team_id:
            return jsonify({'error': 'Team ID is required'}), 400
            
        # Check permission to create expedition
        has_permission, error_msg = check_expedition_permission(
            current_user_id, team_id, 'create_expedition'
        )
        
        if not has_permission:
            return jsonify({'error': error_msg or 'You do not have permission to create expeditions'}), 403

        if 'created_by' not in data:
            data['created_by'] = current_user_id

        if 'leader_id' not in data:
            data['leader_id'] = data['created_by']

        expedition = Expedition(
            team_id=team_id,
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
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Check permission to update expedition
        team_id = expedition.team_id
        has_permission, error_msg = check_expedition_permission(
            current_user_id, team_id, 'update_expedition'
        )
        
        # Special case: Technical guides (level 3) can update their own expeditions
        # even if the general permission is disabled
        if not has_permission:
            role_level = get_user_role_level(current_user_id, team_id)
            is_own_expedition = expedition.created_by == current_user_id or expedition.leader_id == current_user_id
            
            # Level 3 guide can update own expedition
            if role_level == 3 and is_own_expedition:
                has_permission = True
                
        if not has_permission:
            return jsonify({'error': error_msg or 'You do not have permission to update this expedition'}), 403

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
        current_user_id = get_jwt_identity()
        
        # Check permission to delete expedition
        team_id = expedition.team_id
        has_permission, error_msg = check_expedition_permission(
            current_user_id, team_id, 'delete_expedition'
        )
        
        if not has_permission:
            return jsonify({'error': error_msg or 'You do not have permission to delete this expedition'}), 403

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
        
        # Check permission to update expedition
        team_id = expedition.team_id
        has_permission, error_msg = check_expedition_permission(
            current_user_id, team_id, 'update_expedition'
        )
        
        # Special case: Technical guides (level 3) can update their own expeditions
        if not has_permission:
            role_level = get_user_role_level(current_user_id, team_id)
            is_own_expedition = expedition.created_by == current_user_id or expedition.leader_id == current_user_id
            
            # Level 3 guide can update own expedition
            if role_level == 3 and is_own_expedition:
                has_permission = True
                
        if not has_permission:
            return jsonify({'error': error_msg or 'You do not have permission to update this expedition\'s activities'}), 403

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