import type { R2Bucket } from '@cloudflare/workers-types';

/**
 * Uploads audio data to Cloudflare R2 and returns a public URL
 * @param bucket R2 bucket instance
 * @param audioData Audio data as ArrayBuffer or Uint8Array
 * @param key Unique key for the audio file (e.g., question ID)
 * @param contentType MIME type (default: 'audio/mpeg')
 * @returns Public URL to access the uploaded audio
 */
export async function uploadAudioToR2(
  bucket: R2Bucket,
  audioData: ArrayBuffer | Uint8Array,
  key: string,
  contentType: string = 'audio/mpeg'
): Promise<string> {
  try {
    // Ensure we have ArrayBuffer
    const audioBuffer = audioData instanceof ArrayBuffer 
      ? audioData 
      : audioData.buffer;

    // Upload to R2
    await bucket.put(key, audioBuffer, {
      httpMetadata: {
        contentType: contentType,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });

    console.log(`[R2] Uploaded audio to R2: ${key} (${audioBuffer.byteLength} bytes)`);

    // Generate public URL
    // R2 public URLs require configuration in Cloudflare dashboard
    // 
    // SETUP INSTRUCTIONS:
    // 
    // Option 1: Public Development URL (EASIEST - Recommended for testing)
    // 1. In Cloudflare Dashboard > R2 > snapquiz-audio > Settings
    // 2. Click "Enable" next to "Public Development URL"
    // 3. Copy the URL shown (e.g., https://pub-xxxxx.r2.dev)
    // 4. Add to .env: R2_PUBLIC_DEV_URL=https://pub-xxxxx.r2.dev
    //
    // Option 2: Custom Domain (Recommended for production)
    // 1. In Cloudflare Dashboard > R2 > snapquiz-audio > Settings
    // 2. Click "+ Add" next to "Custom Domains"
    // 3. Follow the setup wizard to add your domain
    // 4. Add to .env: R2_CUSTOM_DOMAIN=audio.yourdomain.com
    
    let publicUrl: string;
    
    // Option 1: Custom domain (production)
    const CUSTOM_DOMAIN = process.env.R2_CUSTOM_DOMAIN;
    if (CUSTOM_DOMAIN) {
      publicUrl = `https://${CUSTOM_DOMAIN}/${key}`;
      console.log(`[R2] Using custom domain: ${publicUrl}`);
    }
    // Option 2: Public Development URL (easiest for testing)
    else {
      const PUBLIC_DEV_URL = process.env.R2_PUBLIC_DEV_URL;
      if (PUBLIC_DEV_URL) {
        // Remove trailing slash if present
        const baseUrl = PUBLIC_DEV_URL.replace(/\/$/, '');
        publicUrl = `${baseUrl}/${key}`;
        console.log(`[R2] Using public dev URL: ${publicUrl}`);
      } else {
        // Fallback: Warn and use placeholder
        console.warn(`[R2] R2_PUBLIC_DEV_URL or R2_CUSTOM_DOMAIN not set. Audio files will not be accessible.`);
        console.warn(`[R2] Please enable Public Development URL in Cloudflare and set R2_PUBLIC_DEV_URL in .env`);
        publicUrl = `https://r2-not-configured.example.com/${key}`;
      }
    }
    
    return publicUrl;
  } catch (error) {
    console.error(`[R2] Failed to upload audio to R2:`, error);
    throw new Error(`Failed to upload audio to R2: ${error}`);
  }
}

/**
 * Generates a unique key for an audio file based on question ID and hash
 * @param questionId Question ID
 * @param textHash Hash of the question text (optional, for cache busting)
 * @returns Unique key for R2 storage
 */
export function generateAudioKey(questionId: string, textHash?: string): string {
  const timestamp = Date.now();
  const hash = textHash || `${questionId}-${timestamp}`;
  return `audio/${questionId}/${hash}.mp3`;
}

