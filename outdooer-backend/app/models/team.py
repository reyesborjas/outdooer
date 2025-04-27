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
    
    # Add members relationship
    members = db.relationship('TeamMember', back_populates='team', lazy='dynamic')
    activities = db.relationship("Activity", back_populates="team", lazy='dynamic')
    expeditions = db.relationship("Expedition", back_populates="team", lazy='dynamic')
    
    

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