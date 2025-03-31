# app/models/team.py
from app import db
from datetime import datetime

class Team(db.Model):
    __tablename__ = 'teams'
    
    team_id = db.Column(db.Integer, primary_key=True)
    team_name = db.Column(db.String(255), unique=True, nullable=False)
    master_guide_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    team_status = db.Column(db.String(20), default='active')
    
    # Relationships
    members = db.relationship('TeamMember', backref='team', lazy='dynamic')
    role_config = db.relationship('TeamRoleConfiguration', backref='team', uselist=False)
    
    def __repr__(self):
        return f'<Team {self.team_name}>'

class TeamMember(db.Model):
    __tablename__ = 'team_members'
    
    team_member_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    role_level = db.Column(db.Integer, nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('team_id', 'user_id'),)
    
    def __repr__(self):
        return f'<TeamMember {self.user_id} in {self.team_id}>'

class TeamRoleConfiguration(db.Model):
    __tablename__ = 'team_role_configurations'
    
    role_config_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'))
    level_1_name = db.Column(db.String(100), default='Master Guide')
    level_2_name = db.Column(db.String(100), default='Tactical Guide')
    level_3_name = db.Column(db.String(100), default='Technical Guide')
    level_4_name = db.Column(db.String(100), default='Base Guide')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<TeamRoleConfiguration for {self.team_id}>'