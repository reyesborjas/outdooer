# app/api/locations/routes.py
from flask import jsonify
from . import locations_bp
from app.models.location import Location
from flask import request
from app import db

@locations_bp.route('', methods=['GET'])
def get_locations():
    """Get all locations endpoint"""
    try:
        # Query all locations
        locations = Location.query.all()
        
        # Convert to list of dictionaries
        locations_list = []
        for location in locations:
            locations_list.append({
                'location_id': location.location_id,
                'location_name': location.location_name,
                'location_type': location.location_type,
                'country_code': location.country_code,
                'region_code': location.region_code,
                'latitude': float(location.latitude) if location.latitude else None,
                'longitude': float(location.longitude) if location.longitude else None
            })
        
        return jsonify({'locations': locations_list}), 200
    except Exception as e:
        print(f"Error fetching locations: {str(e)}")
        return jsonify({'error': 'Failed to fetch locations'}), 500

@locations_bp.route('/search', methods=['GET'])
def search_locations():
    """Search locations by name, country, region, or type"""
    search_term = request.args.get('q', '')
    
    if not search_term or len(search_term) < 2:
        return jsonify({'error': 'Search term must be at least 2 characters'}), 400
    
    try:
        # Create search pattern for case-insensitive partial matching
        search_pattern = f"%{search_term}%"
        
        # Query locations that match across multiple fields
        locations = Location.query.filter(
            db.or_(
                Location.location_name.ilike(search_pattern),
                Location.country_code.ilike(search_pattern),
                Location.region_code.ilike(search_pattern),
                Location.location_type.ilike(search_pattern),
                Location.formatted_address.ilike(search_pattern)
            )
        ).limit(20).all()
        
        # Convert to list of dictionaries
        locations_list = []
        for location in locations:
            locations_list.append({
                'location_id': location.location_id,
                'location_name': location.location_name,
                'location_type': location.location_type,
                'country_code': location.country_code,
                'region_code': location.region_code,
                'formatted_address': location.formatted_address,
                'latitude': float(location.latitude) if location.latitude else None,
                'longitude': float(location.longitude) if location.longitude else None
            })
        
        return jsonify({'locations': locations_list}), 200
    except Exception as e:
        print(f"Error searching locations: {str(e)}")
        return jsonify({'error': 'Failed to search locations'}), 500