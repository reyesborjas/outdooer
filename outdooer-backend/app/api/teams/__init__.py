# app/api/teams/__init__.py
from flask import Blueprint

teams_bp = Blueprint('teams', __name__)

from . import routes  # Import routes to register them with the blueprint