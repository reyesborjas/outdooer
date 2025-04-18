// src/pages/Unauthorized.jsx
import React from 'react';
import { Container, Row, Col, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';

const Unauthorized = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} className="text-center">
          <FaExclamationTriangle size={60} className="text-warning mb-4" />
          
          <h2 className="mb-3">Access Denied</h2>
          
          <Alert variant="warning">
            You don't have permission to access this page.
          </Alert>
          
          <p className="mb-4">
            This area requires specific permissions that your account doesn't have.
            If you believe this is a mistake, please contact support or your team leader.
          </p>
          
          <div className="d-flex justify-content-center gap-3">
            <Button as={Link} to="/dashboard" variant="primary">
              Go to Dashboard
            </Button>
            <Button as={Link} to="/" variant="outline-secondary">
              Return to Home
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Unauthorized;