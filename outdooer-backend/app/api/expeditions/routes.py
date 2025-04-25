# app/api/expeditions/routes.py
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.middleware.permissions import check_role_permission
from app.models.expedition import Expedition

from . import expeditions_bp
from .controllers import (
    create_expedition,
    update_expedition,
    delete_expedition,
    get_all_expeditions,
    get_expedition_by_id,
    get_expedition_activities,
    add_expedition_activities
)

# Get all expeditions (with optional filtering)
@expeditions_bp.route('', methods=['GET'])
@jwt_required()
def list_expeditions():
    return get_all_expeditions()

# Get a specific expedition
@expeditions_bp.route('/<int:expedition_id>', methods=['GET'])
@jwt_required()
def get_expedition_route(expedition_id):
    return get_expedition_by_id(expedition_id)

# Create a new expedition
@expeditions_bp.route('', methods=['POST'])
@jwt_required()
@check_role_permission('create_expedition')
def create_expedition_route():
    return create_expedition()

# Update an expedition
@expeditions_bp.route('/<int:expedition_id>', methods=['PUT', 'PATCH'])
@jwt_required()
@check_role_permission('update_expedition')
def update_expedition_route(expedition_id):
    return update_expedition(expedition_id)

# Delete an expedition
@expeditions_bp.route('/<int:expedition_id>', methods=['DELETE'])
@jwt_required()
@check_role_permission('delete_expedition')
def delete_expedition_route(expedition_id):
    return delete_expedition(expedition_id)

# Get expedition activities
@expeditions_bp.route('/<int:expedition_id>/activities', methods=['GET'])
@jwt_required()
def get_expedition_activities_route(expedition_id):
    return get_expedition_activities(expedition_id)

# Add activities to an expedition
@expeditions_bp.route('/<int:expedition_id>/activities', methods=['POST'])
@jwt_required()
@check_role_permission('update_expedition')
def add_expedition_activities_route(expedition_id):
    return add_expedition_activities(expedition_id)

# Get expeditions created by a user
@expeditions_bp.route('/created-by/<int:user_id>', methods=['GET'])
@jwt_required()
def get_expeditions_by_creator(user_id):
    from .controllers import get_expeditions_by_creator
    return get_expeditions_by_creator(user_id)

# Get expeditions led by a user
@expeditions_bp.route('/led-by/<int:user_id>', methods=['GET'])
@jwt_required()
def get_expeditions_by_leader(user_id):
    from .controllers import get_expeditions_by_leader
    return get_expeditions_by_leader(user_id)