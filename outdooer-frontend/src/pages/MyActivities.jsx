// src/pages/MyActivities.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Tabs, Tab, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaEdit, FaEye, FaCalendarAlt, FaTrash } from 'react-icons/fa';
import { activitiesApi } from '../api/activities';
import '../styles/MyActivities.css';

const MyActivities = () => {
  const navigate = useNavigate();
  const { 
    user, 
    isAuthenticated, 
    isGuide, 
    canCreateActivity, 
    canEditActivity, 
    canDeleteActivity 
  } = useContext(AuthContext);
  
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  
  // On component mount, check if user is authenticated and is a guide
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!isGuide()) {
      navigate('/unauthorized');
      return;
    }
  }, [isAuthenticated, isGuide, navigate]);
  
  // Fetch user's activities
  useEffect(() => {
    const fetchMyActivities = async () => {
      try {
        setLoading(true);
        const response = await activitiesApi.getMyActivities();
        
        // Debug logs
        console.log('Activities response:', response);
        
        setActivities(response.activities || []);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load your activities. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && isGuide()) {
      fetchMyActivities();
    }
  }, [isAuthenticated, isGuide]);
  
  // Filter activities based on selected tab
  const filteredActivities = activities.filter(activity => {
    if (activeTab === 'active') {
      return activity.activity_status === 'active';
    } else if (activeTab === 'draft') {
      return activity.activity_status === 'draft';
    } else if (activeTab === 'completed') {
      return activity.activity_status === 'completed';
    } else if (activeTab === 'canceled') {
      return activity.activity_status === 'canceled';
    }
    return true; // All tab
  });
  
  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Handle edit action
  const handleEdit = (activityId) => {
    navigate(`/activities/${activityId}/edit`);
  };
  
  // Handle view action
  const handleView = (activityId) => {
    navigate(`/activities/${activityId}`);
  };
  
  // Handle manage dates action
  const handleManageDates = (activityId) => {
    navigate(`/activities/${activityId}/dates`);
  };
  
  // Handle delete action
  const handleDelete = async (activityId) => {
    if (window.confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
      try {
        await activitiesApi.deleteActivity(activityId);
        // Remove the deleted activity from the state
        setActivities(activities.filter(a => a.activity_id !== activityId));
      } catch (err) {
        console.error('Error deleting activity:', err);
        setError('Failed to delete activity. Please try again.');
      }
    }
  };
  
  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'secondary';
      case 'completed':
        return 'info';
      case 'canceled':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  // Get difficulty badge variant
  const getDifficultyBadgeVariant = (difficulty) => {
    if (!difficulty) return 'secondary';
    
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'success';
      case 'moderate':
        return 'warning';
      case 'difficult':
      case 'extreme':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Loading your activities...</p>
      </Container>
    );
  }
  
  return (
    <Container className="py-4 my-activities-container">
      <Row className="mb-4">
        <Col>
          <h1>My Activities</h1>
          <p className="text-muted">
            Manage activities based on your role level
          </p>
        </Col>
        <Col xs="auto" className="d-flex align-items-center">
          {canCreateActivity() && (
            <Button 
              variant="primary" 
              onClick={() => navigate('/activities/new')}
            >
              Create New Activity
            </Button>
          )}
        </Col>
      </Row>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Card className="shadow-sm">
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="active" title={`Active (${activities.filter(a => a.activity_status === 'active').length})`} />
            <Tab eventKey="draft" title={`Draft (${activities.filter(a => a.activity_status === 'draft').length})`} />
            <Tab eventKey="completed" title={`Completed (${activities.filter(a => a.activity_status === 'completed').length})`} />
            <Tab eventKey="canceled" title={`Canceled (${activities.filter(a => a.activity_status === 'canceled').length})`} />
            <Tab eventKey="all" title={`All (${activities.length})`} />
          </Tabs>
          
          {filteredActivities.length === 0 ? (
            <Alert variant="info">
              {activeTab === 'all' 
                ? "You don't have any activities available based on your role." 
                : `You don't have any ${activeTab} activities available.`}
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="activities-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Team</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Difficulty</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map(activity => (
                    <tr key={activity.activity_id}>
                      <td className="title-cell">{activity.title}</td>
                      <td>{activity.team_name || 'N/A'}</td>
                      <td>{activity.location_name || 'N/A'}</td>
                      <td>{activity.activity_type_name || 'N/A'}</td>
                      <td>{formatPrice(activity.price)}</td>
                      <td>
                        <Badge bg={getDifficultyBadgeVariant(activity.difficulty_level)}>
                          {activity.difficulty_level || 'N/A'}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(activity.activity_status)}>
                          {activity.activity_status}
                        </Badge>
                      </td>
                      <td>{formatDate(activity.created_at)}</td>
                      <td>
                        <div className="d-flex action-buttons">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            title="View Details"
                            onClick={() => handleView(activity.activity_id)}
                            className="me-1"
                          >
                            <FaEye />
                          </Button>
                          
                          {canEditActivity(activity) && (
                            <Button 
                              variant="outline-secondary" 
                              size="sm" 
                              title="Edit Activity"
                              onClick={() => handleEdit(activity.activity_id)}
                              className="me-1"
                            >
                              <FaEdit />
                            </Button>
                          )}
                          
                          {canEditActivity(activity) && (
                            <Button 
                              variant="outline-info" 
                              size="sm" 
                              title="Manage Dates"
                              onClick={() => handleManageDates(activity.activity_id)}
                              className="me-1"
                            >
                              <FaCalendarAlt />
                            </Button>
                          )}
                          
                          {canDeleteActivity(activity) && (
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              title="Delete Activity"
                              onClick={() => handleDelete(activity.activity_id)}
                            >
                              <FaTrash />
                            </Button>
                          )}
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
    </Container>
  );
};

export default MyActivities;