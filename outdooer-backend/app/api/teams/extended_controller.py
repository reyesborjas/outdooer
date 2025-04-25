# app/api/teams/extended_controllers.py
from flask import jsonify, request
from app import db
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.team_role_configuration import TeamRoleConfiguration
from app.models.user import User
from app.models.audit_log import TeamSettingsAuditLog  # Nueva tabla para historial
from flask_jwt_extended import get_jwt_identity
from datetime import datetime

def get_team_role_config(team_id):
    """Get team role configuration with finer permission controls"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is a member of the team
        team_member = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=team_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'You are not a member of this team'}), 403
        
        # Allow viewing for Master Guide and Tactical Guide
        if team_member.role_level > 2:
            return jsonify({'error': 'Only Master Guides and Tactical Guides can view team role configurations'}), 403
            
        # Get role configuration
        role_config = TeamRoleConfiguration.query.filter_by(team_id=team_id).first()
        if not role_config:
            role_config = TeamRoleConfiguration(
                team_id=team_id,
                level_1_name='Master Guide',
                level_2_name='Tactical Guide',
                level_3_name='Technical Guide',
                level_4_name='Base Guide',
                updated_at=datetime.utcnow()
            )
            db.session.add(role_config)
            db.session.commit()
            
        # Get recent audit history (only for Master Guide and Tactical Guide)
        audit_logs = []
        if team_member.role_level <= 2:
            audit_logs = TeamSettingsAuditLog.query.filter_by(
                team_id=team_id
            ).order_by(
                TeamSettingsAuditLog.created_at.desc()
            ).limit(10).all()
            
            # Format audit logs
            audit_logs = [{
                'id': log.log_id,
                'user_name': f"{log.user.first_name} {log.user.last_name}" if log.user else "Unknown",
                'user_role': "Master Guide" if log.user_role_level == 1 else "Tactical Guide",
                'change_date': log.created_at.isoformat(),
                'setting_changed': log.setting_type,
                'old_value': log.old_value,
                'new_value': log.new_value
            } for log in audit_logs]
            
        # Get role usage statistics
        role_counts = {}
        for level in range(1, 5):
            role_counts[f'level_{level}_count'] = TeamMember.query.filter_by(
                team_id=team_id, 
                role_level=level
            ).count()
            
        return jsonify({
            'role_config': {
                'level_1_name': role_config.level_1_name,
                'level_2_name': role_config.level_2_name,
                'level_3_name': role_config.level_3_name,
                'level_4_name': role_config.level_4_name,
                'updated_at': role_config.updated_at.isoformat() if role_config.updated_at else None
            },
            'permissions': {
                'can_edit': team_member.role_level == 1,
                'can_view': team_member.role_level <= 2
            },
            'role_counts': role_counts,
            'audit_logs': audit_logs
        }), 200
    except Exception as e:
        print(f"Error fetching role configuration: {str(e)}")
        return jsonify({'error': f'Failed to fetch role configuration: {str(e)}'}), 500

def update_team_role_config_with_audit(team_id):
    """Update team role configuration with audit trail"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Get the team
        team = Team.query.get_or_404(team_id)
        
        # Check if user is the master guide
        team_member = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=team_id
        ).first()
        
        if not team_member or team_member.role_level != 1:
            return jsonify({'error': 'Only the master guide can update role configuration'}), 403
        
        # Input validation for role names
        for level in range(1, 5):
            key = f'level_{level}_name'
            if key in data:
                # Check if empty
                if not data[key].strip():
                    return jsonify({'error': f'Role name for level {level} cannot be empty'}), 400
                # Check min length
                if len(data[key]) < 3:
                    return jsonify({'error': f'Role name for level {level} must be at least 3 characters'}), 400
                # Check max length
                if len(data[key]) > 30:
                    return jsonify({'error': f'Role name for level {level} cannot exceed 30 characters'}), 400
        
        # Get or create role configuration
        role_config = TeamRoleConfiguration.query.filter_by(team_id=team_id).first()
        if not role_config:
            role_config = TeamRoleConfiguration(team_id=team_id)
            db.session.add(role_config)
        
        # Create audit logs for each changed role name
        for level in range(1, 5):
            key = f'level_{level}_name'
            if key in data and getattr(role_config, key) != data[key]:
                old_value = getattr(role_config, key)
                new_value = data[key]
                
                # Create audit log
                audit_log = TeamSettingsAuditLog(
                    team_id=team_id,
                    user_id=current_user_id,
                    user_role_level=team_member.role_level,
                    setting_type=f"Role Level {level} Name",
                    old_value=old_value,
                    new_value=new_value,
                    created_at=datetime.utcnow()
                )
                db.session.add(audit_log)
                
                # Update role name
                setattr(role_config, key, data[key])
        
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

def get_team_settings_with_permissions(team_id):
    """Get comprehensive team settings with appropriate permissions"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is a member of the team
        team_member = TeamMember.query.filter_by(
            user_id=current_user_id,
            team_id=team_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'You are not a member of this team'}), 403
        
        # Base permission level - Technical guides can see basic team settings
        if team_member.role_level > 3:
            return jsonify({'error': 'Insufficient permissions to view team settings'}), 403
            
        # Get team details
        team = Team.query.get_or_404(team_id)
        
        # Permission levels
        permissions = {
            'view_role_config': team_member.role_level <= 2,
            'edit_role_config': team_member.role_level == 1,
            'view_audit_logs': team_member.role_level <= 2,
            'manage_team_status': team_member.role_level == 1,
            'delete_team': team_member.role_level == 1,
            'view_team_metrics': team_member.role_level <= 3,
            'view_revenue_settings': team_member.role_level <= 2,
            'edit_revenue_settings': team_member.role_level == 1,
        }
        
        # Basic team settings visible to all authorized roles
        response = {
            'team_id': team.team_id,
            'team_name': team.team_name,
            'team_status': team.team_status,
            'master_guide_id': team.master_guide_id,
            'created_at': team.created_at.isoformat() if team.created_at else None,
            'updated_at': team.updated_at.isoformat() if team.updated_at else None,
            'permissions': permissions,
            'user_role_level': team_member.role_level
        }
        
        # Add role configuration if user has permission
        if permissions['view_role_config']:
            role_config = TeamRoleConfiguration.query.filter_by(team_id=team_id).first()
            if role_config:
                response['role_config'] = {
                    'level_1_name': role_config.level_1_name,
                    'level_2_name': role_config.level_2_name,
                    'level_3_name': role_config.level_3_name,
                    'level_4_name': role_config.level_4_name,
                    'updated_at': role_config.updated_at.isoformat() if role_config.updated_at else None
                }
        
        # Add audit logs if user has permission
        if permissions['view_audit_logs']:
            audit_logs = TeamSettingsAuditLog.query.filter_by(
                team_id=team_id
            ).order_by(
                TeamSettingsAuditLog.created_at.desc()
            ).limit(20).all()
            
            response['audit_logs'] = [{
                'id': log.log_id,
                'user_name': f"{log.user.first_name} {log.user.last_name}" if log.user else "Unknown",
                'user_role': "Master Guide" if log.user_role_level == 1 else 
                             "Tactical Guide" if log.user_role_level == 2 else
                             "Technical Guide" if log.user_role_level == 3 else "Base Guide",
                'change_date': log.created_at.isoformat(),
                'setting_changed': log.setting_type,
                'old_value': log.old_value,
                'new_value': log.new_value
            } for log in audit_logs]
        
        # Add team metrics if user has permission
        if permissions['view_team_metrics']:
            # Count members by role level
            role_counts = {}
            for level in range(1, 5):
                role_counts[f'level_{level}_count'] = TeamMember.query.filter_by(
                    team_id=team_id, 
                    role_level=level
                ).count()
            
            # Add activity and expedition counts
            from app.models.activity import Activity
            from app.models.expedition import Expedition
            
            activities_count = Activity.query.filter_by(team_id=team_id).count()
            expeditions_count = Expedition.query.filter_by(team_id=team_id).count()
            
            response['metrics'] = {
                'member_counts': role_counts,
                'total_members': sum(role_counts.values()),
                'activities_count': activities_count,
                'expeditions_count': expeditions_count
            }
        
        # Add revenue settings if user has permission
        if permissions['view_revenue_settings']:
            from app.models.team import TeamRevenueSharing
            
            revenue_settings = {}
            for level in range(1, 5):
                revenue_sharing = TeamRevenueSharing.query.filter_by(
                    team_id=team_id,
                    role_level=level
                ).first()
                
                if revenue_sharing:
                    revenue_settings[f'level_{level}_percentage'] = float(revenue_sharing.percentage)
            
            response['revenue_settings'] = revenue_settings
                
        return jsonify(response), 200
    except Exception as e:
        print(f"Error fetching team settings: {str(e)}")
        return jsonify({'error': f'Failed to fetch team settings: {str(e)}'}), 500

