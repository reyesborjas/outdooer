# app/app.py
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.database import db
from config import config

def create_app(config_name='default'):
    """Application factory function to create and configure the Flask app"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # Initialize extensions
    CORS(app, supports_credentials=True)
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Register blueprints
    with app.app_context():
        # Import and register blueprints here to avoid circular imports
        from app.api.auth import auth_bp
        from app.api.activities import activities_bp
        from app.api.invitation import invitations_bp
        from app.api.activity_types import activity_types_bp
        from app.api.teams import teams_bp
        from app.api.locations import locations_bp
        from app.api.expeditions import expeditions_bp
        from app.api.activity_dates import activity_dates_bp
        from app.api.resources import resources_bp
        from app.api.permissions import permissions_bp
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(activities_bp, url_prefix='/api/activities')
        app.register_blueprint(invitations_bp, url_prefix='/api/invitations')
        app.register_blueprint(activity_types_bp, url_prefix='/api/activity-types')
        app.register_blueprint(teams_bp, url_prefix='/api/teams')
        app.register_blueprint(locations_bp, url_prefix='/api/locations')
        app.register_blueprint(expeditions_bp, url_prefix='/api/expeditions')
        app.register_blueprint(activity_dates_bp, url_prefix='/api/activity-dates')
        app.register_blueprint(resources_bp, url_prefix='/api/resources')
        app.register_blueprint(permissions_bp, url_prefix='/api/permissions')
    
        # Create tables if they don't exist
        db.create_all()
        
        # Set up default role configurations if table is empty
        from app.models.team_role_configuration import TeamRoleConfiguration
        if TeamRoleConfiguration.query.count() == 0:
            from app.scripts.setup_role_configurations import setup_role_configurations
            setup_role_configurations()
            print("Default role configurations initialized.")
    
    # Health check route
    @app.route('/api/health')
    def health_check():
        return {"status": "ok", "message": "outdooer API is running"}
    
    return app