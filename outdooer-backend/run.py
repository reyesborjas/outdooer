#!/usr/bin/env python3
"""
Outdooer Backend API Server

This script runs the Flask application server for the Outdooer backend API.

Usage:
    python run.py [--host HOST] [--port PORT] [--env ENV]

Options:
    --host HOST   Host to bind to [default: 0.0.0.0]
    --port PORT   Port to bind to [default: 5000]
    --env ENV     Environment to use [default: development]
"""

import os
import sys
import argparse
from app import create_app

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Run the Outdooer API server')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=5000, help='Port to bind to')
    parser.add_argument('--env', default=os.getenv('FLASK_ENV', 'development'), 
                      choices=['development', 'production', 'testing', 'staging'],
                      help='Environment to use')
    return parser.parse_args()

def main():
    """Main entry point of the application"""
    args = parse_args()
    
    # Create the application with the specified environment
    app = create_app(args.env)
    
    # Show startup message
    print(f"\n{'=' * 70}")
    print(f"  Outdooer API Server")
    print(f"  Environment: {args.env}")
    print(f"  Server running at: http://{args.host}:{args.port}")
    print(f"  Press Ctrl+C to quit")
    print(f"{'=' * 70}\n")
    
    # Run the application
    debug_mode = args.env.lower() == 'development'
    app.run(host=args.host, port=args.port, debug=debug_mode)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        sys.exit(0)