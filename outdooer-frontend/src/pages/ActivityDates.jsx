// src/pages/ActivityDates.jsx
import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner, Table, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { FaCalendarPlus, FaEdit, FaTrash } from 'react-icons/fa';
import '../styles/ActivityDates.css';

const ActivityDates = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isGuide } = useContext(AuthContext);
  
  // Activity data
  const [activity, setActivity] = useState(null);
  const [activityDates, setActivityDates] = useState([]);
  
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
  
  // Check if user is authorized
  useEffect(() => {
    if (!isAuthenticated || !isGuide()) {
      navigate('/unauthorized');
    }
  }, [isAuthenticated, isGuide, navigate]);
  
  // Fetch activity data and dates
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
      } catch (err) {
        console.error('Error fetching activity data:', err);
        setError('Failed to load activity data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && activityId) {
      fetchData();
    }
  }, [isAuthenticated, activityId]);
  
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
    setDateForm({
      date: '',
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
    setDateForm({
      date: new Date(date.date).toISOString().split('T')[0],
      start_time: date.start_time,
      end_time: date.end_time,
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
  
  // Handle date form submission (add or update)
  const handleDateFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (editingDate) {
        // Update existing date
        await api.put(`/activity-dates/${editingDate.available_date_id}`, dateForm);
        
        // Update local state
        setActivityDates(
          activityDates.map(date => 
            date.available_date_id === editingDate.available_date_id 
              ? { ...date, ...dateForm } 
              : date
          )
        );
        
        setSuccess('Date updated successfully!');
      } else {
        // Add new date
        const response = await api.post(`/activities/${activityId}/dates`, dateForm);
        
        // Add to local state
        setActivityDates([...activityDates, response.data.date]);
        
        setSuccess('New date added successfully!');
      }
      
      // Close modal
      setShowDateModal(false);
    } catch (err) {
      console.error('Error saving date:', err);
      setError(err.response?.data?.error || 'Failed to save date. Please try again.');
    }
  };
  
  // Handle actual date deletion
  const handleDeleteDate = async () => {
    if (!dateToDelete) return;
    
    try {
      await api.delete(`/activity-dates/${dateToDelete.available_date_id}`);
      
      // Update local state
      setActivityDates(
        activityDates.filter(date => date.available_date_id !== dateToDelete.available_date_id)
      );
      
      setSuccess('Date deleted successfully!');
      setShowDeleteModal(false);
      setDateToDelete(null);
    } catch (err) {
      console.error('Error deleting date:', err);
      setError('Failed to delete date. Please try again.');
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
                        {date.start_time} - {date.end_time}
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
              <strong>{formatDate(dateToDelete.date)} ({dateToDelete.start_time} - {dateToDelete.end_time})</strong>?
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