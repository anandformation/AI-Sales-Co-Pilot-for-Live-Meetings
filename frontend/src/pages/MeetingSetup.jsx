import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function MeetingSetup() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [mode, setMode] = useState('live');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Meeting title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const meeting = await api.createMeeting({
        title: title.trim(),
        meetLink: meetLink.trim(),
        participants: []
      });

      navigate(`/meeting/${meeting.id}?mode=${mode}&meetLink=${encodeURIComponent(meetLink)}&autostart=true`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>New Meeting</h1>
        <p>Set up your SPIN sales coaching session</p>
      </div>

      <div className="setup-container">
        <form onSubmit={handleSubmit} className="glass-card-static setup-form">
          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              marginBottom: '24px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label>🏷️ Meeting Title</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Discovery Call - TechSolutions"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>🎯 Mode</label>
            <div className="mode-selector">
              <div
                className={`mode-option ${mode === 'live' ? 'selected' : ''}`}
                onClick={() => setMode('live')}
              >
                <div className="mode-option-icon">🎙️</div>
                <h4>Live Audio</h4>
                <p>Capture your mic &amp; system audio. Open Google Meet in another tab — the AI transcribes and coaches you in real time.</p>
              </div>

              <div
                className={`mode-option ${mode === 'demo' ? 'selected' : ''}`}
                onClick={() => setMode('demo')}
              >
                <div className="mode-option-icon">🎬</div>
                <h4>Demo Mode</h4>
                <p>Simulated sales conversation with live SPIN coaching</p>
              </div>
            </div>
          </div>

          {mode === 'live' && (
            <div className="form-group animate-fade-in">
              <label>🔗 Google Meet Link <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span></label>
              <input
                type="url"
                className="input"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                value={meetLink}
                onChange={e => setMeetLink(e.target.value)}
              />
              <p className="input-hint">Keep your Google Meet open in another tab. The app will capture audio from your mic &amp; the Meet tab for live transcription.</p>
            </div>
          )}

          <div style={{
            padding: '16px',
            background: 'rgba(99, 102, 241, 0.04)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '24px'
          }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✨ Active Features
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { icon: '📝', label: 'Real-time transcription' },
                { icon: '🎯', label: 'SPIN coaching' },
                { icon: '💡', label: 'Suggested questions' },
                { icon: '📊', label: 'Progress analysis' },
                { icon: '🟢', label: 'Buy signal detection' },
                { icon: '📌', label: 'Key topic identification' }
              ].map((feat, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span>{feat.icon}</span> {feat.label}
                </div>
              ))}
            </div>
          </div>

          {mode === 'live' && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(245, 158, 11, 0.06)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '24px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              <strong>💡 How it works:</strong> After launching, the app will ask for your <strong>microphone</strong> and to <strong>share a tab</strong> (pick your Google Meet tab with "Share tab audio" checked). Both audio sources are mixed and transcribed live by Gemini AI.
            </div>
          )}

          <button
            type="submit"
            className="btn btn-success"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem' }}
          >
            {loading ? '⏳ Creating...' : '🚀 Launch Meeting'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default MeetingSetup;
