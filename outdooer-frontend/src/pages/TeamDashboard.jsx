// src/pages/TeamDashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Alert, 
  Spinner, 
  ListGroup, 
  Badge,
  Tab,
  Tabs
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { FaUserPlus, FaCalendarPlus, FaMountain } from 'react-icons/fa';
import '../styles/TeamDashboard.css';

// New Team Dashboard component for Master Guides who just registered
const TeamDashboard = () => {
  const { teamId } = useParams();
  const { user, isAuthenticated, isMasterGuide } = useContext(AuthContext);
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [expeditions, setExpeditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitationCode, setInvitationCode] = useState(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Check if user is authenticated and is the master guide
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!isMasterGuide()) {
      navigate('/unauthorized');
      return;
    }
  }, [isAuthenticated, isMasterGuide, navigate]);

  // Fetch team data
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get team ID from URL or user data if not provided
        const currentTeamId = teamId || user?.teams?.find(t => t.is_master_guide)?.team_id;

        if (!currentTeamId) {
          setError("No team found. Please contact support.");
          setLoading(false);
          return;
        }

        // Fetch team details, members, activities, expeditions
        const [teamResponse, membersResponse, activitiesResponse, expeditionsResponse] = await Promise.all([
          api.get(`/teams/${currentTeamId}`),
          api.get(`/teams/${currentTeamId}/members`),
          api.get(`/activities/team/${currentTeamId}`),
          api.get(`/expeditions/team/${currentTeamId}`)
        ]);

        setTeam(teamResponse.data.team || teamResponse.data);
        setTeamMembers(membersResponse.data.members || []);
        setActivities(activitiesResponse.data.activities || []);
        setExpeditions(expeditionsResponse.data.expeditions || []);
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Failed to load team data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchTeamData();
    }
  }, [isAuthenticated, user, teamId]);

  // Generate new invitation code
  const handleGenerateInvitationCode = async () => {
    try {
      setGeneratingCode(true);
      setError(null);

      const response = await api.post('/invitations/generate', {
        role_type: 'guide',
        team_id: team.team_id,
        max_uses: 1,
        expires_in_days: 7
      });

      setInvitationCode(response.data.code);
      setSuccessMessage('New invitation code generated successfully!');

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Error generating invitation code:', err);
      setError('Failed to generate invitation code. Please try again.');
    } finally {
      setGeneratingCode(false);
    }
  };

  // Copy code to clipboard
  const copyCodeToClipboard = () => {
    if (invitationCode) {
      const shareUrl = `${window.location.origin}/register?code=${invitationCode}`;
      navigator.clipboard.writeText(shareUrl);
      setSuccessMessage('Invitation link copied to clipboard!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading team dashboard...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={() => navigate('/dashboard')} variant="primary">
          Return to Dashboard
        </Button>
      </Container>
    );
  }

  if (!team) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Team not found or you don't have access.</Alert>
        <Button onClick={() => navigate('/dashboard')} variant="primary">
          Return to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4 team-dashboard">
      <Row className="mb-4">
        <Col>
          <h1>{team.team_name}</h1>
          <p className="text-muted">
            Master Guide: {user.first_name} {user.last_name}
          </p>
        </Col>
        <Col xs="auto" className="d-flex align-items-center">
          {successMessage && (
            <Alert 
              variant="success" 
              className="me-3 mb-0 py-2"
              onClose={() => setSuccessMessage(null)} 
              dismissible
            >
              {successMessage}
            </Alert>
          )}
          <Button 
            variant="primary" 
            onClick={handleGenerateInvitationCode}
            disabled={generatingCode}
          >
            {generatingCode ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Generating...
              </>
            ) : (
              <>
                <FaUserPlus className="me-2" />
                Invite Guide
              </>
            )}
          </Button>
        </Col>
      </Row>

      {/* Invitation Code Display */}
      {invitationCode && (
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col>
                <h5 className="mb-0">Guide Invitation Code</h5>
                <p className="text-muted mb-0">
                  Share this code with guides you want to invite to your team
                </p>
              </Col>
              <Col md={4} className="text-center">
                <div className="bg-light p-2 rounded border">
                  <code className="fw-bold">{invitationCode}</code>
                </div>
              </Col>
              <Col md="auto">
                <Button variant="outline-primary" onClick={copyCodeToClipboard}>
                  Copy Invite Link
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <Tabs defaultActiveKey="members" id="team-dashboard-tabs" className="mb-4">
        <Tab eventKey="members" title="Team Members">
          <Card>
            <Card.Body>
              <h4 className="mb-3">Team Members ({teamMembers.length})</h4>
              {teamMembers.length === 0 ? (
                <Alert variant="info">
                  No team members yet. Use the "Invite Guide" button to add guides to your team.
                </Alert>
              ) : (
                <ListGroup>
                  {teamMembers.map(member => (
                    <ListGroup.Item 
                      key={member.user_id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <h6 className="mb-0">{member.first_name} {member.last_name}</h6>
                        <small className="text-muted">
                          {member.role_level === 1 ? 'Master Guide' :
                           member.role_level === 2 ? 'Tactical Guide' :
                           member.role_level === 3 ? 'Technical Guide' :
                           'Base Guide'}
                        </small>
                      </div>
                      <Badge bg={
                        member.role_level === 1 ? 'primary' :
                        member.role_level === 2 ? 'info' :
                        member.role_level === 3 ? 'success' :
                        'secondary'
                      }>
                        Level {member.role_level}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="activities" title="Activities">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Team Activities ({activities.length})</h4>
                <Button 
                  variant="success" 
                  size="sm"
                  onClick={() => navigate('/create-activity')}
                >
                  <FaMountain className="me-2" />
                  Create Activity
                </Button>
              </div>
              
              {activities.length === 0 ? (
                <Alert variant="info">
                  No activities created yet. Use the "Create Activity" button to add activities.
                </Alert>
              ) : (
                <ListGroup>
                  {activities.map(activity => (
                    <ListGroup.Item 
                      key={activity.activity_id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <h6 className="mb-0">{activity.title}</h6>
                        <small className="text-muted">
                          {activity.location_name} | ${activity.price}
                        </small>
                      </div>
                      <div>
                        <Badge bg={
                          activity.difficulty_level === 'easy' ? 'success' :
                          activity.difficulty_level === 'moderate' ? 'warning' :
                          'danger'
                        } className="me-2">
                          {activity.difficulty_level}
                        </Badge>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => navigate(`/activities/${activity.activity_id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="expeditions" title="Expeditions">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Team Expeditions ({expeditions.length})</h4>
                <Button 
                  variant="success" 
                  size="sm"
                  onClick={() => navigate('/create-expedition')}
                >
                  <FaCalendarPlus className="me-2" />
                  Create Expedition
                </Button>
              </div>
              
              {expeditions.length === 0 ? (
                <Alert variant="info">
                  No expeditions created yet. Use the "Create Expedition" button to plan your first expedition.
                </Alert>
              ) : (
                <ListGroup>
                  {expeditions.map(expedition => (
                    <ListGroup.Item 
                      key={expedition.expedition_id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <h6 className="mb-0">{expedition.title}</h6>
                        <small className="text-muted">
                          {new Date(expedition.start_date).toLocaleDateString()} - 
                          {new Date(expedition.end_date).toLocaleDateString()} | 
                          ${expedition.price}
                        </small>
                      </div>
                      <div>
                        <Badge bg={
                          expedition.expedition_status === 'active' ? 'success' :
                          expedition.expedition_status === 'draft' ? 'secondary' :
                          expedition.expedition_status === 'completed' ? 'info' :
                          'danger'
                        } className="me-2">
                          {expedition.expedition_status}
                        </Badge>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => navigate(`/expeditions/${expedition.expedition_id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="settings" title="Team Settings">
          <Card>
            <Card.Body>
              <h4 className="mb-3">Team Settings</h4>
              
              <Card.Title>Guide Role Names</Card.Title>
              <p className="text-muted">
                You can customize the names of the guide roles for your team.
              </p>
              
              <ListGroup className="mb-4">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Level 1:</strong> Master Guide
                  </div>
                  <Badge bg="primary">You</Badge>
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Level 2:</strong> Tactical Guide
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Level 3:</strong> Technical Guide
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Level 4:</strong> Base Guide
                </ListGroup.Item>
              </ListGroup>
              
              <Button variant="outline-primary" disabled>
                Edit Role Names (Coming Soon)
              </Button>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default TeamDashboard;