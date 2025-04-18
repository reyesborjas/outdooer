// src/pages/MyExpeditions.jsx
import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { 
  Container, Row, Col, Card, Badge, Button, Form, Spinner, Alert, 
  Tab, Tabs, Dropdown, Modal, ListGroup 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaEdit, FaEye, FaTrashAlt, FaUsers } from 'react-icons/fa';
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

  // Aquí podrías continuar con el renderizado usando el código corregido
  // anterior o moviendo funciones auxiliares a componentes separados.

  return (
    <Container className="my-expeditions-page">
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
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
            <Tab eventKey="created" title="Created Expeditions" />
            <Tab eventKey="led" title="Led Expeditions" />
          </Tabs>
          <Form className="mb-4 d-flex gap-2">
            <Form.Control
              type="text"
              placeholder="Search expeditions"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Form.Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="canceled">Canceled</option>
              <option value="completed">Completed</option>
            </Form.Select>
          </Form>
          {filteredExpeditions.length === 0 ? (
            <Alert variant="info" className="text-center">
              No expeditions found matching your criteria.
            </Alert>
          ) : (
            filteredExpeditions.map(expedition =>
              renderExpeditionCard(expedition, activeTab === 'created')
            )
          )}
        </>
      )}
    </Container>
  );
};

export default MyExpeditions;