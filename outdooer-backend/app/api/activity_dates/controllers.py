# app/api/activity_dates/controllers.py
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from app.services.activity_date_service import ActivityDateService

def get_guide_instances():
    """Get activity instances for the current guide"""
    try:
        current_user_id = get_jwt_identity()
        instances, error = ActivityDateService.get_guide_instances(current_user_id)
        
        if error:
            return jsonify({'error': error}), 500
            
        return jsonify({'instances': instances}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_guide_instance():
    """Create a new activity instance for a guide"""
    try:
        data = request.json
        current_user_id = get_jwt_identity()
        
        activity_id = data.get('activity_id')
        if not activity_id:
            return jsonify({'error': 'Activity ID is required'}), 400
            
        instance, error = ActivityDateService.create_guide_instance(current_user_id, activity_id)
        
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify({
            'message': 'Activity instance created successfully',
            'instance': instance
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def add_activity_date():
    """Add a new available date for an activity"""
    try:
        data = request.json
        current_user_id = get_jwt_identity()
        
        # Validate required fields
        required_fields = ['activity_id', 'date', 'start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        date_dict, error = ActivityDateService.add_activity_date(
            guide_id=current_user_id,
            activity_id=data.get('activity_id'),
            date_str=data.get('date'),
            start_time_str=data.get('start_time'),
            end_time_str=data.get('end_time'),
            max_reservations=data.get('max_reservations', 10),
            location=data.get('location'),
            status=data.get('status', 'open')
        )
        
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify({
            'message': 'Activity date added successfully',
            'date': date_dict
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def update_activity_date(date_id):
    """Update an existing activity date"""
    try:
        data = request.json
        current_user_id = get_jwt_identity()
        
        date_dict, error = ActivityDateService.update_activity_date(date_id, current_user_id, data)
        
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify({
            'message': 'Activity date updated successfully',
            'date': date_dict
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def delete_activity_date(date_id):
    """Delete an activity date"""
    try:
        current_user_id = get_jwt_identity()
        
        result, error = ActivityDateService.delete_activity_date(date_id, current_user_id)
        
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_activity_dates(activity_id):
    """Get all available dates for an activity"""
    try:
        dates, error = ActivityDateService.get_activity_dates(activity_id)
        
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify({"dates": dates}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_my_activity_dates():
    """Get all available dates for activities led by the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        dates, error = ActivityDateService.get_guide_activity_dates(current_user_id)
        
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify({"dates": dates}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500