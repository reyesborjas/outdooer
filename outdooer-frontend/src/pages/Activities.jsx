// src/pages/Activities.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../styles/Activities.css';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const navigate = useNavigate();

  // Fetch activities from the database
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/activities');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched activities:', data);
        
        if (Array.isArray(data.activities)) {
          setActivities(data.activities);
          setFilteredActivities(data.activities);
        } else if (Array.isArray(data)) {
          setActivities(data);
          setFilteredActivities(data);
        } else {
          console.warn('Unexpected API response format:', data);
          setActivities([]);
          setFilteredActivities([]);
        }
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load activities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Apply filters when search term or difficulty filter changes
  useEffect(() => {
    if (activities.length > 0) {
      const filtered = activities.filter(activity => {
        const matchesSearch = (
          (activity.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
          (activity.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (activity.location_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
        
        const matchesDifficulty = difficultyFilter === 'all' || 
          activity.difficulty_level?.toLowerCase() === difficultyFilter.toLowerCase();
        
        return matchesSearch && matchesDifficulty;
      });
      
      setFilteredActivities(filtered);
    }
  }, [searchTerm, difficultyFilter, activities]);

  // Handle details view
  const handleViewDetails = (activityId) => {
    navigate(`/activities/${activityId}`);
  };

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
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

  return (
    <Container className="py-4 activities-container">
      <h1 className="mb-4 text-center">Explore Activities</h1>

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
                <Form.Label>Filter by Difficulty</Form.Label>
                <Form.Select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="difficult">Difficult</option>
                  <option value="extreme">Extreme</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Display activities */}
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading activities...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : filteredActivities.length > 0 ? (
        <Row className="g-4">
          {filteredActivities.map((activity) => (
            <Col key={activity.id || activity.activity_id} md={6} lg={4}>
              <Card className="h-100 activity-card">
                {activity.image_url && (
                  <div className="activity-image-container">
                    <Card.Img
                      variant="top"
                      src={activity.image_url}
                      alt={activity.title || activity.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                  </div>
                )}
                <Card.Body>
                  <Card.Title>{activity.title || activity.name}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    <i className="bi bi-geo-alt"></i> {activity.location_name || 'Location not specified'}
                  </Card.Subtitle>
                  <div className="d-flex justify-content-between mb-2">
                    <Badge bg={getDifficultyBadgeVariant(activity.difficulty_level)}>
                      {activity.difficulty_level || 'Difficulty not specified'}
                    </Badge>
                    <div className="price">
                      {formatPrice(activity.price || 0)}
                    </div>
                  </div>
                  <Card.Text className="activity-description">
                    {activity.description || 'No description available.'}
                  </Card.Text>
                </Card.Body>
                <Card.Footer className="bg-transparent">
                  <div className="d-grid">
                    <Button 
                      variant="primary" 
                      onClick={() => handleViewDetails(activity.id || activity.activity_id)}
                    >
                      View Details
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Alert variant="info" className="text-center">
          <p className="mb-0">No activities found matching your criteria.</p>
          {searchTerm || difficultyFilter !== 'all' ? (
            <p className="mt-2">Try adjusting your search filters.</p>
          ) : (
            <p className="mt-2">Check back later for new activities!</p>
          )}
        </Alert>
      )}
    </Container>
  );
};

export default Activities;