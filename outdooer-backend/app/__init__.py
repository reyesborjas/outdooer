# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from flask_mail import Mail
from app.app import create_app

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
ma = Marshmallow()
cors = CORS()
mail = Mail()

def create_app(config_name):
    """
    Application factory function to create a Flask app instance
    with the specified configuration.
    """
    from config import config

    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    ma.init_app(app)
    mail.init_app(app)
    
    # Fix CORS to allow credentials and proper headers
    cors.init_app(app,
              resources={r"/api/*": {"origins": "http://localhost:5173"}},
              supports_credentials=True,
              methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
              allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
              expose_headers=["Access-Control-Allow-Origin"],
              vary_header=True)
    
    # Register blueprints
    from app.api.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    from app.api.activities import activities_bp
    app.register_blueprint(activities_bp, url_prefix='/api/activities')

    from app.api.invitation import invitations_bp
    app.register_blueprint(invitations_bp, url_prefix='/api/invitations')

    from app.api.activity_types import activity_types_bp
    app.register_blueprint(activity_types_bp, url_prefix='/api/activity-types')

    from app.api.teams import teams_bp
    app.register_blueprint(teams_bp, url_prefix='/api/teams')

    from app.api.locations import locations_bp
    app.register_blueprint(locations_bp, url_prefix='/api/locations')
    
    # Register expeditions blueprint
    from app.api.expeditions import expeditions_bp
    app.register_blueprint(expeditions_bp, url_prefix='/api/expeditions')
    
    # Register activity_dates blueprint
    from app.api.activity_dates import activity_dates_bp
    app.register_blueprint(activity_dates_bp, url_prefix='/api/activity-dates')
    
    # Register resources blueprint
    from app.api.resources import resources_bp
    app.register_blueprint(resources_bp, url_prefix='/api/resources')

    # Health check
    @app.route('/api/health')
    def health_check():
        return {"status": "ok", "message": "outdooer API is running"}

    return app