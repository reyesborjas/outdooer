# app/models/invitation.py
from app import db
from datetime import datetime, timedelta
import uuid

class InvitationCode(db.Model):
    __tablename__ = 'invitation_codes'
    
    code_id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False, index=True)
    role_type = db.Column(db.String(20), nullable=False)  # 'master_guide', 'guide'
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    max_uses = db.Column(db.Integer, default=1)
    used_count = db.Column(db.Integer, default=0)
    expires_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    team = db.relationship('Team', backref='invitation_codes')
    creator = db.relationship('User', backref='created_invitations')
    usages = db.relationship('InvitationUsage', backref='invitation_code', cascade='all, delete-orphan')
    
    @classmethod
    def generate_code(cls, role_type, team_id=None, expires_in_days=30, max_uses=1, created_by=None):
        """Generate a new invitation code"""
        # Create a unique code with role prefix
        prefix = 'TL' if role_type == 'master_guide' else 'GD'
        unique_part = str(uuid.uuid4())[:8].upper()
        code = f"{prefix}-{unique_part}"
        
        # Calculate expiration date
        expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        # Create and return the invitation code
        return cls(
            code=code,
            role_type=role_type,
            team_id=team_id,
            max_uses=max_uses,
            expires_at=expires_at,
            created_by=created_by,
            is_active=True,
            used_count=0
        )


class InvitationUsage(db.Model):
    __tablename__ = 'invitation_usages'
    
    usage_id = db.Column(db.Integer, primary_key=True)
    code_id = db.Column(db.Integer, db.ForeignKey('invitation_codes.code_id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    used_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='invitation_usages')