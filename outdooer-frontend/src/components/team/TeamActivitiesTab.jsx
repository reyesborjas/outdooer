// src/components/team/TeamActivitiesTab.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api';

const TeamActivitiesTab = ({ teamId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch team activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/activities/team/${teamId}`);
        setActivities(response.data.activities || []);
      } catch (err) {
        console.error('Error fetching team activities:', err);
        setError('Failed to load team activities.');
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      fetchActivities();
    }
  }, [teamId]);

  // Filter activities based on search query and status
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || activity.activity_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="team-activities-tab">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Team Activities</h3>
        <a 
          href={`/create-activity?team=${teamId}`} 
          className="btn btn-primary"
        >
          <i className="bi bi-plus-circle me-2"></i>
          New Activity
        </a>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
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
          </div>
        </div>
      </div>

      {/* Activities List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading activities...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted mb-3">No activities found</p>
          <a 
            href={`/create-activity?team=${teamId}`} 
            className="btn btn-outline-primary"
          >
            Create your first activity
          </a>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Type</th>
                <th>Price</th>
                <th>Status</th>
                <th>Leader</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map(activity => (
                <tr key={activity.activity_id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div>
                        <div className="fw-500">{activity.title}</div>
                        <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: '250px' }}>
                          {activity.description}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{activity.activity_type_name || 'N/A'}</td>
                  <td>${activity.price}</td>
                  <td>
                    <span className={`badge bg-${
                      activity.activity_status === 'active' ? 'success' :
                      activity.activity_status === 'draft' ? 'secondary' :
                      activity.activity_status === 'cancelled' ? 'danger' :
                      activity.activity_status === 'completed' ? 'info' :
                      'warning'
                    }`}>
                      {activity.activity_status}
                    </span>
                  </td>
                  <td>{activity.leader_name || 'Not assigned'}</td>
                  <td>{new Date(activity.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="btn-group">
                      <a 
                        href={`/activities/${activity.activity_id}`} 
                        className="btn btn-sm btn-outline-primary"
                      >
                        View
                      </a>
                      <a 
                        href={`/edit-activity/${activity.activity_id}`} 
                        className="btn btn-sm btn-outline-secondary"
                      >
                        Edit
                      </a>
                      <a 
                        href={`/activities/${activity.activity_id}/dates`} 
                        className="btn btn-sm btn-outline-info"
                      >
                        Dates
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

export default TeamActivitiesTab;