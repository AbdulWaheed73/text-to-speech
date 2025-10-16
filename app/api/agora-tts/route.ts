import { NextRequest, NextResponse } from 'next/server';

/**
 * IMPORTANT NOTE ABOUT AGORA TTS:
 *
 * Agora does not provide a simple standalone TTS API like OpenAI.
 * Instead, TTS is integrated into their Conversational AI Engine, which requires:
 * 1. Setting up a conversational AI agent
 * 2. Joining a real-time channel
 * 3. Using third-party TTS providers (Azure, ElevenLabs, Cartesia, OpenAI, Hume AI)
 *
 * For a simple TTS comparison, we're using ElevenLabs API directly instead,
 * which offers high-quality TTS similar to what Agora's platform would use.
 *
 * Agora Conversational AI docs: https://docs.agora.io/en/conversational-ai/models/tts/overview
 */

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Using ElevenLabs API (one of Agora's supported TTS providers)
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsApiKey) {
      console.error('Missing ElevenLabs API key');
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured. Please add ELEVENLABS_API_KEY to your .env.local file. Get one at https://elevenlabs.io' },
        { status: 500 }
      );
    }

    // ElevenLabs TTS API endpoint
    // Using Rachel voice (ID: 21m00Tcm4TlvDq8ikWAM)
    const voiceId = '21m00Tcm4TlvDq8ikWAM';
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    // Make request to ElevenLabs API
    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return NextResponse.json(
        { error: `TTS API error: ${response.statusText}. ${errorText}` },
        { status: response.status }
      );
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();

    // Return the audio file with proper headers
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error in TTS API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech. Please check your API key and try again.' },
      { status: 500 }
    );
  }
}
