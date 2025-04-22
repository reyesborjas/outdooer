from app import db
from datetime import datetime


class Expedition(db.Model):
    __tablename__ = 'expeditions'

    expedition_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    min_participants = db.Column(db.Integer, default=1)
    max_participants = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    leader_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expedition_status = db.Column(db.String(20), default='active')  # draft, active, canceled, completed

    # Relationships
    team = db.relationship('Team', back_populates='expeditions')
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_expeditions')
    leader = db.relationship('User', foreign_keys=[leader_id], backref='led_expeditions')
    expedition_activities = db.relationship('ExpeditionActivity', back_populates='expedition', cascade='all, delete-orphan')
    expedition_locations = db.relationship('ExpeditionLocation', back_populates='expedition', cascade='all, delete-orphan')
    expedition_resources = db.relationship('ExpeditionResource', back_populates='expedition', cascade='all, delete-orphan')
    expedition_route = db.relationship('ExpeditionRoute', back_populates='expedition', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        """Convert expedition to dictionary for JSON serialization"""
        return {
            "expedition_id": self.expedition_id,
            "team_id": self.team_id,
            "title": self.title,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "min_participants": self.min_participants,
            "max_participants": self.max_participants,
            "price": str(self.price),  # Convert to string for JSON
            "created_by": self.created_by,
            "leader_id": self.leader_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "expedition_status": self.expedition_status,

            # Include related data if available
            "team_name": self.team.team_name if self.team else None,
            "leader_name": f"{self.leader.first_name} {self.leader.last_name}" if self.leader else None,
            "creator_name": f"{self.creator.first_name} {self.creator.last_name}" if self.creator else None,
        }


class ExpeditionActivity(db.Model):
    __tablename__ = 'expeditionactivities'
    
    expedition_activity_id = db.Column(db.Integer, primary_key=True)
    expedition_id = db.Column(db.Integer, db.ForeignKey('expeditions.expedition_id'))
    activity_id = db.Column(db.Integer, db.ForeignKey('activities.activity_id'))
    sequence_order = db.Column(db.Integer, nullable=False)
    day_number = db.Column(db.Integer, nullable=False)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    is_optional = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    expedition = db.relationship('Expedition', back_populates='expedition_activities')
    activity = db.relationship('Activity', backref='expedition_activities')
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        result = {
            "expedition_activity_id": self.expedition_activity_id,
            "expedition_id": self.expedition_id,
            "activity_id": self.activity_id,
            "sequence_order": self.sequence_order,
            "day_number": self.day_number,
            "is_optional": self.is_optional,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        # Include activity details if available
        if self.activity:
            result.update({
                "activity_title": self.activity.title,
                "activity_description": self.activity.description,
                "activity_difficulty_level": self.activity.difficulty_level,
                "activity_price": str(self.activity.price) if self.activity.price else None
            })
        
        return result


class ExpeditionLocation(db.Model):
    __tablename__ = 'expeditionlocations'
    
    expedition_location_id = db.Column(db.Integer, primary_key=True)
    expedition_id = db.Column(db.Integer, db.ForeignKey('expeditions.expedition_id'))
    location_id = db.Column(db.Integer, db.ForeignKey('locations.location_id'))
    location_type = db.Column(db.String(50), nullable=False)  # basecamp, start, end, overnight, etc.
    sequence_order = db.Column(db.Integer)
    arrival_date = db.Column(db.Date)
    departure_date = db.Column(db.Date)
    accommodation_details = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    expedition = db.relationship('Expedition', back_populates='expedition_locations')
    location = db.relationship('Location', backref='expedition_locations')
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        result = {
            "expedition_location_id": self.expedition_location_id,
            "expedition_id": self.expedition_id,
            "location_id": self.location_id,
            "location_type": self.location_type,
            "sequence_order": self.sequence_order,
            "arrival_date": self.arrival_date.isoformat() if self.arrival_date else None,
            "departure_date": self.departure_date.isoformat() if self.departure_date else None,
            "accommodation_details": self.accommodation_details,
            "is_public": self.is_public,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        # Include location details if available
        if self.location:
            result.update({
                "location_name": self.location.location_name,
                "location_type": self.location.location_type,
                "latitude": float(self.location.latitude) if self.location.latitude else None,
                "longitude": float(self.location.longitude) if self.location.longitude else None,
            })
        
        return result


class ExpeditionResource(db.Model):
    __tablename__ = 'expeditionresources'
    
    expedition_resource_id = db.Column(db.Integer, primary_key=True)
    expedition_id = db.Column(db.Integer, db.ForeignKey('expeditions.expedition_id'))
    resource_id = db.Column(db.Integer, db.ForeignKey('resources.resource_id'))
    quantity_required = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    expedition = db.relationship('Expedition', back_populates='expedition_resources')
    # resource = db.relationship('Resource', backref='expedition_resources')  # Uncomment when Resource model is defined
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            "expedition_resource_id": self.expedition_resource_id,
            "expedition_id": self.expedition_id,
            "resource_id": self.resource_id,
            "quantity_required": self.quantity_required,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ExpeditionRoute(db.Model):
    __tablename__ = 'expeditionroutes'
    
    expedition_route_id = db.Column(db.Integer, primary_key=True)
    expedition_id = db.Column(db.Integer, db.ForeignKey('expeditions.expedition_id'), unique=True)
    total_distance_km = db.Column(db.Numeric(8, 2))
    total_travel_time_hours = db.Column(db.Numeric(6, 2))
    route_points = db.Column(db.Text)  # JSON array of ordered [lat, lng] coordinates
    route_summary = db.Column(db.Text)  # Textual summary of the route
    map_image_url = db.Column(db.String(255))
    last_calculated = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    expedition = db.relationship('Expedition', back_populates='expedition_route')
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            "expedition_route_id": self.expedition_route_id,
            "expedition_id": self.expedition_id,
            "total_distance_km": float(self.total_distance_km) if self.total_distance_km else None,
            "total_travel_time_hours": float(self.total_travel_time_hours) if self.total_travel_time_hours else None,
            "route_summary": self.route_summary,
            "map_image_url": self.map_image_url,
            "last_calculated": self.last_calculated.isoformat() if self.last_calculated else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }