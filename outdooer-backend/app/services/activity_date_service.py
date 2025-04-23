# app/services/activity_date_service.py
from app import db
from datetime import datetime, date, time
from app.models.activity import Activity
from app.models.activity_date import GuideActivityInstance, ActivityAvailableDate
from app.models.team import TeamMember

class ActivityDateService:
    """Service for activity date related operations"""
    
    @staticmethod
    def get_guide_instances(guide_id):
        """Get activity instances for a specific guide"""
        try:
            instances = GuideActivityInstance.query.filter_by(guide_id=guide_id, is_active=True).all()
            return [instance.to_dict() for instance in instances], None
        except Exception as e:
            return None, f"Error fetching guide instances: {str(e)}"
    
    @staticmethod
    def create_guide_instance(guide_id, activity_id):
        """Create a new activity instance for a guide"""
        try:
            # Verify the activity exists
            activity = Activity.query.get(activity_id)
            if not activity:
                return None, "Activity not found"
            
            # Verify permissions if activity belongs to a team
            if activity.team_id:
                team_member = TeamMember.query.filter_by(
                    user_id=guide_id,
                    team_id=activity.team_id
                ).first()
                
                if not team_member:
                    return None, "You are not a member of this team"
            
            # Check if instance already exists
            existing_instance = GuideActivityInstance.query.filter_by(
                guide_id=guide_id,
                activity_id=activity_id,
                is_active=True
            ).first()
            
            if existing_instance:
                return existing_instance.to_dict(), None
            
            # Create the instance
            instance = GuideActivityInstance(
                guide_id=guide_id,
                activity_id=activity_id,
                team_id=activity.team_id,
                is_active=True
            )
            
            db.session.add(instance)
            db.session.commit()
            
            return instance.to_dict(), None
        except Exception as e:
            db.session.rollback()
            return None, f"Error creating guide instance: {str(e)}"
    
    @staticmethod
    def add_activity_date(guide_id, activity_id, date_str, start_time_str, end_time_str, 
                         max_reservations=10, location=None, status="open"):
        """Add a new available date for an activity"""
        try:
            # Verify the activity exists
            activity = Activity.query.get(activity_id)
            if not activity:
                return None, "Activity not found"
            
            # Verify permissions for team activities
            if activity.team_id:
                team_member = TeamMember.query.filter_by(
                    user_id=guide_id,
                    team_id=activity.team_id
                ).first()
                
                if not team_member:
                    return None, "You are not a member of this team"
                
                # Check role-based permissions
                if team_member.role_level > 3:
                    if activity.created_by != guide_id and activity.leader_id != guide_id:
                        return None, "You do not have permission to add dates to this activity"
            
            # Parse date and time
            try:
                date_value = date.fromisoformat(date_str)
                start_time_value = time.fromisoformat(start_time_str)
                end_time_value = time.fromisoformat(end_time_str)
            except ValueError:
                return None, "Invalid date or time format"
            
            # Find or create activity instance
            instance = GuideActivityInstance.query.filter_by(
                guide_id=guide_id,
                activity_id=activity_id,
                is_active=True
            ).first()
            
            if not instance:
                instance = GuideActivityInstance(
                    guide_id=guide_id,
                    activity_id=activity_id,
                    team_id=activity.team_id,
                    is_active=True
                )
                db.session.add(instance)
                db.session.flush()
            
            # Create the date
            activity_date = ActivityAvailableDate(
                activity_instance_id=instance.instance_id,
                date=date_value,
                start_time=start_time_value,
                end_time=end_time_value,
                max_reservations=max_reservations,
                location=location,
                status=status
            )
            
            db.session.add(activity_date)
            db.session.commit()
            
            # Prepare response with additional data
            date_dict = activity_date.to_dict()
            date_dict['guide_id'] = instance.guide_id
            date_dict['guide_name'] = f"{instance.guide.first_name} {instance.guide.last_name}" if instance.guide else "Unknown"
            date_dict['activity_id'] = activity_id
            
            return date_dict, None
        except Exception as e:
            db.session.rollback()
            return None, f"Error adding activity date: {str(e)}"
    
    @staticmethod
    def update_activity_date(date_id, current_user_id, data):
        """Update an existing activity date"""
        try:
            # Verify the date exists
            activity_date = ActivityAvailableDate.query.get(date_id)
            if not activity_date:
                return None, "Activity date not found"
            
            # Get the instance and verify permissions
            instance = GuideActivityInstance.query.get(activity_date.activity_instance_id)
            if not instance:
                return None, "Activity instance not found"
            
            # Check if user is guide for this date or has sufficient permission
            if instance.guide_id != current_user_id:
                if instance.team_id:
                    team_member = TeamMember.query.filter_by(
                        user_id=current_user_id,
                        team_id=instance.team_id
                    ).first()
                    
                    if not team_member or team_member.role_level > 2:  # Only Master Guide and Tactical Guide
                        return None, "You do not have permission to update this date"
                else:
                    return None, "You do not have permission to update this date"
            
            # Update fields
            if 'date' in data:
                try:
                    activity_date.date = date.fromisoformat(data['date'])
                except ValueError:
                    return None, "Invalid date format"
                    
            if 'start_time' in data:
                try:
                    activity_date.start_time = time.fromisoformat(data['start_time'])
                except ValueError:
                    return None, "Invalid start time format"
                    
            if 'end_time' in data:
                try:
                    activity_date.end_time = time.fromisoformat(data['end_time'])
                except ValueError:
                    return None, "Invalid end time format"
                    
            if 'max_reservations' in data:
                activity_date.max_reservations = data['max_reservations']
                
            if 'location' in data:
                activity_date.location = data['location']
                
            if 'status' in data:
                activity_date.status = data['status']
            
            db.session.commit()
            
            # Prepare response
            date_dict = activity_date.to_dict()
            date_dict['guide_id'] = instance.guide_id
            date_dict['guide_name'] = f"{instance.guide.first_name} {instance.guide.last_name}" if instance.guide else "Unknown"
            date_dict['activity_id'] = instance.activity_id
            
            return date_dict, None
        except Exception as e:
            db.session.rollback()
            return None, f"Error updating activity date: {str(e)}"
    
    @staticmethod
    def delete_activity_date(date_id, current_user_id):
        """Delete an activity date"""
        try:
            # Verify the date exists
            activity_date = ActivityAvailableDate.query.get(date_id)
            if not activity_date:
                return None, "Activity date not found"
            
            # Get the instance and verify permissions
            instance = GuideActivityInstance.query.get(activity_date.activity_instance_id)
            if not instance:
                return None, "Activity instance not found"
            
            # Check if user is guide for this date or has sufficient permission
            if instance.guide_id != current_user_id:
                if instance.team_id:
                    team_member = TeamMember.query.filter_by(
                        user_id=current_user_id,
                        team_id=instance.team_id
                    ).first()
                    
                    if not team_member or team_member.role_level > 2:  # Only Master Guide and Tactical Guide
                        return None, "You do not have permission to delete this date"
                else:
                    return None, "You do not have permission to delete this date"
            
            # Check if there are reservations
            if activity_date.current_reservations > 0:
                return None, "Cannot delete a date with existing reservations"
            
            # Delete the date
            db.session.delete(activity_date)
            db.session.commit()
            
            return {"message": "Activity date deleted successfully"}, None
        except Exception as e:
            db.session.rollback()
            return None, f"Error deleting activity date: {str(e)}"
    
    @staticmethod
    def get_activity_dates(activity_id):
        """Get all available dates for an activity"""
        try:
            # Verify the activity exists
            activity = Activity.query.get(activity_id)
            if not activity:
                return None, "Activity not found"
            
            # Get all instances for this activity
            instances = GuideActivityInstance.query.filter_by(activity_id=activity_id, is_active=True).all()
            
            # Get all dates from all instances
            all_dates = []
            for instance in instances:
                dates = ActivityAvailableDate.query.filter_by(activity_instance_id=instance.instance_id).all()
                
                for date_obj in dates:
                    date_dict = date_obj.to_dict()
                    date_dict['guide_id'] = instance.guide_id
                    date_dict['guide_name'] = f"{instance.guide.first_name} {instance.guide.last_name}" if instance.guide else "Unknown"
                    date_dict['activity_id'] = activity_id
                    all_dates.append(date_dict)
            
            return all_dates, None
        except Exception as e:
            return None, f"Error fetching activity dates: {str(e)}"
    
    @staticmethod
    def get_guide_activity_dates(guide_id):
        """Get all available dates for activities led by a specific guide"""
        try:
            # Get instances for this guide
            instances = GuideActivityInstance.query.filter_by(guide_id=guide_id, is_active=True).all()
            
            # Get all dates for all instances
            all_dates = []
            for instance in instances:
                dates = ActivityAvailableDate.query.filter_by(activity_instance_id=instance.instance_id).all()
                
                for date_obj in dates:
                    date_dict = date_obj.to_dict()
                    date_dict['guide_id'] = instance.guide_id
                    date_dict['activity_id'] = instance.activity_id
                    date_dict['activity_title'] = instance.activity.title if instance.activity else "Unknown"
                    all_dates.append(date_dict)
            
            return all_dates, None
        except Exception as e:
            return None, f"Error fetching guide activity dates: {str(e)}"