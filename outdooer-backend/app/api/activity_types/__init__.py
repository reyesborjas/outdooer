# app/api/activity_types/__init__.py
from flask import Blueprint

activity_types_bp = Blueprint('activity_types', __name__)

from . import routes  # Import routes to register them with the blueprint