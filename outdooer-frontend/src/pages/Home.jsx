// src/pages/Home.jsx
import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <Container className="py-5 text-center">
      <h1>Welcome to Outdooer!</h1>
      <p className="lead">
        Connecting outdoor enthusiasts with certified guides. 
        Explore activities, join expeditions, and discover the outdoors.
      </p>
      <div className="mt-4">
        <Button as={Link} to="/activities" variant="primary" className="me-3">
          Explore Activities
        </Button>
        <Button as={Link} to="/register" variant="outline-primary">
          Sign Up
        </Button>
      </div>
    </Container>
  );
};

export default Home;