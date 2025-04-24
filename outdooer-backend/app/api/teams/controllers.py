# app/api/teams/controllers.py
from flask import jsonify, request
from app import db
from app.models.team import Team, TeamMember, TeamRoleConfiguration
from app.models.user import User, UserRole
from app.models.invitation import InvitationCode
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timedelta

def get_my_teams():
    """Get teams for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Find team memberships for the user
        team_memberships = TeamMember.query.filter_by(user_id=current_user_id).all()
        
        if not team_memberships:
            return jsonify({'teams': []}), 200
        
        # Get team details
        teams_list = []
        for membership in team_memberships:
            team = Team.query.get(membership.team_id)
            
            if team:
                # Get master guide name
                master_guide = User.query.get(team.master_guide_id) if team.master_guide_id else None
                
                teams_list.append({
                    'team_id': team.team_id,
                    'team_name': team.team_name,
                    'role_level': membership.role_level,
                    'is_master_guide': team.master_guide_id == current_user_id,
                    'master_guide_name': f"{master_guide.first_name} {master_guide.last_name}" if master_guide else None,
                    'member_count': TeamMember.query.filter_by(team_id=team.team_id).count(),
                    'team_status': team.team_status
                })
        
        return jsonify({'teams': teams_list}), 200
    except Exception as e:
        print(f"Error fetching user teams: {str(e)}")
        return jsonify({'error': 'Failed to fetch teams'}), 500

def get_team_details(team_id):
    """Get detailed information about a specific team"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is a member of the team
        team_member = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=team_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'You are not a member of this team'}), 403
        
        team = Team.query.get_or_404(team_id)
        master_guide = User.query.get(team.master_guide_id) if team.master_guide_id else None
        
        # Get role configuration
        role_config = TeamRoleConfiguration.query.filter_by(team_id=team_id).first()
        if not role_config:
            role_config = TeamRoleConfiguration(
                team_id=team_id,
                level_1_name='Master Guide',
                level_2_name='Tactical Guide',
                level_3_name='Technical Guide',
                level_4_name='Base Guide'
            )
            db.session.add(role_config)
            db.session.commit()
        
        # Count members by role level
        role_counts = {}
        for level in range(1, 5):
            role_counts[f'level_{level}_count'] = TeamMember.query.filter_by(team_id=team_id, role_level=level).count()
        
        team_details = {
            'team_id': team.team_id,
            'team_name': team.team_name,
            'master_guide_id': team.master_guide_id,
            'master_guide_name': f"{master_guide.first_name} {master_guide.last_name}" if master_guide else None,
            'team_status': team.team_status,
            'created_at': team.created_at.isoformat() if team.created_at else None,
            'updated_at': team.updated_at.isoformat() if team.updated_at else None,
            'role_config': {
                'level_1_name': role_config.level_1_name,
                'level_2_name': role_config.level_2_name,
                'level_3_name': role_config.level_3_name,
                'level_4_name': role_config.level_4_name
            },
            'member_counts': role_counts,
            'total_members': TeamMember.query.filter_by(team_id=team_id).count(),
            'user_role_level': team_member.role_level
        }
        
        return jsonify({'team': team_details}), 200
    except Exception as e:
        print(f"Error fetching team details: {str(e)}")
        return jsonify({'error': f'Failed to fetch team details: {str(e)}'}), 500

def get_team_members(team_id):
    """Get all members of a specific team"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is a member of the team
        is_member = TeamMember.query.filter_by(
            user_id=current_user_id, 
            team_id=team_id
        ).first()
        
        if not is_member:
            return jsonify({"error": "You are not a member of this team"}), 403
        
        # Get role configuration for this team
        role_config = TeamRoleConfiguration.query.filter_by(team_id=team_id).first()
        role_names = {
            1: role_config.level_1_name if role_config else 'Master Guide',
            2: role_config.level_2_name if role_config else 'Tactical Guide',
            3: role_config.level_3_name if role_config else 'Technical Guide',
            4: role_config.level_4_name if role_config else 'Base Guide'
        }
        
        # Get all team members with guide role
        team_members_query = (
            db.session.query(
                User.user_id,
                User.first_name,
                User.last_name,
                User.email,
                User.profile_image_url,
                User.bio,
                TeamMember.role_level,
                TeamMember.joined_at
            )
            .join(TeamMember, TeamMember.user_id == User.user_id)
            .join(UserRole, UserRole.user_id == User.user_id)
            .filter(TeamMember.team_id == team_id)
            .filter(UserRole.role_type == 'guide')
            .all()
        )
        
        # Format response
        members_list = [{
            'user_id': member.user_id,
            'first_name': member.first_name,
            'last_name': member.last_name,
            'email': member.email,
            'profile_image_url': member.profile_image_url,
            'bio': member.bio,
            'role_level': member.role_level,
            'role_name': role_names.get(member.role_level, 'Unknown'),
            'joined_at': member.joined_at.isoformat() if member.joined_at else None,
            'is_master_guide': member.role_level == 1
        } for member in team_members_query]
        
        return jsonify({'members': members_list}), 200
    except Exception as e:
        print(f"Error fetching team members: {str(e)}")
        return jsonify({'error': f'Failed to fetch team members: {str(e)}'}), 500

def create_team():
    """Create a new team with the current user as the master guide"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Check if user has guide role
        is_guide = UserRole.query.filter_by(
            user_id=current_user_id, 
            role_type='guide'
        ).first()
        
        if not is_guide:
            return jsonify({'error': 'Only guides can create teams'}), 403
        
        # Check if team name already exists
        if Team.query.filter_by(team_name=data.get('team_name')).first():
            return jsonify({'error': 'A team with this name already exists'}), 400
        
        # Create new team
        new_team = Team(
            team_name=data.get('team_name'),
            master_guide_id=current_user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            team_status='active'
        )
        
        db.session.add(new_team)
        db.session.flush()  # Get the team_id without committing
        
        # Add the creator as a member with role_level 1 (Master Guide)
        team_membership = TeamMember(
            team_id=new_team.team_id,
            user_id=current_user_id,
            role_level=1,
            joined_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Create default role configuration
        role_config = TeamRoleConfiguration(
            team_id=new_team.team_id,
            level_1_name='Master Guide',
            level_2_name='Tactical Guide',
            level_3_name='Technical Guide',
            level_4_name='Base Guide',
            updated_at=datetime.utcnow()
        )
        
        db.session.add(team_membership)
        db.session.add(role_config)
        db.session.commit()
        
        return jsonify({
            'message': 'Team created successfully',
            'team': {
                'team_id': new_team.team_id,
                'team_name': new_team.team_name,
                'master_guide_id': new_team.master_guide_id,
                'team_status': new_team.team_status
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating team: {str(e)}")
        return jsonify({'error': f'Failed to create team: {str(e)}'}), 500

def update_team(team_id):
    """Update team information (only by master guide)"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Get the team
        team = Team.query.get_or_404(team_id)
        
        # Check if user is the master guide
        if team.master_guide_id != current_user_id:
            return jsonify({'error': 'Only the master guide can update team information'}), 403
        
        # Update team name if provided and not already in use
        if 'team_name' in data and data['team_name'] != team.team_name:
            if Team.query.filter_by(team_name=data['team_name']).first():
                return jsonify({'error': 'A team with this name already exists'}), 400
            
            team.team_name = data['team_name']
        
        # Update status if provided
        if 'team_status' in data:
            team.team_status = data['team_status']
        
        team.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Team updated successfully',
            'team': {
                'team_id': team.team_id,
                'team_name': team.team_name,
                'master_guide_id': team.master_guide_id,
                'team_status': team.team_status
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating team: {str(e)}")
        return jsonify({'error': f'Failed to update team: {str(e)}'}), 500

def delete_team(team_id):
    """Delete a team (only by master guide)"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get the team
        team = Team.query.get_or_404(team_id)
        
        # Check if user is the master guide
        if team.master_guide_id != current_user_id:
            return jsonify({'error': 'Only the master guide can delete the team'}), 403
        
        # Mark the team as deleted (soft delete)
        team.team_status = 'deleted'
        team.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Team deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting team: {str(e)}")
        return jsonify({'error': f'Failed to delete team: {str(e)}'}), 500

def update_team_role_config(team_id):
    """Update team role configuration"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Get the team
        team = Team.query.get_or_404(team_id)
        
        # Check if user is the master guide
        if team.master_guide_id != current_user_id:
            return jsonify({'error': 'Only the master guide can update role configuration'}), 403
        
        # Get or create role configuration
        role_config = TeamRoleConfiguration.query.filter_by(team_id=team_id).first()
        if not role_config:
            role_config = TeamRoleConfiguration(team_id=team_id)
            db.session.add(role_config)
        
        # Update role names
        if 'level_1_name' in data:
            role_config.level_1_name = data['level_1_name']
        if 'level_2_name' in data:
            role_config.level_2_name = data['level_2_name']
        if 'level_3_name' in data:
            role_config.level_3_name = data['level_3_name']
        if 'level_4_name' in data:
            role_config.level_4_name = data['level_4_name']
        
        role_config.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Role configuration updated successfully',
            'role_config': {
                'level_1_name': role_config.level_1_name,
                'level_2_name': role_config.level_2_name,
                'level_3_name': role_config.level_3_name,
                'level_4_name': role_config.level_4_name
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating role configuration: {str(e)}")
        return jsonify({'error': f'Failed to update role configuration: {str(e)}'}), 500

def update_member_role(team_id, user_id):
    """Update a team member's role level"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Get the team
        team = Team.query.get_or_404(team_id)
        
        # Check if current user is the master guide or tactical guide
        team_member = TeamMember.query.filter_by(
            team_id=team_id,
            user_id=current_user_id
        ).first()
        
        if not team_member or team_member.role_level > 2:
            return jsonify({'error': 'Only master guides and tactical guides can update member roles'}), 403
        
        # Get the member to update
        member_to_update = TeamMember.query.filter_by(
            team_id=team_id,
            user_id=user_id
        ).first_or_404()
        
        # Master guides can only be removed/changed by themselves
        if member_to_update.role_level == 1 and user_id != current_user_id:
            return jsonify({'error': 'Cannot change or remove a master guide'}), 403
        
        # Tactical guides can only be changed by master guides
        if member_to_update.role_level == 2 and team_member.role_level != 1:
            return jsonify({'error': 'Only master guides can change tactical guide roles'}), 403
        
        # Update role level
        new_role_level = data.get('role_level')
        if new_role_level is not None:
            # Validate role level
            if not isinstance(new_role_level, int) or new_role_level < 1 or new_role_level > 4:
                return jsonify({'error': 'Invalid role level. Must be between 1 and 4'}), 400
            
            # Only master guide can assign tactical guide role
            if new_role_level == 2 and team_member.role_level != 1:
                return jsonify({'error': 'Only master guides can assign tactical guide roles'}), 403
            
            # Only master guide can be role level 1
            if new_role_level == 1 and team.master_guide_id != user_id:
                return jsonify({'error': 'Cannot assign master guide role to another user'}), 403
            
            member_to_update.role_level = new_role_level
            member_to_update.updated_at = datetime.utcnow()
            db.session.commit()
        
        # Get role name for the response
        role_config = TeamRoleConfiguration.query.filter_by(team_id=team_id).first()
        role_name = getattr(role_config, f'level_{new_role_level}_name', f'Level {new_role_level}') if role_config else f'Level {new_role_level}'
        
        return jsonify({
            'message': 'Member role updated successfully',
            'member': {
                'user_id': member_to_update.user_id,
                'role_level': member_to_update.role_level,
                'role_name': role_name
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating member role: {str(e)}")
        return jsonify({'error': f'Failed to update member role: {str(e)}'}), 500

def remove_team_member(team_id, user_id):
    """Remove a member from the team"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get the team
        team = Team.query.get_or_404(team_id)
        
        # Check if current user is the master guide or tactical guide
        team_member = TeamMember.query.filter_by(
            team_id=team_id,
            user_id=current_user_id
        ).first()
        
        if not team_member or team_member.role_level > 2:
            return jsonify({'error': 'Only master guides and tactical guides can remove team members'}), 403
        
        # Cannot remove the master guide
        if user_id == team.master_guide_id:
            return jsonify({'error': 'Cannot remove the master guide from the team'}), 403
        
        # Tactical guides can only remove technical and base guides
        if team_member.role_level == 2:
            member_to_remove = TeamMember.query.filter_by(
                team_id=team_id,
                user_id=user_id
            ).first_or_404()
            
            if member_to_remove.role_level <= 2:
                return jsonify({'error': 'Tactical guides can only remove technical and base guides'}), 403
        
        # Remove the member
        TeamMember.query.filter_by(team_id=team_id, user_id=user_id).delete()
        db.session.commit()
        
        return jsonify({'message': 'Team member removed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error removing team member: {str(e)}")
        return jsonify({'error': f'Failed to remove team member: {str(e)}'}), 500

def generate_invitation_code(team_id):
    """Generate a new invitation code for the team"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Get the team
        team = Team.query.get_or_404(team_id)
        
        # Check if current user is the master guide or tactical guide
        team_member = TeamMember.query.filter_by(
            team_id=team_id,
            user_id=current_user_id
        ).first()
        
        if not team_member or team_member.role_level > 2:
            return jsonify({'error': 'Only master guides and tactical guides can generate invitation codes'}), 403
        
        # Generate random code (simplistic for example)
        import random
        import string
        code = 'GD-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        # Get parameters for invitation
        max_uses = data.get('max_uses', 1)
        expires_in_days = data.get('expires_in_days', 7)
        role_level = data.get('role_level', 4)  # Default to Base Guide
        
        # Validate role level
        if not isinstance(role_level, int) or role_level < 1 or role_level > 4:
            return jsonify({'error': 'Invalid role level. Must be between 1 and 4'}), 400
        
        # Only master guide can create invitation for tactical guide
        if role_level <= 2 and team_member.role_level != 1:
            return jsonify({'error': 'Only master guides can create invitations for tactical guides or higher'}), 403
        
        # Create invitation code
        invitation = InvitationCode(
            code=code,
            role_type='guide',
            team_id=team_id,
            created_by=current_user_id,
            max_uses=max_uses,
            used_count=0,
            expires_at=datetime.utcnow() + timedelta(days=expires_in_days),
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        # Add additional data for guide role level
        invitation.metadata_ = {'role_level': role_level}
        
        db.session.add(invitation)
        db.session.commit()
        
        # Get role name for the response
        role_config = TeamRoleConfiguration.query.filter_by(team_id=team_id).first()
        role_name = getattr(role_config, f'level_{role_level}_name', f'Level {role_level}') if role_config else f'Level {role_level}'
        
        return jsonify({
            'message': 'Invitation code generated successfully',
            'invitation': {
                'code': invitation.code,
                'role_type': invitation.role_type,
                'team_id': invitation.team_id,
                'max_uses': invitation.max_uses,
                'expires_at': invitation.expires_at.isoformat(),
                'role_level': role_level,
                'role_name': role_name
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error generating invitation code: {str(e)}")
        return jsonify({'error': f'Failed to generate invitation code: {str(e)}'}), 500

def get_team_invitations(team_id):
    """Get all active invitation codes for a team"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is a member of the team
        team_member = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=team_id
        ).first()
        
        if not team_member or team_member.role_level > 2:
            return jsonify({'error': 'Only master guides and tactical guides can view invitation codes'}), 403
        
        # Get active invitations
        invitations = InvitationCode.query.filter_by(
            team_id=team_id,
            is_active=True
        ).filter(
            InvitationCode.expires_at > datetime.utcnow()
        ).all()
        
        # Get role configuration
        role_config = TeamRoleConfiguration.query.filter_by(team_id=team_id).first()
        
        # Format response
        invitations_list = []
        for invitation in invitations:
            role_level = invitation.metadata_.get('role_level', 4) if hasattr(invitation, 'metadata') and invitation.metadata_ else 4
            role_name = getattr(role_config, f'level_{role_level}_name', f'Level {role_level}') if role_config else f'Level {role_level}'
            
            creator = User.query.get(invitation.created_by)
            creator_name = f"{creator.first_name} {creator.last_name}" if creator else "Unknown"
            
            invitations_list.append({
                'code': invitation.code,
                'max_uses': invitation.max_uses,
                'used_count': invitation.used_count,
                'expires_at': invitation.expires_at.isoformat(),
                'created_at': invitation.created_at.isoformat() if invitation.created_at else None,
                'created_by': creator_name,
                'role_level': role_level,
                'role_name': role_name
            })
        
        return jsonify({'invitations': invitations_list}), 200
    except Exception as e:
        print(f"Error fetching team invitations: {str(e)}")
        return jsonify({'error': f'Failed to fetch team invitations: {str(e)}'}), 500