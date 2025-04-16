# app/api/invitations/routes.py
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from . import invitations_bp
from app.models.invitation import InvitationCode
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app import db

@invitations_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_invitation():
    """Generate new invitation code"""
    current_user_id = get_jwt_identity()
    
    # Check if user has permission (admin or master guide)
    is_admin = UserRole.query.filter_by(user_id=current_user_id, role_type='admin').first() is not None
    
    if not is_admin:
        # Check if master guide
        is_master_guide = TeamMember.query.filter_by(user_id=current_user_id, role_level=1).first() is not None
        
        if not is_master_guide:
            return jsonify({"error": "Unauthorized"}), 403
    
    # Get request data
    data = request.get_json()
    role_type = data.get('role_type', 'guide')  # Default to regular guide
    max_uses = data.get('max_uses', 1)
    expires_in_days = data.get('expires_in_days', 30)
    
    # For master guides, can only create invites for their team
    team_id = data.get('team_id')
    if not is_admin and is_master_guide:
        # Get master guide's team
        team = Team.query.filter_by(master_guide_id=current_user_id).first()
        
        if not team:
            return jsonify({"error": "No team found for this master guide"}), 400
            
        team_id = team.team_id
    
    # For admins creating master guide invites, no team is needed
    if is_admin and role_type == 'master_guide':
        team_id = None
    
    # Generate new code
    invitation = InvitationCode.generate_code(
        role_type=role_type,
        team_id=team_id,
        expires_in_days=expires_in_days,
        max_uses=max_uses,
        created_by=current_user_id
    )
    
    db.session.add(invitation)
    db.session.commit()
    
    return jsonify({
        "code": invitation.code,
        "role_type": invitation.role_type,
        "team_id": invitation.team_id,
        "expires_at": invitation.expires_at.isoformat(),
        "max_uses": invitation.max_uses
    }), 201