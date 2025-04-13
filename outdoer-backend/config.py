import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base directory of the application
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Base configuration class with settings common to all environments."""
    
    # Application Settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-please-change-in-production')
    DEBUG = False
    TESTING = False
    
    # JWT Settings
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # SQLAlchemy Settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_RECORD_QUERIES = True
    
    # Database Configuration
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '123456789')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5434')
    DB_NAME = os.getenv('DB_NAME', 'outdooer')
    
    # Very simple connection string, avoiding special characters
    SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # Firebase settings for storage
    FIREBASE_API_KEY = os.getenv('FIREBASE_API_KEY')
    FIREBASE_AUTH_DOMAIN = os.getenv('FIREBASE_AUTH_DOMAIN')
    FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID')
    FIREBASE_STORAGE_BUCKET = os.getenv('FIREBASE_STORAGE_BUCKET')
    FIREBASE_SERVICE_ACCOUNT_KEY = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY_PATH', 'firebase-service-account.json')
    
    # File Upload Settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'docx', 'xlsx'}
    
    # Pagination Settings
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    # CORS Settings
    CORS_ORIGIN = os.getenv('CORS_ORIGIN', '*')
    
    # Mail Settings
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', None)
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', None)
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@outdooer.com')
    
    # Payment Gateway Settings
    PAYMENT_GATEWAY = os.getenv('PAYMENT_GATEWAY', 'stripe')  # Options: stripe, paypal
    STRIPE_PUBLIC_KEY = os.getenv('STRIPE_PUBLIC_KEY', None)
    STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', None)
    STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', None)
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "200 per day, 50 per hour"
    RATELIMIT_STORAGE_URL = "memory://"
    
    @staticmethod
    def init_app(app):
        """Initialize application with this configuration."""
        pass


class DevelopmentConfig(Config):
    """Configuration for development environment."""
    DEBUG = True
    
    # Enable more detailed SQLAlchemy logging
    SQLALCHEMY_ECHO = True
    
    # Shorter token expiration for easier testing
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)


class TestingConfig(Config):
    """Configuration for testing environment."""
    TESTING = True
    DEBUG = True
    
    # Use in-memory SQLite for testing
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    
    # Disable CSRF protection in tests
    WTF_CSRF_ENABLED = False


class ProductionConfig(Config):
    """Configuration for production environment."""
    
    # Ensure secret keys are set in production
    @classmethod
    def init_app(cls, app):
        Config.init_app(app)
        
        # Validate critical settings
        assert os.getenv('SECRET_KEY'), "SECRET_KEY environment variable must be set in production"
        assert os.getenv('JWT_SECRET_KEY'), "JWT_SECRET_KEY environment variable must be set in production"
        assert os.getenv('FIREBASE_API_KEY'), "FIREBASE_API_KEY environment variable must be set in production"
        assert os.getenv('FIREBASE_STORAGE_BUCKET'), "FIREBASE_STORAGE_BUCKET environment variable must be set in production"
        
        # Configure production-specific logging
        import logging
        from logging.handlers import RotatingFileHandler
        
        # Create logs directory if it doesn't exist
        logs_dir = os.path.join(basedir, 'logs')
        os.makedirs(logs_dir, exist_ok=True)
        
        # Set up file handler for error logs
        file_handler = RotatingFileHandler(
            os.path.join(logs_dir, 'outdooer.log'),
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        
        # Add handler to app logger
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('outdooer API startup')
        
        # Production should use Redis for rate limiting
        app.config['RATELIMIT_STORAGE_URL'] = os.getenv('REDIS_URL', 'redis://localhost:6379/0')


class StagingConfig(ProductionConfig):
    """Configuration for staging environment (similar to production but with debugging)."""
    DEBUG = True
    
    # Staging database (usually separate from production)
    DB_NAME = os.getenv('DB_NAME', 'outdooer_staging')
    SQLALCHEMY_DATABASE_URI = f'postgresql://{Config.DB_USER}:{Config.DB_PASSWORD}@{Config.DB_HOST}:{Config.DB_PORT}/{DB_NAME}'


# Define a dictionary mapping environment names to config classes
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'staging': StagingConfig,
    'default': DevelopmentConfig
}