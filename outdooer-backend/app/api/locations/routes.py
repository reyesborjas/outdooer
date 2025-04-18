# Create a new file: app/api/locations/routes.py
from flask import jsonify
from . import locations_bp
from app.models.location import Location

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
                'latitude': float(location.latitude) if location.latitude else None,
                'longitude': float(location.longitude) if location.longitude else None
            })
        
        return jsonify({'locations': locations_list}), 200
    except Exception as e:
        print(f"Error fetching locations: {str(e)}")
        return jsonify({'error': 'Failed to fetch locations'}), 500