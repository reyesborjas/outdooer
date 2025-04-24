# New model for the audit log - define in app/models/audit_log.py

from app import db
from datetime import datetime

class TeamSettingsAuditLog(db.Model):
    __tablename__ = 'team_settings_audit_logs'
    
    log_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    user_role_level = db.Column(db.Integer, nullable=False)
    setting_type = db.Column(db.String(100), nullable=False)
    old_value = db.Column(db.Text)
    new_value = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    team = db.relationship('Team', back_populates='audit_logs')
    user = db.relationship('User', back_populates='audit_actions')
