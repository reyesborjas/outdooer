# app/__init__.py
# This file properly exports essential application components

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Import database instance
from app.database import db

# Import create_app function
from app.app import create_app

# Make these accessible from the app package
__all__ = ['create_app', 'db']