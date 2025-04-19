// src/pages/EditActivity.jsx
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import '../styles/ActivityForm.css';
import SearchableDropdown from '../components/SearchableDropdown';
import SimilarActivityWarning from '../components/SimilarActivityWarning';

const EditActivity = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isGuide } = useContext(AuthContext);

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
    activity_status: 'active'
  });

  const [originalTitle, setOriginalTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingActivity, setFetchingActivity] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [locations, setLocations] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
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
        const response = await api.get(`/activities/${activityId}`);
        const activityData = response.data.activity || response.data;
        
        // Check if user is authorized to edit this activity
        if (user.user_id === activityData.created_by || user.user_id === activityData.leader_id) {
          setIsAuthorized(true);
          
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
            activity_status: activityData.activity_status
          });
          
          setOriginalTitle(activityData.title);
        } else {
          setError("You don't have permission to edit this activity");
          setIsAuthorized(false);
        }
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
  }, [isAuthenticated, activityId, user?.user_id]);

  // Fetch necessary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingLocations(true);
        const [locationsRes, typesRes, teamsRes] = await Promise.all([
          api.get('/locations'),
          api.get('/activity-types'),
          api.get('/teams/my-teams')
        ]);

        setLocations(locationsRes.data.locations || []);
        setActivityTypes(typesRes.data.activity_types || []);
        setTeams(teamsRes.data.teams || []);
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
        const res = await api.get('/activities/check-similar', {
          params: {
            team_id: formData.team_id,
            activity_type_id: formData.activity_type_id,
            location_id: formData.location_id,
            activity_id: activityId // Exclude current activity
          }
        });
        setSimilarActivities(res.data.has_similar ? res.data.similar_activities : []);
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
        const res = await api.get('/activities/check-title', {
          params: { 
            title: formData.title, 
            team_id: formData.team_id,
            activity_id: activityId // Exclude current activity
          }
        });
        setIsTitleUnique(res.data.unique);
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
      const res = await api.put(`/activities/${activityId}`, formData);

      console.log('Activity updated successfully:', res.data);
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
                  <Form.Select
                    name="team_id"
                    value={formData.team_id}
                    onChange={handleChange}
                    required
                    disabled // Team can't be changed once activity is created
                  >
                    <option value="">Select Team</option>
                    {teams.map(team => (
                      <option key={team.team_id} value={team.team_id}>{team.team_name}</option>
                    ))}
                  </Form.Select>
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
                  label="Location"
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
                  label="Activity Type"
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
              <Col md={3}>
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

              <Col md={3}>
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

              <Col md={3}>
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

              <Col md={3}>
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
                disabled={loading}
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