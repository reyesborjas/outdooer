# app/models/team.py
from app.database import db
from datetime import datetime

class Team(db.Model):
    __tablename__ = 'teams'
    
    # Add extend_existing to handle potential duplicate definitions
    __table_args__ = {'extend_existing': True}
    
    team_id = db.Column(db.Integer, primary_key=True)
    team_name = db.Column(db.String(255), unique=True, nullable=False)
    master_guide_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    team_status = db.Column(db.String(20), default='active')
    
    def __repr__(self):
        return f'<Team {self.team_name}>'

    def to_dict(self):
        return {
            'team_id': self.team_id,
            'team_name': self.team_name,
            'master_guide_id': self.master_guide_id,
            'team_status': self.team_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Other related models can be added here if needed
class TeamMember(db.Model):
    __tablename__ = 'team_members'
    
    team_member_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    role_level = db.Column(db.Integer, nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('team_id', 'user_id'),)
    
    # Define relationships
    user = db.relationship('User', back_populates='team_memberships')
    team = db.relationship('Team', back_populates='members')
    
    def __repr__(self):
        return f'<TeamMember {self.user_id} in {self.team_id}>'

class TeamRoleConfiguration(db.Model):
    __tablename__ = 'team_role_configurations'
    
    # Add extend_existing to handle potential duplicate definitions
    __table_args__ = {'extend_existing': True}
    
    role_config_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), unique=True, nullable=False)
    level_1_name = db.Column(db.String(100), default='Master Guide')
    level_2_name = db.Column(db.String(100), default='Tactical Guide')
    level_3_name = db.Column(db.String(100), default='Technical Guide')
    level_4_name = db.Column(db.String(100), default='Base Guide')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<TeamRoleConfiguration for {self.team_id}>'
    
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