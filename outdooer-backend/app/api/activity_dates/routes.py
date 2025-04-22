# app/api/activity_dates/routes.py
from flask import jsonify, request
from app import db
from app.models.activity import Activity
from app.models.activity_date import GuideActivityInstance, ActivityAvailableDate
from app.models.team import TeamMember
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, time
from . import activity_dates_bp

# Obtener instancias de actividad para un guía
@activity_dates_bp.route('/guide-instances', methods=['GET'])
@jwt_required()
def get_guide_instances():
    try:
        current_user_id = get_jwt_identity()
        instances = GuideActivityInstance.query.filter_by(guide_id=current_user_id, is_active=True).all()
        return jsonify({'instances': [instance.to_dict() for instance in instances]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Crear una instancia de actividad para un guía
@activity_dates_bp.route('/guide-instances', methods=['POST'])
@jwt_required()
def create_guide_instance():
    try:
        data = request.json
        current_user_id = get_jwt_identity()
        
        # Verificar que la actividad existe
        activity = Activity.query.get_or_404(data.get('activity_id'))
        
        # Verificar permisos
        if activity.team_id:
            team_member = TeamMember.query.filter_by(
                user_id=current_user_id,
                team_id=activity.team_id
            ).first()
            
            if not team_member:
                return jsonify({'error': 'You are not a member of this team'}), 403
        
        # Crear la instancia
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

# Agregar una fecha disponible para una actividad
def add_activity_date(activity_id):
    try:
        data = request.json
        current_user_id = get_jwt_identity()
        
        # Verificar que la actividad existe
        activity = Activity.query.get_or_404(activity_id)
        
        # Verificar permisos para editar la actividad
        if activity.team_id:
            team_member = TeamMember.query.filter_by(
                user_id=current_user_id,
                team_id=activity.team_id
            ).first()
            
            if not team_member:
                return jsonify({'error': 'You are not a member of this team'}), 403
            
            # Solo ciertos roles pueden agregar fechas
            if team_member.role_level > 3 and activity.created_by != current_user_id and activity.leader_id != current_user_id:
                return jsonify({'error': 'You do not have permission to add dates to this activity'}), 403
        
        # Buscar o crear una instancia de actividad para este guía
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
            db.session.flush()  # Obtener el ID sin hacer commit
        
        # Crear la fecha disponible
        try:
            date_value = date.fromisoformat(data.get('date'))
            start_time_value = time.fromisoformat(data.get('start_time'))
            end_time_value = time.fromisoformat(data.get('end_time'))
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid date or time format'}), 400
            
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
        
        # Preparar respuesta con datos adicionales
        date_dict = activity_date.to_dict()
        date_dict['guide_id'] = instance.guide_id
        date_dict['guide_name'] = f"{instance.guide.first_name} {instance.guide.last_name}" if instance.guide else "Unknown"
        
        return jsonify({
            'message': 'Activity date added successfully',
            'date': date_dict
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Actualizar una fecha disponible
@activity_dates_bp.route('/activity-dates/<int:date_id>', methods=['PUT'])
@jwt_required()
def update_activity_date(date_id):
    try:
        data = request.json
        current_user_id = get_jwt_identity()
        
        # Verificar que la fecha existe
        activity_date = ActivityAvailableDate.query.get_or_404(date_id)
        
        # Verificar que el usuario es el guía de esta fecha
        instance = GuideActivityInstance.query.get(activity_date.activity_instance_id)
        if not instance or instance.guide_id != current_user_id:
            # Verificar si es Master Guide o Tactical Guide del equipo
            if instance and instance.team_id:
                team_member = TeamMember.query.filter_by(
                    user_id=current_user_id,
                    team_id=instance.team_id
                ).first()
                
                if not team_member or team_member.role_level > 2:  # Solo Master Guide y Tactical Guide
                    return jsonify({'error': 'You do not have permission to update this date'}), 403
            else:
                return jsonify({'error': 'You do not have permission to update this date'}), 403
        
        # Actualizar los campos
        if 'date' in data:
            try:
                activity_date.date = date.fromisoformat(data['date'])
            except ValueError:
                return jsonify({'error': 'Invalid date format'}), 400
                
        if 'start_time' in data:
            try:
                activity_date.start_time = time.fromisoformat(data['start_time'])
            except ValueError:
                return jsonify({'error': 'Invalid start time format'}), 400
                
        if 'end_time' in data:
            try:
                activity_date.end_time = time.fromisoformat(data['end_time'])
            except ValueError:
                return jsonify({'error': 'Invalid end time format'}), 400
                
        if 'max_reservations' in data:
            activity_date.max_reservations = data['max_reservations']
        if 'location' in data:
            activity_date.location = data['location']
        if 'status' in data:
            activity_date.status = data['status']
        
        db.session.commit()
        
        # Preparar respuesta con datos adicionales
        date_dict = activity_date.to_dict()
        date_dict['guide_id'] = instance.guide_id
        date_dict['guide_name'] = f"{instance.guide.first_name} {instance.guide.last_name}" if instance.guide else "Unknown"
        
        return jsonify({
            'message': 'Activity date updated successfully',
            'date': date_dict
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Eliminar una fecha disponible
@activity_dates_bp.route('/activity-dates/<int:date_id>', methods=['DELETE'])
@jwt_required()
def delete_activity_date(date_id):
    try:
        current_user_id = get_jwt_identity()
        
        # Verificar que la fecha existe
        activity_date = ActivityAvailableDate.query.get_or_404(date_id)
        
        # Verificar que el usuario es el guía de esta fecha
        instance = GuideActivityInstance.query.get(activity_date.activity_instance_id)
        if not instance or instance.guide_id != current_user_id:
            # Verificar si es Master Guide o Tactical Guide del equipo
            if instance and instance.team_id:
                team_member = TeamMember.query.filter_by(
                    user_id=current_user_id,
                    team_id=instance.team_id
                ).first()
                
                if not team_member or team_member.role_level > 2:  # Solo Master Guide y Tactical Guide
                    return jsonify({'error': 'You do not have permission to delete this date'}), 403
            else:
                return jsonify({'error': 'You do not have permission to delete this date'}), 403
        
        # Verificar si hay reservas para esta fecha
        if activity_date.current_reservations > 0:
            return jsonify({'error': 'Cannot delete a date with existing reservations'}), 400
        
        # Eliminar la fecha
        db.session.delete(activity_date)
        db.session.commit()
        
        return jsonify({'message': 'Activity date deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500