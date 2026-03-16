import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function History() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    try {
      const data = await api.getMeetings();
      setMeetings(data.filter(m => m.status === 'completed'));
    } catch (err) {
      console.error('Failed to load meetings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMeetingDetail(id) {
    try {
      const data = await api.getMeeting(id);
      setSelectedMeeting(data);
    } catch (err) {
      console.error('Failed to load meeting detail:', err);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteMeeting(id);
      setMeetings(prev => prev.filter(m => m.id !== id));
      if (selectedMeeting?.id === id) {
        setSelectedMeeting(null);
      }
    } catch (err) {
      console.error('Failed to delete meeting:', err);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>History</h1>
        <p>Review your past meetings, transcriptions and SPIN analyses</p>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No completed meetings yet</h3>
          <p>Your completed meetings will appear here with their transcriptions and SPIN analyses.</p>
          <Link to="/new" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Create a Meeting
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Meeting List */}
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>
              📋 Completed Meetings ({meetings.length})
            </h3>
            <div className="meetings-grid">
              {meetings.map(meeting => (
                <div
                  key={meeting.id}
                  className="glass-card meeting-card"
                  onClick={() => loadMeetingDetail(meeting.id)}
                  style={{
                    borderColor: selectedMeeting?.id === meeting.id ? 'var(--accent-primary)' : undefined,
                    boxShadow: selectedMeeting?.id === meeting.id ? 'var(--shadow-glow)' : undefined
                  }}
                >
                  <div className="meeting-info">
                    <div className="meeting-avatar">📋</div>
                    <div className="meeting-details">
                      <h3>{meeting.title}</h3>
                      <p>{new Date(meeting.created_at).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  </div>
                  <div className="meeting-actions">
                    <span className="badge badge-completed">Completed</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(meeting.id); }}
                      className="btn btn-icon btn-secondary"
                      style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Detail */}
          <div>
            {selectedMeeting ? (
              <div className="glass-card-static" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>
                  {selectedMeeting.title}
                </h3>

                {selectedMeeting.spinAnalysis && (
                  <div style={{
                    padding: '16px',
                    background: 'rgba(99, 102, 241, 0.04)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px'
                  }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '8px' }}>
                      🎯 SPIN Analysis
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Phase: <strong>{selectedMeeting.spinAnalysis.phase}</strong>
                    </p>
                    {selectedMeeting.spinAnalysis.insights && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        {selectedMeeting.spinAnalysis.insights}
                      </p>
                    )}
                  </div>
                )}

                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>
                  📝 Transcription
                </h4>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {selectedMeeting.transcripts && selectedMeeting.transcripts.length > 0 ? (
                    selectedMeeting.transcripts.map((t, i) => (
                      <div key={i} style={{
                        padding: '8px 12px',
                        borderLeft: `2px solid ${t.speaker === 'Seller' || t.speaker === 'Vendeur' ? 'var(--accent-primary)' : 'var(--accent-emerald)'}`,
                        marginBottom: '8px',
                        fontSize: '0.82rem'
                      }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          color: t.speaker === 'Seller' || t.speaker === 'Vendeur' ? 'var(--accent-primary)' : 'var(--accent-emerald)',
                          textTransform: 'uppercase'
                        }}>
                          {t.speaker}
                        </span>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.5 }}>
                          {t.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      No transcription available.
                    </p>
                  )}
                </div>

                <Link to={`/meeting/${selectedMeeting.id}`} className="btn btn-secondary" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}>
                  View Full Meeting →
                </Link>
              </div>
            ) : (
              <div className="glass-card empty-state" style={{ height: '100%', minHeight: '300px' }}>
                <div className="empty-state-icon">👈</div>
                <h3>Select a meeting</h3>
                <p>Click on a meeting to view its transcription and SPIN analysis.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default History;
