// src/pages/NewActivity.jsx
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import '../styles/ActivityForm.css';
import SearchableDropdown from '../components/SearchableDropdown';
import SimilarActivityWarning from '../components/SimilarActivityWarning';
import {useNavigate} from 'react-router-dom';

const NewActivity = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isGuide } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location_id: '',
    difficulty_level: 'moderate',
    price: '',
    min_participants: 1,
    max_participants: 10,
    activity_type_id: '',
    leader_id: '',
    act_cover_image_url: '' // Campo para URL de imagen
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [locations, setLocations] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [similarActivities, setSimilarActivities] = useState([]);
  const [checkingSimilar, setCheckingSimilar] = useState(false);
  const [isTitleUnique, setIsTitleUnique] = useState(true);
  const [isTitleChecking, setIsTitleChecking] = useState(false);
  const [userTeamId, setUserTeamId] = useState(null);
  const [previewImage, setPreviewImage] = useState('');

  const memoizedLocations = useMemo(() => locations, [locations]);
  const memoizedActivityTypes = useMemo(() => activityTypes, [activityTypes]);

  // Redirigir si el usuario no está autenticado o no es guía
  useEffect(() => {
    if (!isAuthenticated || !isGuide()) {
      window.location.href = '/unauthorized';
    }
  }, [isAuthenticated, isGuide]);

  // Fetch necessary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingLocations(true);
        const [locationsRes, typesRes, teamsRes] = await Promise.all([
          api.get('/locations'),
          api.get('/activity-types'),
          api.get('/teams/my-teams')
        ]);

        setLocations(locationsRes.data.locations || []);
        setActivityTypes(typesRes.data.activity_types || []);
        
        // Get user's team if they have one
        const teams = teamsRes.data.teams || [];
        if (teams.length > 0) {
          setUserTeamId(teams[0].team_id);
          fetchTeamMembers(teams[0].team_id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load necessary data. Please try again.');
      } finally {
        setLoadingLocations(false);
      }
    };

    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  // Update preview image when URL changes
  useEffect(() => {
    if (formData.act_cover_image_url) {
      setPreviewImage(formData.act_cover_image_url);
    } else {
      setPreviewImage('');
    }
  }, [formData.act_cover_image_url]);

  // Fetch team members when user's team is set
  const fetchTeamMembers = async (teamId) => {
    if (!teamId) {
      setTeamMembers([]);
      return;
    }
    
    try {
      setLoadingTeamMembers(true);
      const res = await api.get(`/teams/${teamId}/members`);
      setTeamMembers(res.data.members || []);
      
      // Set the leader to the current user by default
      setFormData(prev => ({ ...prev, leader_id: user.user_id }));
    } catch (err) {
      console.error('Error fetching team members:', err);
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  // Check for similar activities
  useEffect(() => {
    if (!userTeamId || !formData.activity_type_id || !formData.location_id) {
      setSimilarActivities([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setCheckingSimilar(true);
        const res = await api.get('/activities/check-similar', {
          params: {
            team_id: userTeamId,
            activity_type_id: formData.activity_type_id,
            location_id: formData.location_id
          }
        });
        setSimilarActivities(res.data.has_similar ? res.data.similar_activities : []);
      } catch (err) {
        console.error('Error checking similar activities:', err);
        setSimilarActivities([]);
      } finally {
        setCheckingSimilar(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [userTeamId, formData.activity_type_id, formData.location_id]);

  // Check for unique title
  useEffect(() => {
    if (!formData.title || !userTeamId) {
      setIsTitleUnique(true);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsTitleChecking(true);
        const res = await api.get('/activities/check-title', {
          params: { title: formData.title, team_id: userTeamId }
        });
        setIsTitleUnique(res.data.unique);
      } catch (err) {
        console.error('Error checking title:', err);
        setIsTitleUnique(true);
      } finally {
        setIsTitleChecking(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.title, userTeamId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'min_participants', 'max_participants'].includes(name)
        ? value === '' ? '' : Number(value)
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!isTitleUnique) {
      setError('Please choose a unique activity title.');
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      // Create full payload with all required fields
      const payload = {
        ...formData,
        created_by: user.user_id,
        leader_id: formData.leader_id || user.user_id,
      };
  
      console.log('Sending data to server:', payload);
      
      const res = await api.post('/activities/', payload);
  
      console.log('Activity created successfully:', res.data);
      setLoading(false);
      setSuccess(true);
      
      // After successful creation, redirect to MyActivities page after a short delay
      setTimeout(() => {
        window.location.href = '/my-activities';
      }, 1500);
    } catch (err) {
      console.error('Error creating activity:', err);
      setError(err.response?.data?.error || 'Failed to create activity.');
      setLoading(false);
    }
  };

  // Redirigir directamente a My Activities
  const handleGoToMyActivities = () => {
    navigate('/my-activities');
  };

  if (!isAuthenticated) return null;

  return (
    <Container className="py-4 activity-form-container">
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h1 className="mb-0">Create New Activity</h1>
          <button 
            type="button" 
            className="btn btn-outline-secondary"
            onClick={handleGoToMyActivities}
          >
            Back to My Activities
          </button>
        </Card.Header>
        <Card.Body>
          {success && (
            <Alert variant="success">
              Activity created successfully! Redirecting to your activities...
            </Alert>
          )}
          
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Activity Title*</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="E.g., Mountain Hiking"
                isValid={formData.title && isTitleUnique}
                isInvalid={formData.title && !isTitleUnique}
              />
              {isTitleChecking && (
                <Form.Text className="text-muted">Checking title availability...</Form.Text>
              )}
              {!isTitleUnique && (
                <Form.Control.Feedback type="invalid">
                  This title already exists in your team.
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description*</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Provide a detailed description..."
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <SearchableDropdown
                  label="Location*"
                  items={memoizedLocations}
                  onSelect={value => handleChange({ target: { name: 'location_id', value } })}
                  value={formData.location_id}
                  valueKey="location_id"
                  displayKey="location_name"
                  extraDisplayKeys={['country_code', 'region_code']}
                  placeholder="Search for a location..."
                  isLoading={loadingLocations}
                  required
                  searchKeys={['location_name', 'country_code', 'region_code', 'formatted_address']}
                  noResultsMessage="No locations found."
                />
              </Col>

              <Col md={6}>
                <SearchableDropdown
                  label="Activity Type*"
                  items={memoizedActivityTypes}
                  onSelect={value => handleChange({ target: { name: 'activity_type_id', value } })}
                  value={formData.activity_type_id}
                  valueKey="activity_type_id"
                  displayKey="activity_type_name"
                  placeholder="Search for activity type..."
                  required
                  searchKeys={['activity_type_name', 'description']}
                  noResultsMessage="No activity types found."
                />
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (USD)*</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Min Participants*</Form.Label>
                  <Form.Control
                    type="number"
                    name="min_participants"
                    min="1"
                    max={formData.max_participants || 100}
                    value={formData.min_participants}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Participants*</Form.Label>
                  <Form.Control
                    type="number"
                    name="max_participants"
                    min={formData.min_participants || 1}
                    value={formData.max_participants}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Difficulty Level*</Form.Label>
                  <Form.Select
                    name="difficulty_level"
                    value={formData.difficulty_level}
                    onChange={handleChange}
                    required
                  >
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="difficult">Difficult</option>
                    <option value="extreme">Extreme</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Activity Leader*</Form.Label>
                  <Form.Select
                    name="leader_id"
                    value={formData.leader_id || user.user_id}
                    onChange={handleChange}
                    required
                    disabled={loadingTeamMembers || teamMembers.length === 0}
                  >
                    <option value={user.user_id}>Me (Default)</option>
                    {teamMembers
                      .filter(member => member.user_id !== user.user_id)
                      .map(member => (
                        <option key={member.user_id} value={member.user_id}>
                          {member.first_name} {member.last_name} - {
                            member.role_level === 1 ? 'Master Guide' :
                            member.role_level === 2 ? 'Tactical Guide' :
                            member.role_level === 3 ? 'Technical Guide' : 'Base Guide'
                          }
                        </option>
                      ))}
                  </Form.Select>
                  {loadingTeamMembers && <Form.Text>Loading team members...</Form.Text>}
                  {teamMembers.length === 0 && <Form.Text>No team members available</Form.Text>}
                </Form.Group>
              </Col>
            </Row>

            {/* Campo para URL de imagen de portada */}
            <Form.Group className="mb-4">
              <Form.Label>Cover Image URL</Form.Label>
              <Form.Control
                type="text"
                name="act_cover_image_url"
                value={formData.act_cover_image_url}
                onChange={handleChange}
                placeholder="Enter URL for activity cover image"
              />
              <Form.Text className="text-muted">
                Provide a URL to an image that represents this activity
              </Form.Text>
              
              {previewImage && (
                <div className="mt-2">
                  <p className="mb-1">Image Preview:</p>
                  <div 
                    style={{
                      width: '100%',
                      maxWidth: '300px',
                      height: '150px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <img 
                      src={previewImage} 
                      alt="Cover preview" 
                      style={{
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/300x150?text=Invalid+Image+URL';
                      }}
                    />
                  </div>
                </div>
              )}
            </Form.Group>

            {checkingSimilar && <p>Checking for similar activities...</p>}
            {similarActivities.length > 0 && (
              <SimilarActivityWarning activities={similarActivities} />
            )}

            <div className="d-flex justify-content-between mt-4">
              {/* Botón que usa window.location.href directamente */}
              <button 
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleGoToMyActivities}
              >
                Cancel
              </button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating...
                  </>
                ) : 'Create Activity'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default NewActivity;