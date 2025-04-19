// src/pages/NewActivity.jsx
import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import '../styles/ActivityForm.css';
import SearchableDropdown from '../components/SearchableDropdown';
import SimilarActivityWarning from '../components/SimilarActivityWarning';

const NewActivity = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isGuide } = useContext(AuthContext);
  
  // Form state
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
  
  // UI state
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
  
  // Check if user is authorized to create activities
  useEffect(() => {
    if (!isAuthenticated || !isGuide()) {
      navigate('/unauthorized');
    }
  }, [isAuthenticated, isGuide, navigate]);
  
  // Fetch necessary data (locations, activity types, teams)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingLocations(true);
        // Fetch locations
        const locationsResponse = await api.get('/locations');
        setLocations(locationsResponse.data.locations || []);
        
        // Fetch activity types
        const typesResponse = await api.get('/activity-types');
        setActivityTypes(typesResponse.data.activity_types || []);
        
        // Fetch teams user belongs to
        const teamsResponse = await api.get('/teams/my-teams');
        setTeams(teamsResponse.data.teams || []);
        
        // Set default team if user belongs to only one team
        if (teamsResponse.data.teams && teamsResponse.data.teams.length === 1) {
          setFormData(prev => ({
            ...prev,
            team_id: teamsResponse.data.teams[0].team_id
          }));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load necessary data. Please try again.');
      } finally {
        setLoadingLocations(false);
      }
    };
    
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);
  
  // Check for similar activities when location and activity type are selected
  useEffect(() => {
    // Only check when all three values are present
    if (!formData.team_id || !formData.activity_type_id || !formData.location_id) {
      setSimilarActivities([]);
      return;
    }
    
    const checkSimilarActivities = async () => {
      setCheckingSimilar(true);
      try {
        const response = await api.get('/activities/check-similar', {
          params: {
            team_id: formData.team_id,
            activity_type_id: formData.activity_type_id,
            location_id: formData.location_id
          }
        });
        
        if (response.data.has_similar) {
          setSimilarActivities(response.data.similar_activities);
        } else {
          setSimilarActivities([]);
        }
      } catch (err) {
        console.error('Error checking for similar activities:', err);
        setSimilarActivities([]);
      } finally {
        setCheckingSimilar(false);
      }
    };
    
    // Add debounce to prevent excessive API calls
    const timeoutId = setTimeout(checkSimilarActivities, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.team_id, formData.activity_type_id, formData.location_id]);

  // Check for duplicate titles
  useEffect(() => {
    if (!formData.title || !formData.team_id) return;
    
    const checkTitle = async () => {
      setIsTitleChecking(true);
      try {
        const response = await api.get(`/activities/check-title`, {
          params: {
            title: formData.title,
            team_id: formData.team_id
          }
        });
        setIsTitleUnique(response.data.unique);
      } catch (err) {
        console.error('Error checking title uniqueness:', err);
        // Default to allowing submission if the check fails
        setIsTitleUnique(true);
      } finally {
        setIsTitleChecking(false);
      }
    };
    
    // Debounce the API call to avoid too many requests while typing
    const timeoutId = setTimeout(checkTitle, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.title, formData.team_id]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert numeric values
    if (['price', 'min_participants', 'max_participants'].includes(name)) {
      setFormData({
        ...formData,
        [name]: value === '' ? '' : Number(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate title uniqueness
    if (!isTitleUnique) {
      setError("Please choose a unique activity title.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Confirm if there are similar activities
      if (similarActivities.length > 0) {
        const confirmed = window.confirm(
          `We found ${similarActivities.length} similar ${
            similarActivities.length === 1 ? 'activity' : 'activities'
          } with the same type and location. Are you sure you want to create a new one?`
        );
        
        if (!confirmed) {
          setLoading(false);
          return;
        }
      }
      
      // Create the activity
      const response = await api.post('/activities', {
        ...formData,
        created_by: user.user_id,
        leader_id: user.user_id
      });
      
      console.log('Activity created:', response.data);
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/activities/${response.data.activity_id}`);
      }, 2000);
    } catch (err) {
      console.error('Error creating activity:', err);
      setError(err.response?.data?.error || 'Failed to create activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <Container className="py-4 activity-form-container">
      <Card className="shadow-sm">
        <Card.Header as="h1" className="text-center">Create New Activity</Card.Header>
        <Card.Body>
          {success && (
            <Alert variant="success">
              Activity created successfully! Redirecting to activity details...
            </Alert>
          )}
          
          {error && (
            <Alert variant="danger">
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
                    placeholder="E.g., Mountain Hiking Adventure"
                    isValid={formData.title && isTitleUnique}
                    isInvalid={formData.title && !isTitleUnique}
                  />
                  {isTitleChecking && (
                    <Form.Text className="text-muted">Checking title availability...</Form.Text>
                  )}
                  {!isTitleUnique && (
                    <Form.Control.Feedback type="invalid">
                      An activity with this name already exists in your team. Please choose a different name.
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
                      <option key={team.team_id} value={team.team_id}>
                        {team.team_name}
                      </option>
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
                placeholder="Provide a detailed description of the activity..."
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <SearchableDropdown
                  label="Location"
                  items={locations}
                  onSelect={(value) => handleChange({ target: { name: 'location_id', value }})}
                  value={formData.location_id}
                  valueKey="location_id"
                  displayKey="location_name"
                  extraDisplayKeys={['country_code', 'region_code']}
                  placeholder="Search for a location..."
                  isLoading={loadingLocations}
                  required={true}
                  searchKeys={['location_name', 'country_code', 'region_code', 'formatted_address']}
                  noResultsMessage="No locations found. Try a different search term."
                />
              </Col>
              
              <Col md={6}>
                <SearchableDropdown
                  label="Activity Type"
                  items={activityTypes}
                  onSelect={(value) => handleChange({ target: { name: 'activity_type_id', value }})}
                  value={formData.activity_type_id}
                  valueKey="activity_type_id"
                  displayKey="activity_type_name"
                  placeholder="Search for an activity type..."
                  required={true}
                  searchKeys={['activity_type_name', 'description']}
                  noResultsMessage="No activity types found. Try a different search term."
                />
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Price ($)*</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    placeholder="49.99"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
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
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Participant Range*</Form.Label>
                  <Row>
                    <Col>
                      <Form.Control
                        type="number"
                        min="1"
                        max="999"
                        name="min_participants"
                        value={formData.min_participants}
                        onChange={handleChange}
                        required
                        placeholder="Min"
                      />
                    </Col>
                    <Col>
                      <Form.Control
                        type="number"
                        min={formData.min_participants || 1}
                        max="999"
                        name="max_participants"
                        value={formData.max_participants}
                        onChange={handleChange}
                        required
                        placeholder="Max"
                      />
                    </Col>
                  </Row>
                </Form.Group>
              </Col>
            </Row>
            
            {checkingSimilar ? (
              <div className="text-center my-3">
                <Spinner animation="border" size="sm" /> Checking for similar activities...
              </div>
            ) : (
              <SimilarActivityWarning similarActivities={similarActivities} />
            )}
            
            <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
              <Button 
                variant="secondary" 
                className="me-md-2"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
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