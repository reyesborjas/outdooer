// src/components/team/TeamExpeditionsTab.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api';

const TeamExpeditionsTab = ({ teamId }) => {
  const [expeditions, setExpeditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  // Fetch team expeditions
  useEffect(() => {
    const fetchExpeditions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/expeditions/team/${teamId}`);
        setExpeditions(response.data.expeditions || []);
      } catch (err) {
        console.error('Error fetching team expeditions:', err);
        setError('Failed to load team expeditions.');
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      fetchExpeditions();
    }
  }, [teamId]);

  // Filter expeditions based on search query, status, and time
  const filteredExpeditions = expeditions.filter(expedition => {
    const matchesSearch = expedition.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || expedition.expedition_status === statusFilter;
    
    const now = new Date();
    const startDate = new Date(expedition.start_date);
    const endDate = new Date(expedition.end_date);
    
    let matchesTime = true;
    if (timeFilter === 'upcoming') {
      matchesTime = startDate > now;
    } else if (timeFilter === 'ongoing') {
      matchesTime = startDate <= now && endDate >= now;
    } else if (timeFilter === 'past') {
      matchesTime = endDate < now;
    }
    
    return matchesSearch && matchesStatus && matchesTime;
  });

  return (
    <div className="team-expeditions-tab">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Team Expeditions</h3>
        <a 
          href={`/create-expedition?team=${teamId}`} 
          className="btn btn-primary"
        >
          <i className="bi bi-plus-circle me-2"></i>
          New Expedition
        </a>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search expeditions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Expeditions List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading expeditions...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : filteredExpeditions.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted mb-3">No expeditions found</p>
          <a 
            href={`/create-expedition?team=${teamId}`} 
            className="btn btn-outline-primary"
          >
            Create your first expedition
          </a>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Expedition</th>
                <th>Dates</th>
                <th>Price</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Leader</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpeditions.map(expedition => (
                <tr key={expedition.expedition_id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div>
                        <div className="fw-500">{expedition.title}</div>
                        <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: '250px' }}>
                          {expedition.description}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="small">
                      <div>{new Date(expedition.start_date).toLocaleDateString()}</div>
                      <div>to</div>
                      <div>{new Date(expedition.end_date).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td>${expedition.price}</td>
                  <td>
                    {expedition.min_participants} - {expedition.max_participants} participants
                  </td>
                  <td>
                    <span className={`badge bg-${
                      expedition.expedition_status === 'active' ? 'success' :
                      expedition.expedition_status === 'draft' ? 'secondary' :
                      expedition.expedition_status === 'cancelled' ? 'danger' :
                      expedition.expedition_status === 'completed' ? 'info' :
                      'warning'
                    }`}>
                      {expedition.expedition_status}
                    </span>
                  </td>
                  <td>{expedition.leader_name || 'Not assigned'}</td>
                  <td>
                    <div className="btn-group">
                      <a 
                        href={`/expeditions/${expedition.expedition_id}`} 
                        className="btn btn-sm btn-outline-primary"
                      >
                        View
                      </a>
                      <a 
                        href={`/edit-expedition/${expedition.expedition_id}`} 
                        className="btn btn-sm btn-outline-secondary"
                      >
                        Edit
                      </a>
                      <a 
                        href={`/expeditions/${expedition.expedition_id}/activities`} 
                        className="btn btn-sm btn-outline-info"
                      >
                        Activities
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamExpeditionsTab;