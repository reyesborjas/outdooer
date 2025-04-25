# app/scripts/setup_role_configurations.py
from app.models.team_role_configuration import TeamRoleConfiguration
from app.database import db

def setup_role_configurations():
    """
    Set up the default role configurations for the Outdooer application.
    This defines what operations each role level is permitted to perform.
    
    Role Levels:
    1 = Master Guide (highest authority)
    2 = Tactical Guide
    3 = Technical Guide
    4 = Base Guide (lowest authority)
    """
    # Delete existing configurations to avoid duplicates
    TeamRoleConfiguration.query.delete()
    
    # Define the configurations
    configurations = [
        # Master Guide (Level 1) permissions
        {'role_level': 1, 'operation': 'create_expedition', 'is_permitted': True},
        {'role_level': 1, 'operation': 'update_expedition', 'is_permitted': True},
        {'role_level': 1, 'operation': 'delete_expedition', 'is_permitted': True},
        {'role_level': 1, 'operation': 'create_activity', 'is_permitted': True},
        {'role_level': 1, 'operation': 'update_activity', 'is_permitted': True},
        {'role_level': 1, 'operation': 'delete_activity', 'is_permitted': True},
        {'role_level': 1, 'operation': 'manage_team', 'is_permitted': True},
        
        # Tactical Guide (Level 2) permissions
        {'role_level': 2, 'operation': 'create_expedition', 'is_permitted': True},
        {'role_level': 2, 'operation': 'update_expedition', 'is_permitted': True},
        {'role_level': 2, 'operation': 'delete_expedition', 'is_permitted': False},
        {'role_level': 2, 'operation': 'create_activity', 'is_permitted': True},
        {'role_level': 2, 'operation': 'update_activity', 'is_permitted': True},
        {'role_level': 2, 'operation': 'delete_activity', 'is_permitted': False},
        {'role_level': 2, 'operation': 'manage_team', 'is_permitted': False},
        
        # Technical Guide (Level 3) permissions
        {'role_level': 3, 'operation': 'create_expedition', 'is_permitted': False},
        {'role_level': 3, 'operation': 'update_expedition', 'is_permitted': True},  # Only ones they created/lead
        {'role_level': 3, 'operation': 'delete_expedition', 'is_permitted': False},
        {'role_level': 3, 'operation': 'create_activity', 'is_permitted': True},
        {'role_level': 3, 'operation': 'update_activity', 'is_permitted': True},  # Only ones they created/lead
        {'role_level': 3, 'operation': 'delete_activity', 'is_permitted': False},
        {'role_level': 3, 'operation': 'manage_team', 'is_permitted': False},
        
        # Base Guide (Level 4) permissions
        {'role_level': 4, 'operation': 'create_expedition', 'is_permitted': False},
        {'role_level': 4, 'operation': 'update_expedition', 'is_permitted': False},
        {'role_level': 4, 'operation': 'delete_expedition', 'is_permitted': False},
        {'role_level': 4, 'operation': 'create_activity', 'is_permitted': True},
        {'role_level': 4, 'operation': 'update_activity', 'is_permitted': True},  # Only ones they created
        {'role_level': 4, 'operation': 'delete_activity', 'is_permitted': False},
        {'role_level': 4, 'operation': 'manage_team', 'is_permitted': False},
    ]
    
    # Add configurations to database
    for config in configurations:
        role_config = TeamRoleConfiguration(**config)
        db.session.add(role_config)
    
    db.session.commit()
    print(f"Added {len(configurations)} role configurations to the database.")

# Run this script during app initialization or as a separate setup script
if __name__ == "__main__":
    from app import app
    with app.app_context():
        setup_role_configurations()
        print("Role configurations set up successfully.")