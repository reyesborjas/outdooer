# app/scripts/setup_role_configurations.py
from app.models.team_role_permissions import TeamRolePermissions
from app.database import db

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
    # Define the global permissions configurations
    configurations = [
        # Master Guide (Level 1) permissions - Full permissions
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
        
        # Tactical Guide (Level 2) permissions - Can create expeditions, manage most things except deletion
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
        
        # Technical Guide (Level 3) permissions - Can create activities but not expeditions
        {'role_level': 3, 'permission_key': 'create_expedition', 'is_enabled': False},
        {'role_level': 3, 'permission_key': 'update_expedition', 'is_enabled': False},  # Changed to False
        {'role_level': 3, 'permission_key': 'delete_expedition', 'is_enabled': False},
        {'role_level': 3, 'permission_key': 'create_activity', 'is_enabled': True},
        {'role_level': 3, 'permission_key': 'update_activity', 'is_enabled': True},  # Can still update own activities
        {'role_level': 3, 'permission_key': 'delete_activity', 'is_enabled': False},
        {'role_level': 3, 'permission_key': 'manage_team', 'is_enabled': False},
        {'role_level': 3, 'permission_key': 'manage_team_members', 'is_enabled': False},
        {'role_level': 3, 'permission_key': 'manage_resources', 'is_enabled': True},
        {'role_level': 3, 'permission_key': 'manage_revenue', 'is_enabled': False},
        
        # Base Guide (Level 4) permissions - Limited permissions, can only work with activities
        {'role_level': 4, 'permission_key': 'create_expedition', 'is_enabled': False},
        {'role_level': 4, 'permission_key': 'update_expedition', 'is_enabled': False},
        {'role_level': 4, 'permission_key': 'delete_expedition', 'is_enabled': False},
        {'role_level': 4, 'permission_key': 'create_activity', 'is_enabled': True},
        {'role_level': 4, 'permission_key': 'update_activity', 'is_enabled': True},  # Can update own activities only
        {'role_level': 4, 'permission_key': 'delete_activity', 'is_enabled': False},
        {'role_level': 4, 'permission_key': 'manage_team', 'is_enabled': False},
        {'role_level': 4, 'permission_key': 'manage_team_members', 'is_enabled': False},
        {'role_level': 4, 'permission_key': 'manage_resources', 'is_enabled': False},
        {'role_level': 4, 'permission_key': 'manage_revenue', 'is_enabled': False},
    ]
    
    # Add configurations to database (or update existing)
    for config in configurations:
        # Check if permission already exists
        existing = TeamRolePermissions.query.filter_by(
            team_id=None,  # Global permissions
            role_level=config['role_level'],
            permission_key=config['permission_key']
        ).first()
        
        if existing:
            # Update existing permission if it differs
            if existing.is_enabled != config['is_enabled']:
                existing.is_enabled = config['is_enabled']
                print(f"Updated permission: Role {config['role_level']} - {config['permission_key']} -> {config['is_enabled']}")
        else:
            # Create new permission record
            role_perm = TeamRolePermissions(
                team_id=None,  # NULL for global permissions
                role_level=config['role_level'],
                permission_key=config['permission_key'],
                is_enabled=config['is_enabled']
            )
            db.session.add(role_perm)
            print(f"Added permission: Role {config['role_level']} - {config['permission_key']} -> {config['is_enabled']}")
    
    db.session.commit()
    print(f"Role permissions configuration completed.")

def setup_team_role_permissions(team_id, creator_id):
    """Create permissions for a specific team"""
    # This function is called when creating a new team
    # It will copy the global permissions to the team level with team-specific customizations if needed
    
    # First get all global permissions as a starting point
    global_permissions = TeamRolePermissions.query.filter_by(team_id=None).all()
    
    # Create team-specific versions of these permissions
    for perm in global_permissions:
        # Check if this permission already exists for the team
        existing = TeamRolePermissions.query.filter_by(
            team_id=team_id,
            role_level=perm.role_level,
            permission_key=perm.permission_key
        ).first()
        
        if not existing:
            # Create new team-specific permission based on global setting
            team_perm = TeamRolePermissions(
                team_id=team_id,
                role_level=perm.role_level,
                permission_key=perm.permission_key,
                is_enabled=perm.is_enabled,
                modified_by=creator_id
            )
            db.session.add(team_perm)
    
    db.session.commit()
    print(f"Team-specific permissions created for team {team_id}")