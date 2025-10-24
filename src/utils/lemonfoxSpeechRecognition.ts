interface LemonfoxSpeechRecognitionOptions {
  apiKey: string;
  language?: string;
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onStop?: () => void;
}

export class LemonfoxSpeechRecognition {
  private apiKey: string;
  private language: string;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private onTranscript?: (text: string) => void;
  private onError?: (error: string) => void;
  private onStart?: () => void;
  private onStop?: () => void;

  constructor(options: LemonfoxSpeechRecognitionOptions) {
    this.apiKey = options.apiKey;
    this.language = options.language || 'english';
    this.onTranscript = options.onTranscript;
    this.onError = options.onError;
    this.onStart = options.onStart;
    this.onStop = options.onStop;
  }

  async startRecording(): Promise<void> {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      // Create MediaRecorder with optimal settings for speech
      // LEMONFOX supports: mp3, wav, flac, aac, opus, ogg, m4a, mp4, mpeg, mov, webm
      let mimeType = 'audio/webm;codecs=opus';
      
      // Try different audio formats for better compatibility with LEMONFOX
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'; // Best for LEMONFOX
      } else if (MediaRecorder.isTypeSupported('audio/mp3')) {
        mimeType = 'audio/mp3';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      }
      
      this.mediaRecorder = new MediaRecorder(stream, {
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
    if (this.audioChunks.length === 0) return;

    try {
      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // Send to LEMONFOX API
      const transcript = await this.sendToLemonfox(audioBlob);
      
      if (transcript && transcript.trim()) {
        this.onTranscript?.(transcript);
      }
    } catch (error) {
      this.onError?.(`Failed to process audio: ${error}`);
    }
  }


  private async sendToLemonfox(audioBlob: Blob): Promise<string> {
    try {
      // Create FormData for multipart request according to LEMONFOX API docs
      const formData = new FormData();
      
      // Determine file extension based on blob type (LEMONFOX supports many formats)
      let fileName = 'audio.webm';
      if (audioBlob.type.includes('mp4')) {
        fileName = 'audio.mp4';
      } else if (audioBlob.type.includes('mp3')) {
        fileName = 'audio.mp3';
      } else if (audioBlob.type.includes('wav')) {
        fileName = 'audio.wav';
      } else if (audioBlob.type.includes('flac')) {
        fileName = 'audio.flac';
      } else if (audioBlob.type.includes('aac')) {
        fileName = 'audio.aac';
      } else if (audioBlob.type.includes('ogg')) {
        fileName = 'audio.ogg';
      }
      
      formData.append('file', audioBlob, fileName);
      formData.append('language', 'english'); // Use 'english' as per LEMONFOX docs
      formData.append('response_format', 'text');

      const response = await fetch('https://api.lemonfox.ai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LEMONFOX API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const transcript = await response.text();
      // Handle JSON response that might have quotes around the text
      let cleanTranscript = transcript.trim();
      // Remove surrounding quotes if present
      if (cleanTranscript.startsWith('"') && cleanTranscript.endsWith('"')) {
        cleanTranscript = cleanTranscript.slice(1, -1);
      }
      return cleanTranscript;
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
    this.isRecording = false;
  }
}

// Utility function to check if LEMONFOX is available
export function isLemonfoxAvailable(): boolean {
  return typeof MediaRecorder !== 'undefined' && 
         typeof navigator.mediaDevices !== 'undefined' &&
         navigator.mediaDevices.getUserMedia !== undefined;
}

// Utility function to detect mobile devices
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
