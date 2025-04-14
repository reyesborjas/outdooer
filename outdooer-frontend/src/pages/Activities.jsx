import { useState } from 'react';
import { Container, Row, Col, Card, Badge, Form, Button } from 'react-bootstrap';

const Activities = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Mock data for activities
  const activities = [
    {
      id: 1,
      title: 'Mt. Rainier Summit Climb',
      description: 'A challenging climb to the summit of Mt. Rainier with experienced guides.',
      location: 'Mt. Rainier National Park, WA',
      difficulty: 'Hard',
      date: '2025-05-15',
      duration: '3 days',
      price: 1200,
      image: 'https://via.placeholder.com/300x200?text=Mt.+Rainier'
    },
    {
      id: 2,
      title: 'Grand Canyon Day Hike',
      description: 'Explore the breathtaking views of the Grand Canyon on this guided day hike.',
      location: 'Grand Canyon National Park, AZ',
      difficulty: 'Medium',
      date: '2025-04-20',
      duration: '1 day',
      price: 150,
      image: 'https://via.placeholder.com/300x200?text=Grand+Canyon'
    },
    {
      id: 3,
      title: 'Kayaking the Colorado River',
      description: 'Paddle through stunning canyons and rapids on this kayaking adventure.',
      location: 'Colorado River, CO',
      difficulty: 'Medium',
      date: '2025-06-05',
      duration: '2 days',
      price: 350,
      image: 'https://via.placeholder.com/300x200?text=Colorado+River'
    },
    {
      id: 4,
      title: 'Yellowstone Wildlife Safari',
      description: 'Spot bison, wolves, bears and more on this guided wildlife tour of Yellowstone.',
      location: 'Yellowstone National Park, WY',
      difficulty: 'Easy',
      date: '2025-07-10',
      duration: '1 day',
      price: 200,
      image: 'https://via.placeholder.com/300x200?text=Yellowstone'
    },
  ];
  
  // Filter activities based on search term and difficulty filter
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          activity.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || activity.difficulty.toLowerCase() === filter.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });
  
  return (
    <Container className="py-5">
      <h1 className="mb-4">Explore Activities</h1>
      
      {/* Search and filter section */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Control 
              type="text" 
              placeholder="Search by name or location" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Difficulty Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Button variant="outline-primary" className="w-100">
            Filter
          </Button>
        </Col>
      </Row>
      
      {/* Activities grid */}
      <Row className="g-4">
        {filteredActivities.map((activity) => (
          <Col md={6} lg={4} key={activity.id}>
            <Card className="h-100 shadow-sm">
              <Card.Img variant="top" src={activity.image} />
              <Card.Body>
                <Card.Title>{activity.title}</Card.Title>
                <Card.Text className="text-muted small mb-2">
                  <i className="bi bi-geo-alt"></i> {activity.location}
                </Card.Text>
                <Card.Text className="mb-3">{activity.description}</Card.Text>
                <div className="d-flex justify-content-between align-items-center">
                  <Badge bg={
                    activity.difficulty === 'Easy' ? 'success' : 
                    activity.difficulty === 'Medium' ? 'warning' : 'danger'
                  }>
                    {activity.difficulty}
                  </Badge>
                  <div className="text-muted small">
                    {activity.duration} | {new Date(activity.date).toLocaleDateString()}
                  </div>
                </div>
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between align-items-center">
                <strong>${activity.price}</strong>
                <Button variant="primary" size="sm">View Details</Button>
              </Card.Footer>
            </Card>
          </Col>
        ))}
        
        {filteredActivities.length === 0 && (
          <Col>
            <div className="text-center py-5">
              <h4>No activities found</h4>
              <p>Try changing your search criteria</p>
            </div>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default Activities;