# File: app/api/new_feature/__init__.py
from flask import Blueprint

new_feature_bp = Blueprint('new_feature', __name__)

from . import routes  # Import routes to register them with the blueprint

# Step 2: Implement routes and controller
# File: app/api/new_feature/routes.py
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from . import new_feature_bp
from app import db
from app.models.user import User
from .controllers import get_all_items, get_item_by_id, create_item, update_item, delete_item

@new_feature_bp.route('', methods=['GET'])
@jwt_required()
def get_items_route():
    """Get all items endpoint"""
    return get_all_items()

@new_feature_bp.route('/<int:item_id>', methods=['GET'])
@jwt_required()
def get_item_by_id_route(item_id):
    """Get a specific item by ID"""
    return get_item_by_id(item_id)

@new_feature_bp.route('', methods=['POST'])
@jwt_required()
def create_item_route():
    """Create a new item"""
    return create_item()

@new_feature_bp.route('/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_item_route(item_id):
    """Update an existing item"""
    return update_item(item_id)

@new_feature_bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item_route(item_id):
    """Delete an item"""
    return delete_item(item_id)

# Step 3: Implement controllers
# File: app/api/new_feature/controllers.py
from flask import jsonify, request
from app import db
from app.models.new_feature import NewFeatureModel  # Create this model
from flask_jwt_extended import get_jwt_identity

def get_all_items():
    """Get all items from the database"""
    try:
        items = NewFeatureModel.query.all()
        items_list = [item.to_dict() for item in items]
        return jsonify({'items': items_list}), 200
    except Exception as e:
        print(f"Error fetching items: {str(e)}")
        return jsonify({'error': 'Failed to fetch items'}), 500

def get_item_by_id(item_id):
    """Get a specific item by ID"""
    try:
        item = NewFeatureModel.query.get(item_id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        return jsonify({'item': item.to_dict()}), 200
    except Exception as e:
        print(f"Error fetching item {item_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch item details'}), 500

def create_item():
    """Create a new item"""
    try:
        data = request.get_json()
        
        # Add the current user as creator
        if 'created_by' not in data:
            data['created_by'] = get_jwt_identity()
        
        # Validate required fields
        for field in ['name', 'description']:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Create new item
        new_item = NewFeatureModel(
            name=data.get('name'),
            description=data.get('description'),
            created_by=data.get('created_by')
            # Add other fields as needed
        )

        db.session.add(new_item)
        db.session.commit()

        return jsonify({
            "message": "Item created successfully",
            "item_id": new_item.id,
            "item": new_item.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating item: {str(e)}")
        return jsonify({"error": f"Failed to create item: {str(e)}"}), 500

def update_item(item_id):
    """Update an existing item"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        item = NewFeatureModel.query.get_or_404(item_id)
        
        # Check if user is allowed to update this item
        if item.created_by != current_user_id:
            return jsonify({"error": "You don't have permission to update this item"}), 403
        
        # Update fields
        if 'name' in data:
            item.name = data['name']
        if 'description' in data:
            item.description = data['description']
        # Update other fields as needed
        
        db.session.commit()
        
        return jsonify({
            "message": "Item updated successfully",
            "item": item.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating item {item_id}: {str(e)}")
        return jsonify({"error": f"Failed to update item: {str(e)}"}), 500

def delete_item(item_id):
    """Delete an item"""
    try:
        current_user_id = get_jwt_identity()
        item = NewFeatureModel.query.get_or_404(item_id)
        
        # Check authorization (only creator or admin can delete)
        if item.created_by != current_user_id:
            # Check if user is admin (you'd implement this check)
            is_admin = False  # Replace with your admin check
            if not is_admin:
                return jsonify({"error": "You don't have permission to delete this item"}), 403
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({
            "message": "Item deleted successfully"
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting item {item_id}: {str(e)}")
        return jsonify({"error": f"Failed to delete item: {str(e)}"}), 500
    
from app.api.new_feature import new_feature_bp
app.register_blueprint(new_feature_bp, url_prefix='/api/new-feature')

