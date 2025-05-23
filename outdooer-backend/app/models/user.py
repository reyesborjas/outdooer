# app/models/user.py
from app.database import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    profile_visibility = db.Column(db.Boolean, default=True)
    profile_image_url = db.Column(db.String(255))
    bio = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    national_id = db.Column(db.String(20))
    phone_number = db.Column(db.String(20))
    account_status = db.Column(db.String(20), default='active')
    
    # Define relationships
    roles = db.relationship('UserRole', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    team_memberships = db.relationship('TeamMember', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    created_activities = db.relationship('Activity', foreign_keys='Activity.created_by', back_populates='creator')
    led_activities = db.relationship('Activity', foreign_keys='Activity.leader_id', back_populates='leader')
    created_expeditions = db.relationship('Expedition', foreign_keys='Expedition.created_by', back_populates='creator')
    led_expeditions = db.relationship('Expedition', foreign_keys='Expedition.leader_id', back_populates='leader')
    
    def __repr__(self):
        return f'<User {self.email}>'

class UserRole(db.Model):
    __tablename__ = 'user_roles'
    
    user_role_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    role_type = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'role_type'),)
    
    # Define relationship with User
    user = db.relationship('User', back_populates='roles')
    
    def __repr__(self):
        return f'<UserRole {self.role_type}>'