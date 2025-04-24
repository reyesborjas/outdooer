// src/components/team/TeamMembersTab.jsx
import React, { useState } from 'react';
import api from '../../api';

const TeamMembersTab = ({ team, members, refreshTeam, setSuccessMessage, setError }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleLevel, setNewRoleLevel] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Only master guide or tactical guide can manage members
  const canManageMembers = team?.user_role_level <= 2;
  // Only master guide can change tactical guide roles
  const canManageTacticalGuides = team?.user_role_level === 1;

  // Open role change modal
  const handleOpenRoleModal = (member) => {
    setSelectedMember(member);
    setNewRoleLevel(member.role_level);
    setShowRoleModal(true);
  };

  // Open remove member modal
  const handleOpenRemoveModal = (member) => {
    setSelectedMember(member);
    setShowRemoveModal(true);
  };

  // Close all modals
  const handleCloseModals = () => {
    setShowRoleModal(false);
    setShowRemoveModal(false);
    setSelectedMember(null);
    setNewRoleLevel(null);
  };

  // Update member role
  const handleUpdateRole = async () => {
    if (!selectedMember || !newRoleLevel) return;

    try {
      setIsSubmitting(true);
      
      await api.put(`/api/teams/${team.team_id}/members/${selectedMember.user_id}/role`, {
        role_level: newRoleLevel
      });
      
      setSuccessMessage('Member role updated successfully!');
      handleCloseModals();
      refreshTeam();
    } catch (error) {
      console.error('Error updating member role:', error);
      setError(error.response?.data?.error || 'Failed to update member role');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove member from team
  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      setIsSubmitting(true);
      
      await api.delete(`/api/teams/${team.team_id}/members/${selectedMember.user_id}`);
      
      setSuccessMessage('Member removed from team successfully!');
      handleCloseModals();
      refreshTeam();
    } catch (error) {
      console.error('Error removing member:', error);
      setError(error.response?.data?.error || 'Failed to remove member from team');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || member.email.toLowerCase().includes(query);
  });

  // Get role name based on role level
  const getRoleName = (roleLevel) => {
    return team.role_config?.[`level_${roleLevel}_name`] || `Level ${roleLevel}`;
  };

  // Check if user can manage this particular member
  const canManageMember = (member) => {
    // Master guide can manage everyone except themselves
    if (team.user_role_level === 1) {
      return member.role_level !== 1 || team.master_guide_id !== member.user_id;
    }
    
    // Tactical guide can only manage technical and base guides
    if (team.user_role_level === 2) {
      return member.role_level > 2;
    }
    
    return false;
  };

  return (
    <div className="team-members-tab">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Team Members</h3>
        <div className="search-container">
          <input
            type="text"
            className="form-control"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Members list */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Email</th>
              <th>Joined</th>
              {canManageMembers && <th className="text-end">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={canManageMembers ? 5 : 4} className="text-center py-5">
                  <p className="text-muted mb-0">No members found</p>
                </td>
              </tr>
            ) : (
              filteredMembers.map(member => (
                <tr key={member.user_id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="avatar-circle me-2">
                        {member.profile_image_url ? (
                          <img 
                            src={member.profile_image_url} 
                            alt={`${member.first_name} ${member.last_name}`} 
                            className="rounded-circle"
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="avatar-placeholder rounded-circle d-flex align-items-center justify-content-center"
                               style={{ width: '40px', height: '40px', backgroundColor: '#e9ecef' }}>
                            {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="fw-500">{member.first_name} {member.last_name}</div>
                        {member.is_master_guide && (
                          <span className="badge bg-primary">Master Guide</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge bg-${
                      member.role_level === 1 ? 'primary' :
                      member.role_level === 2 ? 'info' :
                      member.role_level === 3 ? 'success' :
                      'secondary'
                    }`}>
                      {member.role_name}
                    </span>
                  </td>
                  <td>{member.email}</td>
                  <td>{new Date(member.joined_at).toLocaleDateString()}</td>
                  {canManageMembers && (
                    <td className="text-end">
                      {canManageMember(member) && (
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenRoleModal(member)}
                            disabled={
                              // Master guide role can only be assigned to the current master guide
                              member.role_level === 1 || 
                              // Tactical guides can only be managed by master guide
                              (member.role_level === 2 && team.user_role_level !== 1)
                            }
                          >
                            Change Role
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleOpenRemoveModal(member)}
                            disabled={
                              // Can't remove master guide
                              member.role_level === 1 || 
                              // Tactical guides can only be managed by master guide
                              (member.role_level === 2 && team.user_role_level !== 1)
                            }
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Change Role Modal */}
      {showRoleModal && selectedMember && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Member Role</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseModals}
                ></button>
              </div>
              <div className="modal-body">
                <p>Change role for <strong>{selectedMember.first_name} {selectedMember.last_name}</strong></p>
                <div className="mb-3">
                  <label htmlFor="roleLevel" className="form-label">Role</label>
                  <select 
                    id="roleLevel" 
                    className="form-select"
                    value={newRoleLevel}
                    onChange={(e) => setNewRoleLevel(Number(e.target.value))}
                  >
                    {/* Only Master Guide can become/remain Master Guide */}
                    {(canManageTacticalGuides && team.master_guide_id === selectedMember.user_id) && (
                      <option value={1}>{getRoleName(1)}</option>
                    )}
                    {/* Only Master Guide can assign Tactical Guide */}
                    {canManageTacticalGuides && (
                      <option value={2}>{getRoleName(2)}</option>
                    )}
                    <option value={3}>{getRoleName(3)}</option>
                    <option value={4}>{getRoleName(4)}</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCloseModals}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleUpdateRole}
                  disabled={isSubmitting || newRoleLevel === selectedMember.role_level}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Role'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {showRemoveModal && selectedMember && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Remove Team Member</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseModals}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to remove <strong>{selectedMember.first_name} {selectedMember.last_name}</strong> from the team?</p>
                <p className="text-danger">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCloseModals}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleRemoveMember}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Removing...
                    </>
                  ) : (
                    'Remove Member'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembersTab;