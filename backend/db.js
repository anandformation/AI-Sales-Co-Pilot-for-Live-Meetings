const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    meet_link TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    participants TEXT DEFAULT '[]',
    notes TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS transcripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id TEXT NOT NULL,
    speaker TEXT DEFAULT 'Unknown',
    text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id)
  );

  CREATE TABLE IF NOT EXISTS spin_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    suggested_questions TEXT DEFAULT '[]',
    phase_progress TEXT DEFAULT '{}',
    insights TEXT DEFAULT '',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id)
  );
`);

// Meeting operations
const createMeeting = db.prepare(`
  INSERT INTO meetings (id, title, meet_link, status, participants)
  VALUES (?, ?, ?, 'pending', ?)
`);

const getMeeting = db.prepare(`SELECT * FROM meetings WHERE id = ?`);
const getAllMeetings = db.prepare(`SELECT * FROM meetings ORDER BY created_at DESC`);
const updateMeetingStatus = db.prepare(`UPDATE meetings SET status = ? WHERE id = ?`);
const endMeeting = db.prepare(`UPDATE meetings SET status = 'completed', ended_at = CURRENT_TIMESTAMP WHERE id = ?`);
const deleteMeeting = db.prepare(`DELETE FROM meetings WHERE id = ?`);

// Transcript operations
const addTranscript = db.prepare(`
  INSERT INTO transcripts (meeting_id, speaker, text)
  VALUES (?, ?, ?)
`);

const getTranscripts = db.prepare(`
  SELECT * FROM transcripts WHERE meeting_id = ? ORDER BY timestamp ASC
`);

// SPIN analysis operations
const addSpinAnalysis = db.prepare(`
  INSERT INTO spin_analyses (meeting_id, phase, suggested_questions, phase_progress, insights)
  VALUES (?, ?, ?, ?, ?)
`);

const getSpinAnalyses = db.prepare(`
  SELECT * FROM spin_analyses WHERE meeting_id = ? ORDER BY timestamp DESC LIMIT 1
`);

const getSpinHistory = db.prepare(`
  SELECT * FROM spin_analyses WHERE meeting_id = ? ORDER BY timestamp ASC
`);

module.exports = {
  db,
  createMeeting,
  getMeeting,
  getAllMeetings,
  updateMeetingStatus,
  endMeeting,
  deleteMeeting,
  addTranscript,
  getTranscripts,
  addSpinAnalysis,
  getSpinAnalyses,
  getSpinHistory
};
