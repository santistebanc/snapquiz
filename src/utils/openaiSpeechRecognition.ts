interface OpenAISpeechRecognitionOptions {
  language?: string;
  getLanguage?: () => string; // Function to get current language dynamically
  getQuestionContext?: () => { question: string; options: string[] } | null; // Function to get current question context
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onStop?: () => void;
}

export class OpenAISpeechRecognition {
  private language: string;
  private getLanguage?: () => string; // Function to get current language dynamically
  private getQuestionContext?: () => { question: string; options: string[] } | null; // Function to get current question context
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private onTranscript?: (text: string) => void;
  private onError?: (error: string) => void;
  private onStart?: () => void;
  private onStop?: () => void;
  private stream: MediaStream | null = null;

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
      console.log('No audio chunks to process');
      return;
    }

    try {
      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // Check if blob has minimum size (at least 1KB to avoid empty audio)
      if (audioBlob.size < 1024) {
        console.log('Audio blob too small, skipping transcription:', audioBlob.size, 'bytes');
        return;
      }
      
      // Send to OpenAI API via server endpoint
      const transcript = await this.sendToOpenAI(audioBlob);
      
      if (transcript && transcript.trim()) {
        this.onTranscript?.(transcript);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      // Don't show error for empty audio - it's expected when recording stops quickly
      if (!error?.message?.includes('400') && !error?.message?.includes('Bad Request')) {
        this.onError?.(`Failed to process audio: ${error}`);
      }
    } finally {
      // Clear audio chunks after processing
      this.audioChunks = [];
      
      // Stop all tracks
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
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
      
      // Get current language (use getter function if available, otherwise use stored language)
      const currentLanguage = this.getLanguage ? this.getLanguage() : this.language;
      
      // Map language setting to ISO 639-1 code
      const languageMap: Record<string, string> = {
        'American': 'en',
        'Chinese': 'zh',
        'Spanish': 'es',
        'French': 'fr',
        'Hindi': 'hi',
        'Italian': 'it',
        'Portuguese': 'pt',
      };
      const languageCode = languageMap[currentLanguage] || 'en';
      
      // Get current question context if available
      const questionContext = this.getQuestionContext ? this.getQuestionContext() : null;
      
      const formData = new FormData();
      const fileName = audioBlob.type.includes('mp4') ? 'audio.mp4' : 
                      audioBlob.type.includes('webm') ? 'audio.webm' : 
                      audioBlob.type.includes('wav') ? 'audio.wav' : 'audio.webm';
      formData.append('file', audioBlob, fileName);
      formData.append('language', languageCode);
      
      // Add question context as prompt if available
      if (questionContext) {
        const prompt = `This is an answer to a quiz question. The question is: "${questionContext.question}". The possible answer options are: ${questionContext.options.join(', ')}.`;
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

