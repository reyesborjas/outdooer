// src/pages/MyActivities.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Spinner, Alert, 
         Tab, Tabs, Dropdown, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaEdit, FaEye, FaCalendarAlt, FaTrashAlt } from 'react-icons/fa';
import api from '../api';
import '../styles/MyActivities.css';

const MyActivities = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isGuide } = useContext(AuthContext);
  
  // Activities state
  const [createdActivities, setCreatedActivities] = useState([]);
  const [ledActivities, setLedActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('created');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  
  // Check if user is authorized to access this page
  useEffect(() => {
    if (!isAuthenticated || !isGuide()) {
      navigate('/unauthorized');
    }
  }, [isAuthenticated, isGuide, navigate]);
  
  // Fetch user's activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!isAuthenticated || !user?.user_id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch activities created by the user
        const createdResponse = await api.get(`/activities/created-by/${user.user_id}`);
        setCreatedActivities(createdResponse.data.activities || []);
        
        // Fetch activities led by the user
        const ledResponse = await api.get(`/activities/led-by/${user.user_id}`);
        setLedActivities(ledResponse.data.activities || []);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load your activities. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, [isAuthenticated, user]);
  
  // Filter activities based on search term and status filter
  const filterActivities = (activities) => {
    return activities.filter(activity => {
      const matchesSearch = (
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (activity.description && activity.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (activity.location_name && activity.location_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      const matchesStatus = statusFilter === 'all' || activity.activity_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };
  
  // Get filtered activities based on active tab
  const getFilteredActivities = () => {
    const activities = activeTab === 'created' ? createdActivities : ledActivities;
    return filterActivities(activities);
  };
  
  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };
  
  // Handle activity deletion confirmation
  const confirmDeleteActivity = (activity) => {
    setActivityToDelete(activity);
    setShowDeleteModal(true);
  };
  
  // Handle actual activity deletion
  const deleteActivity = async () => {
    if (!activityToDelete) return;
    
    try {
      await api.delete(`/activities/${activityToDelete.activity_id}`);
      
      // Update the activities lists
      setCreatedActivities(createdActivities.filter(
        activity => activity.activity_id !== activityToDelete.activity_id
      ));
      
      setLedActivities(ledActivities.filter(
        activity => activity.activity_id !== activityToDelete.activity_id
      ));
      
      setShowDeleteModal(false);
      setActivityToDelete(null);
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError('Failed to delete activity. Please try again.');
    }
  };
  
  // Get appropriate status badge color
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'secondary';
      case 'canceled':
        return 'danger';
      case 'completed':
        return 'info';
      default:
        return 'secondary';
    }
  };
  
  // Get appropriate difficulty badge color
  const getDifficultyBadgeVariant = (difficulty) => {
    if (!difficulty) return 'secondary';
    
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'success';
      case 'moderate':
      case 'medium':
        return 'warning';
      case 'difficult':
      case 'hard':
      case 'extreme':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  // Handle navigation to edit activity
  const handleEditActivity = (activityId) => {
    navigate(`/edit-activity/${activityId}`);
  };
  
  // Handle navigation to view activity details
  const handleViewActivity = (activityId) => {
    navigate(`/activities/${activityId}`);
  };
  
  // Handle navigation to manage activity dates
  const handleManageDates = (activityId) => {
    navigate(`/activity-dates/${activityId}`);
  };
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <Container className="py-4 my-activities-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Activities</h1>
        <Button 
          variant="primary" 
          onClick={() => navigate('/create-activity')}
        >
          Create New Activity
        </Button>
      </div>
      
      {/* Search and filter section */}
      <Card className="mb-4 filter-card">
        <Card.Body>
          <Row>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Search Activities</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Filter by Status</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="canceled">Canceled</option>
                  <option value="completed">Completed</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Tabs for created vs led activities */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="created" title={`Activities I Created (${createdActivities.length})`}>
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading your activities...</p>
            </div>
          ) : getFilteredActivities().length > 0 ? (
            <Row className="g-4">
              {getFilteredActivities().map((activity) => (
                <Col key={activity.activity_id} md={6} lg={4}>
                  <Card className="h-100 activity-card">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <Badge bg={getStatusBadgeVariant(activity.activity_status)}>
                        {activity.activity_status?.charAt(0).toUpperCase() + activity.activity_status?.slice(1) || 'Unknown'}
                      </Badge>
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="light" size="sm" id={`dropdown-${activity.activity_id}`}>
                          Actions
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleViewActivity(activity.activity_id)}>
                            <FaEye className="me-2" /> View Details
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleEditActivity(activity.activity_id)}>
                            <FaEdit className="me-2" /> Edit Activity
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleManageDates(activity.activity_id)}>
                            <FaCalendarAlt className="me-2" /> Manage Dates
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item 
                            className="text-danger"
                            onClick={() => confirmDeleteActivity(activity)}
                          >
                            <FaTrashAlt className="me-2" /> Delete Activity
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Card.Header>
                    <Card.Body>
                      <Card.Title>{activity.title}</Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">
                        <i className="bi bi-geo-alt"></i> {activity.location_name || 'Location not specified'}
                      </Card.Subtitle>
                      <div className="d-flex justify-content-between mb-2">
                        <Badge bg={getDifficultyBadgeVariant(activity.difficulty_level)}>
                          {activity.difficulty_level || 'Difficulty not specified'}
                        </Badge>
                        <div className="price">
                          {formatPrice(activity.price)}
                        </div>
                      </div>
                      <Card.Text className="activity-description">
                        {activity.description || 'No description available.'}
                      </Card.Text>
                    </Card.Body>
                    <Card.Footer className="bg-transparent d-flex justify-content-between">
                      <div className="text-muted small">
                        <strong>Created:</strong> {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-primary small">
                        <strong>Reservations:</strong> {activity.reservation_count || 0}
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              <p className="mb-0">No activities found matching your criteria.</p>
              {searchTerm || statusFilter !== 'all' ? (
                <p className="mt-2">Try adjusting your search filters.</p>
              ) : (
                <div className="mt-3">
                  <p>You haven't created any activities yet.</p>
                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/create-activity')}
                  >
                    Create Your First Activity
                  </Button>
                </div>
              )}
            </Alert>
          )}
        </Tab>
        
        <Tab eventKey="led" title={`Activities I Lead (${ledActivities.length})`}>
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading your activities...</p>
            </div>
          ) : getFilteredActivities().length > 0 ? (
            <Row className="g-4">
              {getFilteredActivities().map((activity) => (
                <Col key={activity.activity_id} md={6} lg={4}>
                  <Card className="h-100 activity-card">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <Badge bg={getStatusBadgeVariant(activity.activity_status)}>
                        {activity.activity_status?.charAt(0).toUpperCase() + activity.activity_status?.slice(1) || 'Unknown'}
                      </Badge>
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="light" size="sm" id={`dropdown-${activity.activity_id}`}>
                          Actions
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleViewActivity(activity.activity_id)}>
                            <FaEye className="me-2" /> View Details
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleManageDates(activity.activity_id)}>
                            <FaCalendarAlt className="me-2" /> Manage Dates
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Card.Header>
                    <Card.Body>
                      <Card.Title>{activity.title}</Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">
                        <i className="bi bi-geo-alt"></i> {activity.location_name || 'Location not specified'}
                      </Card.Subtitle>
                      <div className="d-flex justify-content-between mb-2">
                        <Badge bg={getDifficultyBadgeVariant(activity.difficulty_level)}>
                          {activity.difficulty_level || 'Difficulty not specified'}
                        </Badge>
                        <div className="price">
                          {formatPrice(activity.price)}
                        </div>
                      </div>
                      <Card.Text className="activity-description">
                        {activity.description || 'No description available.'}
                      </Card.Text>
                    </Card.Body>
                    <Card.Footer className="bg-transparent d-flex justify-content-between">
                      <div className="text-muted small">
                        <strong>Created by:</strong> {activity.creator_name || 'Unknown'}
                      </div>
                      <div className="text-primary small">
                        <strong>Reservations:</strong> {activity.reservation_count || 0}
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              <p className="mb-0">No activities found matching your criteria.</p>
              {searchTerm || statusFilter !== 'all' ? (
                <p className="mt-2">Try adjusting your search filters.</p>
              ) : (
                <p>You aren't the leader for any activities yet.</p>
              )}
            </Alert>
          )}
        </Tab>
      </Tabs>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {activityToDelete && (
            <>
              <p>Are you sure you want to delete the activity:</p>
              <p className="fw-bold">{activityToDelete.title}</p>
              <Alert variant="warning">
                This action cannot be undone. Deleting this activity will also remove all associated
                reservations and scheduling information.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteActivity}>
            Delete Activity
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MyActivities;