# expeditions/routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware.permissions import check_role_permission
from models.expedition import Expedition
from expeditions.controllers import (
    create_expedition,
    update_expedition,
    delete_expedition,
    get_expeditions,
    get_expedition
)

# Create a blueprint for the expeditions API
expeditions_bp = Blueprint('expeditions', __name__, url_prefix='/api/expeditions')

# Get all expeditions (with optional filtering)
@expeditions_bp.route('', methods=['GET'])
@jwt_required()
def list_expeditions():
    return get_expeditions()

# Get a specific expedition
@expeditions_bp.route('/<int:expedition_id>', methods=['GET'])
@jwt_required()
def get_expedition_route(expedition_id):
    return get_expedition(expedition_id)

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