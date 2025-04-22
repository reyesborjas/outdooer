# app/api/activity_dates/__init__.py
from flask import Blueprint

activity_dates_bp = Blueprint('activity_dates', __name__)

from . import routes  # Import routes to register them with the blueprint