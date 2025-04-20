# app/api/invitations/routes.py
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from . import invitations_bp
from app.models.invitation import InvitationCode, InvitationUsage
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app import db
from datetime import datetime
from app.utils.generate_invitation import generate_code

@invitations_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_invitation():
    """Generate new invitation code"""
    current_user_id = get_jwt_identity()

    # Check if user is admin
    is_admin = UserRole.query.filter_by(user_id=current_user_id, role_type='admin').first() is not None

    if not is_admin:
        # Check if master guide
        is_master_guide = TeamMember.query.filter_by(user_id=current_user_id, role_level=1).first() is not None

        if not is_master_guide:
            return jsonify({"error": "Unauthorized"}), 403

    # Get request data
    data = request.get_json()
    role_type = data.get('role_type', 'guide')
    max_uses = data.get('max_uses', 1)
    expires_in_days = data.get('expires_in_days', 30)
    team_id = data.get('team_id')  # Optional

    # For master guides, enforce code generation only for their team
    if not is_admin:
        master_team = Team.query.filter_by(master_guide_id=current_user_id).first()
        if not master_team:
            return jsonify({"error": "No team found for this master guide"}), 400

        # Only allow codes for the same team or for unassigned guides
        if team_id and int(team_id) != master_team.team_id:
            return jsonify({"error": "Cannot generate codes for other teams"}), 403

        # If role is guide and no team_id provided, assume it's for the current team
        if role_type == 'guide' and not team_id:
            team_id = master_team.team_id

    # For admin creating master guide invites, team_id should be None
    if is_admin and role_type == 'master_guide':
        team_id = None

    # Generate the code
    invitation = generate_code(
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

@invitations_bp.route('/validate/<code>', methods=['GET'])
def validate_invitation_code(code):
    """Validate an invitation code and return info about it"""
    invitation = InvitationCode.query.filter_by(code=code, is_active=True).first()

    if not invitation or invitation.used_count >= invitation.max_uses or invitation.expires_at < datetime.utcnow():
        return jsonify({
            "valid": False,
            "message": "Invalid or expired invitation code"
        }), 400

    response = {
        "valid": True,
        "role_type": invitation.role_type,
        "message": f"Valid {invitation.role_type.replace('_', ' ')} invitation"
    }

    if invitation.team_id:
        team = Team.query.get(invitation.team_id)
        if team:
            response["team_id"] = team.team_id
            response["team_name"] = team.team_name

    return jsonify(response), 200

@invitations_bp.route('/details/<code>', methods=['GET'])
def get_invitation_details(code):
    """Get detailed information about an invitation code"""
    invitation = InvitationCode.query.filter_by(code=code).first()
    
    if not invitation:
        return jsonify({"error": "Invitation code not found"}), 404
        
    # Get creator information
    creator = User.query.get(invitation.created_by) if invitation.created_by else None
    
    details = {
        "code": invitation.code,
        "role_type": invitation.role_type,
        "is_active": invitation.is_active,
        "used_count": invitation.used_count,
        "max_uses": invitation.max_uses,
        "expires_at": invitation.expires_at.isoformat() if invitation.expires_at else None,
        "created_at": invitation.created_at.isoformat() if invitation.created_at else None,
        "created_by": {
            "user_id": creator.user_id if creator else None,
            "name": f"{creator.first_name} {creator.last_name}" if creator else "Unknown"
        },
        "status": "expired" if invitation.expires_at < datetime.utcnow() else
                 "used" if invitation.used_count >= invitation.max_uses else
                 "inactive" if not invitation.is_active else "active"
    }
    
    # Add team info if applicable
    if invitation.team_id:
        team = Team.query.get(invitation.team_id)
        if team:
            details["team"] = {
                "team_id": team.team_id,
                "team_name": team.team_name
            }
    
    # Get usage information
    usages = InvitationUsage.query.filter_by(code_id=invitation.code_id).all()
    details["usages"] = []
    
    for usage in usages:
        user = User.query.get(usage.user_id)
        if user:
            details["usages"].append({
                "user_id": user.user_id,
                "name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "used_at": usage.used_at.isoformat() if usage.used_at else None
            })
    
    return jsonify(details), 200