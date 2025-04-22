# app/models/activity_date.py
from app import db
from datetime import datetime

class GuideActivityInstance(db.Model):
    __tablename__ = 'guide_activity_instance'
    
    instance_id = db.Column(db.Integer, primary_key=True)
    guide_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey('activities.activity_id'), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    guide = db.relationship('User', foreign_keys=[guide_id], backref='guided_activity_instances')
    activity = db.relationship('Activity', backref='guide_instances')
    available_dates = db.relationship('ActivityAvailableDate', backref='activity_instance', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'instance_id': self.instance_id,
            'guide_id': self.guide_id,
            'activity_id': self.activity_id,
            'team_id': self.team_id,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'guide_name': f"{self.guide.first_name} {self.guide.last_name}" if self.guide else None,
            'activity_title': self.activity.title if self.activity else None
        }

class ActivityAvailableDate(db.Model):
    __tablename__ = 'activity_available_date'
    
    available_date_id = db.Column(db.Integer, primary_key=True)
    activity_instance_id = db.Column(db.Integer, db.ForeignKey('guide_activity_instance.instance_id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    max_reservations = db.Column(db.Integer, default=10)
    current_reservations = db.Column(db.Integer, default=0)
    location = db.Column(db.String(255))
    status = db.Column(db.String(20), default='open')  # Values: open, closed, canceled
    
    def to_dict(self):
        return {
            'available_date_id': self.available_date_id,
            'activity_instance_id': self.activity_instance_id,
            'date': self.date.isoformat() if self.date else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'max_reservations': self.max_reservations,
            'current_reservations': self.current_reservations,
            'location': self.location,
            'status': self.status
        }