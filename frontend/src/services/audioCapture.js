/**
 * AudioCaptureService
 * 
 * Captures audio from:
 * 1. User's microphone (getUserMedia) → tagged as 'mic' (Seller)
 * 2. System/tab audio from Google Meet (getDisplayMedia) → tagged as 'screen' (Client)
 * 
 * Sends each stream SEPARATELY via Socket.IO so the backend can
 * identify who is speaking (mic = seller, screen = client).
 */

class AudioCaptureService {
  constructor(socket) {
    this.socket = socket;
    this.micStream = null;
    this.screenStream = null;
    this.micContext = null;
    this.screenContext = null;
    this.micProcessor = null;
    this.screenProcessor = null;
    this.isCapturing = false;
    this.meetingId = null;
    this.onStatusChange = null;
    this.onError = null;
  }

  /**
   * Start capturing audio from mic + system audio as separate streams.
   * @param {string} meetingId - The meeting ID to tag audio chunks with
   */
  async start(meetingId) {
    this.meetingId = meetingId;
    this._emitStatus('requesting_permissions');

    try {
      // 1. Request microphone access
      this._emitStatus('requesting_mic');
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });
      this._emitStatus('mic_granted');

      // Set up mic audio processing (tagged as 'mic' = Seller)
      this._setupAudioProcessor('mic', this.micStream);

      // 2. Request screen/tab share for system audio (Client)
      this._emitStatus('requesting_screen');
      try {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,  // Required by browser
          audio: true   // This captures tab/system audio
        });
        this._emitStatus('screen_granted');

        // Stop the video track — we only need audio
        const videoTracks = this.screenStream.getVideoTracks();
        videoTracks.forEach(track => track.stop());

        // Check if we got audio
        const audioTracks = this.screenStream.getAudioTracks();
        if (audioTracks.length > 0) {
          // Set up screen audio processing (tagged as 'screen' = Client)
          this._setupAudioProcessor('screen', this.screenStream);

          audioTracks[0].addEventListener('ended', () => {
            console.log('[AudioCapture] Screen share audio ended by user');
            this._emitStatus('screen_share_ended');
          });
        } else {
          console.warn('[AudioCapture] Screen share has no audio tracks');
          this._emitStatus('screen_no_audio');
        }
      } catch (screenErr) {
        console.warn('[AudioCapture] Screen share denied, continuing with mic only:', screenErr.message);
        this._emitStatus('screen_denied');
        this.screenStream = null;
      }

      this.isCapturing = true;
      this._emitStatus('capturing');
      console.log('[AudioCapture] Started capturing audio (separate streams)');

    } catch (error) {
      console.error('[AudioCapture] Failed to start:', error);
      this._emitStatus('error');
      if (this.onError) {
        this.onError(error);
      }
      this.stop();
      throw error;
    }
  }

  /**
   * Set up an AudioContext + ScriptProcessor for a given stream.
   * Sends PCM chunks via socket tagged with the source ('mic' or 'screen').
   */
  _setupAudioProcessor(source, stream) {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const sourceNode = audioContext.createMediaStreamSource(stream);

    // Buffer size: 4096 samples at 16kHz = ~256ms chunks
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    sourceNode.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (event) => {
      if (!this.isCapturing) return;

      const inputData = event.inputBuffer.getChannelData(0);
      const pcm16 = this._float32ToInt16(inputData);
      const base64Data = this._arrayBufferToBase64(pcm16.buffer);

      this.socket.emit('audio:chunk', {
        meetingId: this.meetingId,
        audioData: base64Data,
        source: source  // 'mic' or 'screen'
      });
    };

    if (source === 'mic') {
      this.micContext = audioContext;
      this.micProcessor = processor;
    } else {
      this.screenContext = audioContext;
      this.screenProcessor = processor;
    }
  }

  /**
   * Stop all audio capture and clean up resources.
   */
  stop() {
    this.isCapturing = false;

    // Clean up mic
    if (this.micProcessor) {
      this.micProcessor.disconnect();
      this.micProcessor.onaudioprocess = null;
      this.micProcessor = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.micContext && this.micContext.state !== 'closed') {
      this.micContext.close().catch(() => {});
      this.micContext = null;
    }

    // Clean up screen
    if (this.screenProcessor) {
      this.screenProcessor.disconnect();
      this.screenProcessor.onaudioprocess = null;
      this.screenProcessor = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
    if (this.screenContext && this.screenContext.state !== 'closed') {
      this.screenContext.close().catch(() => {});
      this.screenContext = null;
    }

    this._emitStatus('stopped');
    console.log('[AudioCapture] Stopped');
  }

  hasSystemAudio() {
    return this.screenStream && this.screenStream.getAudioTracks().length > 0 &&
           this.screenStream.getAudioTracks()[0].readyState === 'live';
  }

  hasMicAudio() {
    return this.micStream && this.micStream.getAudioTracks().length > 0 &&
           this.micStream.getAudioTracks()[0].readyState === 'live';
  }

  _emitStatus(status) {
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  _float32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }

  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export default AudioCaptureService;
