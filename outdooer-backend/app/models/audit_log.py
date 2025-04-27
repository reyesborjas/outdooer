# app/models/audit_log.py

from app.database import db
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
    
    # Relationships - fixed to use back_populates instead of backref
    team = db.relationship('Team', back_populates='audit_logs')
    user = db.relationship('User', backref='audit_actions')
    
    def to_dict(self):
        return {
            'log_id': self.log_id,
            'team_id': self.team_id,
            'user_id': self.user_id,
            'user_role_level': self.user_role_level,
            'setting_type': self.setting_type,
            'old_value': self.old_value,
            'new_value': self.new_value,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }