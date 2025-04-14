// src/components/layout/Navbar.jsx
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const AppNavbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img 
            src="/logo.png" 
            alt="Outdooer Logo" 
            height="30" 
            className="d-inline-block align-top me-2"
          />
          Outdooer
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" end>Home</Nav.Link>
            <Nav.Link as={NavLink} to="/activities">Activities</Nav.Link>
            <Nav.Link as={NavLink} to="/expeditions">Expeditions</Nav.Link>
            <Nav.Link as={NavLink} to="/teams">Guide Teams</Nav.Link>
          </Nav>
          
          <Nav>
            {isAuthenticated ? (
              <>
                <Nav.Link as={NavLink} to="/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={NavLink} to="/profile">
                  {user ? `${user.first_name}` : 'Profile'}
                </Nav.Link>
                <Button 
                  variant="outline-primary" 
                  onClick={logout}
                  className="ms-2"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login">Login</Nav.Link>
                <Button 
                  as={Link} 
                  to="/register" 
                  variant="primary"
                  className="ms-2"
                >
                  Sign Up
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;