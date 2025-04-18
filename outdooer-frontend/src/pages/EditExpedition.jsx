// src/pages/EditExpedition.jsx
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
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { FaTrash, FaArrowUp, FaArrowDown, FaPlus } from 'react-icons/fa';
import '../styles/ActivityForm.css';

const EditExpedition = () => {
  const { expeditionId } = useParams();
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
    team_id: '',
    expedition_status: 'active'
  });
  
  // Expedition activities state
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [availableActivities, setAvailableActivities] = useState([]);
  const [originalActivities, setOriginalActivities] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  
  // Check if user is authorized
  useEffect(() => {
    if (!isAuthenticated || !isGuide()) {
      navigate('/unauthorized');
    }
  }, [isAuthenticated, isGuide, navigate]);
  
  // Calculate expedition duration
  const calculateDuration = useCallback(() => {
    if (!formData.start_date || !formData.end_date) return 0;
    
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [formData.start_date, formData.end_date]);
  
  // Generate day options based on expedition duration
  const getDayOptions = useCallback(() => {
    const duration = calculateDuration();
    return Array.from({ length: duration }, (_, i) => i + 1);
  }, [calculateDuration]);

  // Fetch expedition data and necessary dropdown options
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        
        // Fetch expedition details
        const [expeditionResponse, activitiesResponse] = await Promise.all([
          api.get(`/expeditions/${expeditionId}`),
          api.get(`/expeditions/${expeditionId}/activities`)
        ]);
        
        const expedition = expeditionResponse.data.expedition || expeditionResponse.data;
        
        // Check authorization
        if (expedition.created_by !== user.user_id && expedition.leader_id !== user.user_id) {
          setUnauthorized(true);
          setError("You don't have permission to edit this expedition");
          return;
        }
        
        // Set form data
        setFormData({
          title: expedition.title || '',
          description: expedition.description || '',
          start_date: expedition.start_date ? new Date(expedition.start_date).toISOString().split('T')[0] : '',
          end_date: expedition.end_date ? new Date(expedition.end_date).toISOString().split('T')[0] : '',
          min_participants: expedition.min_participants || 1,
          max_participants: expedition.max_participants || 10,
          price: expedition.price || '',
          team_id: expedition.team_id || '',
          expedition_status: expedition.expedition_status || 'active'
        });
        
        // Process activities
        const activities = activitiesResponse.data.activities || [];
        const sortedActivities = [...activities].sort((a, b) => a.sequence_order - b.sequence_order);
        setSelectedActivities(sortedActivities);
        setOriginalActivities(sortedActivities);
        
        // Fetch available activities if team exists
        if (expedition.team_id) {
          setLoadingActivities(true);
          try {
            const availableResponse = await api.get(`/activities/team/${expedition.team_id}`);
            setAvailableActivities(availableResponse.data.activities || []);
          } catch (err) {
            console.error('Error fetching available activities:', err);
          } finally {
            setLoadingActivities(false);
          }
        }
      } catch (err) {
        console.error('Error fetching expedition data:', err);
        setError(err.response?.data?.message || 'Failed to load expedition data. Please try again.');
      } finally {
        setInitialLoading(false);
      }
    };
    
    if (isAuthenticated && expeditionId) {
      fetchData();
    }
  }, [isAuthenticated, expeditionId, user.user_id]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'min_participants', 'max_participants'].includes(name) 
        ? value === '' ? '' : Number(value)
        : value
    }));
  };
  
  // Handle adding an activity to the expedition
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
  
  // Handle removing an activity from the expedition
  const handleRemoveActivity = (index) => {
    setSelectedActivities(prev => {
      const newActivities = [...prev];
      newActivities.splice(index, 1);
      
      // Update sequence order
      return newActivities.map((activity, idx) => ({
        ...activity,
        sequence_order: idx + 1
      }));
    });
  };
  
  // Handle moving an activity in the order
  const handleMoveActivity = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedActivities.length - 1)
    ) return;
    
    setSelectedActivities(prev => {
      const newActivities = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Swap positions
      [newActivities[index], newActivities[newIndex]] = 
        [newActivities[newIndex], newActivities[index]];
      
      // Update sequence order
      return newActivities.map((activity, idx) => ({
        ...activity,
        sequence_order: idx + 1
      }));
    });
  };
  
  // Handle changing the day number for an activity
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
  
  // Check if activities have changed
  const haveActivitiesChanged = useCallback(() => {
    if (selectedActivities.length !== originalActivities.length) return true;
    
    return selectedActivities.some((activity, i) => (
      activity.activity_id !== originalActivities[i].activity_id ||
      activity.day_number !== originalActivities[i].day_number ||
      activity.sequence_order !== originalActivities[i].sequence_order
    ));
  }, [selectedActivities, originalActivities]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate form
    if (selectedActivities.length === 0) {
      setError('Please add at least one activity to the expedition.');
      setLoading(false);
      return;
    }
    
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setError('End date cannot be before start date.');
      setLoading(false);
      return;
    }
    
    try {
      // Update expedition
      await api.put(`/expeditions/${expeditionId}`, formData);
      
      // Update activities if changed
      if (haveActivitiesChanged()) {
        await api.put(`/expeditions/${expeditionId}/activities`, {
          activities: selectedActivities
        });
      }
      
      setSuccess(true);
      setTimeout(() => navigate(`/expeditions/${expeditionId}`), 2000);
    } catch (err) {
      console.error('Error updating expedition:', err);
      setError(err.response?.data?.message || 'Failed to update expedition. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isAuthenticated || unauthorized) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          {error || "You don't have permission to edit this expedition"}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/my-expeditions')}>
          Back to My Expeditions
        </Button>
      </Container>
    );
  }
  
  if (initialLoading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Loading expedition data...</p>
      </Container>
    );
  }
  
  return (
    <Container className="py-4 activity-form-container">
      <Card className="shadow-sm">
        <Card.Header as="h1" className="text-center">Edit Expedition</Card.Header>
        <Card.Body>
          {success && (
            <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
              Expedition updated successfully! Redirecting to expedition details...
            </Alert>
          )}
          
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}
          
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
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      name="expedition_status"
                      value={formData.expedition_status}
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
              
              {loadingActivities ? (
                <div className="text-center my-3">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading activities...
                </div>
              ) : availableActivities.length === 0 ? (
                <Alert variant="warning">
                  No additional activities found for this team.
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
                                {getDayOptions().map(day => (
                                  <option key={day} value={day}>
                                    Day {day}
                                  </option>
                                ))}
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
            
            <div className="d-flex justify-content-between mt-4">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate(`/expeditions/${expeditionId}`)}
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
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Updating...
                  </>
                ) : 'Update Expedition'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditExpedition;