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
   
    
    # Initialize extensions with the app
    db.init_app(app)
    jwt.init_app(app)
    ma.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGIN']}})
    mail.init_app(app)
    

    
    # Register blueprints
    from app.api.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # More blueprints will be added here
    
    # A simple route to confirm the API is working
    @app.route('/api/health')
    def health_check():
        return {"status": "ok", "message": "outdooer API is running"}
    
    return app