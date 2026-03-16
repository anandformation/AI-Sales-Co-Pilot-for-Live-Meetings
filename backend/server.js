require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const meetingsRouter = require('./routes/meetings');
const { MeetBot } = require('./services/meetBot');
const { SpinAgent } = require('./services/spinAgent');
const { GeminiLiveSession } = require('./services/geminiLive');
const { addTranscript, addSpinAnalysis, updateMeetingStatus } = require('./db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// REST API routes
app.use('/api/meetings', meetingsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// Socket.IO Real-time Communication
// ============================================

// Active sessions per meeting
const activeSessions = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Join a meeting room
  socket.on('meeting:join', (meetingId) => {
    socket.join(meetingId);
    console.log(`[Socket.IO] Client ${socket.id} joined meeting ${meetingId}`);

    // Send current session state if exists
    const session = activeSessions.get(meetingId);
    if (session) {
      socket.emit('meeting:status', { status: session.status });
      if (session.spinAgent?.lastAnalysis) {
        socket.emit('spin:update', session.spinAgent.lastAnalysis);
      }
    }
  });

  // Start meeting (live audio, demo, or bot mode)
  socket.on('meeting:start', async ({ meetingId, meetLink, mode }) => {
    console.log(`[Socket.IO] Starting meeting ${meetingId} in ${mode} mode`);

    try {
      const spinAgent = new SpinAgent(process.env.GEMINI_API_KEY);
      let meetBot = null;

      const session = {
        meetingId,
        spinAgent,
        meetBot,
        status: 'starting',
        transcripts: []
      };

      activeSessions.set(meetingId, session);
      updateMeetingStatus.run('active', meetingId);

      // Set up SPIN agent
      spinAgent.on('spinUpdate', (analysis) => {
        io.to(meetingId).emit('spin:update', analysis);
        // Save to database
        try {
          addSpinAnalysis.run(
            meetingId,
            analysis.currentPhase || 'SITUATION',
            JSON.stringify(analysis.suggestedQuestions || []),
            JSON.stringify(analysis.phaseProgress || {}),
            analysis.insights || ''
          );
        } catch (err) {
          console.error('[DB] Error saving SPIN analysis:', err);
        }
      });

      spinAgent.start();

      if (mode === 'live') {
        // Live Audio mode — audio comes from browser via audio:chunk events
        // Gemini Live session is started separately via meeting:startLive
        console.log(`[Socket.IO] Live Audio mode — waiting for audio stream from browser`);

      } else if (mode === 'demo') {
        // Demo mode - simulate conversation
        meetBot = new MeetBot();
        session.meetBot = meetBot;

        meetBot.on('status', (statusData) => {
          session.status = statusData.status;
          io.to(meetingId).emit('meeting:status', statusData);
        });

        meetBot.on('caption', (caption) => {
          io.to(meetingId).emit('transcript:update', caption);
          session.transcripts.push(caption);
          spinAgent.addTranscript(caption);

          try {
            addTranscript.run(meetingId, caption.speaker, caption.text);
          } catch (err) {
            console.error('[DB] Error saving transcript:', err);
          }
        });

        await meetBot.join('demo-meeting');
        meetBot.startCaptionCapture();
      }

      io.to(meetingId).emit('meeting:status', { status: 'active' });

    } catch (error) {
      console.error(`[Socket.IO] Error starting meeting: ${error.message}`);
      io.to(meetingId).emit('meeting:error', { error: error.message });
    }
  });

  // Handle live audio chunks — routed by source (mic vs screen)
  socket.on('audio:chunk', async ({ meetingId, audioData, source }) => {
    const session = activeSessions.get(meetingId);
    if (!session) return;

    const buffer = Buffer.from(audioData, 'base64');

    // Route audio to the correct Gemini session based on source
    if (source === 'mic' && session.geminiMic) {
      session.geminiMic.sendAudioChunk(buffer);
    } else if (source === 'screen' && session.geminiScreen) {
      session.geminiScreen.sendAudioChunk(buffer);
    } else if (session.geminiSession) {
      // Fallback: single session mode
      session.geminiSession.sendAudioChunk(buffer);
    }
  });

  // Helper: create a Gemini Live session for a specific speaker
  async function createGeminiSessionForSpeaker(meetingId, session, speakerLabel) {
    const geminiSession = new GeminiLiveSession(
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_MODEL
    );

    geminiSession.on('transcription', (data) => {
      const transcriptEntry = {
        ...data,
        speaker: speakerLabel, // Override with our known speaker label
        timestamp: new Date().toISOString()
      };

      io.to(meetingId).emit('transcript:update', transcriptEntry);

      session.transcripts.push(transcriptEntry);
      if (session.spinAgent) {
        session.spinAgent.addTranscript(transcriptEntry);
      }

      try {
        addTranscript.run(meetingId, speakerLabel, data.text);
      } catch (err) {
        console.error('[DB] Error saving transcript:', err);
      }
    });

    geminiSession.on('ready', () => {
      console.log(`[GeminiLive] ${speakerLabel} session ready for ${meetingId}`);
    });

    geminiSession.on('error', (error) => {
      console.error(`[GeminiLive] ${speakerLabel} error for ${meetingId}:`, error.message);
      io.to(meetingId).emit('meeting:error', { error: `${speakerLabel}: ${error.message}` });
    });

    geminiSession.on('disconnected', ({ code, reason }) => {
      console.log(`[GeminiLive] ${speakerLabel} disconnected for ${meetingId}: ${code} ${reason}`);
    });

    await geminiSession.connect();
    console.log(`[GeminiLive] ${speakerLabel} session connected for ${meetingId}`);
    return geminiSession;
  }

  // Start Gemini Live sessions for real-time transcription
  socket.on('meeting:startLive', async ({ meetingId }) => {
    console.log(`[Socket.IO] Starting Gemini Live sessions for ${meetingId}`);

    try {
      const session = activeSessions.get(meetingId);
      if (!session) {
        console.error(`[Socket.IO] No active session found for ${meetingId}`);
        return;
      }

      // Create TWO separate Gemini sessions:
      // 1. Mic session → transcriptions labeled as "You (Seller)"
      // 2. Screen session → transcriptions labeled as "Client"
      const [micSession, screenSession] = await Promise.all([
        createGeminiSessionForSpeaker(meetingId, session, 'You (Seller)'),
        createGeminiSessionForSpeaker(meetingId, session, 'Client')
      ]);

      session.geminiMic = micSession;
      session.geminiScreen = screenSession;

      io.to(meetingId).emit('meeting:status', { status: 'live_ready' });
      console.log(`[Socket.IO] Both Gemini Live sessions ready for ${meetingId}`);

    } catch (error) {
      console.error(`[Socket.IO] Error starting live sessions: ${error.message}`);
      io.to(meetingId).emit('meeting:error', { error: error.message });
    }
  });

  // Stop meeting
  socket.on('meeting:stop', async (meetingId) => {
    const session = activeSessions.get(meetingId);
    if (session) {
      if (session.meetBot) {
        await session.meetBot.leave();
      }
      if (session.spinAgent) {
        session.spinAgent.stop();
      }
      if (session.geminiSession) {
        session.geminiSession.disconnect();
      }
      if (session.geminiMic) {
        session.geminiMic.disconnect();
      }
      if (session.geminiScreen) {
        session.geminiScreen.disconnect();
      }
      activeSessions.delete(meetingId);
      updateMeetingStatus.run('completed', meetingId);
      io.to(meetingId).emit('meeting:status', { status: 'completed' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   Assistant Meet Commercial - Backend    ║
  ║   Running on port ${PORT}                   ║
  ╚══════════════════════════════════════════╝
  `);
});
