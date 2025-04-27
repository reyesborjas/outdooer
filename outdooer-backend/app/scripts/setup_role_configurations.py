# app/scripts/setup_role_configurations.py
from app.models.global_role_permissions import GlobalRolePermission
from app import db

def setup_role_configurations():
    """
    Set up the default global role permissions for the Outdooer application.
    This defines what operations each role level is permitted to perform.
    
    Role Levels:
    1 = Master Guide (highest authority)
    2 = Tactical Guide
    3 = Technical Guide
    4 = Base Guide (lowest authority)
    """
    # Remove any existing global configurations to avoid duplicates
    GlobalRolePermission.query.filter_by(team_id=None).delete()
    
    # Define the global permissions configurations
    configurations = [
        # Master Guide (Level 1) permissions
        {'role_level': 1, 'permission_key': 'create_expedition', 'is_enabled': True},
        {'role_level': 1, 'permission_key': 'update_expedition', 'is_enabled': True},
        {'role_level': 1, 'permission_key': 'delete_expedition', 'is_enabled': True},
        {'role_level': 1, 'permission_key': 'create_activity', 'is_enabled': True},
        {'role_level': 1, 'permission_key': 'update_activity', 'is_enabled': True},
        {'role_level': 1, 'permission_key': 'delete_activity', 'is_enabled': True},
        {'role_level': 1, 'permission_key': 'manage_team', 'is_enabled': True},
        {'role_level': 1, 'permission_key': 'manage_team_members', 'is_enabled': True},
        {'role_level': 1, 'permission_key': 'manage_resources', 'is_enabled': True},
        {'role_level': 1, 'permission_key': 'manage_revenue', 'is_enabled': True},
        
        # Tactical Guide (Level 2) permissions
        {'role_level': 2, 'permission_key': 'create_expedition', 'is_enabled': True},
        {'role_level': 2, 'permission_key': 'update_expedition', 'is_enabled': True},
        {'role_level': 2, 'permission_key': 'delete_expedition', 'is_enabled': False},
        {'role_level': 2, 'permission_key': 'create_activity', 'is_enabled': True},
        {'role_level': 2, 'permission_key': 'update_activity', 'is_enabled': True},
        {'role_level': 2, 'permission_key': 'delete_activity', 'is_enabled': False},
        {'role_level': 2, 'permission_key': 'manage_team', 'is_enabled': False},
        {'role_level': 2, 'permission_key': 'manage_team_members', 'is_enabled': True},
        {'role_level': 2, 'permission_key': 'manage_resources', 'is_enabled': True},
        {'role_level': 2, 'permission_key': 'manage_revenue', 'is_enabled': False},
        
        # Technical Guide (Level 3) permissions
        {'role_level': 3, 'permission_key': 'create_expedition', 'is_enabled': False},
        {'role_level': 3, 'permission_key': 'update_expedition', 'is_enabled': True},  # Only ones they created/lead
        {'role_level': 3, 'permission_key': 'delete_expedition', 'is_enabled': False},
        {'role_level': 3, 'permission_key': 'create_activity', 'is_enabled': True},
        {'role_level': 3, 'permission_key': 'update_activity', 'is_enabled': True},  # Only ones they created/lead
        {'role_level': 3, 'permission_key': 'delete_activity', 'is_enabled': False},
        {'role_level': 3, 'permission_key': 'manage_team', 'is_enabled': False},
        {'role_level': 3, 'permission_key': 'manage_team_members', 'is_enabled': False},
        {'role_level': 3, 'permission_key': 'manage_resources', 'is_enabled': True},
        {'role_level': 3, 'permission_key': 'manage_revenue', 'is_enabled': False},
        
        # Base Guide (Level 4) permissions
        {'role_level': 4, 'permission_key': 'create_expedition', 'is_enabled': False},
        {'role_level': 4, 'permission_key': 'update_expedition', 'is_enabled': False},
        {'role_level': 4, 'permission_key': 'delete_expedition', 'is_enabled': False},
        {'role_level': 4, 'permission_key': 'create_activity', 'is_enabled': True},
        {'role_level': 4, 'permission_key': 'update_activity', 'is_enabled': True},  # Only ones they created
        {'role_level': 4, 'permission_key': 'delete_activity', 'is_enabled': False},
        {'role_level': 4, 'permission_key': 'manage_team', 'is_enabled': False},
        {'role_level': 4, 'permission_key': 'manage_team_members', 'is_enabled': False},
        {'role_level': 4, 'permission_key': 'manage_resources', 'is_enabled': False},
        {'role_level': 4, 'permission_key': 'manage_revenue', 'is_enabled': False},
    ]
    
    # Add configurations to database
    for config in configurations:
        role_perm = GlobalRolePermission(
            team_id=None,  # NULL for global permissions
            role_level=config['role_level'],
            permission_key=config['permission_key'],
            is_enabled=config['is_enabled']
        )
        db.session.add(role_perm)
    
    db.session.commit()
    print(f"Added {len(configurations)} global role permissions to the database.")