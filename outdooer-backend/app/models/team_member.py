# app/models/team_member.py
from app.database import db
from datetime import datetime

class TeamMember(db.Model):
    __tablename__ = 'team_members'
    
    # Add extend_existing to handle potential duplicate definitions
    __table_args__ = (
        db.UniqueConstraint('team_id', 'user_id'),
        {'extend_existing': True}
    )
    
    team_member_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    role_level = db.Column(db.Integer, nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Define proper relationships
    user = db.relationship('User', back_populates='team_memberships')
    team = db.relationship('Team', back_populates='members')
    
