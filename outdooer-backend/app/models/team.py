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
    
    # Relaciones
    # Usar strings para relaciones para resolver dependencias circulares
    members = db.relationship('TeamMember', back_populates='team', lazy='dynamic', cascade='all, delete-orphan')
    role_config = db.relationship('TeamRoleConfiguration', back_populates='team', uselist=False, cascade='all, delete-orphan')
    activities = db.relationship('Activity', back_populates='team')
    # Expedition se omite si no lo tienes definido todavía
    # expeditions = db.relationship('Expedition', back_populates='team')
    
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
    
    # Relaciones
    team = db.relationship('Team', back_populates='members')
    # Evitar la relación bidireccional con User para romper la circularidad
    # (ya está definida en User.team_memberships)
    
    def __repr__(self):
        return f'<TeamMember {self.user_id} in {self.team_id}>'

class TeamRoleConfiguration(db.Model):
    __tablename__ = 'team_role_configurations'
    
    role_config_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), unique=True)
    level_1_name = db.Column(db.String(100), default='Master Guide')
    level_2_name = db.Column(db.String(100), default='Tactical Guide')
    level_3_name = db.Column(db.String(100), default='Technical Guide')
    level_4_name = db.Column(db.String(100), default='Base Guide')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    team = db.relationship('Team', back_populates='role_config')
    
    def __repr__(self):
        return f'<TeamRoleConfiguration for {self.team_id}>'