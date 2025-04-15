// src/pages/ActivityDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaMountain, FaDollarSign, FaUsers } from 'react-icons/fa';
import '../styles/ActivityDetails.css';

const ActivityDetails = () => {
  const { activityId } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActivityDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/activities/${activityId}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched activity details:', data);
        
        if (data.activity) {
          setActivity(data.activity);
        } else {
          setActivity(data); // Some APIs might return the activity directly
        }
      } catch (err) {
        console.error('Error fetching activity details:', err);
        setError('Failed to load activity details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (activityId) {
      fetchActivityDetails();
    }
  }, [activityId]);

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  // Get appropriate badge color for difficulty level
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

  const handleReservation = () => {
    // This would navigate to a reservation form or add to cart
    alert('Reservation functionality will be implemented here');
  };

  const handleBack = () => {
    navigate('/activities');
  };

  return (
    <Container className="py-4 activity-details-container">
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading activity details...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : activity ? (
        <>
          <Button 
            variant="outline-secondary" 
            className="mb-3 back-button" 
            onClick={handleBack}
          >
            &larr; Back to Activities
          </Button>
          
          <Card className="activity-details-card">
            <Row className="g-0">
              <Col md={5} className="activity-image-col">
                <div className="activity-image-container">
                  <img 
                    src={activity.image_url || 'https://via.placeholder.com/800x600?text=No+Image'} 
                    alt={activity.title || activity.name} 
                    className="img-fluid rounded-start" 
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x600?text=No+Image';
                    }}
                  />
                </div>
              </Col>
              <Col md={7}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="activity-title">
                      {activity.title || activity.name}
                    </Card.Title>
                    <Badge 
                      bg={getDifficultyBadgeVariant(activity.difficulty_level)}
                      className="difficulty-badge"
                    >
                      {activity.difficulty_level || 'Difficulty not specified'}
                    </Badge>
                  </div>
                  
                  <Card.Text className="activity-description">
                    {activity.description || 'No description available.'}
                  </Card.Text>
                  
                  <ListGroup variant="flush" className="activity-details-list">
                    <ListGroup.Item>
                      <FaMapMarkerAlt className="me-2 list-icon" />
                      <strong>Location:</strong> {activity.location_name || 'Location not specified'}
                    </ListGroup.Item>
                    
                    <ListGroup.Item>
                      <FaDollarSign className="me-2 list-icon" />
                      <strong>Price:</strong> {formatPrice(activity.price)}
                    </ListGroup.Item>
                    
                    <ListGroup.Item>
                      <FaClock className="me-2 list-icon" />
                      <strong>Duration:</strong> {activity.duration || 'Not specified'}
                    </ListGroup.Item>
                    
                    <ListGroup.Item>
                      <FaUsers className="me-2 list-icon" />
                      <strong>Group Size:</strong> {activity.max_participants ? 
                        `Up to ${activity.max_participants} participants` : 
                        'Not specified'}
                    </ListGroup.Item>
                    
                    <ListGroup.Item>
                      <FaMountain className="me-2 list-icon" />
                      <strong>Activity Type:</strong> {activity.activity_type || 'Not specified'}
                    </ListGroup.Item>
                    
                    <ListGroup.Item>
                      <FaCalendarAlt className="me-2 list-icon" />
                      <strong>Available Dates:</strong> {activity.available_dates || 'Contact for availability'}
                    </ListGroup.Item>
                  </ListGroup>
                  
                  <div className="mt-4 d-grid gap-2">
                    <Button 
                      variant="primary" 
                      size="lg"
                      onClick={handleReservation}
                    >
                      Reserve This Activity
                    </Button>
                  </div>
                </Card.Body>
              </Col>
            </Row>
          </Card>
          
          {/* Additional sections could be added here, such as:
              - Related activities
              - Reviews and ratings
              - Guides information
              - Equipment needed
              - FAQ
          */}
        </>
      ) : (
        <Alert variant="warning">
          Activity not found. The activity may have been removed or you may have followed an invalid link.
        </Alert>
      )}
    </Container>
  );
};

export default ActivityDetails;