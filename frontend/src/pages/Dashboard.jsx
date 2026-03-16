import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    try {
      const data = await api.getMeetings();
      setMeetings(data);
    } catch (err) {
      console.error('Failed to load meetings:', err);
    } finally {
      setLoading(false);
    }
  }

  const activeMeetings = meetings.filter(m => m.status === 'active');
  const completedMeetings = meetings.filter(m => m.status === 'completed');
  const totalTranscriptHours = (completedMeetings.length * 0.5).toFixed(1);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your sales meetings and SPIN analyses</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.08)' }}>📅</div>
          <div className="stat-content">
            <h3>{meetings.length}</h3>
            <p>Total Meetings</p>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(244, 63, 94, 0.08)' }}>🔴</div>
          <div className="stat-content">
            <h3>{activeMeetings.length}</h3>
            <p>Active Now</p>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)' }}>⏱️</div>
          <div className="stat-content">
            <h3>{totalTranscriptHours}h</h3>
            <p>Hours Transcribed</p>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)' }}>🎯</div>
          <div className="stat-content">
            <h3>SPIN</h3>
            <p>Coaching Active</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <Link to="/new" className="btn btn-primary">
          ➕ New Meeting
        </Link>
        <Link to="/history" className="btn btn-secondary">
          📚 View History
        </Link>
      </div>

      {/* Active Meetings */}
      {activeMeetings.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-live">LIVE</span>
            Active Meetings
          </h2>
          <div className="meetings-grid">
            {activeMeetings.map(meeting => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Meetings */}
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
          📋 Recent Meetings
        </h2>
        {loading ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="glass-card empty-state">
            <div className="empty-state-icon">🎤</div>
            <h3>No meetings yet</h3>
            <p>Create your first meeting to start real-time SPIN sales coaching.</p>
            <Link to="/new" className="btn btn-primary" style={{ marginTop: '16px' }}>
              Create a Meeting
            </Link>
          </div>
        ) : (
          <div className="meetings-grid">
            {meetings.slice(0, 10).map(meeting => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MeetingCard({ meeting }) {
  const statusBadge = {
    active: 'badge-live',
    completed: 'badge-completed',
    pending: 'badge-pending'
  };

  const statusLabel = {
    active: 'Live',
    completed: 'Completed',
    pending: 'Pending'
  };

  return (
    <Link to={`/meeting/${meeting.id}`}>
      <div className="glass-card meeting-card">
        <div className="meeting-info">
          <div className="meeting-avatar">
            {meeting.status === 'active' ? '🔴' : '📋'}
          </div>
          <div className="meeting-details">
            <h3>{meeting.title}</h3>
            <p>{new Date(meeting.created_at).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
        <div className="meeting-actions">
          <span className={`badge ${statusBadge[meeting.status] || 'badge-pending'}`}>
            {statusLabel[meeting.status] || meeting.status}
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1.2rem' }}>→</span>
        </div>
      </div>
    </Link>
  )
}

export default Dashboard;
