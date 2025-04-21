# app/services/activity_service.py
from app import db
from app.models.activity import Activity, find_similar_activities
from app.models.location import Location
from app.models.activity_type import ActivityType
from app.models.team import Team, TeamMember
from datetime import datetime

class ActivityService:
    """Service for activity-related operations"""
    
    @staticmethod
    def get_all_activities():
        """Get all activities"""
        try:
            activities = Activity.query.all()
            return [activity.to_dict() for activity in activities], None
        except Exception as e:
            return None, f"Error fetching activities: {str(e)}"
    
    @staticmethod
    def get_activity_by_id(activity_id):
        """Get a specific activity by ID"""
        try:
            activity = Activity.query.get(activity_id)
            if not activity:
                return None, "Activity not found"
            return activity.to_dict(), None
        except Exception as e:
            return None, f"Error fetching activity: {str(e)}"
    
    @staticmethod
    def get_user_activities(user_id):
        """Get activities based on user's role in the team"""
        try:
            # Find all teams where the user is a member
            team_memberships = TeamMember.query.filter_by(user_id=user_id).all()
            
            if not team_memberships:
                # User is not part of any team, only show activities they created
                activities = Activity.query.filter_by(created_by=user_id).all()
                return [activity.to_dict() for activity in activities], None
            
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
                        (Activity.created_by == user_id) | (Activity.leader_id == user_id)
                    ).all()
                    all_activities.extend(team_activities)
                
                # Level 4 (Base Guide): Can only see activities they created
                elif role_level == 4:
                    team_activities = Activity.query.filter(
                        Activity.team_id == team_id,
                        Activity.created_by == user_id
                    ).all()
                    all_activities.extend(team_activities)
            
            # Remove duplicates
            unique_activities = []
            activity_ids = set()
            
            for activity in all_activities:
                if activity.activity_id not in activity_ids:
                    activity_ids.add(activity.activity_id)
                    unique_activities.append(activity)
            
            return [activity.to_dict() for activity in unique_activities], None
            
        except Exception as e:
            return None, f"Error fetching user activities: {str(e)}"
    
    @staticmethod
    def get_team_activities(team_id, user_id):
        """Get activities for a specific team (respecting permission levels)"""
        try:
            # Find user's role in this team
            membership = TeamMember.query.filter_by(
                user_id=user_id,
                team_id=team_id
            ).first()
            
            if not membership:
                return None, "You are not a member of this team"
            
            # Filter activities based on role level
            if membership.role_level <= 2:  # Master Guide and Tactical Guide
                activities = Activity.query.filter_by(team_id=team_id).all()
            elif membership.role_level == 3:  # Technical Guide
                activities = Activity.query.filter(
                    Activity.team_id == team_id,
                    (Activity.created_by == user_id) | (Activity.leader_id == user_id)
                ).all()
            else:  # Base Guide
                activities = Activity.query.filter(
                    Activity.team_id == team_id,
                    Activity.created_by == user_id
                ).all()
            
            return [activity.to_dict() for activity in activities], None
        except Exception as e:
            return None, f"Error fetching team activities: {str(e)}"
    
    @staticmethod
    def create_activity(data, current_user_id):
        """Create a new activity"""
        try:
            if 'created_by' not in data:
                data['created_by'] = current_user_id
            
            # Get user's team_id from their team membership
            team_id = None
            if 'team_id' not in data or not data['team_id']:
                # Find first team where the user is a member
                team_membership = TeamMember.query.filter_by(user_id=current_user_id).first()
                if team_membership:
                    team_id = team_membership.team_id
            else:
                team_id = data['team_id']
            
            # Verify the user has permission to create activities in this team
            if team_id:
                membership = TeamMember.query.filter_by(
                    user_id=current_user_id, 
                    team_id=team_id
                ).first()
                
                if not membership:
                    return None, "You are not a member of this team"
                
                # Check for duplicate activity title in the same team
                existing_activity = Activity.query.filter_by(
                    team_id=team_id,
                    title=data.get('title')
                ).first()
                
                if existing_activity:
                    return None, "An activity with this name already exists in your team"

            # Validate location exists
            location_id = data.get('location_id')
            if location_id:
                location = Location.query.get(location_id)
                if not location:
                    return None, f"Location with ID {location_id} not found"

            # Validate activity type exists
            activity_type_id = data.get('activity_type_id')
            if activity_type_id:
                activity_type = ActivityType.query.get(activity_type_id)
                if not activity_type:
                    return None, f"Activity type with ID {activity_type_id} not found"

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
                    return None, "Selected leader is not a member of this team"
                    
                # Check if current user can assign this leader
                user_membership = TeamMember.query.filter_by(
                    user_id=current_user_id,
                    team_id=team_id
                ).first()
                
                # Base Guide (Level 4): Can only assign Master Guide or Tactical Guide as leaders
                if user_membership.role_level == 4 and leader_membership.role_level > 2:
                    return None, "Base Guides can only assign Master Guides or Tactical Guides as leaders"

            new_activity = Activity(
                title=data.get('title'),
                team_id=team_id,
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

            return new_activity.to_dict(), None
        except Exception as e:
            db.session.rollback()
            return None, f"Failed to create activity: {str(e)}"
    
    @staticmethod
    def update_activity(activity_id, data, current_user_id):
        """Update an existing activity"""
        try:
            activity = Activity.query.get(activity_id)
            
            if not activity:
                return None, "Activity not found"
            
            # Check authorization based on role level if activity has a team
            if activity.team_id:
                team_membership = TeamMember.query.filter_by(
                    user_id=current_user_id, 
                    team_id=activity.team_id
                ).first()
                
                if not team_membership:
                    return None, "You are not a member of this team"
                    
                # Master Guide (Level 1) and Tactical Guide (Level 2) can edit any activity
                # Technical Guide (Level 3) can only edit activities they created or lead
                # Base Guide (Level 4) can only edit activities they created
                if team_membership.role_level > 2:
                    if team_membership.role_level == 3:
                        if activity.created_by != current_user_id and activity.leader_id != current_user_id:
                            return None, "Technical Guides can only edit activities they created or lead"
                    elif team_membership.role_level == 4:
                        if activity.created_by != current_user_id:
                            return None, "Base Guides can only edit activities they created"
            else:
                # For activities without a team, only the creator can edit
                if activity.created_by != current_user_id:
                    return None, "Only the creator can edit this activity"

            # Check for duplicate title if changed and activity has a team
            if 'title' in data and data['title'] != activity.title and activity.team_id:
                existing_activity = Activity.query.filter_by(
                    team_id=activity.team_id,
                    title=data['title']
                ).filter(Activity.activity_id != activity_id).first()
                
                if existing_activity:
                    return None, "An activity with this name already exists in your team"

            # Validate location if updated
            if 'location_id' in data and data['location_id'] != activity.location_id:
                location = Location.query.get(data['location_id'])
                if not location:
                    return None, f"Location with ID {data['location_id']} not found"

            # Validate activity type if updated
            if 'activity_type_id' in data and data['activity_type_id'] != activity.activity_type_id:
                activity_type = ActivityType.query.get(data['activity_type_id'])
                if not activity_type:
                    return None, f"Activity type with ID {data['activity_type_id']} not found"
            
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
                        return None, "Base Guides can only assign Master Guides or Tactical Guides as leaders"

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

            return activity.to_dict(), None
        except Exception as e:
            db.session.rollback()
            return None, f"Failed to update activity: {str(e)}"
    
    @staticmethod
    def delete_activity(activity_id, current_user_id):
        """Delete an activity"""
        try:
            activity = Activity.query.get(activity_id)
            
            if not activity:
                return None, "Activity not found"
            
            # Check authorization based on role level
            team_membership = TeamMember.query.filter_by(
                user_id=current_user_id, 
                team_id=activity.team_id
            ).first()
            
            if not team_membership:
                return None, "You are not a member of this team"
                
            # Only Master Guide (Level 1) can delete activities
            if team_membership.role_level != 1:
                return None, "Only Master Guides can delete activities"

            db.session.delete(activity)
            db.session.commit()

            return {"message": "Activity deleted successfully"}, None
        except Exception as e:
            db.session.rollback()
            return None, f"Failed to delete activity: {str(e)}"
    
    @staticmethod
    def check_activity_title_unique(title, team_id, activity_id=None):
        """Check if an activity title is unique within a team"""
        try:
            query = Activity.query.filter_by(team_id=team_id, title=title)
            
            if activity_id:
                query = query.filter(Activity.activity_id != activity_id)
            
            return {"unique": query.first() is None}, None
        except Exception as e:
            return None, f"Error checking title uniqueness: {str(e)}"
    
    @staticmethod
    def find_similar_activities(team_id, activity_type_id, location_id, activity_id=None):
        """Find similar activities based on type and location"""
        try:
            similar_activities = find_similar_activities(
                team_id, activity_type_id, location_id, activity_id
            )
            
            return {
                "has_similar": len(similar_activities) > 0,
                "similar_count": len(similar_activities),
                "similar_activities": [
                    {
                        "activity_id": a.activity_id,
                        "title": a.title,
                        "difficulty_level": a.difficulty_level,
                        "price": float(a.price)
                    } for a in similar_activities[:5]
                ]
            }, None
        except Exception as e:
            return None, f"Error finding similar activities: {str(e)}"