# Create a new file: app/api/locations/__init__.py
from flask import Blueprint

locations_bp = Blueprint('locations', __name__)

from . import routes