#!/usr/bin/env python3
"""
Outdoer API Backend - Entry Point
This file serves as the main entry point for the Outdoer backend application.
"""

import os
from app import create_app

# Determine which configuration to use (development, testing, production)
config_name = os.getenv('FLASK_ENV', 'development')

# Create the Flask application instance
app = create_app(config_name)

if __name__ == '__main__':
    # Get port from environment variable or use default (5000)
    port = int(os.getenv('PORT', 5000))
    
    # Run the application
    app.run(
        host='0.0.0.0',  # Make server publicly available
        port=port,
        debug=(config_name == 'development')  # Enable debug mode only in development
    )