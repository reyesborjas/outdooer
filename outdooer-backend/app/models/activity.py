# app/models/activity.py
from app import db
from datetime import datetime

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
    
    # Relationships
    location = db.relationship('Location', backref='activities')
    team = db.relationship('Team', backref='activities')
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_activities')
    leader = db.relationship('User', foreign_keys=[leader_id], backref='led_activities')
    
    def __repr__(self):
        return f'<Activity {self.title}>'