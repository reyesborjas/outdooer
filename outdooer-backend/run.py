# run.py
import os
from app import create_app

# Create the application instance with environment configuration
config_name = os.getenv('FLASK_ENV', 'development')
app = create_app(config_name)

if __name__ == '__main__':
    # Run the application 
    app.run(debug=True)