// src/components/team/TeamInvitationsTab.jsx
import React, { useState } from 'react';
import api from '../../api';

const TeamInvitationsTab = ({ team, invitations, refreshTeam, setSuccessMessage, setError }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [roleLevel, setRoleLevel] = useState(4); // Default to Base Guide
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [newInvitation, setNewInvitation] = useState(null);

  // Only master guide or tactical guide can manage invitations
  const canManageInvitations = team?.user_role_level <= 2;
  
  // Only master guide can create invitation for tactical guide
  const canCreateTacticalGuideInvite = team?.user_role_level === 1;

  // Handle generating a new invitation code
  const handleGenerateInvitation = async () => {
    try {
      setIsGenerating(true);
      
      const response = await api.post(`/teams/${team.team_id}/invitations`, {
        role_level: roleLevel,
        max_uses: maxUses,
        expires_in_days: expiresInDays
      });
      
      setNewInvitation(response.data.invitation);
      setSuccessMessage('Invitation code generated successfully!');
      refreshTeam();
    } catch (error) {
      console.error('Error generating invitation code:', error);
      setError(error.response?.data?.error || 'Failed to generate invitation code');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy invitation link to clipboard
  const copyToClipboard = (code) => {
    const url = `${window.location.origin}/register?code=${code}`;
    navigator.clipboard.writeText(url);
    setSuccessMessage('Invitation link copied to clipboard!');
  };

  // Reset the invite modal
  const resetInviteModal = () => {
    setRoleLevel(4);
    setMaxUses(1);
    setExpiresInDays(7);
    setNewInvitation(null);
  };

  // Open invite modal
  const handleOpenInviteModal = () => {
    resetInviteModal();
    setShowInviteModal(true);
  };

  // Close invite modal
  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
  };

  // Get role name based on role level
  const getRoleName = (roleLevel) => {
    return team.role_config?.[`level_${roleLevel}_name`] || `Level ${roleLevel}`;
  };

  // Get remaining validity days
  const getRemainingDays = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="team-invitations-tab">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Team Invitations</h3>
        {canManageInvitations && (
          <button 
            className="btn btn-primary" 
            onClick={handleOpenInviteModal}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Generate Invitation
          </button>
        )}
      </div>

      <div className="mb-4">
        <p className="mb-0">
          Invite new guides to join your team by generating invitation codes. 
          Share these codes with potential team members so they can register as guides and join your team.
        </p>
      </div>

      {/* Active invitations table */}
      <h5 className="mb-3">Active Invitations</h5>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Invitation Code</th>
              <th>Role</th>
              <th>Usage</th>
              <th>Expires</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invitations.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-5">
                  <p className="text-muted mb-0">No active invitations</p>
                  {canManageInvitations && (
                    <button 
                      className="btn btn-sm btn-outline-primary mt-2" 
                      onClick={handleOpenInviteModal}
                    >
                      Generate an invitation
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              invitations.map(invitation => (
                <tr key={invitation.code}>
                  <td>
                    <code>{invitation.code}</code>
                  </td>
                  <td>
                    <span className={`badge bg-${
                      invitation.role_level === 1 ? 'primary' :
                      invitation.role_level === 2 ? 'info' :
                      invitation.role_level === 3 ? 'success' :
                      'secondary'
                    }`}>
                      {invitation.role_name}
                    </span>
                  </td>
                  <td>
                    <span className="used-count">{invitation.used_count} / {invitation.max_uses}</span>
                  </td>
                  <td>
                    <span className={`${getRemainingDays(invitation.expires_at) <= 2 ? 'text-danger' : ''}`}>
                      {getRemainingDays(invitation.expires_at)} days
                    </span>
                  </td>
                  <td>{invitation.created_by}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => copyToClipboard(invitation.code)}
                    >
                      <i className="bi bi-clipboard me-1"></i>
                      Copy Link
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Invitation Modal */}
      {showInviteModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {newInvitation ? 'Invitation Code Generated' : 'Generate Team Invitation'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseInviteModal}
                ></button>
              </div>
              
              {newInvitation ? (
                <div className="modal-body">
                  <div className="alert alert-success">
                    <p className="mb-1">Your invitation code has been generated:</p>
                    <div className="bg-light p-3 mt-2 text-center">
                      <code className="fs-5">{newInvitation.code}</code>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p>Share this link with your invite:</p>
                    <div className="input-group">
                      <input 
                        type="text" 
                        className="form-control" 
                        readOnly 
                        value={`${window.location.origin}/register?code=${newInvitation.code}`} 
                      />
                      <button 
                        className="btn btn-outline-primary" 
                        type="button" 
                        onClick={() => copyToClipboard(newInvitation.code)}
                      >
                        <i className="bi bi-clipboard"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="invitation-details">
                    <p className="mb-1">Invitation Details:</p>
                    <ul className="list-group">
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        Role
                        <span className="badge bg-primary">{newInvitation.role_name}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        Maximum Uses
                        <span>{newInvitation.max_uses}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        Expires
                        <span>{new Date(newInvitation.expires_at).toLocaleDateString()}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="roleLevel" className="form-label">Guide Role</label>
                    <select 
                      id="roleLevel" 
                      className="form-select"
                      value={roleLevel}
                      onChange={(e) => setRoleLevel(Number(e.target.value))}
                    >
                      {/* Only Master Guide can create invitations for Tactical Guides */}
                      {canCreateTacticalGuideInvite && (
                        <option value={2}>{getRoleName(2)}</option>
                      )}
                      <option value={3}>{getRoleName(3)}</option>
                      <option value={4}>{getRoleName(4)}</option>
                    </select>
                    <div className="form-text">
                      Select the role level for the invited guide.
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="maxUses" className="form-label">Maximum Uses</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="maxUses" 
                      min="1" 
                      max="10"
                      value={maxUses}
                      onChange={(e) => setMaxUses(Number(e.target.value))}
                    />
                    <div className="form-text">
                      How many guides can use this invitation code.
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="expiresInDays" className="form-label">Expires In (Days)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="expiresInDays" 
                      min="1" 
                      max="30"
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    />
                    <div className="form-text">
                      Number of days before this invitation expires.
                    </div>
                  </div>
                </div>
              )}
              
              <div className="modal-footer">
                {newInvitation ? (
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleCloseInviteModal}
                  >
                    Done
                  </button>
                ) : (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleCloseInviteModal}
                      disabled={isGenerating}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handleGenerateInvitation}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Generating...
                        </>
                      ) : (
                        'Generate Invitation'
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamInvitationsTab;