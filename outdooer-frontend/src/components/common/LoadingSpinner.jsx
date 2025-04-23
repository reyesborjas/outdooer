// src/components/common/LoadingSpinner.jsx
import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
      <div className="text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">{message}</p>
      </div>
    </Container>
  );
};

export default LoadingSpinner;