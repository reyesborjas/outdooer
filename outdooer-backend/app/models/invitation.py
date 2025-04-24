# app/models/invitation.py
from app import db
from datetime import datetime, timedelta
import uuid

class InvitationCode(db.Model):
    __tablename__ = 'invitation_codes'
    
    code_id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    role_type = db.Column(db.String(20), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    max_uses = db.Column(db.Integer, default=1)
    used_count = db.Column(db.Integer, default=0)
    expires_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Define relationships without using backref to avoid conflicts
    team = db.relationship('Team', foreign_keys=[team_id])
    creator = db.relationship('User', foreign_keys=[created_by])
    usages = db.relationship('InvitationUsage', back_populates='invitation_code', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'code_id': self.code_id,
            'code': self.code,
            'role_type': self.role_type,
            'team_id': self.team_id,
            'created_by': self.created_by,
            'max_uses': self.max_uses,
            'used_count': self.used_count,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def generate_code(cls, role_type, team_id=None, expires_in_days=30, max_uses=1, created_by=None):
        """Generate a new invitation code with enhanced uniqueness"""
        # Create a unique code with role prefix
        prefix = 'TL' if role_type == 'master_guide' else 'GD'
        
        # Attempt to create a unique code
        attempts = 0
        max_attempts = 10
        
        while attempts < max_attempts:
            # Generate unique code
            unique_part = str(uuid.uuid4())[:8].upper()
            code = f"{prefix}-{unique_part}"
            
            # Check for existing code
            existing = cls.query.filter_by(code=code).first()
            if existing:
                attempts += 1
                continue
            
            # Calculate expiration date
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
            
            # Create invitation code
            return cls(
                code=code,
                role_type=role_type,
                team_id=team_id,
                max_uses=max_uses,
                used_count=0,
                expires_at=expires_at,
                created_by=created_by,
                is_active=True,
                created_at=datetime.utcnow()
            )
        
        raise ValueError(f"Could not generate a unique invitation code after {max_attempts} attempts")


class InvitationUsage(db.Model):
    __tablename__ = 'invitation_usages'
    
    usage_id = db.Column(db.Integer, primary_key=True)
    code_id = db.Column(db.Integer, db.ForeignKey('invitation_codes.code_id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    used_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Define relationships
    invitation_code = db.relationship('InvitationCode', back_populates='usages')
    user = db.relationship('User', backref='invitation_usages')
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'usage_id': self.usage_id,
            'code_id': self.code_id,
            'user_id': self.user_id,
            'used_at': self.used_at.isoformat() if self.used_at else None
        }