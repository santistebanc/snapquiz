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

export async function generateAudioWithTimestamps(
  text: string,
  voiceId: string = 'Daniel'
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

    return {
      audioUrl: data.OutputUri,
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

