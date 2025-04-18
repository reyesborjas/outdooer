// src/pages/ExpeditionParticipants.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  Container, Card, Row, Col, Button, Table, Form, Badge, Alert,
  Spinner, Modal, Tabs, Tab, InputGroup
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  FaUserPlus, FaEnvelope, FaCheck, FaTimes, FaEdit,
  FaTrash, FaInfoCircle
} from 'react-icons/fa';
import { expeditionsApi } from '../api/expeditions';
import '../styles/ExpeditionParticipants.css';

const ExpeditionParticipants = () => {
  const { expeditionId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isGuide } = useContext(AuthContext);

  // Expedition and participant data
  const [expedition, setExpedition] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState('confirmed');

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modals and forms
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [participantForm, setParticipantForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservationAction, setReservationAction] = useState(null);
  const [denialReason, setDenialReason] = useState('');

  // Redirect unauthorized users
  useEffect(() => {
    if (!isAuthenticated || !isGuide()) {
      navigate('/unauthorized');
    }
  }, [isAuthenticated, isGuide, navigate]);

  // Fetch expedition data and participants
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { expedition } = await expeditionsApi.getExpedition(expeditionId);
        const { participants } = await expeditionsApi.getExpeditionParticipants(expeditionId);
        const { reservations } = await expeditionsApi.getExpeditionReservations(expeditionId);

        setExpedition(expedition);
        setParticipants(participants || []);
        setReservations(reservations || []);
      } catch (err) {
        console.error('Error fetching expedition data:', err);
        setError('Failed to load expedition data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && expeditionId) {
      fetchData();
    }
  }, [isAuthenticated, expeditionId]);

  // Handle form changes
  const handleParticipantFormChange = ({ target: { name, value } }) => {
    setParticipantForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddParticipant = () => {
    setEditingParticipant(null);
    setParticipantForm({
      first_name: '',
      last_name: '',
      email: '',
      emergency_contact_name: '',
      emergency_contact_phone: ''
    });
    setShowParticipantModal(true);
  };

  const handleEditParticipant = (participant) => {
    setEditingParticipant(participant);
    setParticipantForm({
      first_name: participant.first_name,
      last_name: participant.last_name,
      email: participant.email,
      emergency_contact_name: participant.emergency_contact_name || '',
      emergency_contact_phone: participant.emergency_contact_phone || ''
    });
    setShowParticipantModal(true);
  };

  const handleParticipantFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingParticipant) {
        await expeditionsApi.updateExpeditionParticipant(
          expeditionId,
          editingParticipant.participant_id,
          participantForm
        );
        setParticipants(participants.map(p =>
          p.participant_id === editingParticipant.participant_id
            ? { ...p, ...participantForm }
            : p
        ));
        setSuccess('Participant updated successfully!');
      } else {
        const { participant } = await expeditionsApi.addExpeditionParticipant(
          expeditionId,
          participantForm
        );
        setParticipants([...participants, participant]);
        setSuccess('Participant added successfully!');
      }

      setShowParticipantModal(false);
    } catch (err) {
      console.error('Error saving participant:', err);
      setError(err.response?.data?.error || 'Failed to save participant. Please try again.');
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!window.confirm("Are you sure you want to remove this participant?")) return;

    try {
      await expeditionsApi.removeExpeditionParticipant(expeditionId, participantId);
      setParticipants(participants.filter(p => p.participant_id !== participantId));
      setSuccess('Participant removed successfully!');
    } catch (err) {
      console.error('Error removing participant:', err);
      setError('Failed to remove participant. Please try again.');
    }
  };

  const handleReservationAction = (reservation, action) => {
    setSelectedReservation(reservation);
    setReservationAction(action);
    setDenialReason('');
    setShowReservationModal(true);
  };

  const handleProcessReservation = async () => {
    if (!selectedReservation || !reservationAction) return;

    try {
      if (reservationAction === 'approve') {
        await expeditionsApi.approveReservation(selectedReservation.reservation_id);
        setReservations(reservations.map(r =>
          r.reservation_id === selectedReservation.reservation_id
            ? { ...r, status: 'approved', payment_status: 'pending' }
            : r
        ));
        setSuccess('Reservation approved successfully!');
      } else if (reservationAction === 'deny') {
        await expeditionsApi.denyReservation(
          selectedReservation.reservation_id,
          { denial_reason: denialReason }
        );
        setReservations(reservations.map(r =>
          r.reservation_id === selectedReservation.reservation_id
            ? { ...r, status: 'denied', denial_reason: denialReason }
            : r
        ));
        setSuccess('Reservation denied successfully!');
      }

      setShowReservationModal(false);
      setSelectedReservation(null);
      setReservationAction(null);
    } catch (err) {
      console.error('Error processing reservation:', err);
      setError(err.response?.data?.error || 'Failed to process reservation. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return 'bg-success';
      case 'pending':
      case 'processing':
        return 'bg-warning';
      case 'denied':
      case 'canceled':
        return 'bg-danger';
      case 'refunded':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  const filteredReservations = () => {
    switch (activeTab) {
      case 'pending':
        return reservations.filter(r => r.status === 'pending');
      case 'approved':
        return reservations.filter(r => r.status === 'approved');
      case 'denied':
        return reservations.filter(r => r.status === 'denied');
      case 'all':
        return reservations;
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Loading expedition data...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4 expedition-participants-container">
      <Card className="shadow-sm">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="mb-0">Manage Expedition Participants</h1>
            <Button 
              variant="primary"
              onClick={() => navigate(`/expeditions/${expeditionId}`)}
            >
              Back to Expedition
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          
          {expedition && (
            <div className="expedition-info mb-4">
              <h2>{expedition.title}</h2>
              <div className="d-flex flex-wrap">
                <div className="expedition-detail me-4">
                  <div className="detail-label">Start Date</div>
                  <div className="detail-value">{formatDate(expedition.start_date)}</div>
                </div>
                <div className="expedition-detail me-4">
                  <div className="detail-label">End Date</div>
                  <div className="detail-value">{formatDate(expedition.end_date)}</div>
                </div>
                <div className="expedition-detail me-4">
                  <div className="detail-label">Participants</div>
                  <div className="detail-value">
                    {participants.length} / {expedition.max_participants}
                  </div>
                </div>
                <div className="expedition-detail">
                  <div className="detail-label">Status</div>
                  <div className="detail-value">
                    <Badge bg={getStatusBadgeClass(expedition.expedition_status)}>
                      {expedition.expedition_status.charAt(0).toUpperCase() + expedition.expedition_status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="confirmed" title="Confirmed Participants">
              <div className="d-flex justify-content-between mb-3">
                <h3>Participants ({participants.length})</h3>
                <Button variant="success" onClick={handleAddParticipant} disabled={participants.length >= expedition?.max_participants}>
                  <FaUserPlus className="me-2" /> Add Participant
                </Button>
              </div>
              
              {participants.length === 0 ? (
                <Alert variant="info">
                  No participants have been added to this expedition yet.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover className="participants-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Emergency Contact</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant, index) => (
                        <tr key={participant.participant_id}>
                          <td>{index + 1}</td>
                          <td>
                            {participant.first_name} {participant.last_name}
                          </td>
                          <td>
                            <a href={`mailto:${participant.email}`}>
                              {participant.email}
                            </a>
                          </td>
                          <td>
                            {participant.emergency_contact_name ? (
                              <>
                                {participant.emergency_contact_name}<br />
                                <small>{participant.emergency_contact_phone}</small>
                              </>
                            ) : (
                              <span className="text-muted">Not provided</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex">
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleEditParticipant(participant)}
                              >
                                <FaEdit />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleRemoveParticipant(participant.participant_id)}
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Tab>
            
            <Tab eventKey="pending" title={`Pending Requests (${reservations.filter(r => r.status === 'pending').length})`}>
              <div className="reservation-management mb-3">
                <h3>Pending Reservation Requests</h3>
                {filteredReservations().length === 0 ? (
                  <Alert variant="info">
                    No pending reservation requests for this expedition.
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover className="reservations-table">
                      <thead>
                        <tr>
                          <th>Request Date</th>
                          <th>Explorer</th>
                          <th>Participants</th>
                          <th>Price</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReservations().map(reservation => (
                          <tr key={reservation.reservation_id}>
                            <td>{formatDate(reservation.reservation_date)}</td>
                            <td>
                              {reservation.user?.first_name} {reservation.user?.last_name}<br />
                              <small>{reservation.user?.email}</small>
                            </td>
                            <td>{reservation.participant_count}</td>
                            <td>${reservation.total_price}</td>
                            <td>
                              <div className="d-flex">
                                <Button 
                                  variant="success" 
                                  size="sm" 
                                  className="me-2"
                                  onClick={() => handleReservationAction(reservation, 'approve')}
                                >
                                  <FaCheck className="me-1" /> Approve
                                </Button>
                                <Button 
                                  variant="danger" 
                                  size="sm"
                                  onClick={() => handleReservationAction(reservation, 'deny')}
                                >
                                  <FaTimes className="me-1" /> Deny
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            </Tab>
            
            <Tab eventKey="approved" title="Approved Reservations">
              <div className="reservation-management mb-3">
                <h3>Approved Reservations</h3>
                {filteredReservations().length === 0 ? (
                  <Alert variant="info">
                    No approved reservations for this expedition.
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover className="reservations-table">
                      <thead>
                        <tr>
                          <th>Approved Date</th>
                          <th>Explorer</th>
                          <th>Participants</th>
                          <th>Price</th>
                          <th>Payment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReservations().map(reservation => (
                          <tr key={reservation.reservation_id}>
                            <td>{formatDate(reservation.updated_at || reservation.reservation_date)}</td>
                            <td>
                              {reservation.user?.first_name} {reservation.user?.last_name}<br />
                              <small>{reservation.user?.email}</small>
                            </td>
                            <td>{reservation.participant_count}</td>
                            <td>${reservation.total_price}</td>
                            <td>
                              <Badge bg={getStatusBadgeClass(reservation.payment_status)}>
                                {reservation.payment_status.charAt(0).toUpperCase() + reservation.payment_status.slice(1)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            </Tab>
            
            <Tab eventKey="denied" title="Denied Reservations">
              <div className="reservation-management mb-3">
                <h3>Denied Reservations</h3>
                {filteredReservations().length === 0 ? (
                  <Alert variant="info">
                    No denied reservations for this expedition.
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover className="reservations-table">
                      <thead>
                        <tr>
                          <th>Denied Date</th>
                          <th>Explorer</th>
                          <th>Participants</th>
                          <th>Price</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReservations().map(reservation => (
                          <tr key={reservation.reservation_id}>
                            <td>{formatDate(reservation.updated_at || reservation.reservation_date)}</td>
                            <td>
                              {reservation.user?.first_name} {reservation.user?.last_name}<br />
                              <small>{reservation.user?.email}</small>
                            </td>
                            <td>{reservation.participant_count}</td>
                            <td>${reservation.total_price}</td>
                            <td>{reservation.denial_reason || 'No reason provided'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            </Tab>
            
            <Tab eventKey="all" title="All Reservations">
              <div className="reservation-management mb-3">
                <h3>All Reservations</h3>
                {reservations.length === 0 ? (
                  <Alert variant="info">
                    No reservations for this expedition yet.
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover className="reservations-table">
                      <thead>
                        <tr>
                          <th>Request Date</th>
                          <th>Explorer</th>
                          <th>Participants</th>
                          <th>Price</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations.map(reservation => (
                          <tr key={reservation.reservation_id}>
                            <td>{formatDate(reservation.reservation_date)}</td>
                            <td>
                              {reservation.user?.first_name} {reservation.user?.last_name}<br />
                              <small>{reservation.user?.email}</small>
                            </td>
                            <td>{reservation.participant_count}</td>
                            <td>${reservation.total_price}</td>
                            <td>
                              <Badge bg={getStatusBadgeClass(reservation.status)}>
                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                              </Badge>
                              {reservation.payment_status && (
                                <Badge className="ms-2" bg={getStatusBadgeClass(reservation.payment_status)}>
                                  {reservation.payment_status.charAt(0).toUpperCase() + reservation.payment_status.slice(1)}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
      
      {/* Add/Edit Participant Modal */}
      <Modal show={showParticipantModal} onHide={() => setShowParticipantModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingParticipant ? 'Edit Participant' : 'Add Participant'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleParticipantFormSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={participantForm.first_name}
                    onChange={handleParticipantFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={participantForm.last_name}
                    onChange={handleParticipantFormChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Email*</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={participantForm.email}
                onChange={handleParticipantFormChange}
                required
              />
            </Form.Group>
            
            <hr />
            <h6>Emergency Contact Information</h6>
            
            <Form.Group className="mb-3">
              <Form.Label>Emergency Contact Name</Form.Label>
              <Form.Control
                type="text"
                name="emergency_contact_name"
                value={participantForm.emergency_contact_name}
                onChange={handleParticipantFormChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Emergency Contact Phone</Form.Label>
              <Form.Control
                type="tel"
                name="emergency_contact_phone"
                value={participantForm.emergency_contact_phone}
                onChange={handleParticipantFormChange}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end mt-4">
              <Button variant="secondary" className="me-2" onClick={() => setShowParticipantModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingParticipant ? 'Update Participant' : 'Add Participant'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Reservation Action Modal */}
      <Modal show={showReservationModal} onHide={() => setShowReservationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {reservationAction === 'approve' ? 'Approve Reservation' : 'Deny Reservation'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReservation && (
            <>
              <p>
                {reservationAction === 'approve' 
                  ? 'Are you sure you want to approve this reservation request?' 
                  : 'Are you sure you want to deny this reservation request?'}
              </p>
              
              <div className="reservation-detail mb-3">
                <strong>Explorer:</strong> {selectedReservation.user?.first_name} {selectedReservation.user?.last_name}
              </div>
              
              <div className="reservation-detail mb-3">
                <strong>Participants:</strong> {selectedReservation.participant_count}
              </div>
              
              <div className="reservation-detail mb-3">
                <strong>Total Price:</strong> ${selectedReservation.total_price}
              </div>
              
              {reservationAction === 'deny' && (
                <Form.Group className="mb-3">
                  <Form.Label>Denial Reason</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={denialReason}
                    onChange={(e) => setDenialReason(e.target.value)}
                    placeholder="Please provide a reason for denying this reservation"
                  />
                </Form.Group>
              )}
              
              {reservationAction === 'approve' && (
                <Alert variant="info">
                  <FaInfoCircle className="me-2" />
                  Approving this reservation will notify the explorer and request payment.
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReservationModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={reservationAction === 'approve' ? 'success' : 'danger'} 
            onClick={handleProcessReservation}
            disabled={reservationAction === 'deny' && !denialReason.trim()}
          >
            {reservationAction === 'approve' ? 'Approve Reservation' : 'Deny Reservation'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ExpeditionParticipants;