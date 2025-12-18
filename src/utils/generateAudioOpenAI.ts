import type { WordTimestamp } from '../types';
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Map UnrealSpeech voice IDs to OpenAI voice names
const voiceMap: Record<string, 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'> = {
  // American voices - map to OpenAI voices
  'Noah': 'onyx',
  'Jasper': 'echo',
  'Caleb': 'onyx',
  'Ronan': 'echo',
  'Ethan': 'onyx',
  'Daniel': 'alloy',
  'Zane': 'echo',
  'Autumn': 'nova',
  'Melody': 'shimmer',
  'Hannah': 'nova',
  'Emily': 'shimmer',
  'Ivy': 'nova',
  'Kaitlyn': 'shimmer',
  'Luna': 'nova',
  'Willow': 'shimmer',
  'Lauren': 'nova',
  'Sierra': 'shimmer',
  // Default mappings for other languages
  'Wei': 'onyx',
  'Jian': 'echo',
  'Hao': 'onyx',
  'Sheng': 'echo',
  'Mei': 'nova',
  'Lian': 'shimmer',
  'Ting': 'nova',
  'Jing': 'shimmer',
  'Mateo': 'onyx',
  'Javier': 'echo',
  'Lucía': 'nova',
  'Élodie': 'shimmer',
  'Arjun': 'onyx',
  'Rohan': 'echo',
  'Ananya': 'nova',
  'Priya': 'shimmer',
  'Luca': 'onyx',
  'Giulia': 'nova',
  'Thiago': 'onyx',
  'Rafael': 'echo',
  'Camila': 'nova',
};

// Estimate word timestamps based on text
// Uses faster speaking rate for OpenAI TTS (~180-200 words per minute)
function estimateWordTimestamps(text: string): WordTimestamp[] {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const wordsPerSecond = 3.2; // Faster speaking rate (~192 words per minute)
  const baseDelay = 0.2; // Shorter initial delay
  const pauseBetweenWords = 0.1; // Shorter pause between words
  
  const timestamps: WordTimestamp[] = [];
  let currentTime = baseDelay;
  
  words.forEach((word, index) => {
    // Estimate duration based on word length (longer words take more time)
    // Faster rate: ~0.03s per character, minimum 0.15s
    const wordDuration = Math.max(0.15, word.length * 0.03);
    
    timestamps.push({
      word: word,
      start: currentTime,
      end: currentTime + wordDuration,
    });
    
    currentTime += wordDuration + pauseBetweenWords;
  });
  
  return timestamps;
}

import type { R2Bucket } from '@cloudflare/workers-types';
import { uploadAudioToR2, generateAudioKey } from './uploadToR2';

export async function generateAudioWithTimestampsOpenAI(
  text: string,
  voiceId: string = 'Daniel',
  audioBucket?: R2Bucket | null,
  questionId?: string
): Promise<{ audioUrl: string; wordTimestamps: WordTimestamp[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const openai = createOpenAI({ apiKey });
    
    // Map voice ID to OpenAI voice
    // If voiceId is already an OpenAI voice name, use it directly
    // Otherwise, map from UnrealSpeech voice ID
    const openAIVoiceNames: string[] = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const openaiVoice = openAIVoiceNames.includes(voiceId.toLowerCase()) 
      ? (voiceId.toLowerCase() as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer')
      : (voiceMap[voiceId] || 'alloy');
    
    console.log(`[OpenAI TTS] Generating for text: "${text.substring(0, 50)}..." with voice: ${openaiVoice}`);
    
    // Generate speech using AI SDK
    let audio: ArrayBuffer;
    try {
      console.log(`[OpenAI TTS] Calling generateSpeech with model: tts-1, voice: ${openaiVoice}, text length: ${text.length}`);
      const result = await generateSpeech({
        model: openai.speech('tts-1'),
        text: text,
        voice: openaiVoice,
      });
      
      console.log(`[OpenAI TTS] generateSpeech returned, type: ${typeof result}, constructor: ${result?.constructor?.name}`);
      
      // Inspect the result object structure
      if (result && typeof result === 'object') {
        const keys = Object.keys(result);
        console.log(`[OpenAI TTS] Result keys:`, keys);
        // Log first few property values (but not full objects to avoid huge logs)
        for (const key of keys.slice(0, 5)) {
          const value = (result as any)[key];
          const valueType = typeof value;
          const valueConstructor = value?.constructor?.name;
          console.log(`[OpenAI TTS] Result.${key}: type=${valueType}, constructor=${valueConstructor}`);
          if (valueType === 'number' || valueType === 'string' || valueType === 'boolean') {
            console.log(`[OpenAI TTS] Result.${key} =`, value);
          }
        }
      }
      
      // DefaultSpeechResult - try to extract audio data
      // The AI SDK's generateSpeech might return the audio directly or wrapped
      let audioData: ArrayBuffer | Uint8Array | Blob | ReadableStream | any = null;
      
      // First, check if result itself is the audio (ArrayBuffer, Uint8Array, Blob)
      if (result instanceof ArrayBuffer || result instanceof Uint8Array || result instanceof Blob) {
        audioData = result;
        console.log(`[OpenAI TTS] Result is directly audio data`);
      }
      // Check for common properties in DefaultSpeechResult
      else if (result && typeof result === 'object') {
        // result.audio is a DefaultGeneratedAudioFile object - need to extract audio from it
        if ('audio' in result) {
          const audioFile = (result as any).audio;
          console.log(`[OpenAI TTS] audioFile type: ${typeof audioFile}, constructor: ${audioFile?.constructor?.name}`);
          
          // Inspect DefaultGeneratedAudioFile structure
          if (audioFile && typeof audioFile === 'object') {
            const audioFileKeys = Object.keys(audioFile);
            console.log(`[OpenAI TTS] audioFile keys:`, audioFileKeys);
            
            // DefaultGeneratedAudioFile has base64Data and uint8ArrayData properties
            // Check for base64Data first (preferred - already encoded)
            if ('base64Data' in audioFile) {
              const base64DataValue = audioFile.base64Data;
              console.log(`[OpenAI TTS] base64Data exists, type: ${typeof base64DataValue}, length: ${base64DataValue?.length || 0}`);
              if (base64DataValue && typeof base64DataValue === 'string' && base64DataValue.length > 0) {
                // Use base64Data directly - it's already base64 encoded
                const mediaType = (audioFile.mediaType as string) || 'audio/mpeg';
                console.log(`[OpenAI TTS] Using audioFile.base64Data, mediaType: ${mediaType}`);
                // Return early with base64 data URL
                const audioUrl = `data:${mediaType};base64,${base64DataValue}`;
                const wordTimestamps = estimateWordTimestamps(text);
                return { audioUrl, wordTimestamps };
              }
            }
            
            // Fallback to uint8ArrayData if base64Data is not available or empty
            if ('uint8ArrayData' in audioFile && audioFile.uint8ArrayData) {
              // Use uint8ArrayData - convert to ArrayBuffer
              audioData = audioFile.uint8ArrayData;
              console.log(`[OpenAI TTS] Using audioFile.uint8ArrayData`);
            } else {
              // Fallback: try other properties
              const audioFileProps = ['data', 'content', 'bytes', 'buffer', 'arrayBuffer', 'stream', 'body'];
              for (const prop of audioFileProps) {
                if (prop in audioFile) {
                  audioData = audioFile[prop];
                  console.log(`[OpenAI TTS] Found audioFile.${prop}`);
                  break;
                }
              }
            }
            
            // Try methods on DefaultGeneratedAudioFile
            if (!audioData) {
              const audioFileMethods = ['toArrayBuffer', 'arrayBuffer', 'getData', 'read', 'stream', 'getBytes'];
              for (const method of audioFileMethods) {
                if (typeof audioFile[method] === 'function') {
                  try {
                    audioData = await audioFile[method]();
                    console.log(`[OpenAI TTS] Called audioFile.${method}() successfully`);
                    break;
                  } catch (e) {
                    console.log(`[OpenAI TTS] audioFile.${method}() failed:`, e);
                  }
                }
              }
            }
            
            // If still no data, try to use audioFile as iterable
            if (!audioData && typeof audioFile[Symbol.asyncIterator] === 'function') {
              console.log(`[OpenAI TTS] audioFile is async iterable, converting...`);
              const chunks: Uint8Array[] = [];
              for await (const chunk of audioFile) {
                chunks.push(chunk);
              }
              const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
              const combined = new Uint8Array(totalLength);
              let offset = 0;
              for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
              }
              audioData = combined.buffer;
            }
          }
        }
        
        // Fallback: try other properties in result
        if (!audioData) {
          const possibleProps = ['data', 'stream', 'content', 'body', 'buffer'];
          for (const prop of possibleProps) {
            if (prop in result) {
              audioData = (result as any)[prop];
              console.log(`[OpenAI TTS] Found result.${prop} property`);
              break;
            }
          }
        }
        
        // If no property found, check for methods on result
        if (!audioData) {
          const possibleMethods = ['toArrayBuffer', 'arrayBuffer', 'getAudio', 'getData', 'read', 'stream'];
          for (const method of possibleMethods) {
            if (typeof (result as any)[method] === 'function') {
              try {
                audioData = await (result as any)[method]();
                console.log(`[OpenAI TTS] Called result.${method}() method successfully`);
                break;
              } catch (e) {
                console.log(`[OpenAI TTS] result.${method}() failed:`, e);
              }
            }
          }
        }
        
        // Last resort: try to use result as iterable or access Symbol.iterator
        if (!audioData && typeof (result as any)[Symbol.asyncIterator] === 'function') {
          console.log(`[OpenAI TTS] Result is async iterable, converting...`);
          const chunks: Uint8Array[] = [];
          for await (const chunk of result as any) {
            chunks.push(chunk);
          }
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
          const combined = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }
          audioData = combined.buffer;
        }
        
        // If still no audioData, use result as-is (might be the audio wrapped)
        if (!audioData) {
          audioData = result;
          console.log(`[OpenAI TTS] Using result as-is`);
        }
      }
      
      if (!audioData) {
        throw new Error('Could not extract audio data from DefaultSpeechResult');
      }
      
      // Convert audioData to ArrayBuffer
      if (audioData instanceof ArrayBuffer) {
        audio = audioData;
        console.log(`[OpenAI TTS] Audio data is ArrayBuffer, size: ${audio.byteLength}`);
      } else if (audioData instanceof Uint8Array) {
        audio = audioData.buffer;
        console.log(`[OpenAI TTS] Audio data is Uint8Array, size: ${audio.byteLength}`);
      } else if (audioData instanceof Blob) {
        audio = await audioData.arrayBuffer();
        console.log(`[OpenAI TTS] Audio data is Blob, converted to ArrayBuffer, size: ${audio.byteLength}`);
      } else if (audioData && typeof (audioData as any).getReader === 'function') {
        // It's a ReadableStream
        console.log(`[OpenAI TTS] Audio data is ReadableStream, converting to ArrayBuffer...`);
        const reader = (audioData as ReadableStream<Uint8Array>).getReader();
        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            chunks.push(value);
          }
        }
        // Concatenate all chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        audio = combined.buffer;
        console.log(`[OpenAI TTS] Converted ReadableStream to ArrayBuffer, size: ${audio.byteLength}`);
      } else {
        throw new Error(`Unsupported audio data type: ${typeof audioData}, constructor: ${audioData?.constructor?.name}`);
      }
      
      if (!audio || audio.byteLength === 0) {
        throw new Error('Generated audio is empty');
      }
      
      console.log(`[OpenAI TTS] Final audio ArrayBuffer size: ${audio.byteLength} bytes`);
    } catch (speechError: any) {
      console.error(`[OpenAI TTS] Speech generation failed:`, speechError);
      console.error(`[OpenAI TTS] Error details:`, {
        message: speechError?.message,
        name: speechError?.name,
        stack: speechError?.stack,
        cause: speechError?.cause,
        toString: String(speechError)
      });
      throw new Error(`OpenAI TTS speech generation failed: ${speechError?.message || String(speechError)}`);
    }
    
    // Convert audio ArrayBuffer to base64 data URL for server-side compatibility
    const audioArray = new Uint8Array(audio);
    
    // Use a base64 encoding approach that works in both Node.js and Cloudflare Workers
    let base64: string;
    try {
      // Try using btoa first (works in browsers and Cloudflare Workers)
      if (typeof btoa !== 'undefined') {
        // Convert Uint8Array to binary string, then to base64
        // For large arrays, process in chunks to avoid stack overflow
        const chunkSize = 8192;
        let binaryString = '';
        for (let i = 0; i < audioArray.length; i += chunkSize) {
          const chunk = audioArray.slice(i, i + chunkSize);
          binaryString += String.fromCharCode.apply(null, Array.from(chunk));
        }
        base64 = btoa(binaryString);
        console.log('Used btoa for base64 encoding');
      } else if (typeof Buffer !== 'undefined' && Buffer.from && typeof Buffer.from === 'function') {
        // Use Node.js Buffer if available and properly implemented
        base64 = Buffer.from(audioArray).toString('base64');
        console.log('Used Buffer.from for base64 encoding');
      } else {
        // Last resort: manual base64 encoding
        console.log('Using manual base64 encoding');
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        while (i < audioArray.length) {
          const a = audioArray[i++];
          const b = i < audioArray.length ? audioArray[i++] : 0;
          const c = i < audioArray.length ? audioArray[i++] : 0;
          
          const bitmap = (a << 16) | (b << 8) | c;
          result += base64Chars.charAt((bitmap >> 18) & 63);
          result += base64Chars.charAt((bitmap >> 12) & 63);
          result += i - 2 < audioArray.length ? base64Chars.charAt((bitmap >> 6) & 63) : '=';
          result += i - 1 < audioArray.length ? base64Chars.charAt(bitmap & 63) : '=';
        }
        base64 = result;
        console.log('Used manual base64 encoding');
      }
    } catch (encodingError: any) {
      console.error('Error encoding audio to base64:', encodingError);
      throw new Error(`Failed to encode audio: ${encodingError?.message || String(encodingError)}`);
    }
    
    // Upload to R2 if bucket is available, otherwise use data URL
    let audioUrl: string;
    if (audioBucket && questionId) {
      try {
        const key = generateAudioKey(questionId);
        audioUrl = await uploadAudioToR2(audioBucket, audio, key, 'audio/mpeg');
        console.log(`[OpenAI TTS] Uploaded to R2: ${key}, URL: ${audioUrl}`);
      } catch (r2Error) {
        console.error(`[OpenAI TTS] Failed to upload to R2, falling back to data URL:`, r2Error);
        // Fallback to data URL if R2 upload fails
        audioUrl = `data:audio/mpeg;base64,${base64}`;
      }
    } else {
      // Use data URL if R2 is not available
      audioUrl = `data:audio/mpeg;base64,${base64}`;
      console.log(`[OpenAI TTS] Using data URL (R2 not available), length: ${audioUrl.length} chars`);
    }
    
    // Estimate word timestamps
    const wordTimestamps = estimateWordTimestamps(text);
    
    return {
      audioUrl,
      wordTimestamps,
    };
  } catch (error) {
    console.error('Error generating audio with OpenAI TTS:', error);
    // Re-throw the error so it can be caught and logged in generateQuestions
    throw error;
  }
}

