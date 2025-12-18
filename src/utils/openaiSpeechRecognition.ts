interface OpenAISpeechRecognitionOptions {
  language?: string;
  getLanguage?: () => string; // Function to get current language dynamically
  getQuestionContext?: () => { question: string; options: string[]; language?: string } | null; // Function to get current question context
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onStop?: () => void;
}

export class OpenAISpeechRecognition {
  private language: string;
  private getLanguage?: () => string; // Function to get current language dynamically
  private getQuestionContext?: () => { question: string; options: string[]; language?: string } | null; // Function to get current question context
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private onTranscript?: (text: string) => void;
  private onError?: (error: string) => void;
  private onStart?: () => void;
  private onStop?: () => void;
  private stream: MediaStream | null = null;
  private recordingStartTime: number = 0;
  private readonly MIN_RECORDING_DURATION_MS = 500; // Minimum 0.5 seconds of recording
  private readonly MIN_AUDIO_SIZE_BYTES = 2048; // Minimum 2KB of audio data

  constructor(options: OpenAISpeechRecognitionOptions) {
    this.language = options.language || 'American';
    this.getLanguage = options.getLanguage;
    this.getQuestionContext = options.getQuestionContext;
    this.onTranscript = options.onTranscript;
    this.onError = options.onError;
    this.onStart = options.onStart;
    this.onStop = options.onStop;
  }

  updateLanguage(language: string): void {
    this.language = language;
  }

  async startRecording(): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      // Create MediaRecorder with optimal settings for speech
      let mimeType = 'audio/webm;codecs=opus';
      
      // Try different audio formats for better compatibility
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      }
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType
      });

      this.audioChunks = [];
      this.isRecording = true;
      this.recordingStartTime = Date.now(); // Track when recording started

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processAudio();
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.onStart?.();
    } catch (error) {
      this.onError?.(`Failed to start recording: ${error}`);
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.onStop?.();
    }
  }

  private async processAudio(): Promise<void> {
    if (this.audioChunks.length === 0) {
      console.log('No audio chunks to process - skipping transcription');
      this.cleanup();
      return;
    }

    try {
      // Calculate recording duration
      const recordingDuration = Date.now() - this.recordingStartTime;
      
      // Check if recording was too short (likely no speech)
      if (recordingDuration < this.MIN_RECORDING_DURATION_MS) {
        console.log(`Recording too short (${recordingDuration}ms < ${this.MIN_RECORDING_DURATION_MS}ms) - skipping transcription`);
        this.cleanup();
        return;
      }

      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // Check if blob has minimum size (at least 2KB to avoid empty/silent audio)
      if (audioBlob.size < this.MIN_AUDIO_SIZE_BYTES) {
        console.log(`Audio blob too small (${audioBlob.size} bytes < ${this.MIN_AUDIO_SIZE_BYTES} bytes) - skipping transcription`);
        this.cleanup();
        return;
      }
      
      console.log(`Processing audio: ${audioBlob.size} bytes, ${recordingDuration}ms duration`);
      
      // Send to OpenAI API via server endpoint
      const transcript = await this.sendToOpenAI(audioBlob);
      
      // Only use transcript if it's not empty and seems valid
      if (transcript && transcript.trim() && transcript.trim().length > 0) {
        // Additional validation: reject very short transcripts that might be noise
        const trimmedTranscript = transcript.trim();
        if (trimmedTranscript.length >= 2) { // At least 2 characters
          this.onTranscript?.(trimmedTranscript);
        } else {
          console.log('Transcript too short, likely noise - ignoring:', trimmedTranscript);
        }
      } else {
        console.log('Empty or invalid transcript received - ignoring');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      // Don't show error for empty audio - it's expected when recording stops quickly
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Check if error is about no transcript generated - treat as empty string, don't show error
      if (errorMessage.includes('No transcript generated') || errorMessage.includes('AI_NoTranscriptGeneratedError')) {
        console.log('No transcript generated (empty/silent audio) - treating as empty string');
        // Don't call onError, just return silently
        this.cleanup();
        return;
      }
      if (!errorMessage.includes('400') && !errorMessage.includes('Bad Request') && !errorMessage.includes('too small')) {
        this.onError?.(`Failed to process audio: ${error}`);
      }
    } finally {
      this.cleanup();
    }
  }
  
  private cleanup(): void {
    // Clear audio chunks after processing
    this.audioChunks = [];
    this.recordingStartTime = 0;
    
    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  private async sendToOpenAI(audioBlob: Blob): Promise<string> {
    try {
      // Get PartyKit host (same logic as store.ts)
      const getPartyKitHost = (): string => {
        if (window.location.hostname !== "localhost") {
          return window.location.host;
        }
        const currentPort = window.location.port;
        if (currentPort && currentPort !== "80" && currentPort !== "443") {
          return `localhost:${currentPort}`;
        }
        return `localhost:1999`;
      };
      
      const host = getPartyKitHost();
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      
      // Get roomId from URL or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const roomId = urlParams.get('room') || localStorage.getItem('snapquiz_roomId') || '';
      
      // Get current question context if available
      const questionContext = this.getQuestionContext ? this.getQuestionContext() : null;
      
      const formData = new FormData();
      const fileName = audioBlob.type.includes('mp4') ? 'audio.mp4' : 
                      audioBlob.type.includes('webm') ? 'audio.webm' : 
                      audioBlob.type.includes('wav') ? 'audio.wav' : 'audio.webm';
      formData.append('file', audioBlob, fileName);
      
      
      // Add question context as prompt if available
      // Note: We only provide context, not instructions to generate answers
      if (questionContext) {
        const prompt = `This audio contains an answer to a quiz question. The question is: "${questionContext.question}". So expect an answer in the same language as the question. Only transcribe what is actually spoken in the audio. If the audio is silent or contains no speech, return an empty string.`;
        formData.append('prompt', prompt);
      }

      const response = await fetch(`${protocol}//${host}/parties/main/${roomId}/transcribe`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Don't throw error for 400 (bad request) - likely empty or invalid audio
        if (response.status === 400) {
          console.log('Audio transcription rejected (likely empty/invalid audio):', errorText);
          return ''; // Return empty string instead of throwing
        }
        // Check if error is about no transcript generated - treat as empty string
        if (errorText.includes('No transcript generated') || errorText.includes('AI_NoTranscriptGeneratedError')) {
          console.log('No transcript generated (empty/silent audio) - returning empty string');
          return ''; // Return empty string instead of throwing
        }
        throw new Error(`OpenAI transcription error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      throw new Error(`Failed to transcribe audio: ${error}`);
    }
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  destroy(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isRecording = false;
  }
}

// Utility function to check if OpenAI speech recognition is available
export function isOpenAISpeechRecognitionAvailable(): boolean {
  return typeof MediaRecorder !== 'undefined' && 
         typeof navigator.mediaDevices !== 'undefined' &&
         navigator.mediaDevices.getUserMedia !== undefined;
}

