# app/api/activities/__init__.py
from flask import Blueprint

activities_bp = Blueprint('activities', __name__)

from . import routes  # Import routes to register them with the blueprint