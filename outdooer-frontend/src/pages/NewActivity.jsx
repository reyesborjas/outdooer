// src/pages/NewActivity.jsx
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import '../styles/ActivityForm.css';
import SearchableDropdown from '../components/SearchableDropdown';
import SimilarActivityWarning from '../components/SimilarActivityWarning';

const NewActivity = () => {
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
    team_id: ''
  });

  const [loading, setLoading] = useState(false);
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

  const memoizedLocations = useMemo(() => locations, [locations]);
  const memoizedActivityTypes = useMemo(() => activityTypes, [activityTypes]);

  // Check user authorization
  useEffect(() => {
    if (!isAuthenticated || !isGuide()) {
      navigate('/unauthorized');
      return;
    }
  }, [isAuthenticated, isGuide, navigate]);

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

        if (teamsRes.data.teams?.length === 1) {
          setFormData(prev => ({ ...prev, team_id: teamsRes.data.teams[0].team_id }));
        }
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
            location_id: formData.location_id
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
  }, [formData.team_id, formData.activity_type_id, formData.location_id]);

  // Check for unique title
  useEffect(() => {
    if (!formData.title || !formData.team_id) return;

    const timeoutId = setTimeout(async () => {
      try {
        setIsTitleChecking(true);
        const res = await api.get('/activities/check-title', {
          params: { title: formData.title, team_id: formData.team_id }
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
  }, [formData.title, formData.team_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'min_participants', 'max_participants'].includes(name)
        ? value === '' ? '' : Number(value)
        : value
    }));
  };

  // Fixed handleSubmit function for your NewActivity.jsx component
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!isTitleUnique) {
    setError('Please choose a unique activity title.');
    return;
  }

  setLoading(true);
  setError(null);

  try {
    // Check for similar activities confirmation
    if (similarActivities.length > 0) {
      const confirmed = window.confirm(
        `We found ${similarActivities.length} similar activity(ies). Do you still want to create this one?`
      );
      if (!confirmed) {
        setLoading(false);
        return;
      }
    }

    // Make sure to use the trailing slash to match the server's expectations
    const res = await api.post('activities/', {
      ...formData,
      created_by: user.user_id,
      leader_id: user.user_id
    });

    console.log('Activity created successfully:', res.data);
    
    // Clear loading state before changing route
    setLoading(false);
    
    // Set success state
    setSuccess(true);
    
    // Use window.location for more reliable navigation
    // This is more direct and bypasses potential React Router issues
    setTimeout(() => {
      window.location.href = `/activities/${res.data.activity_id}`;
    }, 1000); // Short delay to ensure state updates are processed

  } catch (err) {
    console.error('Error creating activity:', err);
    setError(err.response?.data?.error || 'Failed to create activity.');
    setLoading(false);
  }
};

// Also add this to your form:
<div className="d-flex justify-content-between mt-4">
  <Button 
    variant="outline-secondary" 
    onClick={() => window.location.href = '/activities'}
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
        Creating...
      </>
    ) : 'Create Activity'}
  </Button>
</div>
  const handleCancel = () => {
    // Use direct navigation as a more reliable method
    window.location.href = '/activities';
  };

  if (!isAuthenticated) return null;

  return (
    <Container className="py-4 activity-form-container">
      <Card className="shadow-sm">
        <Card.Header as="h1" className="text-center">Create New Activity</Card.Header>
        <Card.Body>
          {success && (
            <Alert variant="success">
              Activity created successfully! Redirecting...
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
                  >
                    <option value="">Select Team</option>
                    {teams.map(team => (
                      <option key={team.team_id} value={team.team_id}>{team.team_name}</option>
                    ))}
                  </Form.Select>
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
                <option value="hard">Hard</option>
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
                    Creating...
                  </>
                ) : 'Create Activity'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default NewActivity;