# app/utils/generate_invitation.py

from app.models.invitation import InvitationCode
from datetime import datetime, timedelta

def generate_code(role_type, created_by, team_id=None, expires_in_days=30, max_uses=1):
    """Helper to generate an InvitationCode instance"""
    expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
    return InvitationCode(
        role_type=role_type,
        team_id=team_id,
        created_by=created_by,
        expires_at=expires_at,
        max_uses=max_uses
    )
