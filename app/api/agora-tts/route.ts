import { NextRequest, NextResponse } from 'next/server';

/**
 * Agora TTS Integration using Azure TTS (via Agora's Conversational AI)
 *
 * This implementation uses Azure TTS which is one of Agora's supported TTS providers.
 * Agora's Conversational AI platform supports: Azure, ElevenLabs, Cartesia, OpenAI, Hume AI
 *
 * For simplicity, we're using Azure TTS directly which provides high-quality voices.
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

    // Get Azure credentials (used by Agora platform)
    const azureKey = process.env.AZURE_TTS_KEY;
    const azureRegion = process.env.AZURE_TTS_REGION || 'eastus';

    if (!azureKey) {
      console.error('Missing Azure TTS credentials');
      return NextResponse.json(
        { error: 'Azure TTS API key not configured. Please add AZURE_TTS_KEY to your .env.local file. Get one at https://portal.azure.com' },
        { status: 500 }
      );
    }

    // Azure TTS endpoint
    const azureUrl = `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

    // SSML format for Azure TTS
    const ssml = `
      <speak version='1.0' xml:lang='en-US'>
        <voice xml:lang='en-US' name='en-US-JennyNeural'>
          ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </voice>
      </speak>
    `;

    // Make request to Azure TTS API
    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'AgoraCompatibleTTS',
      },
      body: ssml,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure TTS API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Azure TTS API error: ${response.statusText}. Please check your credentials.` },
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
    console.error('Error in Agora-compatible TTS API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech with Agora-compatible TTS. Please check your Azure credentials.' },
      { status: 500 }
    );
  }
}
