#!/usr/bin/env python3
"""
Database Setup Script for Outdooer

This script checks the database connection and initializes the database if needed.
It should be run before starting the application for the first time.

Usage:
    python db_setup.py [--reset]

Options:
    --reset   Reset the database (drop all tables and recreate)
"""

import os
import sys
import argparse
from pathlib import Path

# Add the parent directory to path to import application modules
sys.path.insert(0, str(Path(__file__).resolve().parent))

import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Set up the Outdooer database')
    parser.add_argument('--reset', action='store_true', help='Reset the database (drop all tables and recreate)')
    return parser.parse_args()

def check_db_connection():
    """Check if database connection is working and database exists"""
    print("Checking database connection...")
    
    # Get database connection parameters from environment variables
    host = os.getenv('DB_HOST', 'localhost')
    port = os.getenv('DB_PORT', '5434')
    user = os.getenv('DB_USER', 'postgres')
    password = os.getenv('DB_PASSWORD', '123456789')
    db_name = os.getenv('DB_NAME', 'outdooer')
    
    # Try to connect to PostgreSQL
    try:
        # First connect to default postgres database
        conn = psycopg2.connect(
            host=host,
            port=port,
            database='postgres',
            user=user,
            password=password
        )
        conn.autocommit = True
        print("Successfully connected to PostgreSQL!")
        
        # Check if our database exists
        cursor = conn.cursor()
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
        exists = cursor.fetchone()
        
        if not exists:
            print(f"Database '{db_name}' does not exist, creating it...")
            cursor.execute(f"CREATE DATABASE {db_name}")
            print(f"Database '{db_name}' created successfully!")
        else:
            print(f"Database '{db_name}' already exists.")
        
        cursor.close()
        conn.close()
        
        # Now try to connect to our database
        test_conn = psycopg2.connect(
            host=host,
            port=port,
            database=db_name,
            user=user,
            password=password
        )
        test_conn.close()
        print(f"Successfully connected to '{db_name}' database!")
        
        return True
        
    except Exception as e:
        print(f"Database connection error: {e}")
        print("\nPlease check your database configuration in the .env file.")
        print("Make sure PostgreSQL is running and accessible.")
        return False

def initialize_db(reset=False):
    """Initialize the database schema and add initial data"""
    # Import here to avoid circular imports
    from app import create_app, db
    from app.models.user import User, UserRole
    from app.utils.security import generate_password_hash
    
    # Create Flask application
    app = create_app('development')
    
    print("\nInitializing database schema...")
    with app.app_context():
        if reset:
            print("Dropping all tables (this will delete ALL existing data)...")
            db.drop_all()
            print("All tables dropped successfully.")
        
        # Create tables
        db.create_all()
        print("Database tables created successfully!")
        
        # Check if admin user exists
        admin_exists = User.query.filter_by(email='admin@outdooer.com').first() is not None
        
        if not admin_exists:
            print("\nCreating admin user...")
            
            # Create admin user
            admin_user = User(
                email='admin@outdooer.com',
                password_hash=generate_password_hash('admin123'),  # Should be changed immediately!
                first_name='Admin',
                last_name='User',
                date_of_birth='1990-01-01',
                account_status='active'
            )
            db.session.add(admin_user)
            db.session.flush()  # Get user_id without committing
            
            # Add admin role
            admin_role = UserRole(
                user_id=admin_user.user_id,
                role_type='admin'
            )
            db.session.add(admin_role)
            
            db.session.commit()
            print(f"Admin user created successfully!")
            print("\nLogin credentials:")
            print("  Email: admin@outdooer.com")
            print("  Password: admin123")
            print("\nIMPORTANT: Change this password after first login!")
        else:
            print("\nAdmin user already exists, skipping creation.")
        
        # Initialize role configurations
        from app.scripts.setup_role_configurations import setup_role_configurations
        setup_role_configurations()
        print("Role configurations initialized.")
    
    print("\nDatabase initialization completed successfully!")

if __name__ == '__main__':
    args = parse_args()
    
    print("\n=== Outdooer Database Setup ===\n")
    
    if check_db_connection():
        initialize_db(reset=args.reset)
        print("\nSetup completed! You can now start the application.")
    else:
        print("\nSetup failed. Please fix the database connection issues and try again.")
        sys.exit(1)