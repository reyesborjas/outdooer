# app/api/invitation/__init__.py
from flask import Blueprint

invitations_bp = Blueprint('invitations', __name__)

from . import routes  # Import routes to register them with the blueprint