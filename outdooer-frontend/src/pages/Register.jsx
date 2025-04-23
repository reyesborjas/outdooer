// src/pages/Register.jsx
import { useState, useContext, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authApi } from '../api/auth';

const Register = () => {
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    invitation_code: ''
  });

  // Validation and UI state
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState(null);
  const [invitationError, setInvitationError] = useState(null);
  const [validatingCode, setValidatingCode] = useState(false);

  // Router and Auth context
  const { register, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract invitation code from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeFromUrl = params.get('code');
    
    if (codeFromUrl) {
      setFormData(prev => ({ ...prev, invitation_code: codeFromUrl }));
      validateInvitationCode(codeFromUrl);
    }
  }, [location]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user modifies the field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    
    // Validate invitation code if changed and not empty
    if (name === 'invitation_code' && value.trim() !== '') {
      validateInvitationCode(value);
    } else if (name === 'invitation_code' && value.trim() === '') {
      setInvitationInfo(null);
      setInvitationError(null);
    }
  };

  // Validate invitation code
  const validateInvitationCode = async (code) => {
    setValidatingCode(true);
    setInvitationError(null);
    try {
      const response = await authApi.validateInvitationCode(code);
      setInvitationInfo(response);
    } catch (err) {
      console.error('Error validating invitation code:', err);
      setInvitationError('Invalid or expired invitation code');
    } finally {
      setValidatingCode(false);
    }
  };

  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    // Date of birth validation
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      // Check if user is at least 18 years old
      if (age < 18) {
        newErrors.date_of_birth = 'You must be at least 18 years old';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Remove confirmPassword as it's not needed for registration
      const { confirmPassword, ...registrationData } = formData;
      
      // Register the user
      const success = await register(registrationData);
      
      if (success) {
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Create an Account</h2>
              
              {error && <Alert variant="danger">{error}</Alert>}
              
              {/* Invitation code information */}
              {invitationInfo && invitationInfo.valid && (
                <Alert variant="success">
                  <p className="mb-0">
                    <strong>Valid invitation code!</strong> You're registering as a{' '}
                    <strong>{invitationInfo.role_type.replace('_', ' ')}</strong>.
                    {invitationInfo.team_name && (
                      <span> You'll be joining team <strong>{invitationInfo.team_name}</strong>.</span>
                    )}
                  </p>
                </Alert>
              )}
              
              {invitationError && (
                <Alert variant="danger">
                  {invitationError}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="first_name">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        isInvalid={!!errors.first_name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.first_name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="last_name">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        isInvalid={!!errors.last_name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.last_name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="date_of_birth">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    isInvalid={!!errors.date_of_birth}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.date_of_birth}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="password">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        isInvalid={!!errors.password}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.password}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="confirmPassword">
                      <Form.Label>Confirm Password</Form.Label>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        isInvalid={!!errors.confirmPassword}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.confirmPassword}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="showPassword"
                    label="Show password"
                    onChange={() => setShowPassword(!showPassword)}
                  />
                </Form.Group>
                
                <Form.Group className="mb-4" controlId="invitation_code">
                  <Form.Label>Invitation Code (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="invitation_code"
                    value={formData.invitation_code}
                    onChange={handleChange}
                    isInvalid={!!errors.invitation_code}
                  />
                  <Form.Text className="text-muted">
                    Enter your invitation code if you have one. This is required for guide registration.
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    {errors.invitation_code}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={isSubmitting || validatingCode}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        /> {' '}
                        Creating account...
                      </>
                    ) : 'Register'}
                  </Button>
                </div>
              </Form>
              
              <div className="text-center mt-4">
                <p>
                  Already have an account?{' '}
                  <Link to="/login">Login</Link>
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