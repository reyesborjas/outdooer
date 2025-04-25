# app/models/team_role_configuration.py
from app.database import db

class TeamRoleConfiguration(db.Model):
    """
    Model for storing role-based permissions for different operations.
    This maps each role level to specific operations they can perform.
    """
    __tablename__ = 'team_role_configurations'
    
    id = db.Column(db.Integer, primary_key=True)
    role_level = db.Column(db.Integer, nullable=False)  # 1=Master, 2=Tactical, 3=Technical, 4=Base
    operation = db.Column(db.String(50), nullable=False)  # e.g., 'create_expedition', 'delete_activity'
    is_permitted = db.Column(db.Boolean, default=False)
    
    # Add a unique constraint to prevent duplicate configurations
    __table_args__ = (
        db.UniqueConstraint('role_level', 'operation', name='uq_role_operation'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'role_level': self.role_level,
            'operation': self.operation,
            'is_permitted': self.is_permitted
        }