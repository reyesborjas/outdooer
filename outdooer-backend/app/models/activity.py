# app/models/activity.py
from app import db
from datetime import datetime


class Activity(db.Model):
    __tablename__ = 'activities'
    
    activity_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), nullable=True)
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
    act_cover_image_url = db.Column(db.String(255))
    
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
            "act_cover_image_url": self.act_cover_image_url,
            # Include relationship data
            "location_name": self.location.location_name if self.location else None,
            "activity_type_name": self.activity_type.activity_type_name if self.activity_type else None,
            # Include leader name if available
            "leader_name": f"{self.leader.first_name} {self.leader.last_name}" if self.leader else None,
            # Include creator name if available
            "creator_name": f"{self.creator.first_name} {self.creator.last_name}" if self.creator else None,
            # Include team name if available
            "team_name": self.team.team_name if self.team else None
        }


def find_similar_activities(team_id, activity_type_id, location_id, exclude_activity_id=None):
    """
    Find activities with the same activity_type, team, and location
    
    Parameters:
    - team_id: ID of the team
    - activity_type_id: ID of the activity type
    - location_id: ID of the location
    - exclude_activity_id: Optional ID to exclude from results (for editing)
    
    Returns:
    - List of similar activities
    """
    query = Activity.query.filter_by(
        team_id=team_id,
        activity_type_id=activity_type_id,
        location_id=location_id
    )
    
    if exclude_activity_id:
        query = query.filter(Activity.activity_id != exclude_activity_id)
    
    return query.all()