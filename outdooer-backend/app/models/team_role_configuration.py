# app/models/team_role_configuration.py
from app.database import db

class TeamRoleConfiguration(db.Model):
    """
    Model for global role configurations that define the default permissions
    for each role level across all teams.
    """
    __tablename__ = 'team_role_configurations'
    
    # This is for the global configuration - not team specific
    role_config_id = db.Column(db.Integer, primary_key=True)
    role_level = db.Column(db.Integer, nullable=False)  # 1=Master, 2=Tactical, 3=Technical, 4=Base
    operation = db.Column(db.String(50), nullable=False)  # e.g., 'create_expedition', 'delete_activity'
    is_permitted = db.Column(db.Boolean, default=False)
    
    # Add unique constraint to prevent duplicates
    __table_args__ = (
        db.UniqueConstraint('role_level', 'operation', name='uq_role_operation'),
        {'extend_existing': True}
    )
    
    def to_dict(self):
        return {
            'role_config_id': self.role_config_id,
            'role_level': self.role_level,
            'operation': self.operation,
            'is_permitted': self.is_permitted
        }