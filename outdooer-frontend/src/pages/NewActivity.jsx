// src/pages/NewActivity.jsx
import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import '../styles/ActivityForm.css';

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
      }
    };
    
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);
  
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
    setLoading(true);
    setError(null);
    
    try {
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
                  />
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
                <Form.Group className="mb-3">
                  <Form.Label>Location*</Form.Label>
                  <Form.Select
                    name="location_id"
                    value={formData.location_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Location</option>
                    {locations.map(location => (
                      <option key={location.location_id} value={location.location_id}>
                        {location.location_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Activity Type*</Form.Label>
                  <Form.Select
                    name="activity_type_id"
                    value={formData.activity_type_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Activity Type</option>
                    {activityTypes.map(type => (
                      <option key={type.activity_type_id} value={type.activity_type_id}>
                        {type.activity_type_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
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