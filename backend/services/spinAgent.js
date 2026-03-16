const { EventEmitter } = require('events');

const SPIN_SYSTEM_PROMPT = `You are an expert in SPIN Selling methodology (Neil Rackham). You analyze sales conversations in real-time.

The SPIN method is broken down into 4 phases:

1. **SITUATION** - Questions to understand the prospect's current context:
   - "How do you currently handle...?"
   - "What tools are you using for...?"
   - "How many people are involved in...?"

2. **PROBLEM** - Questions to identify challenges and pain points:
   - "What challenges do you face with...?"
   - "Are you satisfied with your current solution?"
   - "What frustrations do you have with...?"

3. **IMPLICATION** - Questions to amplify the impact of problems:
   - "What impact does this problem have on your productivity?"
   - "If this issue isn't resolved, what would the consequences be?"
   - "How much is this costing you in time and money?"

4. **NEED_PAYOFF** - Questions to help the prospect visualize the solution:
   - "How would things change if you could...?"
   - "What benefit would you see from solving this problem?"
   - "If we could automate this process, what impact would that have?"

INSTRUCTIONS:
- Analyze the conversation transcript
- Identify the current SPIN phase
- Suggest 2-3 relevant questions to advance through the SPIN process
- Give a progress score (0-100) for each phase
- Provide a brief insight about the conversation dynamics

ALWAYS respond in valid JSON with this structure:
{
  "currentPhase": "SITUATION|PROBLEM|IMPLICATION|NEED_PAYOFF",
  "suggestedQuestions": ["question1", "question2", "question3"],
  "phaseProgress": { "S": 0, "P": 0, "I": 0, "N": 0 },
  "insights": "Brief insight about the conversation",
  "keyTopics": ["topic1", "topic2"],
  "buySignals": ["signal if detected"]
}`;

class SpinAgent extends EventEmitter {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.transcriptBuffer = [];
    this.analysisInterval = null;
    this.lastAnalysis = null;
    this.isAnalyzing = false;
    this.minBufferSize = 5; // Wait for at least 5 transcript entries
    this.analysisIntervalMs = 30000; // Analyze every 30 seconds
  }

  start() {
    console.log('[SPINAgent] Started monitoring transcription');
    this.analysisInterval = setInterval(() => {
      this.analyzeIfReady();
    }, this.analysisIntervalMs);

    // Emit initial state
    this.emit('spinUpdate', {
      currentPhase: 'SITUATION',
      suggestedQuestions: [
        'Can you walk me through your current process?',
        'What tools are you using today?',
        'Who are the key stakeholders in this decision?'
      ],
      phaseProgress: { S: 0, P: 0, I: 0, N: 0 },
      insights: 'Waiting for the conversation to begin...',
      keyTopics: [],
      buySignals: []
    });
  }

  stop() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    console.log('[SPINAgent] Stopped monitoring');
  }

  addTranscript(entry) {
    this.transcriptBuffer.push({
      speaker: entry.speaker,
      text: entry.text,
      timestamp: new Date().toISOString()
    });
  }

  async analyzeIfReady() {
    if (this.isAnalyzing || this.transcriptBuffer.length < this.minBufferSize) {
      return;
    }

    this.isAnalyzing = true;

    try {
      const fullTranscript = this.transcriptBuffer
        .map(t => `[${t.speaker}]: ${t.text}`)
        .join('\n');

      const analysis = await this.callGeminiForAnalysis(fullTranscript);

      if (analysis) {
        this.lastAnalysis = analysis;
        this.emit('spinUpdate', analysis);
      }
    } catch (error) {
      console.error('[SPINAgent] Analysis error:', error.message);
    } finally {
      this.isAnalyzing = false;
    }
  }

  async callGeminiForAnalysis(transcript) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Here is the transcript of an ongoing sales conversation:\n\n${transcript}\n\nAnalyze this conversation using the SPIN Selling methodology.`
              }]
            }],
            systemInstruction: {
              parts: [{ text: SPIN_SYSTEM_PROMPT }]
            },
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const text = data.candidates[0].content.parts[0].text;
        try {
          return JSON.parse(text);
        } catch {
          console.error('[SPINAgent] Failed to parse JSON response:', text.substring(0, 200));
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('[SPINAgent] API call failed:', error.message);
      return null;
    }
  }

  async forceAnalysis() {
    this.isAnalyzing = false;
    await this.analyzeIfReady();
  }
}

module.exports = { SpinAgent };
