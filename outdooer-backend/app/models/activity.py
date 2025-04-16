# app/models/activity.py
from app import db
from datetime import datetime
from app.models.location import Location  # Import the Location model
from app.models.team import Team  # Import the Team model
from app.models.user import User  # Import the User model

class Activity(db.Model):
    __tablename__ = 'activities'
    
    activity_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'))
    location_id = db.Column(db.Integer, db.ForeignKey('locations.location_id'))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    min_participants = db.Column(db.Integer, default=1)
    max_participants = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    difficulty_level = db.Column(db.String(50))
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    leader_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    activity_status = db.Column(db.String(20), default='active')
    
    # Relationships with proper back_populates instead of backref
    location = db.relationship('Location', back_populates='activities')
    team = db.relationship('Team', back_populates='activities')
    creator = db.relationship('User', foreign_keys=[created_by], back_populates='created_activities')
    leader = db.relationship('User', foreign_keys=[leader_id], back_populates='led_activities')