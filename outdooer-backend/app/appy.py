# app.py
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.database import db
from config import Config

# Import blueprints
from users.routes import users_bp
from auth.routes import auth_bp
from teams.routes import teams_bp
from expeditions.routes import expeditions_bp
from activities.routes import activities_bp
from permissions.routes import permissions_bp  # New permissions blueprint

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    CORS(app)
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Register blueprints
    app.register_blueprint(users_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(teams_bp)
    app.register_blueprint(expeditions_bp)
    app.register_blueprint(activities_bp)
    app.register_blueprint(permissions_bp)  # Register permissions blueprint
    
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
        
        # Set up default role configurations if table is empty
        from models.team_role_configuration import TeamRoleConfiguration
        if not TeamRoleConfiguration.query.first():
            from scripts.setup_role_configurations import setup_role_configurations
            setup_role_configurations()
            print("Default role configurations initialized.")
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)