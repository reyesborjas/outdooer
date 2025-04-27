// src/components/team/TeamSettingsTab.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, 
  Form, 
  Button, 
  Alert, 
  Spinner, 
  Tabs, 
  Tab,
  Modal
} from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api';
import TeamPermissionSettings from './TeamPermissionSettings';
import PermissionGate from '../common/PermissionGate';

const MAX_ROLE_NAME_LENGTH = 30;
const MIN_ROLE_NAME_LENGTH = 3;

const TeamSettingsTab = ({ team, refreshTeam, setSuccessMessage, setError }) => {
  const { isAdmin } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('roles');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleConfig, setRoleConfig] = useState({
    level_1_name: team.role_config?.level_1_name || 'Master Guide',
    level_2_name: team.role_config?.level_2_name || 'Tactical Guide',
    level_3_name: team.role_config?.level_3_name || 'Technical Guide',
    level_4_name: team.role_config?.level_4_name || 'Base Guide'
  });
  const [roleNameErrors, setRoleNameErrors] = useState({
    level_1_name: '',
    level_2_name: '',
    level_3_name: '',
    level_4_name: ''
  });
  const [roleNameWarnings, setRoleNameWarnings] = useState([]);
  const [teamStatus, setTeamStatus] = useState(team.team_status || 'active');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [changeHistory, setChangeHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Check authorization through the role level
  const isMasterGuide = isAdmin() || team?.user_role_level === 1;
  const isViewOnly = !isMasterGuide;
  
  // Validate role names for similarity
  useEffect(() => {
    const warnings = [];
    const roleNames = [
      roleConfig.level_1_name.toLowerCase(),
      roleConfig.level_2_name.toLowerCase(),
      roleConfig.level_3_name.toLowerCase(),
      roleConfig.level_4_name.toLowerCase()
    ];

    // Check for very similar names (simple check for now)
    for (let i = 0; i < roleNames.length; i++) {
      for (let j = i + 1; j < roleNames.length; j++) {
        if (roleNames[i] === roleNames[j]) {
          warnings.push(`Role names for Level ${i + 1} and Level ${j + 1} are identical.`);
        } else if (roleNames[i].includes(roleNames[j]) || roleNames[j].includes(roleNames[i])) {
          warnings.push(`Role names for Level ${i + 1} and Level ${j + 1} are very similar.`);
        }
      }
    }

    setRoleNameWarnings(warnings);
  }, [roleConfig]);
  
  // Fetch change history
  useEffect(() => {
    const fetchChangeHistory = async () => {
      try {
        // This would be an actual API call in production
        // For now, we'll use mock data
        const mockHistory = [
          {
            id: 1,
            user_name: 'John Doe',
            change_date: '2025-04-20T14:30:00Z',
            setting_changed: 'Role Names',
            old_value: 'Trail Leader',
            new_value: 'Technical Guide',
            user_role: 'Master Guide'
          },
          {
            id: 2,
            user_name: 'Jane Smith',
            change_date: '2025-04-18T09:15:00Z',
            setting_changed: 'Team Status',
            old_value: 'inactive',
            new_value: 'active',
            user_role: 'Master Guide'
          }
        ];
        setChangeHistory(mockHistory);
      } catch (error) {
        console.error('Error fetching change history:', error);
      }
    };

    if (showHistory) {
      fetchChangeHistory();
    }
  }, [showHistory]);
  
  // Handle role name changes
  const handleRoleNameChange = (level, value) => {
    setRoleConfig({
      ...roleConfig,
      [`level_${level}_name`]: value
    });
    
    validateRoleName(level, value);
  };
  
  // Validate role name
  const validateRoleName = (level, value) => {
    const errors = { ...roleNameErrors };
    
    if (!value.trim()) {
      errors[`level_${level}_name`] = 'Role name cannot be empty';
    } else if (value.length < MIN_ROLE_NAME_LENGTH) {
      errors[`level_${level}_name`] = `Role name must be at least ${MIN_ROLE_NAME_LENGTH} characters`;
    } else if (value.length > MAX_ROLE_NAME_LENGTH) {
      errors[`level_${level}_name`] = `Role name cannot exceed ${MAX_ROLE_NAME_LENGTH} characters`;
    } else {
      errors[`level_${level}_name`] = '';
    }
    
    setRoleNameErrors(errors);
  };
  
  // Check if form is valid
  const isFormValid = () => {
    // Check for any validation errors
    const hasErrors = Object.values(roleNameErrors).some(error => error !== '');
    // Check if all role names are filled
    const allFilled = Object.values(roleConfig).every(name => name.trim() !== '');
    
    return !hasErrors && allFilled;
  };

  // Update role configurations
  const handleUpdateRoleConfig = async () => {
    if (!isFormValid()) {
      setError('Please fix the validation errors before saving.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await api.put(`/teams/${team.team_id}/role-config`, roleConfig);
      
      // Clear any existing errors
      setError(null);
      
      // Show success message with icon
      setSuccessMessage(
        <>
          <i className="bi bi-check-circle-fill text-success me-2"></i>
          Team role configuration updated successfully!
        </>
      );
      
      refreshTeam();
    } catch (err) {
      console.error('Error updating role configuration:', err);
      setError(
        <>
          <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
          {err.response?.data?.error || 'Failed to update role configuration'}
        </>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update team status
  const handleUpdateTeamStatus = async (status) => {
    try {
      setIsSubmitting(true);
      
      await api.put(`/teams/${team.team_id}`, {
        team_status: status
      });
      
      setSuccessMessage(
        <>
          <i className="bi bi-check-circle-fill text-success me-2"></i>
          Team {status === 'active' ? 'activated' : 'deactivated'} successfully!
        </>
      );
      
      setTeamStatus(status);
      setShowDeactivateModal(false);
      refreshTeam();
    } catch (err) {
      console.error('Error updating team status:', err);
      setError(
        <>
          <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
          {err.response?.data?.error || 'Failed to update team status'}
        </>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete team (soft delete)
  const handleDeleteTeam = async () => {
    try {
      setIsSubmitting(true);
      
      await api.delete(`/teams/${team.team_id}`);
      
      setSuccessMessage(
        <>
          <i className="bi bi-check-circle-fill text-success me-2"></i>
          Team deleted successfully!
        </>
      );
      
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Error deleting team:', err);
      setError(
        <>
          <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
          {err.response?.data?.error || 'Failed to delete team'}
        </>
      );
      setIsSubmitting(false);
    }
  };

  if (!isMasterGuide) {
    return (
      <Alert variant="warning">
        <h5>Access Restricted</h5>
        <p className="mb-0">Only the Master Guide can access team settings.</p>
      </Alert>
    );
  }

  return (
    <div className="team-settings-container">
      <Tabs
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key)}
        className="mb-4"
      >
        <Tab eventKey="roles" title="Role Names">
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Role Names</h5>
              <Button 
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                <i className={`bi bi-${showHistory ? 'eye-slash' : 'clock-history'} me-1`}></i>
                {showHistory ? 'Hide History' : 'View History'}
              </Button>
            </Card.Header>
            <Card.Body>
              {showHistory && (
                <div className="mb-4">
                  <h6 className="mb-3">Change History</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Changed By</th>
                          <th>Date</th>
                          <th>Setting</th>
                          <th>Old Value</th>
                          <th>New Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {changeHistory.length > 0 ? (
                          changeHistory.map(entry => (
                            <tr key={entry.id}>
                              <td>{entry.user_name} <small>({entry.user_role})</small></td>
                              <td>{new Date(entry.change_date).toLocaleString()}</td>
                              <td>{entry.setting_changed}</td>
                              <td>{entry.old_value}</td>
                              <td>{entry.new_value}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">No change history available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <p className="text-muted mb-3">
                Customize the names of guide roles for your team. These names will be displayed throughout the platform.
              </p>
              
              {roleNameWarnings.length > 0 && (
                <Alert variant="warning" className="mb-3">
                  <h6 className="alert-heading">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Warning
                  </h6>
                  <ul className="mb-0">
                    {roleNameWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </Alert>
              )}
              
              <div className="mb-3">
                <Form.Label htmlFor="level1Name">Level 1 (Master Guide)</Form.Label>
                <Form.Control
                  type="text"
                  id="level1Name"
                  value={roleConfig.level_1_name}
                  onChange={(e) => handleRoleNameChange(1, e.target.value)}
                  isInvalid={!!roleNameErrors.level_1_name}
                  maxLength={MAX_ROLE_NAME_LENGTH}
                />
                <Form.Control.Feedback type="invalid">
                  {roleNameErrors.level_1_name}
                </Form.Control.Feedback>
                <Form.Text className="d-flex justify-content-between">
                  <span>The team owner and highest authority level.</span>
                  <span className={roleConfig.level_1_name.length > MAX_ROLE_NAME_LENGTH - 10 ? 'text-danger' : ''}>
                    {roleConfig.level_1_name.length}/{MAX_ROLE_NAME_LENGTH}
                  </span>
                </Form.Text>
              </div>
              
              <div className="mb-3">
                <Form.Label htmlFor="level2Name">Level 2 (Tactical Guide)</Form.Label>
                <Form.Control
                  type="text"
                  id="level2Name"
                  value={roleConfig.level_2_name}
                  onChange={(e) => handleRoleNameChange(2, e.target.value)}
                  isInvalid={!!roleNameErrors.level_2_name}
                  maxLength={MAX_ROLE_NAME_LENGTH}
                />
                <Form.Control.Feedback type="invalid">
                  {roleNameErrors.level_2_name}
                </Form.Control.Feedback>
                <Form.Text className="d-flex justify-content-between">
                  <span>Can help manage the team and create activities/expeditions.</span>
                  <span className={roleConfig.level_2_name.length > MAX_ROLE_NAME_LENGTH - 10 ? 'text-danger' : ''}>
                    {roleConfig.level_2_name.length}/{MAX_ROLE_NAME_LENGTH}
                  </span>
                </Form.Text>
              </div>
              
              <div className="mb-3">
                <Form.Label htmlFor="level3Name">Level 3 (Technical Guide)</Form.Label>
                <Form.Control
                  type="text"
                  id="level3Name"
                  value={roleConfig.level_3_name}
                  onChange={(e) => handleRoleNameChange(3, e.target.value)}
                  isInvalid={!!roleNameErrors.level_3_name}
                  maxLength={MAX_ROLE_NAME_LENGTH}
                />
                <Form.Control.Feedback type="invalid">
                  {roleNameErrors.level_3_name}
                </Form.Control.Feedback>
                <Form.Text className="d-flex justify-content-between">
                  <span>Can create and lead activities.</span>
                  <span className={roleConfig.level_3_name.length > MAX_ROLE_NAME_LENGTH - 10 ? 'text-danger' : ''}>
                    {roleConfig.level_3_name.length}/{MAX_ROLE_NAME_LENGTH}
                  </span>
                </Form.Text>
              </div>
              
              <div className="mb-3">
                <Form.Label htmlFor="level4Name">Level 4 (Base Guide)</Form.Label>
                <Form.Control
                  type="text"
                  id="level4Name"
                  value={roleConfig.level_4_name}
                  onChange={(e) => handleRoleNameChange(4, e.target.value)}
                  isInvalid={!!roleNameErrors.level_4_name}
                  maxLength={MAX_ROLE_NAME_LENGTH}
                />
                <Form.Control.Feedback type="invalid">
                  {roleNameErrors.level_4_name}
                </Form.Control.Feedback>
                <Form.Text className="d-flex justify-content-between">
                  <span>Basic guide with limited permissions.</span>
                  <span className={roleConfig.level_4_name.length > MAX_ROLE_NAME_LENGTH - 10 ? 'text-danger' : ''}>
                    {roleConfig.level_4_name.length}/{MAX_ROLE_NAME_LENGTH}
                  </span>
                </Form.Text>
              </div>
              
              <Button
                variant="primary"
                onClick={handleUpdateRoleConfig}
                disabled={isSubmitting || !isFormValid()}
              >
                {isSubmitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2"></i>
                    Save Role Names
                  </>
                )}
              </Button>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="status" title="Team Status">
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Team Status</h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-3">
                Current Status: 
                <span className={`badge ms-2 ${teamStatus === 'active' ? 'bg-success' : 'bg-danger'}`}>
                  <i className={`bi bi-${teamStatus === 'active' ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                  {teamStatus === 'active' ? 'Active' : 'Inactive'}
                </span>
              </p>
              
              <p className="text-muted">
                {teamStatus === 'active' 
                  ? 'Your team is currently active. Team members can view and join activities and expeditions.'
                  : 'Your team is currently inactive. Activities and expeditions will not be visible to explorers.'}
              </p>
              
              {teamStatus === 'active' ? (
                <Button
                  variant="warning"
                  onClick={() => setShowDeactivateModal(true)}
                >
                  <i className="bi bi-pause-circle me-2"></i>
                  Deactivate Team
                </Button>
              ) : (
                <Button
                  variant="success"
                  onClick={() => handleUpdateTeamStatus('active')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-play-circle me-2"></i>
                      Activate Team
                    </>
                  )}
                </Button>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="permissions" title="Permissions">
          <TeamPermissionSettings 
            team={team}
            refreshTeam={refreshTeam}
            setSuccessMessage={setSuccessMessage}
            setError={setError}
          />
        </Tab>
        
        <Tab eventKey="danger" title="Danger Zone">
          <Card className="border-danger">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Danger Zone
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="text-danger fw-bold">Warning: These actions cannot be undone!</p>
              
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Delete Team</h6>
                  <p className="text-muted mb-0">
                    Permanently delete this team and all associated data. All activities and expeditions will be removed.
                  </p>
                </div>
                <Button
                  variant="outline-danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <i className="bi bi-trash3 me-2"></i>
                  Delete Team
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      
      {/* Deactivate Team Modal */}
      <Modal show={showDeactivateModal} onHide={() => setShowDeactivateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pause-circle me-2"></i>
            Deactivate Team
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <i className="bi bi-info-circle-fill me-2"></i>
            Are you sure you want to deactivate your team?
          </Alert>
          <p>While deactivated:</p>
          <ul>
            <li>Your team's activities and expeditions will be hidden from explorers</li>
            <li>Team members will still have access to the team dashboard</li>
            <li>You can reactivate the team at any time</li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary"
            onClick={() => setShowDeactivateModal(false)}
            disabled={isSubmitting}
          >
            <i className="bi bi-x-circle me-2"></i>
            Cancel
          </Button>
          <Button 
            variant="warning"
            onClick={() => handleUpdateTeamStatus('inactive')}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deactivating...
              </>
            ) : (
              <>
                <i className="bi bi-pause-circle me-2"></i>
                Deactivate Team
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Delete Team Modal */}
      <Modal show={showDeleteModal} onHide={() => {
        setShowDeleteModal(false);
        setConfirmDelete('');
      }}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-trash3 me-2"></i>
            Delete Team
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            This action is irreversible! Deleting your team will permanently remove all associated data including activities, expeditions, and team members.
          </Alert>
          <p>Please type <strong>DELETE</strong> in the box below to confirm:</p>
          <Form.Control 
            type="text" 
            value={confirmDelete} 
            onChange={(e) => setConfirmDelete(e.target.value)} 
            placeholder="Type DELETE to confirm" 
            isInvalid={confirmDelete && confirmDelete !== 'DELETE'}
          />
          <Form.Control.Feedback type="invalid">
            You must type DELETE exactly to confirm.
          </Form.Control.Feedback>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowDeleteModal(false);
              setConfirmDelete('');
            }}
            disabled={isSubmitting}
          >
            <i className="bi bi-x-circle me-2"></i>
            Cancel
          </Button>
          <Button 
            variant="danger"
            onClick={handleDeleteTeam}
            disabled={confirmDelete !== 'DELETE' || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <i className="bi bi-trash3-fill me-2"></i>
                Confirm Delete
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TeamSettingsTab;
