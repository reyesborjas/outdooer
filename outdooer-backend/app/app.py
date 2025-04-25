# app/app.py
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.database import db
from config import config

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # Initialize extensions
    CORS(app)
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Register blueprints
    from app.api.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    from app.api.teams import teams_bp
    app.register_blueprint(teams_bp, url_prefix='/api/teams')
    
    from app.api.activities import activities_bp
    app.register_blueprint(activities_bp, url_prefix='/api/activities')
    
    from app.api.expeditions import expeditions_bp
    app.register_blueprint(expeditions_bp, url_prefix='/api/expeditions')
    
    from app.api.permissions import permissions_bp
    app.register_blueprint(permissions_bp, url_prefix='/api/permissions')
    
    from app.api.activity_types import activity_types_bp
    app.register_blueprint(activity_types_bp, url_prefix='/api/activity-types')
    
    from app.api.invitation import invitations_bp
    app.register_blueprint(invitations_bp, url_prefix='/api/invitations')
    
    from app.api.locations import locations_bp
    app.register_blueprint(locations_bp, url_prefix='/api/locations')
    
    from app.api.activity_dates import activity_dates_bp
    app.register_blueprint(activity_dates_bp, url_prefix='/api/activity-dates')
    
    from app.api.resources import resources_bp
    app.register_blueprint(resources_bp, url_prefix='/api/resources')
    
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
        
        # Set up default role configurations if table is empty
        from app.models.team_role_configuration import TeamRoleConfiguration
        if not TeamRoleConfiguration.query.first():
            from app.scripts.setup_role_configurations import setup_role_configurations
            setup_role_configurations()
            print("Default role configurations initialized.")
    
    # Health check route
    @app.route('/api/health')
    def health_check():
        return {"status": "ok", "message": "outdooer API is running"}
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)