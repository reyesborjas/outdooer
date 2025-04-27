# app/models/team.py
from app.database import db
from datetime import datetime

class Team(db.Model):
    __tablename__ = 'teams'
    
    team_id = db.Column(db.Integer, primary_key=True)
    team_name = db.Column(db.String(255), unique=True, nullable=False)
    master_guide_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    team_status = db.Column(db.String(20), default='active')
    
    # Define relationships
    members = db.relationship('TeamMember', back_populates='team', lazy='dynamic')
    activities = db.relationship("Activity", back_populates="team", lazy='dynamic')
    expeditions = db.relationship("Expedition", back_populates="team", lazy='dynamic')
    role_config = db.relationship("TeamRoleConfiguration", backref="team", uselist=False)
    revenue_sharing = db.relationship("TeamRevenueSharing", backref="team")
    metrics = db.relationship("TeamMetrics", backref="team", uselist=False)
    microsites = db.relationship("TeamMicrosites", backref="team", uselist=False)
    audit_logs = db.relationship("TeamSettingsAuditLog", back_populates="team")
    
    def to_dict(self):
        return {
            'team_id': self.team_id,
            'team_name': self.team_name,
            'master_guide_id': self.master_guide_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'team_status': self.team_status
        }




class TeamRevenueSharing(db.Model):
    __tablename__ = 'teamrevenuesharing'
    
    sharing_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), nullable=False)
    role_level = db.Column(db.Integer, nullable=False)
    percentage = db.Column(db.Numeric(5, 2), nullable=False)
    modified_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Define relationship with modifier
    modifier = db.relationship('User', backref='modified_revenue_sharing')
    
    __table_args__ = (
        db.UniqueConstraint('team_id', 'role_level', name='teamrevenuesharing_team_id_role_level_key'),
    )
    
    def to_dict(self):
        return {
            'sharing_id': self.sharing_id,
            'team_id': self.team_id,
            'role_level': self.role_level,
            'percentage': float(self.percentage),
            'modified_by': self.modified_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class TeamMetrics(db.Model):
    __tablename__ = 'teammetrics'
    
    metric_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), unique=True, nullable=False)
    current_reservation_count = db.Column(db.Integer, default=0)
    reservation_limit = db.Column(db.Integer, default=100)
    total_events_count = db.Column(db.Integer, default=0)
    total_activities_count = db.Column(db.Integer, default=0)
    total_expeditions_count = db.Column(db.Integer, default=0)
    total_revenue = db.Column(db.Numeric(12, 2), default=0)
    total_commission_paid = db.Column(db.Numeric(12, 2), default=0)
    custom_commission_rate = db.Column(db.Numeric(5, 2))
    commission_rate_negotiated = db.Column(db.Boolean, default=False)
    limit_negotiation_date = db.Column(db.DateTime)
    limit_approved_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with approver
    approver = db.relationship('User', backref='approved_team_limits')
    
    def to_dict(self):
        return {
            'metric_id': self.metric_id,
            'team_id': self.team_id,
            'current_reservation_count': self.current_reservation_count,
            'reservation_limit': self.reservation_limit,
            'total_events_count': self.total_events_count,
            'total_activities_count': self.total_activities_count,
            'total_expeditions_count': self.total_expeditions_count,
            'total_revenue': float(self.total_revenue) if self.total_revenue else 0,
            'total_commission_paid': float(self.total_commission_paid) if self.total_commission_paid else 0,
            'custom_commission_rate': float(self.custom_commission_rate) if self.custom_commission_rate else None,
            'commission_rate_negotiated': self.commission_rate_negotiated,
            'limit_negotiation_date': self.limit_negotiation_date.isoformat() if self.limit_negotiation_date else None,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }


class TeamMicrosites(db.Model):
    __tablename__ = 'teammicrosites'
    
    microsite_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), unique=True, nullable=False)
    site_title = db.Column(db.String(255), nullable=False)
    site_description = db.Column(db.Text)
    theme_color = db.Column(db.String(20))
    logo_url = db.Column(db.String(255))
    contact_email = db.Column(db.String(255))
    contact_phone = db.Column(db.String(50))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'microsite_id': self.microsite_id,
            'team_id': self.team_id,
            'site_title': self.site_title,
            'site_description': self.site_description,
            'theme_color': self.theme_color,
            'logo_url': self.logo_url,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }