// src/components/SimilarActivityWarning.jsx
import React from 'react';
import { Alert, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const SimilarActivityWarning = ({ similarActivities }) => {
  if (!similarActivities || similarActivities.length === 0) {
    return null;
  }

  return (
    <Alert variant="warning" className="mt-3">
      <Alert.Heading>Similar Activities Found</Alert.Heading>
      <p>
        We found {similarActivities.length} {similarActivities.length === 1 ? 'activity' : 'activities'} with the same type and location. 
        You may want to check if your activity is a duplicate before proceeding.
      </p>
      
      <ListGroup className="mt-3">
        {similarActivities.map(activity => (
          <ListGroup.Item key={activity.activity_id} className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{activity.title}</strong>
              <div className="small text-muted">
                Difficulty: {activity.difficulty_level}, Price: ${activity.price}
              </div>
            </div>
            <Link 
              to={`/activities/${activity.activity_id}`} 
              className="btn btn-sm btn-outline-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              View
            </Link>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Alert>
  );
};

export default SimilarActivityWarning;