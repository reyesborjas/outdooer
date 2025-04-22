# app/api/expeditions/cors_handler.py
from flask import request, jsonify
from . import expeditions_bp

# Add OPTIONS handlers for all routes to handle CORS preflight requests
@expeditions_bp.route('', methods=['OPTIONS'])
@expeditions_bp.route('/<int:expedition_id>', methods=['OPTIONS'])
@expeditions_bp.route('/created-by/<int:user_id>', methods=['OPTIONS'])
@expeditions_bp.route('/led-by/<int:user_id>', methods=['OPTIONS'])
@expeditions_bp.route('/<int:expedition_id>/activities', methods=['OPTIONS'])
def handle_options_requests(*args, **kwargs):
    """Handle OPTIONS requests for CORS preflight"""
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
    return response