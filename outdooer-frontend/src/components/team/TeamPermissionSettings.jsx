// src/components/team/TeamPermissionSettings.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import permissionService from '../../services/permissionService';

/**
 * Component for managing team-specific permissions
 * 
 * @param {Object} props - Component props
 * @param {Object} props.team - Team object
 * @param {Function} props.refreshTeam - Function to refresh team data
 * @param {Function} props.setSuccessMessage - Function to set success message
 * @param {Function} props.setError - Function to set error message
 */
const TeamPermissionSettings = ({ team, refreshTeam, setSuccessMessage, setError }) => {
  const { isAdmin, user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState({});
  const [permissionCategories, setPermissionCategories] = useState([]);
  const [roleConfig, setRoleConfig] = useState({});
  
  // Check if user can manage permissions
  const canManagePermissions = isAdmin() || (team?.user_role_level === 1);
  
  // Fetch team permissions and role configurations
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!team?.team_id) return;
      
      setLoading(true);
      try {
        // Get team-specific permissions
        const teamPermissions = await permissionService.getTeamPermissions(team.team_id);
        setPermissions(teamPermissions.permissions || {});
        
        // Get role configurations
        const roleConfigs = await permissionService.getRoleConfigurations();
        setRoleConfig(roleConfigs.role_configurations || {});
        
        // Extract permission categories
        const categories = Object.keys(teamPermissions.permissions || {}).reduce((acc, key) => {
          const category = key.split('_')[0];
          if (!acc.includes(category)) {
            acc.push(category);
          }
          return acc;
        }, []);
        
        setPermissionCategories(categories);
      } catch (err) {
        console.error('Error fetching team permissions:', err);
        setError('Failed to load team permissions. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPermissions();
  }, [team?.team_id, setError]);
  
  // Group permissions by category for easier display
  const getPermissionsByCategory = (category) => {
    if (!permissions) return [];
    
    return Object.entries(permissions).filter(([key]) => 
      key.startsWith(`${category}_`)
    ).sort(([a], [b]) => a.localeCompare(b));
  };
  
  // Format permission key for display (e.g., 'create_activity' -> 'Create Activity')
  const formatPermissionName = (key) => {
    if (!key) return '';
    
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Handle permission change
  const handlePermissionChange = (permissionKey, level, value) => {
    setPermissions(prev => ({
      ...prev,
      [permissionKey]: {
        ...prev[permissionKey],
        [`level_${level}`]: value
      }
    }));
  };
  
  // Save updated permissions
  const handleSavePermissions = async () => {
    if (!canManagePermissions) {
      setError('You do not have permission to update team permissions.');
      return;
    }
    
    setSaving(true);
    try {
      await permissionService.updateTeamPermissions(team.team_id, permissions);
      
      // Clear permission cache to ensure fresh permissions are loaded
      permissionService.clearCache();
      
      setSuccessMessage('Team permissions updated successfully!');
    } catch (err) {
      console.error('Error updating team permissions:', err);
      setError(err.response?.data?.error || 'Failed to update team permissions. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Reset permissions to default
  const handleResetPermissions = async () => {
    if (!canManagePermissions) {
      setError('You do not have permission to reset team permissions.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to reset all permissions to default values? This action cannot be undone.')) {
      return;
    }
    
    setSaving(true);
    try {
      await permissionService.syncTeamPermissions(team.team_id);
      
      // Refresh permissions after reset
      const teamPermissions = await permissionService.getTeamPermissions(team.team_id);
      setPermissions(teamPermissions.permissions || {});
      
      // Clear permission cache to ensure fresh permissions are loaded
      permissionService.clearCache();
      
      setSuccessMessage('Team permissions reset to default values successfully!');
    } catch (err) {
      console.error('Error resetting team permissions:', err);
      setError(err.response?.data?.error || 'Failed to reset team permissions. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  if (!canManagePermissions) {
    return (
      <Alert variant="warning">
        <h5>Access Restricted</h5>
        <p className="mb-0">Only the Master Guide can manage team permissions.</p>
      </Alert>
    );
  }
  
  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" role="status" />
        <p className="mt-2">Loading team permissions...</p>
      </div>
    );
  }
  
  return (
    <div className="team-permissions-tab">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Team Permissions</h3>
        <div>
          <Button 
            variant="outline-secondary" 
            className="me-2" 
            onClick={handleResetPermissions}
            disabled={saving}
          >
            Reset to Defaults
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSavePermissions}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Saving...
              </>
            ) : (
              'Save Permissions'
            )}
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <p>
          Customize what each guide level can do within your team. The Master Guide always has full permissions regardless of settings.
        </p>
        <Alert variant="info">
          <i className="bi bi-info-circle-fill me-2"></i>
          Changes to permissions will take effect immediately after saving.
        </Alert>
      </div>
      
      {permissionCategories.map(category => (
        <Card key={category} className="mb-4">
          <Card.Header>
            <h4 className="mb-0 text-capitalize">{category} Permissions</h4>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table striped bordered hover className="mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Permission</th>
                    <th style={{ width: '17.5%' }}>
                      {roleConfig.level_2_name || 'Tactical Guide'} (L2)
                    </th>
                    <th style={{ width: '17.5%' }}>
                      {roleConfig.level_3_name || 'Technical Guide'} (L3)
                    </th>
                    <th style={{ width: '17.5%' }}>
                      {roleConfig.level_4_name || 'Base Guide'} (L4)
                    </th>
                    <th style={{ width: '17.5%' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {getPermissionsByCategory(category).map(([key, value]) => (
                    <tr key={key}>
                      <td>{formatPermissionName(key)}</td>
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={!!value.level_2}
                          onChange={e => handlePermissionChange(key, 2, e.target.checked)}
                          id={`perm-${key}-l2`}
                        />
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={!!value.level_3}
                          onChange={e => handlePermissionChange(key, 3, e.target.checked)}
                          id={`perm-${key}-l3`}
                        />
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={!!value.level_4}
                          onChange={e => handlePermissionChange(key, 4, e.target.checked)}
                          id={`perm-${key}-l4`}
                        />
                      </td>
                      <td>
                        <small>{value.description || 'No description available'}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      ))}
      
      <div className="d-flex justify-content-end">
        <Button 
          variant="primary" 
          onClick={handleSavePermissions}
          disabled={saving}
        >
          {saving ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" />
              Saving...
            </>
          ) : (
            'Save Permissions'
          )}
        </Button>
      </div>
    </div>
  );
};

export default TeamPermissionSettings;