// src/pages/EditActivity.jsx
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { activitiesApi } from '../api/activities';
import '../styles/ActivityForm.css';
import SearchableDropdown from '../components/SearchableDropdown';
import SimilarActivityWarning from '../components/SimilarActivityWarning';

const EditActivity = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isGuide, canEditActivity } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location_id: '',
    difficulty_level: 'moderate',
    price: '',
    min_participants: 1,
    max_participants: 10,
    activity_type_id: '',
    team_id: '',
    activity_status: 'active',
    leader_id: ''
  });

  const [originalTitle, setOriginalTitle] = useState('');
  const [originalActivity, setOriginalActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingActivity, setFetchingActivity] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [locations, setLocations] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [similarActivities, setSimilarActivities] = useState([]);
  const [checkingSimilar, setCheckingSimilar] = useState(false);
  const [isTitleUnique, setIsTitleUnique] = useState(true);
  const [isTitleChecking, setIsTitleChecking] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const memoizedLocations = useMemo(() => locations, [locations]);
  const memoizedActivityTypes = useMemo(() => activityTypes, [activityTypes]);

  // Check user authorization
  useEffect(() => {
    if (!isAuthenticated || !isGuide()) {
      navigate('/unauthorized');
      return;
    }
  }, [isAuthenticated, isGuide, navigate]);

  // Fetch activity data
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setFetchingActivity(true);
        const response = await activitiesApi.getActivityById(activityId);
        const activityData = response.activity || response;
        
        setOriginalActivity(activityData);
        
        // Check if user is authorized to edit this activity
        const canEdit = canEditActivity(activityData);
        setIsAuthorized(canEdit);
        
        if (!canEdit) {
          setError("You don't have permission to edit this activity based on your role level");
          return;
        }
        
        // Set form data
        setFormData({
          title: activityData.title,
          description: activityData.description,
          location_id: activityData.location_id,
          difficulty_level: activityData.difficulty_level,
          price: parseFloat(activityData.price),
          min_participants: activityData.min_participants,
          max_participants: activityData.max_participants,
          activity_type_id: activityData.activity_type_id,
          team_id: activityData.team_id,
          activity_status: activityData.activity_status,
          leader_id: activityData.leader_id
        });
        
        setOriginalTitle(activityData.title);
        
        // Fetch team members for this team
        fetchTeamMembers(activityData.team_id);
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError('Failed to fetch activity data. Please try again.');
      } finally {
        setFetchingActivity(false);
      }
    };

    if (isAuthenticated && activityId) {
      fetchActivity();
    }
  }, [isAuthenticated, activityId, canEditActivity]);

  // Fetch team members for leader selection
  const fetchTeamMembers = async (teamId) => {
    if (!teamId) return;
    
    try {
      setLoadingTeamMembers(true);
      const response = await fetch(`/teams/${teamId}/members`);
      const data = await response.json();
      setTeamMembers(data.members || []);
    } catch (err) {
      console.error('Error fetching team members:', err);
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  // Fetch necessary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingLocations(true);
        const [locationsRes, typesRes] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/activity-types')
        ]);

        const locationsData = await locationsRes.json();
        const typesData = await typesRes.json();

        setLocations(locationsData.locations || []);
        setActivityTypes(typesData.activity_types || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load necessary data. Please try again.');
      } finally {
        setLoadingLocations(false);
      }
    };

    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  // Check for similar activities
  useEffect(() => {
    if (!formData.team_id || !formData.activity_type_id || !formData.location_id) {
      setSimilarActivities([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setCheckingSimilar(true);
        const result = await activitiesApi.checkSimilarActivities(
          formData.team_id,
          formData.activity_type_id,
          formData.location_id,
          activityId // Exclude current activity
        );
        setSimilarActivities(result.has_similar ? result.similar_activities : []);
      } catch (err) {
        console.error('Error checking similar activities:', err);
        setSimilarActivities([]);
      } finally {
        setCheckingSimilar(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.team_id, formData.activity_type_id, formData.location_id, activityId]);

  // Check for unique title
  useEffect(() => {
    if (!formData.title || !formData.team_id || formData.title === originalTitle) {
      setIsTitleUnique(true);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsTitleChecking(true);
        const result = await activitiesApi.checkActivityTitle(
          formData.title, 
          formData.team_id,
          activityId
        );
        setIsTitleUnique(result.unique);
      } catch (err) {
        console.error('Error checking title:', err);
        setIsTitleUnique(true);
      } finally {
        setIsTitleChecking(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.title, formData.team_id, originalTitle, activityId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'min_participants', 'max_participants'].includes(name)
        ? value === '' ? '' : Number(value)
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isTitleUnique) {
      setError('Please choose a unique activity title.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Make update request
      const result = await activitiesApi.updateActivity(activityId, formData);

      console.log('Activity updated successfully:', result);
      setLoading(false);
      setSuccess(true);
      
      // Navigate back to activity details after short delay
      setTimeout(() => {
        navigate(`/activities/${activityId}`);
      }, 1500);
    } catch (err) {
      console.error('Error updating activity:', err);
      setError(err.response?.data?.error || 'Failed to update activity.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/activities/${activityId}`);
  };

  if (!isAuthenticated || fetchingActivity) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading activity data...</p>
      </Container>
    );
  }

  if (!isAuthorized) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          {error || "You don't have permission to edit this activity"}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/activities')}>
          Back to Activities
        </Button>
      </Container>
    );
  }

  // Check if user is Base Guide and trying to assign leader
  const isBaseGuide = user?.teams?.find(team => team.team_id === formData.team_id)?.role_level === 4;
  const canAssignLeader = (leaderId) => {
    if (!isBaseGuide) return true;
    
    // Base Guide can only assign Master Guide or Tactical Guide as leaders
    const leader = teamMembers.find(member => member.user_id === Number(leaderId));
    return !leader || leader.role_level <= 2;
  };

  return (
    <Container className="py-4 activity-form-container">
      <Card className="shadow-sm">
        <Card.Header as="h1" className="text-center">Edit Activity</Card.Header>
        <Card.Body>
          {success && (
            <Alert variant="success">
              Activity updated successfully! Redirecting...
            </Alert>
          )}
          
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Activity Title*</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="E.g., Mountain Hiking"
                    isValid={formData.title && isTitleUnique}
                    isInvalid={formData.title && !isTitleUnique}
                  />
                  {isTitleChecking && (
                    <Form.Text className="text-muted">Checking title availability...</Form.Text>
                  )}
                  {!isTitleUnique && (
                    <Form.Control.Feedback type="invalid">
                      This title already exists in your team.
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Team*</Form.Label>
                  <Form.Control
                    type="text"
                    value={originalActivity?.team_name || ''}
                    disabled
                    readOnly
                  />
                  <Form.Text className="text-muted">
                    Team cannot be changed once an activity is created.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description*</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Provide a detailed description..."
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <SearchableDropdown
                  label="Location*"
                  items={memoizedLocations}
                  onSelect={value => handleChange({ target: { name: 'location_id', value } })}
                  value={formData.location_id}
                  valueKey="location_id"
                  displayKey="location_name"
                  extraDisplayKeys={['country_code', 'region_code']}
                  placeholder="Search for a location..."
                  isLoading={loadingLocations}
                  required
                  searchKeys={['location_name', 'country_code', 'region_code', 'formatted_address']}
                  noResultsMessage="No locations found."
                />
              </Col>

              <Col md={6}>
                <SearchableDropdown
                  label="Activity Type*"
                  items={memoizedActivityTypes}
                  onSelect={value => handleChange({ target: { name: 'activity_type_id', value } })}
                  value={formData.activity_type_id}
                  valueKey="activity_type_id"
                  displayKey="activity_type_name"
                  placeholder="Search for activity type..."
                  required
                  searchKeys={['activity_type_name', 'description']}
                  noResultsMessage="No activity types found."
                />
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (USD)*</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Min Participants*</Form.Label>
                  <Form.Control
                    type="number"
                    name="min_participants"
                    min="1"
                    max={formData.max_participants || 100}
                    value={formData.min_participants}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Participants*</Form.Label>
                  <Form.Control
                    type="number"
                    name="max_participants"
                    min={formData.min_participants || 1}
                    value={formData.max_participants}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Difficulty Level*</Form.Label>
                  <Form.Select
                    name="difficulty_level"
                    value={formData.difficulty_level}
                    onChange={handleChange}
                    required
                  >
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="difficult">Difficult</option>
                    <option value="extreme">Extreme</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status*</Form.Label>
                  <Form.Select
                    name="activity_status"
                    value={formData.activity_status}
                    onChange={handleChange}
                    required
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="canceled">Canceled</option>
                    <option value="completed">Completed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Activity Leader*</Form.Label>
              <Form.Select
                name="leader_id"
                value={formData.leader_id}
                onChange={handleChange}
                required
                disabled={loadingTeamMembers}
                isInvalid={isBaseGuide && formData.leader_id && !canAssignLeader(formData.leader_id)}
              >
                {teamMembers.map(member => (
                  <option 
                    key={member.user_id} 
                    value={member.user_id}
                    disabled={isBaseGuide && member.role_level > 2}
                  >
                    {member.first_name} {member.last_name} - {
                      member.role_level === 1 ? 'Master Guide' :
                      member.role_level === 2 ? 'Tactical Guide' :
                      member.role_level === 3 ? 'Technical Guide' : 'Base Guide'
                    }
                  </option>
                ))}
              </Form.Select>
              {loadingTeamMembers && <Form.Text>Loading team members...</Form.Text>}
              {isBaseGuide && (
                <Form.Text className="text-muted">
                  As a Base Guide, you can only assign Master Guides or Tactical Guides as leaders.
                </Form.Text>
              )}
              {isBaseGuide && formData.leader_id && !canAssignLeader(formData.leader_id) && (
                <Form.Control.Feedback type="invalid">
                  Base Guides can only assign Master Guides or Tactical Guides as leaders.
                </Form.Control.Feedback>
              )}
            </Form.Group>

            {checkingSimilar && <p>Checking for similar activities...</p>}
            {similarActivities.length > 0 && (
              <SimilarActivityWarning activities={similarActivities} />
            )}

            <div className="d-flex justify-content-between mt-4">
              <Button 
                variant="outline-secondary" 
                onClick={handleCancel}
                type="button"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading || (isBaseGuide && formData.leader_id && !canAssignLeader(formData.leader_id))}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Updating...
                  </>
                ) : 'Update Activity'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditActivity;