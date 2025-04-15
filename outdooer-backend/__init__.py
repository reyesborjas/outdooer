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
    from app.api.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    from app.api.activities import activities_bp
    app.register_blueprint(activities_bp, url_prefix='/api/activities')
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
   
    # Initialize extensions with the app
    db.init_app(app)
    jwt.init_app(app)
    ma.init_app(app)
    
    # Update CORS configuration here
    cors.init_app(app, 
                  resources={r"/api/*": {"origins": "*"}}, 
                  supports_credentials=True)
    
    mail.init_app(app)
    
    # Register blueprints
    from app.api.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # More blueprints will be added here
    
    # A simple route to confirm the API is working
    @app.route('/api/health')
    def health_check():
        return {"status": "ok", "message": "outdooer API is running"}
    
    # Add a test route that can be used to verify the API connection
    @app.route('/api/test')
    def test_api():
        return {"message": "API is working"}, 200
    
  # Add this to app/__init__.py, inside the create_app function
    @app.route('/api/db-test')
    def db_test():
        try:
            # Try a simple database query
            from app.models.user import User
            user_count = User.query.count()
            return {
                "status": "connected", 
                "user_count": user_count,
                "message": f"Database connection successful. Found {user_count} users."
            }
        except Exception as e:
            import traceback
            return {
                "status": "error",
                "message": f"Database connection error: {str(e)}",
                "traceback": traceback.format_exc()
            }, 500
    
    return app