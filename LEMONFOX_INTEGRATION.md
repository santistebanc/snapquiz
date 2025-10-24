# LEMONFOX Speech Recognition Integration

This project now includes LEMONFOX speech recognition as a fallback for mobile devices where browser speech recognition may not work reliably.

## Setup

### 1. Get LEMONFOX API Key

1. Visit [LEMONFOX](https://lemonfox.ai/)
2. Sign up for an account
3. Get your API key from the dashboard

### 2. Configure Environment Variables

Add your LEMONFOX API key to your `.env` file:

```bash
# Add to your .env file
LEMONFOX_API_KEY=your_lemonfox_api_key_here

# Existing variables:
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here  
DOMAIN=your_domain_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Deploy with Environment Variables

```bash
npm run deploy
```

## How It Works

### Automatic Fallback System

The `SmartVoiceInput` component automatically chooses the best speech recognition method:

- **Primary method**: Uses LEMONFOX API for high-quality speech recognition
- **Fallback method**: Uses built-in browser speech recognition if LEMONFOX is not available
- **Mobile optimized**: Works reliably on all devices with LEMONFOX

### Features

- **Real-time transcription**: Get live transcriptions as you speak
- **Mobile optimized**: Works reliably on mobile devices
- **Offline detection**: Shows connection status
- **Auto-submit**: Automatically submits after 2 seconds of silence
- **Error handling**: Graceful fallback and error messages

### Usage

The integration is already included in the `AnswerInput` component. No code changes needed - it automatically uses the best available method.

```tsx
// The component automatically chooses the best method
<SmartVoiceInput
  onTranscript={handleVoiceTranscript}
  isActive={gameState.phase === 'buzzing'}
  disabled={timeLeft <= 0}
  autoStart={true}
  onSubmit={handleSubmit}
/>
```

## Technical Details

### LEMONFOX Integration

- **Audio Format**: Records audio as WebM with Opus codec
- **API Endpoint**: `https://api.lemonfox.ai/v1/audio/transcriptions`
- **Model**: Uses Whisper-1 for high-quality transcription
- **Language**: Configured for English (en-US)

### Browser Compatibility

- **All browsers with LEMONFOX**: Uses LEMONFOX API (primary method)
- **Chrome/Edge without LEMONFOX**: Falls back to built-in speech recognition
- **Safari without LEMONFOX**: Falls back to built-in speech recognition  
- **Firefox without LEMONFOX**: Falls back to built-in speech recognition
- **Mobile browsers**: Uses LEMONFOX for best reliability

### Performance

- **Latency**: LEMONFOX adds ~1-2 seconds for API processing
- **Quality**: High-quality transcription with Whisper-1 model
- **Reliability**: Works consistently across all devices

## Troubleshooting

### Common Issues

1. **"LEMONFOX API key not configured"**
   - Make sure `LEMONFOX_API_KEY` is set in your `.env` file
   - Redeploy with `npm run deploy`

2. **"Failed to transcribe audio"**
   - Check your internet connection
   - Verify your LEMONFOX API key is valid
   - Check browser console for detailed error messages

3. **Mobile not using LEMONFOX**
   - Ensure the API key is properly configured
   - Check that the environment variable is loaded

### Debug Mode

To see which method is being used, check the status indicator in the voice input component:
- 📶 "Using LEMONFOX (Primary)" - LEMONFOX API (preferred method)
- 🌐 "Using Browser (Fallback)" - Built-in speech recognition (fallback)
- ❌ "Offline" - No internet connection

## Cost Considerations

LEMONFOX charges per API call. For a quiz game:
- **Typical usage**: 1-2 API calls per answer
- **Cost**: Very low for typical usage
- **Optimization**: Audio is only sent when recording stops

## Security

- API key is stored securely in environment variables
- Audio is processed server-side by LEMONFOX
- No audio data is stored locally
- HTTPS required for production
