import { experimental_generateSpeech as generateSpeech } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await generateSpeech({
      model: openai.speech('tts-1'),
      text: text,
      voice: 'alloy',
    });

    console.log('Audio generated successfully');
    console.log('Audio uint8Array length:', result.audio.uint8Array.length);

    // Get the audio as Uint8Array and convert to Buffer
    const audioBuffer = Buffer.from(result.audio.uint8Array);
    console.log('Audio buffer size:', audioBuffer.length, 'bytes');

    // Return the audio data as an MP3 response
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
