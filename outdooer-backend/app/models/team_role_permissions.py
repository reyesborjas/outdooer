# app/models/team_role_permissions.py
from app.database import db

class TeamRolePermissions(db.Model):
    """
    Model for team-specific role permissions.
    Maps to the team_role_permissions table for team-specific permissions.
    """
    __tablename__ = 'team_role_permissions'
    __table_args__ = {'extend_existing': True}
    permission_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), nullable=False)  # Must be non-null for team permissions
    role_level = db.Column(db.Integer, nullable=False)  # 1=Master, 2=Tactical, 3=Technical, 4=Base
    permission_key = db.Column(db.String(100), nullable=False)  # e.g., 'create_expedition', 'delete_activity'
    is_enabled = db.Column(db.Boolean, default=False)
    modified_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    modified_at = db.Column(db.DateTime, default=db.func.now())
    
    # Define relationships
    team = db.relationship('Team', backref='team_permissions')
    modifier = db.relationship('User', backref='modified_team_permissions')
    
    __table_args__ = (
        db.UniqueConstraint('team_id', 'role_level', 'permission_key', name='unique_team_role_permission'),
    )
    
    def to_dict(self):
        return {
            'permission_id': self.permission_id,
            'team_id': self.team_id,
            'role_level': self.role_level,
            'permission_key': self.permission_key,
            'is_enabled': self.is_enabled,
            'modified_by': self.modified_by,
            'modified_at': self.modified_at.isoformat() if self.modified_at else None
        }