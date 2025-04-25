# app/api/resources/routes.py
from flask import jsonify, request
from . import resources_bp
from app import db
from app.models.resource import Resource, ResourceCategory, ActivityResource
from app.models.team import Team
from app.models.team_member import TeamMember
from flask_jwt_extended import jwt_required, get_jwt_identity

# Rutas para categorías de recursos

@resources_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_resource_categories():
    """Obtener todas las categorías de recursos para el equipo del usuario"""
    try:
        current_user_id = get_jwt_identity()
        
        # Obtener los equipos del usuario
        team_memberships = TeamMember.query.filter_by(user_id=current_user_id).all()
        team_ids = [tm.team_id for tm in team_memberships]
        
        # Obtener categorías para esos equipos
        categories = ResourceCategory.query.filter(ResourceCategory.team_id.in_(team_ids)).all()
        
        return jsonify({
            'categories': [category.to_dict() for category in categories]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resources_bp.route('/categories/team/<int:team_id>', methods=['GET'])
@jwt_required()
def get_team_resource_categories(team_id):
    """Obtener todas las categorías de recursos para un equipo específico"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verificar si el usuario es miembro del equipo
        team_member = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=team_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'You are not a member of this team'}), 403
        
        # Obtener categorías para ese equipo
        categories = ResourceCategory.query.filter_by(team_id=team_id).all()
        
        return jsonify({
            'categories': [category.to_dict() for category in categories]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resources_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_resource_category():
    """Crear una nueva categoría de recursos"""
    try:
        data = request.json
        current_user_id = get_jwt_identity()
        
        # Verificar si se proporcionó un team_id
        team_id = data.get('team_id')
        if not team_id:
            return jsonify({'error': 'Team ID is required'}), 400
        
        # Verificar si el usuario es miembro del equipo
        team_member = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=team_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'You are not a member of this team'}), 403
        
        # Solo Master Guides y Tactical Guides pueden crear categorías
        if team_member.role_level > 2:
            return jsonify({'error': 'Only Master Guides and Tactical Guides can create resource categories'}), 403
        
        # Verificar si ya existe una categoría con el mismo nombre en el equipo
        existing_category = ResourceCategory.query.filter_by(
            team_id=team_id,
            category_name=data.get('category_name')
        ).first()
        
        if existing_category:
            return jsonify({'error': 'A category with this name already exists in your team'}), 400
        
        # Crear la categoría
        category = ResourceCategory(
            team_id=team_id,
            category_name=data.get('category_name'),
            description=data.get('description'),
            created_by=current_user_id
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Resource category created successfully',
            'category': category.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@resources_bp.route('/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_resource_category(category_id):
    """Actualizar una categoría de recursos existente"""
    try:
        data = request.json
        current_user_id = get_jwt_identity()
        
        # Verificar si la categoría existe
        category = ResourceCategory.query.get_or_404(category_id)
        
        # Verificar si el usuario es miembro del equipo
        team_member = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=category.team_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'You are not a member of this team'}), 403
        
        # Solo Master Guides, Tactical Guides y el creador pueden actualizar categorías
        if team_member.role_level > 2 and category.created_by != current_user_id:
            return jsonify({'error': 'You do not have permission to update this category'}), 403
        
        # Verificar si el nuevo nombre ya existe en el equipo
        if 'category_name' in data and data['category_name'] != category.category_name:
            existing_category = ResourceCategory.query.filter_by(
                team_id=category.team_id,
                category_name=data['category_name']
            ).first()
            
            if existing_category:
                return jsonify({'error': 'A category with this name already exists in your team'}), 400
        
        # Actualizar campos
        if 'category_name' in data:
            category.category_name = data['category_name']
        if 'description' in data:
            category.description = data['description']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Resource category updated successfully',
            'category': category.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@resources_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_resource_category(category_id):
    """Eliminar una categoría de recursos existente"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verificar si la categoría existe
        category = ResourceCategory.query.get_or_404(category_id)
        
        # Verificar si el usuario es miembro del equipo
        team_member = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=category.team_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'You are not a member of this team'}), 403
        
        # Solo Master Guides pueden eliminar categorías
        if team_member.role_level > 1:
            return jsonify({'error': 'Only Master Guides can delete resource categories'}), 403
        
        # Verificar si la categoría tiene recursos asociados
        resources_count = Resource.query.filter_by(category_id=category_id).count()
        if resources_count > 0:
            return jsonify({'error': f'Cannot delete category with {resources_count} associated resources'}), 400
        
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({'message': 'Resource category deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Rutas para recursos

@resources_bp.route('/', methods=['GET'])
@jwt_required()
def get_resources():
    """Obtener todos los recursos para el equipo del usuario"""
    try:
        current_user_id = get_jwt_identity()
        
        # Obtener los equipos del usuario
        team_memberships = TeamMember.query.filter_by(user_id=current_user_id).all()
        team_ids = [tm.team_id for tm in team_memberships]
        
        # Obtener recursos para esos equipos
        resources = Resource.query.filter(Resource.team_id.in_(team_ids)).all()
        
        return jsonify({
            'resources': [resource.to_dict() for resource in resources]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resources_bp.route('/team/<int:team_id>', methods=['GET'])
@jwt_required()
def get_team_resources(team_id):
    """Obtener todos los recursos para un equipo específico"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verificar si el usuario es miembro del equipo
        team_member = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=team_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'You are not a member of this team'}), 403
        
        # Obtener recursos para ese equipo
        resources = Resource.query.filter_by(team_id=team_id).all()
        
        return jsonify({
            'resources': [resource.to_dict() for resource in resources]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resources_bp.route('/', methods=['POST'])
@jwt_required()
def create_resource():
    """Crear un nuevo recurso"""
    try:
        data = request.json
        current_user_id = get_jwt_identity()
        
        # Verificar si se proporcionó un team_id
        team_id = data.get('team_id')
        if not team_id:
            return jsonify({'error': 'Team ID is required'}), 400
        
        # Verificar si el usuario es miembro del equipo
        team_member = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=team_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'You are not a member of this team'}), 403
        
        # Verificar si la categoría existe
        category_id = data.get('category_id')
        if category_id:
            category = ResourceCategory.query.get(category_id)
            if not category or category.team_id != team_id:
                return jsonify({'error': 'Invalid category ID'}), 400
        
        # Crear el recurso
        resource = Resource(
            team_id=team_id,
            category_id=category_id,
            resource_name=data.get('resource_name'),
            description=data.get('description'),
            quantity=data.get('quantity', 0),
            unit_cost=data.get('unit_cost'),
            created_by=current_user_id
        )
        
        db.session.add(resource)
        db.session.commit()
        
        return jsonify({
            'message': 'Resource created successfully',
            'resource': resource.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@resources_bp.route('/<int:resource_id>', methods=['PUT'])
@jwt_required()
def update_resource(resource_id):
    """Actualizar un recurso existente"""
    try:
        data = request.json
        current_user_id = get_jwt_identity()
        
        # Verificar si el recurso existe
        resource = Resource.query.get_or_404(resource_id)
        
        # Verificar si el usuario es miembro del equipo
        team_member = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=resource.team_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'You are not a member of this team'}), 403
        
        # Solo Master Guides, Tactical Guides y el creador pueden actualizar recursos
        if team_member.role_level > 2 and resource.created_by != current_user_id:
            return jsonify({'error': 'You do not have permission to update this resource'}), 403
        
        # Verificar si la categoría existe
        if 'category_id' in data:
            category = ResourceCategory.query.get(data['category_id'])
            if not category or category.team_id != resource.team_id:
                return jsonify({'error': 'Invalid category ID'}), 400
        
        # Actualizar campos
        if 'resource_name' in data:
            resource.resource_name = data['resource_name']
        if 'description' in data:
            resource.description = data['description']
        if 'quantity' in data:
            resource.quantity = data['quantity']
        if 'unit_cost' in data:
            resource.unit_cost = data['unit_cost']
        if 'category_id' in data:
            resource.category_id = data['category_id']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Resource updated successfully',
            'resource': resource.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@resources_bp.route('/<int:resource_id>', methods=['DELETE'])
@jwt_required()
def delete_resource(resource_id):
    """Eliminar un recurso existente"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verificar si el recurso existe
        resource = Resource.query.get_or_404(resource_id)
        
        # Verificar si el usuario es miembro del equipo
        team_member = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=resource.team_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'You are not a member of this team'}), 403
        
        # Solo Master Guides pueden eliminar recursos
        if team_member.role_level > 1:
            return jsonify({'error': 'Only Master Guides can delete resources'}), 403
        
        # Verificar si el recurso está asociado a actividades
        activity_resources_count = ActivityResource.query.filter_by(resource_id=resource_id).count()
        if activity_resources_count > 0:
            return jsonify({'error': f'Cannot delete resource used by {activity_resources_count} activities'}), 400
        
        db.session.delete(resource)
        db.session.commit()
        
        return jsonify({'message': 'Resource deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Ruta para asociar recursos a actividades
@resources_bp.route('/activities/<int:activity_id>/resources', methods=['GET'])
@jwt_required()
def get_activity_resources(activity_id):
    """Obtener todos los recursos asociados a una actividad"""
    try:
        from app.models.activity import Activity
        
        # Verificar si la actividad existe
        activity = Activity.query.get_or_404(activity_id)
        
        # Obtener recursos para esta actividad
        activity_resources = ActivityResource.query.filter_by(activity_id=activity_id).all()
        
        return jsonify({
            'resources': [res.to_dict() for res in activity_resources]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resources_bp.route('/activities/<int:activity_id>/resources', methods=['POST'])
@jwt_required()
def add_activity_resource(activity_id):
    """Asociar un recurso a una actividad"""
    try:
        data = request.json
        current_user_id = get_jwt_identity()
        
        from app.models.activity import Activity
        
        # Verificar si la actividad existe
        activity = Activity.query.get_or_404(activity_id)
        
        # Verificar si el usuario tiene permisos para editar la actividad
        if activity.team_id:
            team_member = TeamMember.query.filter_by(
                user_id=current_user_id,
                team_id=activity.team_id
            ).first()
            
            if not team_member:
                return jsonify({'error': 'You are not a member of this team'}), 403
            
            if team_member.role_level > 2 and activity.created_by != current_user_id and activity.leader_id != current_user_id:
                return jsonify({'error': 'You do not have permission to modify this activity\'s resources'}), 403
        
        # Verificar si el recurso existe
        resource_id = data.get('resource_id')
        resource = Resource.query.get_or_404(resource_id)
        
        # Verificar si el recurso pertenece al mismo equipo que la actividad
        if activity.team_id != resource.team_id:
            return jsonify({'error': 'Resource must belong to the same team as the activity'}), 400
        
        # Verificar si ya existe esta asociación
        existing = ActivityResource.query.filter_by(
            activity_id=activity_id,
            resource_id=resource_id
        ).first()
        
        if existing:
            # Actualizar la cantidad si ya existe
            existing.quantity_required = data.get('quantity_required', existing.quantity_required)
            existing.notes = data.get('notes', existing.notes)
        else:
            # Crear nueva asociación
            activity_resource = ActivityResource(
                activity_id=activity_id,
                resource_id=resource_id,
                quantity_required=data.get('quantity_required', 1),
                notes=data.get('notes')
            )
            db.session.add(activity_resource)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Resource associated successfully with activity',
            'activity_resource': existing.to_dict() if existing else activity_resource.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@resources_bp.route('/activities/<int:activity_id>/resources/<int:resource_id>', methods=['DELETE'])
@jwt_required()
def remove_activity_resource(activity_id, resource_id):
    """Eliminar la asociación entre un recurso y una actividad"""
    try:
        current_user_id = get_jwt_identity()
        
        from app.models.activity import Activity
        
        # Verificar si la actividad existe
        activity = Activity.query.get_or_404(activity_id)
        
        # Verificar si el usuario tiene permisos para editar la actividad
        if activity.team_id:
            team_member = TeamMember.query.filter_by(
                user_id=current_user_id,
                team_id=activity.team_id
            ).first()
            
            if not team_member:
                return jsonify({'error': 'You are not a member of this team'}), 403
            
            if team_member.role_level > 2 and activity.created_by != current_user_id and activity.leader_id != current_user_id:
                return jsonify({'error': 'You do not have permission to modify this activity\'s resources'}), 403
        
        # Buscar la asociación
        activity_resource = ActivityResource.query.filter_by(
            activity_id=activity_id,
            resource_id=resource_id
        ).first_or_404()
        
        # Eliminar la asociación
        db.session.delete(activity_resource)
        db.session.commit()
        
        return jsonify({'message': 'Resource disassociated from activity successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500