import { useEffect, useRef } from 'react'

function TranscriptView({ transcripts }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcripts]);

  if (!transcripts || transcripts.length === 0) {
    return (
      <div className="glass-card-static" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <div className="empty-state-icon">🎙️</div>
          <h3>Waiting for transcription</h3>
          <p>The live transcription will appear here once the conversation starts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card-static" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem' }}>📝</span>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Live Transcription</h3>
        </div>
        <span style={{
          fontSize: '0.7rem',
          color: 'var(--text-tertiary)',
          fontWeight: 500
        }}>
          {transcripts.length} entries
        </span>
      </div>

      <div className="transcript-container" ref={containerRef}>
        {transcripts.map((entry, i) => {
          const isSeller = entry.speaker?.includes('Seller') || entry.speaker?.includes('You') || entry.speaker === 'AI';
          const speakerColor = isSeller ? 'var(--accent-primary)' : 'var(--accent-emerald)';
          const speakerIcon = isSeller ? '🎤' : '👤';

          return (
            <div key={i} className="transcript-entry" style={{
              padding: '12px 16px',
              background: isSeller ? 'rgba(99, 102, 241, 0.04)' : 'rgba(16, 185, 129, 0.04)',
              borderRadius: 'var(--radius-md)',
              borderLeft: `3px solid ${speakerColor}`
            }}>
              <div className="transcript-speaker" style={{ color: speakerColor }}>
                {speakerIcon} {entry.speaker}
              </div>
              <div className="transcript-text">{entry.text}</div>
              <div className="transcript-time">
                {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('en-US') : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TranscriptView;
