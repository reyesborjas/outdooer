// src/pages/MyExpeditions.jsx
import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { 
  Container, Row, Col, Card, Badge, Button, Form, Spinner, Alert, 
  Tab, Tabs, Dropdown, Modal, ListGroup 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaEdit, FaEye, FaTrashAlt, FaUsers, FaEllipsisV } from 'react-icons/fa';
import api from '../api';
import '../styles/MyExpeditions.css';

const MyExpeditions = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isGuide } = useContext(AuthContext);

  const [expeditions, setExpeditions] = useState({ created: [], led: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedExpedition, setExpandedExpedition] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expeditionToDelete, setExpeditionToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('created');

  useEffect(() => {
    if (!isAuthenticated || !isGuide()) {
      navigate('/unauthorized');
    }
  }, [isAuthenticated, isGuide, navigate]);

  useEffect(() => {
    const fetchExpeditions = async () => {
      if (!isAuthenticated || !user?.user_id) return;

      setLoading(true);
      setError(null);

      try {
        const [createdResponse, ledResponse] = await Promise.all([
          api.get(`/expeditions/created-by/${user.user_id}`),
          api.get(`/expeditions/led-by/${user.user_id}`)
        ]);

        setExpeditions({
          created: createdResponse.data.expeditions || [],
          led: ledResponse.data.expeditions || []
        });
      } catch (err) {
        console.error('Error fetching expeditions:', err);
        setError('Failed to load your expeditions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpeditions();
  }, [isAuthenticated, user]);

  const formatPrice = useCallback(price => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  }, []);

  const formatDate = useCallback(dateString => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const calculateDuration = useCallback((startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
    return `${Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1} days`;
  }, []);

  const getStatusBadgeVariant = useCallback(status => {
    const variants = {
      active: 'success',
      draft: 'secondary',
      canceled: 'danger',
      completed: 'info'
    };
    return variants[status] || 'secondary';
  }, []);

  const filteredExpeditions = useMemo(() => {
    const currentExpeditions = expeditions[activeTab] || [];
    return currentExpeditions.filter(expedition => {
      const matchesSearch = searchTerm
        ? expedition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expedition.description?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchesStatus = statusFilter === 'all' || expedition.expedition_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [expeditions, activeTab, searchTerm, statusFilter]);

  const confirmDeleteExpedition = expedition => {
    setExpeditionToDelete(expedition);
    setShowDeleteModal(true);
  };

  const deleteExpedition = async () => {
    if (!expeditionToDelete) return;
    try {
      await api.delete(`/expeditions/${expeditionToDelete.expedition_id}`);
      setExpeditions(prev => ({
        created: prev.created.filter(e => e.expedition_id !== expeditionToDelete.expedition_id),
        led: prev.led.filter(e => e.expedition_id !== expeditionToDelete.expedition_id)
      }));
      setShowDeleteModal(false);
      setExpeditionToDelete(null);
    } catch (err) {
      console.error('Error deleting expedition:', err);
      setError('Failed to delete expedition. Please try again.');
    }
  };

  const toggleExpeditionDetails = expeditionId => {
    setExpandedExpedition(prev => (prev === expeditionId ? null : expeditionId));
  };

  // Define the missing renderExpeditionCard function
  const renderExpeditionCard = (expedition, canDelete) => {
    const isExpanded = expandedExpedition === expedition.expedition_id;
    
    return (
      <Card key={expedition.expedition_id} className="mb-3 expedition-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{expedition.title}</h5>
          <div className="d-flex align-items-center">
            <Badge bg={getStatusBadgeVariant(expedition.expedition_status)} className="me-2">
              {expedition.expedition_status}
            </Badge>
            <Dropdown>
              <Dropdown.Toggle variant="light" size="sm" id={`expedition-${expedition.expedition_id}-actions`}>
                <FaEllipsisV />
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item onClick={() => navigate(`/expeditions/${expedition.expedition_id}`)}>
                  <FaEye className="me-2" /> View Details
                </Dropdown.Item>
                <Dropdown.Item onClick={() => navigate(`/edit-expedition/${expedition.expedition_id}`)}>
                  <FaEdit className="me-2" /> Edit Expedition
                </Dropdown.Item>
                <Dropdown.Item onClick={() => navigate(`/expeditions/${expedition.expedition_id}/participants`)}>
                  <FaUsers className="me-2" /> Manage Participants
                </Dropdown.Item>
                {canDelete && (
                  <Dropdown.Item className="text-danger" onClick={() => confirmDeleteExpedition(expedition)}>
                    <FaTrashAlt className="me-2" /> Delete Expedition
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={9}>
              <div className="expedition-description mb-3">
                {expedition.description?.length > 150 && !isExpanded
                  ? `${expedition.description.slice(0, 150)}...`
                  : expedition.description}
                {expedition.description?.length > 150 && (
                  <Button
                    variant="link"
                    className="p-0 ms-1"
                    onClick={() => toggleExpeditionDetails(expedition.expedition_id)}
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </Button>
                )}
              </div>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <div className="price mb-1">{formatPrice(expedition.price)}</div>
                  <small className="text-muted">per person</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="expedition-details g-2">
            <Col sm={6} md={3}>
              <div className="detail-label">Start Date</div>
              <div className="detail-value">{formatDate(expedition.start_date)}</div>
            </Col>
            <Col sm={6} md={3}>
              <div className="detail-label">End Date</div>
              <div className="detail-value">{formatDate(expedition.end_date)}</div>
            </Col>
            <Col sm={6} md={3}>
              <div className="detail-label">Duration</div>
              <div className="detail-value">{calculateDuration(expedition.start_date, expedition.end_date)}</div>
            </Col>
            <Col sm={6} md={3}>
              <div className="detail-label">Capacity</div>
              <div className="detail-value">{expedition.min_participants} - {expedition.max_participants} people</div>
            </Col>
          </Row>
          
          <div className="d-flex justify-content-between mt-3">
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => navigate(`/expeditions/${expedition.expedition_id}`)}
            >
              <FaEye className="me-1" /> View Details
            </Button>
            <div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="me-2"
                onClick={() => navigate(`/edit-expedition/${expedition.expedition_id}`)}
              >
                <FaEdit className="me-1" /> Edit
              </Button>
              {canDelete && (
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={() => confirmDeleteExpedition(expedition)}
                >
                  <FaTrashAlt className="me-1" /> Delete
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <Container className="my-expeditions-page py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Expeditions</h1>
        <Button 
          variant="primary" 
          onClick={() => navigate('/create-expedition')}
        >
          Create New Expedition
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading your expeditions...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <Tabs
            id="expeditions-tabs"
            activeKey={activeTab}
            onSelect={tab => setActiveTab(tab)}
            className="mb-4"
          >
            <Tab eventKey="created" title={`Created Expeditions (${expeditions.created.length})`} />
            <Tab eventKey="led" title={`Led Expeditions (${expeditions.led.length})`} />
          </Tabs>
          
          <div className="mb-4 d-flex gap-2">
            <Form.Control
              type="text"
              placeholder="Search expeditions"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-grow-1"
            />
            <Form.Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '150px' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="canceled">Canceled</option>
              <option value="completed">Completed</option>
            </Form.Select>
          </div>
          
          {filteredExpeditions.length === 0 ? (
            <Alert variant="info" className="text-center">
              <p className="mb-3">No expeditions found matching your criteria.</p>
              <Button variant="primary" onClick={() => navigate('/create-expedition')}>
                Create Your First Expedition
              </Button>
            </Alert>
          ) : (
            filteredExpeditions.map(expedition =>
              renderExpeditionCard(expedition, activeTab === 'created')
            )
          )}
          
          {/* Delete Confirmation Modal */}
          <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm Deletion</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {expeditionToDelete && (
                <>
                  <p>Are you sure you want to delete the expedition <strong>{expeditionToDelete.title}</strong>?</p>
                  <p className="text-danger">This action cannot be undone.</p>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={deleteExpedition}>
                Delete Expedition
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </Container>
  );
};

export default MyExpeditions;