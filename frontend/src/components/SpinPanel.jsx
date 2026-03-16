function SpinPanel({ spinData }) {
  const data = spinData || {
    currentPhase: 'SITUATION',
    suggestedQuestions: [],
    phaseProgress: { S: 0, P: 0, I: 0, N: 0 },
    insights: 'Waiting for the conversation to start...',
    keyTopics: [],
    buySignals: []
  };

  const phases = [
    { key: 'S', label: 'Situation', fullLabel: 'SITUATION', color: 'var(--accent-cyan)' },
    { key: 'P', label: 'Problem', fullLabel: 'PROBLEM', color: 'var(--accent-amber)' },
    { key: 'I', label: 'Implication', fullLabel: 'IMPLICATION', color: 'var(--accent-rose)' },
    { key: 'N', label: 'Need-Payoff', fullLabel: 'NEED_PAYOFF', color: 'var(--accent-emerald)' },
  ];

  const currentPhaseKey = data.currentPhase || 'SITUATION';

  return (
    <div className="spin-panel glass-card-static" style={{ flex: 1 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>🎯</span>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>SPIN Coaching</h3>
        </div>
        <span className="badge badge-live" style={{ fontSize: '0.65rem' }}>
          Live
        </span>
      </div>

      {/* Phase Indicators */}
      <div className="spin-phase-indicator">
        {phases.map(phase => {
          const isActive = phase.fullLabel === currentPhaseKey;
          return (
            <div key={phase.key}
              className={`spin-phase-dot ${isActive ? 'active' : ''}`}
              style={{
                borderColor: isActive ? phase.color : 'transparent',
                background: isActive ? `${phase.color}12` : 'var(--bg-tertiary)',
                boxShadow: isActive ? `0 0 12px ${phase.color}20` : 'none'
              }}
            >
              <div style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: isActive ? phase.color : 'var(--text-tertiary)'
              }}>
                {phase.key}
              </div>
              <div style={{
                fontSize: '0.6rem',
                color: isActive ? phase.color : 'var(--text-muted)',
                marginTop: '2px'
              }}>
                {phase.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bars */}
      <div className="spin-progress-section">
        {phases.map(phase => {
          const progress = data.phaseProgress?.[phase.key] || 0;
          return (
            <div key={phase.key} className="spin-progress-item">
              <div className="spin-progress-label">
                <span style={{ color: phase.color }}>{phase.label}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${phase.color}, ${phase.color}aa)`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Questions */}
      {data.suggestedQuestions && data.suggestedQuestions.length > 0 && (
        <div className="spin-questions">
          <h4>💡 Suggested Questions</h4>
          {data.suggestedQuestions.map((q, i) => (
            <div key={i} className="spin-question-item animate-slide-in"
              style={{ animationDelay: `${i * 0.1}s` }}>
              {q}
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {data.insights && (
        <div className="spin-insights">
          <h4>🧠 Insights</h4>
          <p>{data.insights}</p>
        </div>
      )}

      {/* Key Topics */}
      {data.keyTopics && data.keyTopics.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            📌 Key Topics
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {data.keyTopics.map((topic, i) => (
              <span key={i} style={{
                padding: '4px 10px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)'
              }}>
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Buy Signals */}
      {data.buySignals && data.buySignals.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: 'rgba(16, 185, 129, 0.06)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(16, 185, 129, 0.12)'
        }}>
          <h4 style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--accent-emerald)',
            marginBottom: '6px'
          }}>
            🟢 Buy Signals
          </h4>
          {data.buySignals.map((signal, i) => (
            <p key={i} style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              • {signal}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default SpinPanel;
