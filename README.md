# Text to Speech Comparison App

A Next.js application that lets you compare two different text-to-speech engines side by side: **Web Speech API** (free, browser-based) and **OpenAI TTS** (premium, AI-powered).

## Features

- **Dual TTS Engines**: Compare Web Speech API vs OpenAI TTS
- **Web Speech API (Free)**:
  - No API key required
  - Works offline
  - Instant playback
  - Browser-based synthesis
- **OpenAI TTS (Premium)**:
  - High-quality AI voices
  - Natural-sounding speech
  - Multiple voice options
  - Powered by Vercel AI SDK
- Responsive side-by-side comparison layout
- Dark mode support
- Clean, modern UI

## Prerequisites

- Node.js 18+ installed
- A modern web browser (Chrome, Firefox, Safari, Edge) for Web Speech API
- An OpenAI API key (optional, only needed for OpenAI TTS comparison - get one at https://platform.openai.com/api-keys)

## Setup Instructions

1. **Clone or navigate to the project directory:**
   ```bash
   cd text-to-speech-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables (Optional - only for OpenAI TTS):**
   - If you want to test OpenAI TTS, copy the `.env.example` file to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Open `.env.local` and add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_actual_openai_api_key_here
     ```
   - **Note**: You can skip this step and use only the free Web Speech API (left side)

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   - Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

### Web Speech API (Left Side - FREE)
1. Enter any text in the left textarea
2. Click "Play with Browser TTS"
3. The text will be spoken immediately using your browser's built-in TTS
4. Works instantly, no API key needed!

### OpenAI TTS (Right Side - PREMIUM)
1. Make sure you have set up your OpenAI API key in `.env.local`
2. Enter any text in the right textarea
3. Click "Play with OpenAI TTS"
4. High-quality AI-generated speech will be generated and played
5. Note: Requires OpenAI credits

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS
- **TTS Engines:**
  - Web Speech API (browser built-in)
  - OpenAI TTS-1 via Vercel AI SDK
- **Language:** TypeScript

## Project Structure

```
text-to-speech-app/
├── app/
│   ├── api/
│   │   └── tts/
│   │       └── route.ts        # API endpoint for text-to-speech
│   ├── page.tsx                # Main UI component
│   └── layout.tsx              # Root layout
├── .env.local                  # Environment variables (gitignored)
├── .env.example                # Example environment file
└── README.md                   # This file
```

## API Endpoint

**POST /api/tts**

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

### OpenAI TTS
- Uses OpenAI's `tts-1` model with the `alloy` voice
- Audio is generated server-side and streamed to the client
- Each API call incurs a small cost (~$0.015 per 1,000 characters)
- Make sure to keep your API key secure and never commit it to version control
- Requires active OpenAI account with credits

## Deploy on Vercel

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com/new)
3. Add your `OPENAI_API_KEY` environment variable in the Vercel dashboard
4. Deploy!

## Learn More

- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenAI TTS API](https://platform.openai.com/docs/guides/text-to-speech)
- [Next.js Documentation](https://nextjs.org/docs)

## FAQ

**Q: Can I use this app without an OpenAI API key?**
A: Yes! The Web Speech API (left side) works completely free without any API key.

**Q: Why use OpenAI TTS if Web Speech API is free?**
A: OpenAI TTS provides more natural-sounding, consistent voices across all platforms. Web Speech API quality varies by browser/OS.

**Q: What about WhisperSpeech or other TTS options?**
A: WhisperSpeech is an open-source TTS but requires GPU and self-hosting. This app focuses on easy-to-use options.
