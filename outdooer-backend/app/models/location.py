# app/models/location.py
from app import db
from datetime import datetime

class Location(db.Model):
    __tablename__ = 'locations'
    
    location_id = db.Column(db.Integer, primary_key=True)
    location_name = db.Column(db.String(255), nullable=False)
    location_type = db.Column(db.String(50), nullable=False)
    latitude = db.Column(db.Numeric(10, 8), nullable=False)
    longitude = db.Column(db.Numeric(11, 8), nullable=False)
    elevation_meters = db.Column(db.Numeric(8, 2))
    parent_location_id = db.Column(db.Integer, db.ForeignKey('locations.location_id'))
    country_code = db.Column(db.String(2))
    region_code = db.Column(db.String(10))
    postal_code = db.Column(db.String(20))
    formatted_address = db.Column(db.Text)
    is_verified = db.Column(db.Boolean, default=False)
    geojson = db.Column(db.Text)
    timezone = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    aliases = db.relationship('LocationAlias', backref='location', lazy='dynamic')
    child_locations = db.relationship('Location', backref=db.backref('parent_location', remote_side=[location_id]))
    
    def __repr__(self):
        return f'<Location {self.location_name}>'

class LocationAlias(db.Model):
    __tablename__ = 'location_aliases'
    
    alias_id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.location_id'))
    alias_name = db.Column(db.String(255), nullable=False)
    language_code = db.Column(db.String(2))
    is_primary = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<LocationAlias {self.alias_name}>'