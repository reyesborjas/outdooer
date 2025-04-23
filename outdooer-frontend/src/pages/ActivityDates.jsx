// src/pages/ActivityDates.jsx
import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner, Table, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { FaCalendarPlus, FaEdit, FaTrash, FaUserCheck } from 'react-icons/fa';
import '../styles/ActivityDates.css';

const ActivityDates = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isGuide } = useContext(AuthContext);
  
  // Activity data
  const [activity, setActivity] = useState(null);
  const [activityDates, setActivityDates] = useState([]);
  const [guideInstance, setGuideInstance] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Date form state
  const [showDateModal, setShowDateModal] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [dateForm, setDateForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    max_reservations: 10,
    location: '',
    status: 'open'
  });
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dateToDelete, setDateToDelete] = useState(null);
  
  // Format time string to ensure it has seconds (HH:MM:SS)
  const formatTimeWithSeconds = (timeString) => {
    if (!timeString) return '';
    
    // If the time already has seconds (HH:MM:SS), return as is
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
    
    // If the time is in HH:MM format, add :00 for seconds
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      return `${timeString}:00`;
    }
    
    return timeString;
  };
  
  // Check if user is authorized
  useEffect(() => {
    if (!isAuthenticated || !isGuide()) {
      navigate('/unauthorized');
    }
  }, [isAuthenticated, isGuide, navigate]);
  
  // Fetch activity data, dates, and check guide instance
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch activity details
        const activityResponse = await api.get(`/activities/${activityId}`);
        const activity = activityResponse.data.activity || activityResponse.data;
        setActivity(activity);
        
        // Fetch activity dates
        const datesResponse = await api.get(`/activities/${activityId}/dates`);
        setActivityDates(datesResponse.data.dates || []);
        
        // Check if current guide has an instance for this activity
        try {
          const instancesResponse = await api.get('/activity-dates/guide-instances');
          const instances = instancesResponse.data.instances || [];
          const existingInstance = instances.find(instance => instance.activity_id === parseInt(activityId));
          
          setGuideInstance(existingInstance || null);
        } catch (instanceErr) {
          console.warn('Could not check guide instances:', instanceErr);
          // Non-blocking error, don't show to user
        }
      } catch (err) {
        console.error('Error fetching activity data:', err);
        
        // Enhanced error handling
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (err.response.status === 404) {
            setError('Activity not found. It may have been deleted or you may not have permission to access it.');
          } else if (err.response.status === 403) {
            setError('You do not have permission to access this activity.');
          } else if (err.response.data && err.response.data.error) {
            setError(`Server error: ${err.response.data.error}`);
          } else {
            setError(`Error ${err.response.status}: Failed to load activity data.`);
          }
        } else if (err.request) {
          // The request was made but no response was received
          setError('Network error. Please check your internet connection and try again.');
        } else {
          // Something happened in setting up the request
          setError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && activityId) {
      fetchData();
    }
  }, [isAuthenticated, activityId]);
  
  // Create guide instance if needed
  const ensureGuideInstance = async () => {
    // If guide instance already exists, return it
    if (guideInstance) {
      return guideInstance;
    }
    
    try {
      // Create a new guide instance
      const response = await api.post('/activity-dates/guide-instances', {
        activity_id: activityId
      });
      
      const newInstance = response.data.instance;
      setGuideInstance(newInstance);
      return newInstance;
    } catch (err) {
      console.error('Error creating guide instance:', err);
      throw new Error('Failed to create guide instance. Please try again.');
    }
  };
  
  // Handle date form input changes
  const handleDateFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'max_reservations') {
      setDateForm({
        ...dateForm,
        [name]: parseInt(value, 10)
      });
    } else {
      setDateForm({
        ...dateForm,
        [name]: value
      });
    }
  };
  
  // Open modal to add a new date
  const handleAddDate = () => {
    setEditingDate(null);
    // Get tomorrow's date in YYYY-MM-DD format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    setDateForm({
      date: tomorrowStr,
      start_time: '09:00',
      end_time: '17:00',
      max_reservations: 10,
      location: '',
      status: 'open'
    });
    setShowDateModal(true);
  };
  
  // Open modal to edit an existing date
  const handleEditDate = (date) => {
    setEditingDate(date);
    
    // Parse start and end times to ensure they are in HH:MM format
    const startTime = date.start_time.substring(0, 5);
    const endTime = date.end_time.substring(0, 5);
    
    setDateForm({
      date: new Date(date.date).toISOString().split('T')[0],
      start_time: startTime,
      end_time: endTime,
      max_reservations: date.max_reservations,
      location: date.location || '',
      status: date.status
    });
    setShowDateModal(true);
  };
  
  // Open modal to confirm deletion
  const handleDeleteDateConfirm = (date) => {
    setDateToDelete(date);
    setShowDeleteModal(true);
  };
  
  // Prepare date data for API submission
  const prepareDateData = (formData) => {
    return {
      ...formData,
      activity_id: parseInt(activityId, 10),
      start_time: formatTimeWithSeconds(formData.start_time),
      end_time: formatTimeWithSeconds(formData.end_time)
    };
  };
  
  // Handle date form submission (add or update)
  const handleDateFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Ensure time fields have seconds
      const preparedData = prepareDateData(dateForm);
      
      if (editingDate) {
        // Update existing date
        await api.put(`/activity-dates/activity-dates/${editingDate.available_date_id}`, preparedData);
        
        // Update local state
        setActivityDates(
          activityDates.map(date => 
            date.available_date_id === editingDate.available_date_id 
              ? { 
                  ...date, 
                  ...preparedData,
                  date: preparedData.date, // Ensure date format is consistent
                } 
              : date
          )
        );
        
        setSuccess('Date updated successfully!');
      } else {
        // Ensure we have a guide instance
        await ensureGuideInstance();
        
        // Add new date
        const response = await api.post(`/activity-dates/add-date`, preparedData);
        
        // Add to local state
        setActivityDates([...activityDates, response.data.date]);
        
        setSuccess('New date added successfully!');
      }
      
      // Close modal
      setShowDateModal(false);
    } catch (err) {
      console.error('Error saving date:', err);
      
      // Enhanced error handling
      if (err.response) {
        if (err.response.status === 400) {
          setError(`Validation error: ${err.response.data.error || 'Please check your inputs.'}`);
        } else if (err.response.status === 403) {
          setError('Permission denied: You do not have permission to modify dates for this activity.');
        } else if (err.response.data && err.response.data.error) {
          setError(`Server error: ${err.response.data.error}`);
        } else {
          setError(`Error ${err.response.status}: Failed to save date.`);
        }
      } else if (err.request) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    }
  };
  
  // Handle actual date deletion
  const handleDeleteDate = async () => {
    if (!dateToDelete) return;
    
    try {
      await api.delete(`/activity-dates/activity-dates/${dateToDelete.available_date_id}`);
      
      // Update local state
      setActivityDates(
        activityDates.filter(date => date.available_date_id !== dateToDelete.available_date_id)
      );
      
      setSuccess('Date deleted successfully!');
      setShowDeleteModal(false);
      setDateToDelete(null);
    } catch (err) {
      console.error('Error deleting date:', err);
      
      // Enhanced error handling
      if (err.response) {
        if (err.response.status === 400) {
          setError(`Cannot delete date: ${err.response.data.error || 'It may have reservations.'}`);
        } else if (err.response.status === 403) {
          setError('Permission denied: You do not have permission to delete this date.');
        } else if (err.response.data && err.response.data.error) {
          setError(`Server error: ${err.response.data.error}`);
        } else {
          setError(`Error ${err.response.status}: Failed to delete date.`);
        }
      } else if (err.request) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      setShowDeleteModal(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get appropriate status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open':
        return 'bg-success';
      case 'closed':
        return 'bg-secondary';
      case 'canceled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };
  
  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Loading activity dates...</p>
      </Container>
    );
  }
  
  return (
    <Container className="py-4 activity-dates-container">
      <Card className="shadow-sm">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="mb-0">Manage Activity Dates</h1>
            <Button 
              variant="primary"
              onClick={() => navigate(`/activities/${activityId}`)}
            >
              Back to Activity
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          
          {activity && (
            <div className="activity-info mb-4">
              <h2>{activity.title}</h2>
              <p className="text-muted">
                <strong>Location:</strong> {activity.location_name || 'Not specified'} | 
                <strong> Difficulty:</strong> {activity.difficulty_level} | 
                <strong> Price:</strong> ${activity.price}
              </p>
              
              {guideInstance ? (
                <Alert variant="info">
                  <div className="d-flex align-items-center">
                    <FaUserCheck className="me-2" />
                    <span>You are registered as a guide for this activity.</span>
                  </div>
                </Alert>
              ) : (
                <Alert variant="warning">
                  <p>
                    You'll be automatically registered as a guide for this activity when you add your first available date.
                  </p>
                </Alert>
              )}
            </div>
          )}
          
          <div className="d-flex justify-content-between mb-3">
            <h3>Available Dates</h3>
            <Button variant="success" onClick={handleAddDate}>
              <FaCalendarPlus className="me-2" /> Add New Date
            </Button>
          </div>
          
          {activityDates.length === 0 ? (
            <Alert variant="info">
              No dates have been set for this activity yet. Click the "Add New Date" button to add availability.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover className="activity-dates-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Reservations</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activityDates.sort((a, b) => new Date(a.date) - new Date(b.date)).map(date => (
                    <tr key={date.available_date_id}>
                      <td>{formatDate(date.date)}</td>
                      <td>
                        {date.start_time.substring(0, 5)} - {date.end_time.substring(0, 5)}
                      </td>
                      <td>{date.location || activity?.location_name || 'Default location'}</td>
                      <td>{date.max_reservations}</td>
                      <td>
                        {date.current_reservations || 0} / {date.max_reservations}
                        <div className="reservation-bar">
                          <div 
                            className="reservation-progress" 
                            style={{ 
                              width: `${((date.current_reservations || 0) / date.max_reservations) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(date.status)}`}>
                          {date.status.charAt(0).toUpperCase() + date.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEditDate(date)}
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteDateConfirm(date)}
                            disabled={date.current_reservations > 0}
                            title={date.current_reservations > 0 ? "Cannot delete dates with reservations" : "Delete date"}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Add/Edit Date Modal */}
      <Modal show={showDateModal} onHide={() => setShowDateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingDate ? 'Edit Available Date' : 'Add New Available Date'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleDateFormSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Date*</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={dateForm.date}
                onChange={handleDateFormChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
              <Form.Text className="text-muted">
                Date format: YYYY-MM-DD
              </Form.Text>
            </Form.Group>
            
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time*</Form.Label>
                  <Form.Control
                    type="time"
                    name="start_time"
                    value={dateForm.start_time}
                    onChange={handleDateFormChange}
                    required
                  />
                  <Form.Text className="text-muted">
                    24-hour format (HH:MM)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>End Time*</Form.Label>
                  <Form.Control
                    type="time"
                    name="end_time"
                    value={dateForm.end_time}
                    onChange={handleDateFormChange}
                    required
                  />
                  <Form.Text className="text-muted">
                    24-hour format (HH:MM)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Location (optional)</Form.Label>
              <Form.Control
                type="text"
                name="location"
                value={dateForm.location}
                onChange={handleDateFormChange}
                placeholder="Leave blank to use activity's default location"
              />
            </Form.Group>
            
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Reservations*</Form.Label>
                  <Form.Control
                    type="number"
                    name="max_reservations"
                    value={dateForm.max_reservations}
                    onChange={handleDateFormChange}
                    required
                    min="1"
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Status*</Form.Label>
                  <Form.Select
                    name="status"
                    value={dateForm.status}
                    onChange={handleDateFormChange}
                    required
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="canceled">Canceled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end mt-4">
              <Button variant="secondary" className="me-2" onClick={() => setShowDateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingDate ? 'Update Date' : 'Add Date'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {dateToDelete && (
            <p>
              Are you sure you want to delete the date:<br />
              <strong>{formatDate(dateToDelete.date)} ({dateToDelete.start_time.substring(0, 5)} - {dateToDelete.end_time.substring(0, 5)})</strong>?
            </p>
          )}
          <Alert variant="warning">
            This action cannot be undone. Once deleted, this date will no longer be available for reservations.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteDate}>
            Delete Date
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ActivityDates;