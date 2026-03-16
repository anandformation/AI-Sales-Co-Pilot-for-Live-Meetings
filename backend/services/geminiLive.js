const WebSocket = require('ws');
const { EventEmitter } = require('events');

class GeminiLiveSession extends EventEmitter {
  constructor(apiKey, model) {
    super();
    this.apiKey = apiKey;
    this.model = model || 'gemini-2.5-flash-native-audio-latest';
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;

    // Transcription buffering — accumulate fragments into complete sentences
    this.inputTranscriptBuffer = '';
    this.outputTranscriptBuffer = '';
    this.inputFlushTimer = null;
    this.outputFlushTimer = null;
    this.FLUSH_DELAY_MS = 1500; // Wait 1.5s of silence before flushing a sentence
  }

  getWebSocketUrl() {
    return `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.getWebSocketUrl());

        this.ws.on('open', () => {
          console.log('[GeminiLive] WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Send initial configuration
          // Native audio models require AUDIO responseModality.
          // We use inputAudioTranscription to get text transcripts of spoken audio.
          const configMessage = {
            setup: {
              model: `models/${this.model}`,
              generationConfig: {
                responseModalities: ['AUDIO']
              },
              systemInstruction: {
                parts: [{
                  text: `You are a silent listener. Do not speak or respond. Just listen quietly.`
                }]
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {}
            }
          };

          this.ws.send(JSON.stringify(configMessage));
          console.log('[GeminiLive] Configuration sent');
          resolve();
        });

        this.ws.on('message', (data) => {
          try {
            const response = JSON.parse(data.toString());
            this.handleResponse(response);
          } catch (err) {
            console.error('[GeminiLive] Error parsing response:', err);
          }
        });

        this.ws.on('error', (error) => {
          console.error('[GeminiLive] WebSocket error:', error.message);
          this.emit('error', error);
          if (!this.isConnected) {
            reject(error);
          }
        });

        this.ws.on('close', (code, reason) => {
          console.log(`[GeminiLive] WebSocket closed: ${code} ${reason}`);
          this.isConnected = false;
          // Flush any remaining buffered text
          this._flushInputBuffer();
          this._flushOutputBuffer();
          this.emit('disconnected', { code, reason: reason.toString() });
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  handleResponse(response) {
    // Handle setup complete
    if (response.setupComplete) {
      console.log('[GeminiLive] Setup complete — ready to receive audio');
      this.emit('ready');
      return;
    }

    // Handle server content
    if (response.serverContent) {
      const serverContent = response.serverContent;

      // Handle input transcription (what the speakers said — from mic or system audio)
      if (serverContent.inputTranscription) {
        const text = serverContent.inputTranscription.text;
        if (text) {
          this._appendInputTranscript(text);
        }
      }

      // Ignore outputTranscription — we don't want the AI model's responses in the transcript
      // Ignore modelTurn audio data — we don't want the model's audio response

      // Handle turn completion — flush any remaining buffered text
      if (serverContent.turnComplete) {
        this._flushInputBuffer();
        this.emit('turnComplete');
      }
    }
  }

  /**
   * Accumulate input transcription fragments.
   * Fragments arrive word-by-word or phrase-by-phrase.
   * We buffer them and flush after a pause (FLUSH_DELAY_MS).
   */
  _appendInputTranscript(text) {
    this.inputTranscriptBuffer += text;

    // Reset the flush timer
    if (this.inputFlushTimer) {
      clearTimeout(this.inputFlushTimer);
    }

    // Flush after a pause in incoming fragments
    this.inputFlushTimer = setTimeout(() => {
      this._flushInputBuffer();
    }, this.FLUSH_DELAY_MS);
  }

  _flushInputBuffer() {
    if (this.inputFlushTimer) {
      clearTimeout(this.inputFlushTimer);
      this.inputFlushTimer = null;
    }

    const text = this.inputTranscriptBuffer.trim();
    if (text) {
      console.log(`[GeminiLive] Transcription: "${text}"`);
      this.emit('transcription', {
        speaker: 'Participant',
        text: text,
        type: 'input'
      });
      this.inputTranscriptBuffer = '';
    }
  }

  _appendOutputTranscript(text) {
    this.outputTranscriptBuffer += text;

    if (this.outputFlushTimer) {
      clearTimeout(this.outputFlushTimer);
    }

    this.outputFlushTimer = setTimeout(() => {
      this._flushOutputBuffer();
    }, this.FLUSH_DELAY_MS);
  }

  _flushOutputBuffer() {
    if (this.outputFlushTimer) {
      clearTimeout(this.outputFlushTimer);
      this.outputFlushTimer = null;
    }

    const text = this.outputTranscriptBuffer.trim();
    if (text) {
      // Only emit if it's meaningful (not just silence acknowledgment)
      if (text.length > 2) {
        this.emit('transcription', {
          speaker: 'AI Assistant',
          text: text,
          type: 'output'
        });
      }
      this.outputTranscriptBuffer = '';
    }
  }

  sendAudioChunk(audioBuffer) {
    if (!this.isConnected || !this.ws) {
      return false;
    }

    const encoded = audioBuffer.toString('base64');
    const audioMessage = {
      realtimeInput: {
        mediaChunks: [{
          data: encoded,
          mimeType: 'audio/pcm;rate=16000'
        }]
      }
    };

    try {
      this.ws.send(JSON.stringify(audioMessage));
      return true;
    } catch (err) {
      console.error('[GeminiLive] Error sending audio:', err);
      return false;
    }
  }

  sendText(text) {
    if (!this.isConnected || !this.ws) {
      return false;
    }

    const textMessage = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{ text }]
        }],
        turnComplete: true
      }
    };

    try {
      this.ws.send(JSON.stringify(textMessage));
      return true;
    } catch (err) {
      console.error('[GeminiLive] Error sending text:', err);
      return false;
    }
  }

  disconnect() {
    if (this.inputFlushTimer) clearTimeout(this.inputFlushTimer);
    if (this.outputFlushTimer) clearTimeout(this.outputFlushTimer);
    this._flushInputBuffer();
    this._flushOutputBuffer();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}

module.exports = { GeminiLiveSession };
