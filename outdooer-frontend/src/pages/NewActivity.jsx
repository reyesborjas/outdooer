// src/pages/EditActivity.jsx
import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import '../styles/ActivityForm.css';
import SearchableDropdown from '../components/SearchableDropdown';
import SimilarActivityWarning from '../components/SimilarActivityWarning';

const EditActivity = () => {
  const { activityId } = useParams();
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
    team_id: '',
    activity_status: 'active'
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [locations, setLocations] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [unauthorizedAction, setUnauthorizedAction] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [similarActivities, setSimilarActivities] = useState([]);
  const [checkingSimilar, setCheckingSimilar] = useState(false);
  const [isTitleUnique, setIsTitleUnique] = useState(true);
  const [isTitleChecking, setIsTitleChecking] = useState(false);
  
  // Check if user is authorized
  useEffect(() => {
    if (!isAuthenticated || !isGuide()) {
      navigate('/unauthorized');
    }
  }, [isAuthenticated, isGuide, navigate]);
  
  // Check for similar activities
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
            location_id: formData.location_id,
            activity_id: activityId // Pass this when editing to exclude the current activity
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
  }, [formData.team_id, formData.activity_type_id, formData.location_id, activityId]);
  
  // Check for duplicate titles
  useEffect(() => {
    if (!formData.title || !formData.team_id) return;
    
    const checkTitle = async () => {
      setIsTitleChecking(true);
      try {
        const response = await api.get(`/activities/check-title`, {
          params: {
            title: formData.title,
            team_id: formData.team_id,
            activity_id: activityId // Pass this when editing to exclude the current activity
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
  }, [formData.title, formData.team_id, activityId]);
  
  // Fetch activity data and necessary dropdown options
  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      setError(null);
      
      try {
        setLoadingLocations(true);
        // Fetch activity details
        const activityResponse = await api.get(`/activities/${activityId}`);
        const activity = activityResponse.data.activity || activityResponse.data;
        
        // Check if user is authorized to edit this activity
        if (activity.created_by !== user.user_id && activity.leader_id !== user.user_id) {
          setUnauthorizedAction(true);
          setError("You don't have permission to edit this activity");
          setInitialLoading(false);
          return;
        }
        
        // Fetch locations
        const locationsResponse = await api.get('/locations');
        setLocations(locationsResponse.data.locations || []);
        
        // Fetch activity types
        const typesResponse = await api.get('/activity-types');
        setActivityTypes(typesResponse.data.activity_types || []);
        
        // Set form data from activity
        setFormData({
          title: activity.title || '',
          description: activity.description || '',
          location_id: activity.location_id || '',
          difficulty_level: activity.difficulty_level || 'moderate',
          price: activity.price || '',
          min_participants: activity.min_participants || 1,
          max_participants: activity.max_participants || 10,
          activity_type_id: activity.activity_type_id || '',
          team_id: activity.team_id || '',
          activity_status: activity.activity_status || 'active'
        });
      } catch (err) {
        console.error('Error fetching activity data:', err);
        setError('Failed to load activity data. Please try again.');
      } finally {
        setInitialLoading(false);
        setLoadingLocations(false);
      }
    };
    
    if (isAuthenticated && activityId) {
      fetchData();
    }
  }, [isAuthenticated, activityId, user.user_id]);
  
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
          } with the same type and location. Are you sure you want to continue?`
        );
        
        if (!confirmed) {
          setLoading(false);
          return;
        }
      }
      
      // Update the activity
      const response = await api.put(`/activities/${activityId}`, formData);
      
      console.log('Activity updated:', response.data);
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/activities/${activityId}`);
      }, 2000);
    } catch (err) {
      console.error('Error updating activity:', err);
      setError(err.response?.data?.error || 'Failed to update activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isAuthenticated || unauthorizedAction) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          {error || "You don't have permission to edit this activity"}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/my-activities')}>
          Back to My Activities
        </Button>
      </Container>
    );
  }
  
  if (initialLoading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Loading activity data...</p>
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
              Activity updated successfully! Redirecting to activity details...
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
                  <Form.Label>Status</Form.Label>
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