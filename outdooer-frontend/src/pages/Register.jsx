import { useState, useContext } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    date_of_birth: '',
    invitation_code: ''
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear validation error when field is changed
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: null
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }
    
    if (formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }
    
    // Date of birth validation - must be at least 13 years old
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 13) {
        errors.date_of_birth = 'You must be at least 13 years old to register';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // First validate the form client-side
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    // Create a new object without confirm_password
    const { confirm_password, ...registerData } = formData;
    
    try {
      const success = await register(registerData);
      if (success) {
        navigate('/dashboard');
      }
    } catch (err) {
      // Error is handled in AuthContext
      console.error('Registration submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Create Account</h2>
              
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="firstName">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.first_name}
                        required
                        placeholder="Enter your first name"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.first_name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="lastName">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.last_name}
                        required
                        placeholder="Enter your last name"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.last_name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.email}
                    required
                    placeholder="Enter your email"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="dob">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.date_of_birth}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.date_of_birth}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="password">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.password}
                        required
                        placeholder="Create a password"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.password}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="confirmPassword">
                      <Form.Label>Confirm Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.confirm_password}
                        required
                        placeholder="Confirm your password"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.confirm_password}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Label>Invitation Code (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  name="invitation_code"
                  value={formData.invitation_code}
                  onChange={handleChange}
                  placeholder="Enter invitation code if you have one"
                />
                <Form.Text className="text-muted">
                  Required to register as a guide. Leave empty for explorer account.
                </Form.Text>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="I agree to the Terms of Service and Privacy Policy"
                    required
                  />
                </Form.Group>
                
                <div className="d-grid gap-2 mt-4">
                  <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </div>
              </Form>
              
              <div className="text-center mt-3">
                <p className="mb-0">
                  Already have an account? <Link to="/login">Login</Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;