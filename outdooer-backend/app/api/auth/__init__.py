# app/api/auth/__init__.py
from flask import Blueprint

# Just create the blueprint
auth_bp = Blueprint('auth', __name__)

# Import routes here after creating the blueprint to avoid circular imports
from . import routes