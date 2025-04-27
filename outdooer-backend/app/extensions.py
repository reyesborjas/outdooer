# app/extensions.py
"""
Flask extensions module to avoid circular imports
This file initializes all Flask extensions used in the application
"""

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_marshmallow import Marshmallow

# Initialize extensions without binding to app yet
db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
ma = Marshmallow()

def init_app(app):
    """
    Initialize all Flask extensions with the app
    
    Args:
        app: Flask application instance
    """
    # Initialize extensions with the app
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    ma.init_app(app)