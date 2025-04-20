# app/utils/generate_invitation.py

from app.models.invitation import InvitationCode
from datetime import datetime, timedelta
import uuid

def generate_code(role_type, created_by, team_id=None, expires_in_days=30, max_uses=1):
    """
    Helper to generate an InvitationCode instance
    
    Parameters:
    - role_type: Type of role ('master_guide', 'guide')
    - created_by: User ID of the creator
    - team_id: Optional ID of the team (required for guide invitations)
    - expires_in_days: Number of days until the code expires
    - max_uses: Maximum number of times the code can be used
    
    Returns:
    - InvitationCode instance (not yet added to the database)
    """
    # Create a unique code with role prefix
    prefix = 'TL' if role_type == 'master_guide' else 'GD'
    unique_part = str(uuid.uuid4())[:8].upper()
    code = f"{prefix}-{unique_part}"
    
    # Calculate expiration date
    expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
    
    # Create and return the invitation code
    return InvitationCode(
        code=code,
        role_type=role_type,
        team_id=team_id,
        created_by=created_by,
        max_uses=max_uses,
        expires_at=expires_at,
        is_active=True,
        used_count=0
    )