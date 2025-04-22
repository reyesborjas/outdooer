# app/api/resources/__init__.py
from flask import Blueprint

resources_bp = Blueprint('resources', __name__)

from . import routes  # Import routes to register them with the blueprint