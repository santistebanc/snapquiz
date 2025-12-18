import type { WordTimestamp } from '../types';

interface UnrealSpeechResponse {
  OutputUri: string;
  TimestampsUri: string;
  TaskStatus: string;
}

interface TimestampData {
  word: string;
  start: number;
  end: number;
  text_offset: number;
}

export async function generateAudioWithTimestampsUnrealSpeech(
  text: string,
  voiceId: string = 'Daniel',
  audioBucket?: R2Bucket | null,
  questionId?: string
): Promise<{ audioUrl: string; wordTimestamps: WordTimestamp[] }> {
  const apiKey = process.env.UNREALSPEECH_API_KEY;
  
  if (!apiKey) {
    throw new Error('UnrealSpeech API key not configured');
  }

  try {
    // Step 1: Request audio generation
    const response = await fetch('https://api.v8.unrealspeech.com/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: voiceId,
        Bitrate: '192k',
        Speed: 0,
        Pitch: 1.0,
        TimestampType: 'word', // Request word-level timestamps
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('UnrealSpeech API error:', errorText);
      throw new Error(`UnrealSpeech API failed: ${response.status} ${errorText}`);
    }

    const data = await response.json() as UnrealSpeechResponse;

    if (data.TaskStatus !== 'completed') {
      console.warn('UnrealSpeech task not completed:', data.TaskStatus);
    }

    // Step 2: Fetch timestamps from the TimestampsUri
    let wordTimestamps: WordTimestamp[] = [];
    
    if (data.TimestampsUri) {
      try {
        const timestampsResponse = await fetch(data.TimestampsUri);
        if (timestampsResponse.ok) {
          const timestampsData = await timestampsResponse.json() as TimestampData[];
          
          // Convert timestamps to our format
          wordTimestamps = timestampsData.map(item => ({
            word: item.word,
            start: item.start,
            end: item.end,
          }));
        } else {
          console.warn('Failed to fetch timestamps from:', data.TimestampsUri);
        }
      } catch (timestampError) {
        console.error('Error fetching timestamps:', timestampError);
      }
    }

    // UnrealSpeech already returns a public URL, but we can optionally upload to R2 for consistency
    let audioUrl = data.OutputUri;
    
    // If R2 is available and we want to store a copy, we could fetch and upload
    // For now, we'll use the UnrealSpeech URL directly since it's already publicly accessible
    if (audioBucket && questionId) {
      try {
        // Optionally: fetch the audio from UnrealSpeech and upload to R2
        // For now, we'll just use the UnrealSpeech URL
        console.log(`[UnrealSpeech] Using UnrealSpeech URL: ${audioUrl}`);
      } catch (r2Error) {
        console.error(`[UnrealSpeech] R2 upload failed, using UnrealSpeech URL:`, r2Error);
      }
    }
    
    return {
      audioUrl,
      wordTimestamps,
    };
  } catch (error) {
    console.error('Error generating audio with UnrealSpeech:', error);
    // Return empty values if audio generation fails - don't break question generation
    return {
      audioUrl: '',
      wordTimestamps: [],
    };
  }
}

import type { R2Bucket } from '@cloudflare/workers-types';

// Main function that routes to the appropriate TTS provider
export async function generateAudioWithTimestamps(
  text: string,
  voiceId: string = 'Daniel',
  provider: 'unrealspeech' | 'openai' = 'unrealspeech',
  audioBucket?: R2Bucket | null,
  questionId?: string
): Promise<{ audioUrl: string; wordTimestamps: WordTimestamp[] }> {
  if (provider === 'openai') {
    const { generateAudioWithTimestampsOpenAI } = await import('./generateAudioOpenAI');
    return generateAudioWithTimestampsOpenAI(text, voiceId, audioBucket, questionId);
  } else {
    return generateAudioWithTimestampsUnrealSpeech(text, voiceId, audioBucket, questionId);
  }
}

