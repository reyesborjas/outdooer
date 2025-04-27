# app/models/team_role_configuration.py
from app.database import db

class TeamRoleConfiguration(db.Model):
    """
    Model for team-specific role names configurations (e.g., custom role names per team).
    Maps to the team_role_configurations table in the database.
    """
    __tablename__ = 'team_role_configurations'
    
    role_config_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'))
    level_1_name = db.Column(db.String(100), default='Master Guide')
    level_2_name = db.Column(db.String(100), default='Tactical Guide')
    level_3_name = db.Column(db.String(100), default='Technical Guide')
    level_4_name = db.Column(db.String(100), default='Base Guide')
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())
    
    # Define relationship with Team
    team = db.relationship('Team', backref=db.backref('role_config', uselist=False))
    
    def to_dict(self):
        return {
            'role_config_id': self.role_config_id,
            'team_id': self.team_id,
            'level_1_name': self.level_1_name,
            'level_2_name': self.level_2_name,
            'level_3_name': self.level_3_name,
            'level_4_name': self.level_4_name,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }