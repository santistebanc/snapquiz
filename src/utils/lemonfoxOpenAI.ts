import OpenAI from 'openai';

export class LemonfoxOpenAI {
  private openai: OpenAI;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.lemonfox.ai/v1",
      dangerouslyAllowBrowser: true, // Required for browser usage
    });
  }

  async transcribeAudio(audioBlob: Blob, language: string = 'english'): Promise<string> {
    try {
      console.log('LemonfoxOpenAI: Starting transcription with OpenAI SDK');
      
      // Convert blob to File for OpenAI SDK
      const audioFile = new File([audioBlob], 'audio.webm', { type: audioBlob.type });
      
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: language,
        response_format: "text"
      });

      console.log('LemonfoxOpenAI: Transcription successful:', transcription);
      // Handle both string and object responses
      const text = typeof transcription === 'string' ? transcription : transcription.text || String(transcription);
      return text;
    } catch (error) {
      console.error('LemonfoxOpenAI: Transcription failed:', error);
      throw new Error(`LEMONFOX API error: ${error}`);
    }
  }

  async transcribeAudioWithOptions(audioBlob: Blob, options: {
    language?: string;
    response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
    temperature?: number;
    timestamp_granularities?: string[];
  } = {}): Promise<string> {
    try {
      console.log('LemonfoxOpenAI: Starting transcription with options:', options);
      
      // Convert blob to File for OpenAI SDK
      const audioFile = new File([audioBlob], 'audio.webm', { type: audioBlob.type });
      
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: options.language || 'english',
        response_format: options.response_format || 'text',
        temperature: options.temperature,
        timestamp_granularities: options.timestamp_granularities
      });

      console.log('LemonfoxOpenAI: Transcription successful:', transcription);
      // Handle both string and object responses
      const text = typeof transcription === 'string' ? transcription : transcription.text || String(transcription);
      return text;
    } catch (error) {
      console.error('LemonfoxOpenAI: Transcription failed:', error);
      throw new Error(`LEMONFOX API error: ${error}`);
    }
  }
}

// Helper function to check if LEMONFOX is available
export function isLemonfoxOpenAIAvailable(): boolean {
  return typeof window !== 'undefined' && 
    (window as any).LEMONFOX_API_KEY && 
    (window as any).LEMONFOX_API_KEY !== 'undefined';
}
