# app/models/activity_type.py
from app import db
from datetime import datetime

class ActivityType(db.Model):
    __tablename__ = 'activity_types'
    
    activity_type_id = db.Column(db.Integer, primary_key=True)
    activity_type_name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<ActivityType {self.activity_type_name}>'