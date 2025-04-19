# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from flask_mail import Mail

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
    cors.init_app(app,
                  resources={r"/api/*": {"origins": "http://localhost:5173"}},
                  supports_credentials=True,
                  methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # Register blueprints
    from app.api.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    from app.api.activities import activities_bp
    app.register_blueprint(activities_bp, url_prefix='/api/activities')

    from app.api.invitation import invitations_bp
    app.register_blueprint(invitations_bp, url_prefix='/api/invitations')

    # Health check
    @app.route('/api/health')
    def health_check():
        return {"status": "ok", "message": "outdooer API is running"}

    from app.api.activity_types import activity_types_bp
    app.register_blueprint(activity_types_bp, url_prefix='/api/activity-types')

    from app.api.teams import teams_bp
    app.register_blueprint(teams_bp, url_prefix='/api/teams')

    # Add the locations blueprint
    from app.api.locations import locations_bp
    app.register_blueprint(locations_bp, url_prefix='/api/locations')

    return app