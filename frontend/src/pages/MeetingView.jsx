import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import socket from '../services/socket'
import api from '../services/api'
import AudioCaptureService from '../services/audioCapture'
import TranscriptView from '../components/TranscriptView'
import SpinPanel from '../components/SpinPanel'

function MeetingView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasAutoStarted = useRef(false);
  const audioCaptureRef = useRef(null);

  const [meeting, setMeeting] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [spinData, setSpinData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [started, setStarted] = useState(false);
  const [audioStatus, setAudioStatus] = useState(null);

  const mode = searchParams.get('mode') || 'demo';
  const meetLink = searchParams.get('meetLink') || '';
  const autostart = searchParams.get('autostart') === 'true';

  // Load meeting data
  useEffect(() => {
    async function loadMeeting() {
      try {
        const data = await api.getMeeting(id);
        setMeeting(data);
        if (data.transcripts?.length > 0) {
          setTranscripts(data.transcripts);
        }
        if (data.spinAnalysis) {
          setSpinData({
            currentPhase: data.spinAnalysis.phase,
            suggestedQuestions: data.spinAnalysis.suggested_questions,
            phaseProgress: data.spinAnalysis.phase_progress,
            insights: data.spinAnalysis.insights || ''
          });
        }
        setStatus(data.status);
      } catch (err) {
        console.error('Failed to load meeting:', err);
      }
    }
    loadMeeting();
  }, [id]);

  // Socket.IO connection
  useEffect(() => {
    socket.emit('meeting:join', id);

    socket.on('transcript:update', (data) => {
      setTranscripts(prev => [...prev, data]);
    });

    socket.on('spin:update', (data) => {
      setSpinData(data);
    });

    socket.on('meeting:status', (data) => {
      setStatus(data.status);
    });

    socket.on('meeting:error', (data) => {
      console.error('Meeting error:', data.error);
    });

    return () => {
      socket.off('transcript:update');
      socket.off('spin:update');
      socket.off('meeting:status');
      socket.off('meeting:error');
    };
  }, [id]);

  // Auto-start the meeting when coming from setup with autostart=true
  useEffect(() => {
    if (autostart && !hasAutoStarted.current && meeting) {
      hasAutoStarted.current = true;
      handleStart();
    }
  }, [autostart, meeting]);

  // Cleanup audio capture on unmount
  useEffect(() => {
    return () => {
      if (audioCaptureRef.current) {
        audioCaptureRef.current.stop();
      }
    };
  }, []);

  async function handleStart() {
    setStarted(true);
    setStatus('active');

    // Tell backend to start the meeting session (SPIN agent, etc.)
    socket.emit('meeting:start', {
      meetingId: id,
      meetLink: decodeURIComponent(meetLink),
      mode
    });

    if (mode === 'live') {
      // Start Gemini Live session on the backend
      socket.emit('meeting:startLive', { meetingId: id });

      // Start capturing audio from browser
      try {
        const audioCapture = new AudioCaptureService(socket);
        audioCaptureRef.current = audioCapture;

        audioCapture.onStatusChange = (newStatus) => {
          setAudioStatus(newStatus);
        };

        audioCapture.onError = (error) => {
          console.error('Audio capture error:', error);
        };

        await audioCapture.start(id);
      } catch (err) {
        console.error('Failed to start audio capture:', err);
        setAudioStatus('error');
      }
    }
  }

  function handleStop() {
    // Stop audio capture
    if (audioCaptureRef.current) {
      audioCaptureRef.current.stop();
      audioCaptureRef.current = null;
    }

    socket.emit('meeting:stop', id);
    setStarted(false);
    setAudioStatus(null);
  }

  function getAudioStatusLabel() {
    switch (audioStatus) {
      case 'requesting_mic': return '🎤 Requesting microphone...';
      case 'mic_granted': return '🎤 Microphone ready';
      case 'requesting_screen': return '🖥️ Requesting screen share...';
      case 'screen_granted': return '🖥️ Screen share ready';
      case 'screen_denied': return '🎤 Mic only (no screen share)';
      case 'screen_share_ended': return '🎤 Mic only (screen share ended)';
      case 'capturing': return '🔴 Capturing audio';
      case 'error': return '❌ Audio capture failed';
      case 'stopped': return '⏹ Stopped';
      default: return null;
    }
  }

  function getModeLabel() {
    if (mode === 'live') return '🎙️ Live Audio';
    if (mode === 'demo') return '🎬 Demo';
    return mode;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary btn-icon"
              style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}
            >
              ←
            </button>
            <h1 style={{
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'var(--text-primary)'
            }}>
              {meeting?.title || 'Meeting'}
            </h1>
            {(status === 'active' || started) && <span className="badge badge-live">LIVE</span>}
            {status === 'completed' && !started && <span className="badge badge-completed">Completed</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Mode: {getModeLabel()}
              {meetLink && ` · ${decodeURIComponent(meetLink)}`}
            </p>
            {audioStatus && audioStatus !== 'stopped' && (
              <span style={{
                fontSize: '0.72rem',
                padding: '3px 10px',
                borderRadius: '20px',
                background: audioStatus === 'capturing' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.08)',
                color: audioStatus === 'capturing' ? '#ef4444' : 'var(--accent-primary)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {audioStatus === 'capturing' && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }} />
                )}
                {getAudioStatusLabel()}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {!started && status !== 'completed' && (
            <button onClick={handleStart} className="btn btn-success">
              ▶️ Start Session
            </button>
          )}
          {started && status !== 'completed' && (
            <button onClick={handleStop} className="btn btn-danger">
              ⏹ End Session
            </button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="meeting-layout">
        {/* Left: Transcript */}
        <div className="meeting-main">
          <TranscriptView transcripts={transcripts} />
        </div>

        {/* Right: SPIN Panel */}
        <div className="meeting-sidebar-panel">
          <SpinPanel spinData={spinData} />
        </div>
      </div>
    </div>
  )
}

export default MeetingView;
