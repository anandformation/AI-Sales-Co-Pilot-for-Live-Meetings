const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
  createMeeting,
  getMeeting,
  getAllMeetings,
  updateMeetingStatus,
  endMeeting,
  deleteMeeting,
  getTranscripts,
  getSpinAnalyses,
  getSpinHistory
} = require('../db');

const router = express.Router();

// Create a new meeting
router.post('/', (req, res) => {
  try {
    const { title, meetLink, participants } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const id = uuidv4();
    const participantsList = JSON.stringify(participants || []);

    createMeeting.run(id, title, meetLink || '', participantsList);

    const meeting = getMeeting.get(id);
    res.status(201).json({
      ...meeting,
      participants: JSON.parse(meeting.participants)
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// List all meetings
router.get('/', (req, res) => {
  try {
    const meetings = getAllMeetings.all();
    res.json(meetings.map(m => ({
      ...m,
      participants: JSON.parse(m.participants)
    })));
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get meeting details with transcript and SPIN analysis
router.get('/:id', (req, res) => {
  try {
    const meeting = getMeeting.get(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const transcripts = getTranscripts.all(req.params.id);
    const spinAnalysis = getSpinAnalyses.get(req.params.id);

    res.json({
      ...meeting,
      participants: JSON.parse(meeting.participants),
      transcripts,
      spinAnalysis: spinAnalysis ? {
        ...spinAnalysis,
        suggested_questions: JSON.parse(spinAnalysis.suggested_questions),
        phase_progress: JSON.parse(spinAnalysis.phase_progress)
      } : null
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// Update meeting status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    updateMeetingStatus.run(status, req.params.id);
    const meeting = getMeeting.get(req.params.id);
    res.json({
      ...meeting,
      participants: JSON.parse(meeting.participants)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// End a meeting
router.post('/:id/stop', (req, res) => {
  try {
    endMeeting.run(req.params.id);
    const meeting = getMeeting.get(req.params.id);
    res.json({
      ...meeting,
      participants: JSON.parse(meeting.participants)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop meeting' });
  }
});

// Delete a meeting
router.delete('/:id', (req, res) => {
  try {
    deleteMeeting.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// Get SPIN history for a meeting
router.get('/:id/spin-history', (req, res) => {
  try {
    const history = getSpinHistory.all(req.params.id);
    res.json(history.map(h => ({
      ...h,
      suggested_questions: JSON.parse(h.suggested_questions),
      phase_progress: JSON.parse(h.phase_progress)
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SPIN history' });
  }
});

module.exports = router;
