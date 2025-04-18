// src/pages/NewExpedition.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  Container, 
  Form, 
  Button, 
  Card, 
  Row, 
  Col, 
  Alert, 
  Spinner, 
  ListGroup 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import '../styles/ActivityForm.css';

const NewExpedition = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isGuide } = useContext(AuthContext);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    min_participants: 1,
    max_participants: 10,
    price: '',
    team_id: ''
  });
  
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [availableActivities, setAvailableActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [teams, setTeams] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  
  // Check if user is authorized to create expeditions
  useEffect(() => {
    if (!isAuthenticated || !isGuide()) {
      navigate('/unauthorized');
    }
  }, [isAuthenticated, isGuide, navigate]);
  
  // Fetch teams the user belongs to
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await api.get('/teams/my-teams');
        setTeams(response.data.teams || []);
        
        if (response.data.teams?.length === 1) {
          setFormData(prev => ({
            ...prev,
            team_id: response.data.teams[0].team_id
          }));
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Failed to load teams data. Please try again.');
      }
    };
    
    if (isAuthenticated) {
      fetchTeams();
    }
  }, [isAuthenticated]);
  
  // Fetch available activities when team is selected
  useEffect(() => {
    const fetchActivities = async () => {
      if (!formData.team_id) return;
      
      setLoadingActivities(true);
      try {
        const response = await api.get(`/activities/team/${formData.team_id}`);
        setAvailableActivities(response.data.activities || []);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load team activities. Please try again.');
      } finally {
        setLoadingActivities(false);
      }
    };
    
    fetchActivities();
  }, [formData.team_id]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'min_participants', 'max_participants'].includes(name) 
        ? value === '' ? '' : Number(value)
        : value
    }));
  };
  
  const handleAddActivity = (activityId) => {
    const activity = availableActivities.find(act => act.activity_id === Number(activityId));
    
    if (activity && !selectedActivities.some(a => a.activity_id === activity.activity_id)) {
      setSelectedActivities(prev => [
        ...prev, 
        { 
          ...activity, 
          sequence_order: prev.length + 1,
          day_number: 1
        }
      ]);
    }
  };
  
  const handleRemoveActivity = (index) => {
    setSelectedActivities(prev => {
      const newActivities = [...prev];
      newActivities.splice(index, 1);
      
      return newActivities.map((activity, idx) => ({
        ...activity,
        sequence_order: idx + 1
      }));
    });
  };
  
  const handleMoveActivity = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === selectedActivities.length - 1)
    ) return;
    
    setSelectedActivities(prev => {
      const newActivities = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      [newActivities[index], newActivities[newIndex]] = 
        [newActivities[newIndex], newActivities[index]];
      
      return newActivities.map((activity, idx) => ({
        ...activity,
        sequence_order: idx + 1
      }));
    });
  };
  
  const handleDayChange = (index, day) => {
    setSelectedActivities(prev => {
      const newActivities = [...prev];
      newActivities[index] = {
        ...newActivities[index],
        day_number: Number(day)
      };
      return newActivities;
    });
  };
  
  const calculateDuration = useCallback(() => {
    if (!formData.start_date || !formData.end_date) return 0;
    
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [formData.start_date, formData.end_date]);
  
  const getDayOptions = useCallback(() => {
    const duration = calculateDuration();
    return Array.from({ length: duration }, (_, i) => (
      <option key={i + 1} value={i + 1}>
        Day {i + 1}
      </option>
    ));
  }, [calculateDuration]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedActivities.length === 0) {
      setError('Please add at least one activity to the expedition.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const expeditionResponse = await api.post('/expeditions', {
        ...formData,
        created_by: user.user_id,
        leader_id: user.user_id
      });
      
      const expeditionId = expeditionResponse.data.expedition_id;
      
      await api.post(`/expeditions/${expeditionId}/activities`, {
        activities: selectedActivities
      });
      
      setSuccess(true);
      setTimeout(() => navigate(`/expeditions/${expeditionId}`), 2000);
    } catch (err) {
      console.error('Error creating expedition:', err);
      setError(err.response?.data?.error || 'Failed to create expedition. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isAuthenticated) return null;

  return (
    <Container className="py-4 activity-form-container">
      <Card className="shadow-sm">
        <Card.Header as="h1" className="text-center">Create New Expedition</Card.Header>
        <Card.Body>
          {success && (
            <Alert variant="success">
              Expedition created successfully! Redirecting to expedition details...
            </Alert>
          )}
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <div className="form-section">
              <h4 className="form-section-title">Basic Information</h4>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Expedition Title*</Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="E.g., Mountain Trek Expedition"
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
                  placeholder="Provide a detailed description of the expedition..."
                />
              </Form.Group>
              
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Date*</Form.Label>
                    <Form.Control
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>End Date*</Form.Label>
                    <Form.Control
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      required
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={3}>
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
                      placeholder="499.99"
                    />
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Participant Range*</Form.Label>
                    <Row>
                      <Col xs={6}>
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
                      <Col xs={6}>
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
            </div>
            
            <div className="form-section">
              <h4 className="form-section-title">Expedition Activities</h4>
              
              {!formData.team_id ? (
                <Alert variant="info">
                  Please select a team first to see available activities.
                </Alert>
              ) : loadingActivities ? (
                <div className="text-center my-3">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading activities...
                </div>
              ) : availableActivities.length === 0 ? (
                <Alert variant="warning">
                  No activities found for this team. Please create activities first.
                </Alert>
              ) : (
                <>
                  <Row className="mb-3">
                    <Col md={8}>
                      <Form.Group>
                        <Form.Label>Add Activities to Expedition</Form.Label>
                        <Form.Select 
                          onChange={(e) => handleAddActivity(e.target.value)}
                          value=""
                        >
                          <option value="">Select an activity to add</option>
                          {availableActivities.map(activity => (
                            <option 
                              key={activity.activity_id} 
                              value={activity.activity_id}
                              disabled={selectedActivities.some(a => a.activity_id === activity.activity_id)}
                            >
                              {activity.title} - {activity.difficulty_level}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    
                    <Col md={4}>
                      <div className="mb-2">
                        <Form.Label>Expedition Duration</Form.Label>
                        <div className="d-flex align-items-center">
                          <div className="border rounded px-3 py-2 w-100 bg-light">
                            {calculateDuration()} days
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                  
                  <div className="selected-activities mb-3">
                    <h6>Selected Activities ({selectedActivities.length})</h6>
                    {selectedActivities.length === 0 ? (
                      <div className="text-muted">
                        No activities selected yet. Add activities to build your expedition itinerary.
                      </div>
                    ) : (
                      <ListGroup>
                        {selectedActivities.map((activity, index) => (
                          <ListGroup.Item 
                            key={`${activity.activity_id}-${index}`}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <div className="d-flex align-items-center">
                              <div className="me-3 activity-order">{index + 1}</div>
                              <div>
                                <div className="fw-bold">{activity.title}</div>
                                <div className="text-muted small">
                                  Difficulty: {activity.difficulty_level}, 
                                  Price: ${activity.price}
                                </div>
                              </div>
                            </div>
                            
                            <div className="d-flex align-items-center">
                              <Form.Select 
                                className="day-select me-3"
                                value={activity.day_number}
                                onChange={(e) => handleDayChange(index, e.target.value)}
                                style={{ width: '100px' }}
                              >
                                {getDayOptions()}
                              </Form.Select>
                              
                              <div className="d-flex">
                                <Button 
                                  variant="light" 
                                  size="sm" 
                                  className="me-1"
                                  onClick={() => handleMoveActivity(index, 'up')}
                                  disabled={index === 0}
                                >
                                  <FaArrowUp />
                                </Button>
                                <Button 
                                  variant="light" 
                                  size="sm" 
                                  className="me-1"
                                  onClick={() => handleMoveActivity(index, 'down')}
                                  disabled={index === selectedActivities.length - 1}
                                >
                                  <FaArrowDown />
                                </Button>
                                <Button 
                                  variant="light" 
                                  size="sm" 
                                  className="text-danger"
                                  onClick={() => handleRemoveActivity(index)}
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="text-center mt-4">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
                className="px-4 py-2"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating Expedition...
                  </>
                ) : 'Create Expedition'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default NewExpedition;