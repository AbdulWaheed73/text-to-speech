# Text to Speech Comparison App

A Next.js application that lets you compare three different text-to-speech engines: **Web Speech API** (free, browser-based), **OpenAI TTS** (premium, AI-powered), and **Agora TTS** (cloud-based, real-time).

## Features

- **Triple TTS Engines**: Compare Web Speech API vs OpenAI TTS vs Agora TTS
- **Web Speech API (Free)**:
  - No API key required
  - Works offline
  - Instant playback
  - Browser-based synthesis
  - Multi-language support
- **OpenAI TTS (Premium)**:
  - High-quality AI voices
  - Natural-sounding speech
  - Multiple voice options
  - Powered by Vercel AI SDK
- **ElevenLabs TTS (Cloud)** *(Agora-compatible)*:
  - High-quality AI voices
  - Real-time processing
  - Natural-sounding speech
  - Same provider used by Agora's platform
- Responsive 3-column comparison layout
- Dark mode support
- Clean, modern UI

## Prerequisites

- Node.js 18+ installed
- A modern web browser (Chrome, Firefox, Safari, Edge) for Web Speech API
- An OpenAI API key (optional, only needed for OpenAI TTS - get one at https://platform.openai.com/api-keys)
- An ElevenLabs API key (optional, only needed for third TTS engine - get one at https://elevenlabs.io)

## Setup Instructions

1. **Clone or navigate to the project directory:**
   ```bash
   cd text-to-speech-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables (Optional - for OpenAI TTS and Agora TTS):**
   - If you want to test OpenAI TTS or Agora TTS, copy the `.env.example` file to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Open `.env.local` and add your credentials:
     ```
     OPENAI_API_KEY=your_actual_openai_api_key_here
     AGORA_APP_ID=your_agora_app_id_here
     AGORA_TOKEN=your_agora_token_here
     ```
   - **Note**: You can skip this step and use only the free Web Speech API (first card)

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   - Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

### Web Speech API (First Card - FREE)
1. Select your preferred language from the dropdown
2. Choose a voice from the available voices
3. Enter any text in the textarea
4. Click "Play with Browser TTS"
5. The text will be spoken immediately using your browser's built-in TTS
6. Works instantly, no API key needed!

### OpenAI TTS (Second Card - PREMIUM)
1. Make sure you have set up your OpenAI API key in `.env.local`
2. Enter any text in the textarea
3. Click "Play with OpenAI TTS"
4. High-quality AI-generated speech will be generated and played
5. Note: Requires OpenAI credits

### Agora TTS (Third Card - CLOUD)
1. Make sure you have set up your Agora credentials in `.env.local`
2. Enter any text in the textarea
3. Click "Play with Agora TTS"
4. Cloud-generated speech will be processed and played
5. Note: Requires Agora account and credentials

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS
- **TTS Engines:**
  - Web Speech API (browser built-in)
  - OpenAI TTS-1 via Vercel AI SDK
  - Agora TTS API
- **Language:** TypeScript

## Project Structure

```
text-to-speech-app/
├── app/
│   ├── api/
│   │   ├── tts/
│   │   │   └── route.ts        # OpenAI TTS API endpoint
│   │   └── agora-tts/
│   │       └── route.ts        # Agora TTS API endpoint
│   ├── page.tsx                # Main UI component
│   └── layout.tsx              # Root layout
├── .env.local                  # Environment variables (gitignored)
├── .env.example                # Example environment file
└── README.md                   # This file
```

## API Endpoints

### POST /api/tts (OpenAI)

Request body:
```json
{
  "text": "Your text to convert to speech"
}
```

Response: Audio file (MP3 format)

### POST /api/agora-tts (Agora)

Request body:
```json
{
  "text": "Your text to convert to speech"
}
```

Response: Audio file (MP3 format)

## Notes

### Web Speech API
- Completely free and works offline
- Voice quality depends on your browser and operating system
- Different browsers may have different available voices
- No API key or internet connection required
- Multi-language support with language/voice selection

### OpenAI TTS
- Uses OpenAI's `tts-1` model with the `alloy` voice
- Audio is generated server-side and streamed to the client
- Each API call incurs a small cost (~$0.015 per 1,000 characters)
- Make sure to keep your API key secure and never commit it to version control
- Requires active OpenAI account with credits

### Agora TTS
- Real-time cloud-based text-to-speech processing
- Enterprise-grade infrastructure with scalability
- Uses Agora's REST API for TTS generation
- Requires Agora App ID and access token
- Voice and language can be customized in the API route
- Keep your credentials secure and never commit them to version control

## Deploy on Vercel

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com/new)
3. Add your environment variables in the Vercel dashboard:
   - `OPENAI_API_KEY` (for OpenAI TTS)
   - `AGORA_APP_ID` (for Agora TTS)
   - `AGORA_TOKEN` (for Agora TTS)
4. Deploy!

## Learn More

- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenAI TTS API](https://platform.openai.com/docs/guides/text-to-speech)
- [Agora Documentation](https://docs.agora.io/)
- [Agora REST API](https://docs.agora.io/en/voice-calling/reference/rest-api)
- [Next.js Documentation](https://nextjs.org/docs)

## FAQ

**Q: Can I use this app without API keys?**
A: Yes! The Web Speech API (first card) works completely free without any API key.

**Q: Why use OpenAI TTS or Agora TTS if Web Speech API is free?**
A: OpenAI TTS provides more natural-sounding, consistent voices across all platforms. Agora TTS offers enterprise-grade reliability and scalability. Web Speech API quality varies by browser/OS.

**Q: What's the difference between OpenAI TTS and Agora TTS?**
A: OpenAI TTS focuses on high-quality, natural-sounding AI voices. Agora TTS is part of a real-time communication platform, designed for scalability and enterprise applications.

**Q: How do I get Agora credentials?**
A: Sign up at https://console.agora.io/, create a project, and get your App ID and generate an access token.

**Q: What about WhisperSpeech or other TTS options?**
A: WhisperSpeech is an open-source TTS but requires GPU and self-hosting. This app focuses on easy-to-use options.
