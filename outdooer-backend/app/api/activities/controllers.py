# app/api/activities/controllers.py

from flask import jsonify, request
from datetime import datetime
from app import db
from app.models.activity import Activity
from app.models.location import Location
from app.models.activity_type import ActivityType
from app.models.team import Team
from app.models.team_member import TeamMember
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

def get_my_activities():
    """Get activities based on user's role in the team"""
    try:
        current_user_id = get_jwt_identity()
        
        # Find all teams where the user is a member
        team_memberships = TeamMember.query.filter_by(user_id=current_user_id).all()
        
        if not team_memberships:
            # User is not part of any team, only show activities they created
            activities = Activity.query.filter_by(created_by=current_user_id).all()
            return jsonify({'activities': [activity.to_dict() for activity in activities]}), 200
        
        # Process each team membership based on role level
        all_activities = []
        
        for membership in team_memberships:
            team_id = membership.team_id
            role_level = membership.role_level
            
            # Level 1 (Master Guide) and Level 2 (Tactical Guide): Can see all team activities
            if role_level <= 2:  
                team_activities = Activity.query.filter_by(team_id=team_id).all()
                all_activities.extend(team_activities)
            
            # Level 3 (Technical Guide): Can see activities they created or are leading
            elif role_level == 3:
                team_activities = Activity.query.filter(
                    Activity.team_id == team_id,
                    (Activity.created_by == current_user_id) | (Activity.leader_id == current_user_id)
                ).all()
                all_activities.extend(team_activities)
            
            # Level 4 (Base Guide): Can only see activities they created
            elif role_level == 4:
                team_activities = Activity.query.filter(
                    Activity.team_id == team_id,
                    Activity.created_by == current_user_id
                ).all()
                all_activities.extend(team_activities)
        
        # Remove duplicates (in case a user has same activities in multiple teams)
        unique_activities = []
        activity_ids = set()
        
        for activity in all_activities:
            if activity.activity_id not in activity_ids:
                activity_ids.add(activity.activity_id)
                unique_activities.append(activity)
        
        return jsonify({'activities': [activity.to_dict() for activity in unique_activities]}), 200
        
    except Exception as e:
        print(f"Error fetching user activities: {str(e)}")
        return jsonify({'error': f'Failed to fetch user activities: {str(e)}'}), 500

def create_activity():
    """Create a new activity"""
    try:
        data = request.get_json()
        if 'created_by' not in data:
            data['created_by'] = get_jwt_identity()
        
        current_user_id = data['created_by']
        
        # Get user's team_id from their team membership
        team_id = None
        if 'team_id' not in data or not data['team_id']:
            # Find first team where the user is a member
            team_membership = TeamMember.query.filter_by(user_id=current_user_id).first()
            if team_membership:
                team_id = team_membership.team_id
        else:
            team_id = data['team_id']
        
        # Verify the user has permission to create activities in this team (if a team is assigned)
        if team_id:
            membership = TeamMember.query.filter_by(
                user_id=current_user_id, 
                team_id=team_id
            ).first()
            
            if not membership:
                return jsonify({"error": "You are not a member of this team"}), 403
            
            # Check for duplicate activity title in the same team
            existing_activity = Activity.query.filter_by(
                team_id=team_id,
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

        # Set leader_id to current user if not specified
        if 'leader_id' not in data:
            data['leader_id'] = current_user_id
        
        # Validate leader_id based on role level (only if team exists)
        leader_id = data.get('leader_id')
        if leader_id != current_user_id and team_id:
            leader_membership = TeamMember.query.filter_by(
                user_id=leader_id, 
                team_id=team_id
            ).first()
            
            if not leader_membership:
                return jsonify({"error": "Selected leader is not a member of this team"}), 400
                
            # Check if current user can assign this leader
            user_membership = TeamMember.query.filter_by(
                user_id=current_user_id,
                team_id=team_id
            ).first()
            
            # Base Guide (Level 4): Can only assign Master Guide or Tactical Guide as leaders
            if user_membership.role_level == 4 and leader_membership.role_level > 2:
                return jsonify({"error": "Base Guides can only assign Master Guides or Tactical Guides as leaders"}), 403

        new_activity = Activity(
            title=data.get('title'),
            team_id=team_id,  # Can be None for guides without a team
            description=data.get('description'),
            location_id=location_id,
            difficulty_level=data.get('difficulty_level'),
            price=data.get('price'),
            min_participants=data.get('min_participants'),
            max_participants=data.get('max_participants'),
            activity_type_id=activity_type_id,
            leader_id=leader_id,
            activity_status=data.get('activity_status', 'active'),
            created_by=data.get('created_by'),
            act_cover_image_url=data.get('act_cover_image_url')
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
        
        # Check authorization based on role level if activity has a team
        if activity.team_id:
            team_membership = TeamMember.query.filter_by(
                user_id=current_user_id, 
                team_id=activity.team_id
            ).first()
            
            if not team_membership:
                return jsonify({"error": "You are not a member of this team"}), 403
                
            # Master Guide (Level 1) and Tactical Guide (Level 2) can edit any activity
            # Technical Guide (Level 3) can only edit activities they created or lead
            # Base Guide (Level 4) can only edit activities they created
            if team_membership.role_level > 2:
                if team_membership.role_level == 3:
                    if activity.created_by != current_user_id and activity.leader_id != current_user_id:
                        return jsonify({"error": "Technical Guides can only edit activities they created or lead"}), 403
                elif team_membership.role_level == 4:
                    if activity.created_by != current_user_id:
                        return jsonify({"error": "Base Guides can only edit activities they created"}), 403
        else:
            # For activities without a team, only the creator can edit
            if activity.created_by != current_user_id:
                return jsonify({"error": "Only the creator can edit this activity"}), 403

        # Check for duplicate title if changed and activity has a team
        if 'title' in data and data['title'] != activity.title and activity.team_id:
            existing_activity = Activity.query.filter_by(
                team_id=activity.team_id,
                title=data['title']
            ).filter(Activity.activity_id != activity_id).first()
            
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
        
        # Check leader assignment permission if activity has a team
        if 'leader_id' in data and data['leader_id'] != activity.leader_id and activity.team_id:
            # Base Guide can only assign Master or Tactical Guide as leaders
            team_membership = TeamMember.query.filter_by(
                user_id=current_user_id, 
                team_id=activity.team_id
            ).first()
            
            if team_membership and team_membership.role_level == 4:
                leader_membership = TeamMember.query.filter_by(
                    user_id=data['leader_id'], 
                    team_id=activity.team_id
                ).first()
                
                if not leader_membership or leader_membership.role_level > 2:
                    return jsonify({"error": "Base Guides can only assign Master Guides or Tactical Guides as leaders"}), 403

        # Apply updates
        for field in [
            'title', 'description', 'location_id', 'difficulty_level',
            'price', 'min_participants', 'max_participants',
            'activity_type_id', 'leader_id', 'activity_status', 'act_cover_image_url'
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
    
def delete_activity(activity_id):
    """Delete an activity"""
    try:
        current_user_id = get_jwt_identity()
        activity = Activity.query.get_or_404(activity_id)
        
        # Check authorization based on role level
        team_membership = TeamMember.query.filter_by(
            user_id=current_user_id, 
            team_id=activity.team_id
        ).first()
        
        if not team_membership:
            return jsonify({"error": "You are not a member of this team"}), 403
            
        # Only Master Guide (Level 1) can delete activities
        if team_membership.role_level != 1:
            return jsonify({"error": "Only Master Guides can delete activities"}), 403

        db.session.delete(activity)
        db.session.commit()

        return jsonify({
            "message": "Activity deleted successfully"
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting activity {activity_id}: {str(e)}")
        return jsonify({"error": f"Failed to delete activity: {str(e)}"}), 500