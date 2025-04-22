# app/models/resource.py
from app import db
from datetime import datetime

class ResourceCategory(db.Model):
    __tablename__ = 'resource_categories'
    
    category_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'))
    category_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    team = db.relationship('Team', backref='resource_categories')
    creator = db.relationship('User', backref='created_resource_categories')
    resources = db.relationship('Resource', backref='category', cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'category_id': self.category_id,
            'team_id': self.team_id,
            'category_name': self.category_name,
            'description': self.description,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Resource(db.Model):
    __tablename__ = 'resources'
    
    resource_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'))
    category_id = db.Column(db.Integer, db.ForeignKey('resource_categories.category_id'))
    resource_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.Integer, nullable=False)
    unit_cost = db.Column(db.Numeric(10, 2))
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    team = db.relationship('Team', backref='resources')
    creator = db.relationship('User', backref='created_resources')
    
    # Relaciones con actividades y expediciones
    activity_resources = db.relationship('ActivityResource', backref='resource', cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'resource_id': self.resource_id,
            'team_id': self.team_id,
            'category_id': self.category_id,
            'resource_name': self.resource_name,
            'description': self.description,
            'quantity': self.quantity,
            'unit_cost': float(self.unit_cost) if self.unit_cost else None,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'category_name': self.category.category_name if self.category else None
        }

class ActivityResource(db.Model):
    __tablename__ = 'activity_resources'
    
    activity_resource_id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activities.activity_id'), nullable=False)
    resource_id = db.Column(db.Integer, db.ForeignKey('resources.resource_id'), nullable=False)
    quantity_required = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación con actividad (la relación con resource está en Resource)
    activity = db.relationship('Activity', backref='activity_resources')
    
    def to_dict(self):
        return {
            'activity_resource_id': self.activity_resource_id,
            'activity_id': self.activity_id,
            'resource_id': self.resource_id,
            'resource_name': self.resource.resource_name if self.resource else None,
            'quantity_required': self.quantity_required,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }