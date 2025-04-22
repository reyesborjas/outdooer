# app/api/expeditions/__init__.py
from flask import Blueprint

expeditions_bp = Blueprint('expeditions', __name__)

from . import routes  # Import routes to register them with the blueprint
from . import cors_handler  # Import CORS handler for OPTIONS requests