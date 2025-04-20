// src/pages/Register.jsx
import { useState, useContext, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Badge, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authApi } from '../api/auth';

const Register = () => {
  // Get query params (for invitation codes shared via URL)
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const inviteCodeFromUrl = queryParams.get('code');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    date_of_birth: '',
    invitation_code: inviteCodeFromUrl || ''
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [codeValidating, setCodeValidating] = useState(false);
  const [codeInfo, setCodeInfo] = useState(null);
  const { register, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Validate invitation code when component mounts or code changes
  useEffect(() => {
    const validateInvitationCode = async () => {
      if (!formData.invitation_code || formData.invitation_code.length < 5) {
        setCodeInfo(null);
        return;
      }
      
      setCodeValidating(true);
      try {
        const response = await authApi.validateInvitationCode(formData.invitation_code);
        setCodeInfo(response);
      } catch (err) {
        console.error("Validation error:", err);
        setCodeInfo({ 
          valid: false, 
          message: err.response?.data?.error || 'Invalid or expired invitation code'
        });
      } finally {
        setCodeValidating(false);
      }
    };
    
    // Validate immediately if code comes from URL parameter
    if (inviteCodeFromUrl) {
      validateInvitationCode();
    } else {
      // Debounce the validation to avoid too many API calls
      const timeoutId = setTimeout(validateInvitationCode, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.invitation_code, inviteCodeFromUrl]);
  
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
    
    // If they entered an invitation code but it's not valid, add an error
    if (formData.invitation_code && codeInfo && !codeInfo.valid) {
      errors.invitation_code = codeInfo.message || 'Invalid invitation code';
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
      // Pass the registration information to AuthContext
      const success = await register(registerData);
      if (success) {
        // If registration was successful, navigate to dashboard
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
              
              {codeInfo?.valid && (
                <Alert variant="success" className="mb-4">
                  <Alert.Heading>Valid Invitation Code</Alert.Heading>
                  <p>
                    {codeInfo.role_type === 'master_guide' ? (
                      <>You'll be registered as a <Badge bg="primary">Master Guide</Badge> and will be able to create your own team.</>
                    ) : (
                      <>You'll be registered as a <Badge bg="info">Guide</Badge> {codeInfo.team_name && `for team "${codeInfo.team_name}"`}.</>
                    )}
                  </p>
                </Alert>
              )}
              
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
                      <Form.Text className="text-muted">
                        Must be at least 8 characters long
                      </Form.Text>
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
                
                <Form.Group className="mb-3">
                  <Form.Label>Invitation Code {!inviteCodeFromUrl && '(Optional)'}</Form.Label>
                  <Form.Control
                    type="text"
                    name="invitation_code"
                    value={formData.invitation_code}
                    onChange={handleChange}
                    placeholder="Enter invitation code if you have one"
                    isValid={codeInfo?.valid}
                    isInvalid={codeInfo?.valid === false || !!validationErrors.invitation_code}
                    disabled={!!inviteCodeFromUrl} // Disable if code comes from URL
                  />
                  {codeValidating && (
                    <div className="d-flex align-items-center mt-1">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <span className="text-muted">Validating code...</span>
                    </div>
                  )}
                  {!codeValidating && codeInfo?.valid === false && (
                    <Form.Control.Feedback type="invalid">
                      {codeInfo.message || 'Invalid invitation code'}
                    </Form.Control.Feedback>
                  )}
                  {!inviteCodeFromUrl && (
                    <Form.Text className="text-muted">
                      Required to register as a guide. Leave empty for explorer account.
                    </Form.Text>
                  )}
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="termsCheck"
                    label="I agree to the Terms of Service and Privacy Policy"
                    required
                  />
                </Form.Group>
                
                <div className="d-grid gap-2 mt-4">
                  <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Creating account...
                      </>
                    ) : 'Create Account'}
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