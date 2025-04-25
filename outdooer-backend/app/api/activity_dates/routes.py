# app/api/activity_dates/routes.py
from flask import jsonify, request
from app import db
from app.models.activity import Activity
from app.models.activity_date import GuideActivityInstance, ActivityAvailableDate
from app.models.team_member import TeamMember
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, time
from . import activity_dates_bp

# Get guide instances for a guide
@activity_dates_bp.route('/guide-instances', methods=['GET'])
@jwt_required()
def get_guide_instances():
    """Get activity instances for the current guide"""
    try:
        current_user_id = get_jwt_identity()
        instances = GuideActivityInstance.query.filter_by(guide_id=current_user_id, is_active=True).all()
        return jsonify({'instances': [instance.to_dict() for instance in instances]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Create a guide instance for an activity
@activity_dates_bp.route('/guide-instances', methods=['POST'])
@jwt_required()
def create_guide_instance():
    """Create a new activity instance for a guide"""
    try:
        data = request.json
        current_user_id = get_jwt_identity()
        
        # Verify activity exists
        activity = Activity.query.get_or_404(data.get('activity_id'))
        
        # Verify permissions
        if activity.team_id:
            team_member = TeamMember.query.filter_by(
                user_id=current_user_id,
                team_id=activity.team_id
            ).first()
            
            if not team_member:
                return jsonify({'error': 'You are not a member of this team'}), 403
        
        # Create the instance
        instance = GuideActivityInstance(
            guide_id=current_user_id,
            activity_id=activity.activity_id,
            team_id=activity.team_id,
            is_active=True
        )
        
        db.session.add(instance)
        db.session.commit()
        
        return jsonify({
            'message': 'Activity instance created successfully',
            'instance': instance.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Add a date to an activity instance
@activity_dates_bp.route('/add-date', methods=['POST'])
@jwt_required()
def add_activity_date():
    """Add a new available date for an activity"""
    try:
        data = request.json
        current_user_id = get_jwt_identity()
        
        # Get activity ID from request
        activity_id = data.get('activity_id')
        if not activity_id:
            return jsonify({'error': 'Activity ID is required'}), 400
            
        # Verify that the activity exists
        activity = Activity.query.get_or_404(activity_id)
        
        # Verify permissions for editing the activity
        if activity.team_id:
            team_member = TeamMember.query.filter_by(
                user_id=current_user_id,
                team_id=activity.team_id
            ).first()
            
            if not team_member:
                return jsonify({'error': 'You are not a member of this team'}), 403
            
            # Only certain roles can add dates
            if team_member.role_level > 3 and activity.created_by != current_user_id and activity.leader_id != current_user_id:
                return jsonify({'error': 'You do not have permission to add dates to this activity'}), 403
        
        # Find or create activity instance for this guide
        instance = GuideActivityInstance.query.filter_by(
            guide_id=current_user_id, 
            activity_id=activity_id,
            is_active=True
        ).first()
        
        if not instance:
            instance = GuideActivityInstance(
                guide_id=current_user_id,
                activity_id=activity_id,
                team_id=activity.team_id,
                is_active=True
            )
            db.session.add(instance)
            db.session.flush()  # Get ID without commit
        
        # Validate and parse date and time
        try:
            date_value = date.fromisoformat(data.get('date'))
            start_time_value = time.fromisoformat(data.get('start_time'))
            end_time_value = time.fromisoformat(data.get('end_time'))
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid date or time format. Use YYYY-MM-DD for date and HH:MM:SS for time'}), 400
            
        # Create the date
        activity_date = ActivityAvailableDate(
            activity_instance_id=instance.instance_id,
            date=date_value,
            start_time=start_time_value,
            end_time=end_time_value,
            max_reservations=data.get('max_reservations', 10),
            location=data.get('location'),
            status=data.get('status', 'open')
        )
        
        db.session.add(activity_date)
        db.session.commit()
        
        # Prepare response with additional data
        date_dict = activity_date.to_dict()
        date_dict['guide_id'] = instance.guide_id
        date_dict['guide_name'] = f"{instance.guide.first_name} {instance.guide.last_name}" if instance.guide else "Unknown"
        date_dict['activity_id'] = activity_id
        
        return jsonify({
            'message': 'Activity date added successfully',
            'date': date_dict
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Get dates for an activity
@activity_dates_bp.route('/for-activity/<int:activity_id>', methods=['GET'])
@jwt_required()
def get_activity_dates(activity_id):
    """Get all available dates for an activity"""
    try:
        # Verify if activity exists
        activity = Activity.query.get_or_404(activity_id)
        
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
        
        return jsonify({"dates": all_dates}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get my available dates (dates for activities led by the current user)
@activity_dates_bp.route('/my-dates', methods=['GET'])
@jwt_required()
def get_my_activity_dates():
    """Get all available dates for activities led by the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get instances for this guide
        instances = GuideActivityInstance.query.filter_by(guide_id=current_user_id, is_active=True).all()
        
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
        
        return jsonify({"dates": all_dates}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Update a date
@activity_dates_bp.route('/activity-dates/<int:date_id>', methods=['PUT'])
@jwt_required()
def update_activity_date(date_id):
    """Update an existing activity date"""
    try:
        data = request.json
        current_user_id = get_jwt_identity()
        
        # Verify that the date exists
        activity_date = ActivityAvailableDate.query.get_or_404(date_id)
        
        # Verify that the user is the guide for this date
        instance = GuideActivityInstance.query.get(activity_date.activity_instance_id)
        if not instance or instance.guide_id != current_user_id:
            # Check if the user is a Master Guide or Tactical Guide for the team
            if instance and instance.team_id:
                team_member = TeamMember.query.filter_by(
                    user_id=current_user_id,
                    team_id=instance.team_id
                ).first()
                
                if not team_member or team_member.role_level > 2:  # Only Master Guide and Tactical Guide
                    return jsonify({'error': 'You do not have permission to update this date'}), 403
            else:
                return jsonify({'error': 'You do not have permission to update this date'}), 403
        
        # Update the fields
        if 'date' in data:
            try:
                activity_date.date = date.fromisoformat(data['date'])
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
                
        if 'start_time' in data:
            try:
                activity_date.start_time = time.fromisoformat(data['start_time'])
            except ValueError:
                return jsonify({'error': 'Invalid start time format. Use HH:MM:SS'}), 400
                
        if 'end_time' in data:
            try:
                activity_date.end_time = time.fromisoformat(data['end_time'])
            except ValueError:
                return jsonify({'error': 'Invalid end time format. Use HH:MM:SS'}), 400
                
        if 'max_reservations' in data:
            activity_date.max_reservations = data['max_reservations']
            
        if 'location' in data:
            activity_date.location = data['location']
            
        if 'status' in data:
            activity_date.status = data['status']
        
        db.session.commit()
        
        # Prepare response with additional data
        date_dict = activity_date.to_dict()
        date_dict['guide_id'] = instance.guide_id
        date_dict['guide_name'] = f"{instance.guide.first_name} {instance.guide.last_name}" if instance.guide else "Unknown"
        date_dict['activity_id'] = instance.activity_id
        
        return jsonify({
            'message': 'Activity date updated successfully',
            'date': date_dict
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Delete a date
@activity_dates_bp.route('/activity-dates/<int:date_id>', methods=['DELETE'])
@jwt_required()
def delete_activity_date(date_id):
    """Delete an activity date"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify that the date exists
        activity_date = ActivityAvailableDate.query.get_or_404(date_id)
        
        # Verify that the user is the guide for this date
        instance = GuideActivityInstance.query.get(activity_date.activity_instance_id)
        if not instance or instance.guide_id != current_user_id:
            # Check if the user is a Master Guide or Tactical Guide for the team
            if instance and instance.team_id:
                team_member = TeamMember.query.filter_by(
                    user_id=current_user_id,
                    team_id=instance.team_id
                ).first()
                
                if not team_member or team_member.role_level > 2:  # Only Master Guide and Tactical Guide
                    return jsonify({'error': 'You do not have permission to delete this date'}), 403
            else:
                return jsonify({'error': 'You do not have permission to delete this date'}), 403
        
        # Check if there are reservations for this date
        if activity_date.current_reservations > 0:
            return jsonify({'error': 'Cannot delete a date with existing reservations'}), 400
        
        # Delete the date
        db.session.delete(activity_date)
        db.session.commit()
        
        return jsonify({'message': 'Activity date deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500