import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Convert File to Buffer for OpenAI API
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const imageFile = new File([imageBuffer], image.name, { type: image.type });

    // Create variation using DALL-E 2
    const response = await openai.images.createVariation({
      model: 'dall-e-2',
      image: imageFile,
      n: 1,
      size: '1024x1024',
    });

    const imageUrl = response.data[0].url;

    return NextResponse.json({
      imageUrl,
    });

  } catch (error: any) {
    console.error('Error creating variation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create variation' },
      { status: 500 }
    );
  }
}
