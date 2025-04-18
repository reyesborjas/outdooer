# app/models/activity.py
from app import db
from datetime import datetime
from app.models.location import Location

class Activity(db.Model):
    __tablename__ = 'activities'
    
    activity_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'))
    location_id = db.Column(db.Integer, db.ForeignKey('locations.location_id'))
    activity_type_id = db.Column(db.Integer, db.ForeignKey('activity_types.activity_type_id'))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
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
    location = db.relationship('Location', back_populates='activities')
    team = db.relationship('Team', back_populates='activities')
    creator = db.relationship('User', foreign_keys=[created_by], back_populates='created_activities')
    leader = db.relationship('User', foreign_keys=[leader_id], back_populates='led_activities')
    activity_type = db.relationship('ActivityType', backref='activities')

    def to_dict(self):
        """Convert the Activity model to a dictionary."""
        return {
            "activity_id": self.activity_id,
            "team_id": self.team_id,
            "location_id": self.location_id,
            "activity_type_id": self.activity_type_id,
            "title": self.title,
            "description": self.description,
            "min_participants": self.min_participants,
            "max_participants": self.max_participants,
            "price": str(self.price),  # Convert to string for JSON serialization
            "difficulty_level": self.difficulty_level,
            "created_by": self.created_by,
            "leader_id": self.leader_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "activity_status": self.activity_status,
        }
