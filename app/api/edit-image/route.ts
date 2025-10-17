import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;
    const mask = formData.get('mask') as File | null;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Convert File to Buffer for OpenAI API
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const imageFile = new File([imageBuffer], image.name, { type: image.type });

    // Prepare API parameters
    const params: any = {
      model: 'dall-e-2',
      image: imageFile,
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    };

    // Add mask if provided
    if (mask) {
      const maskBuffer = Buffer.from(await mask.arrayBuffer());
      const maskFile = new File([maskBuffer], mask.name, { type: mask.type });
      params.mask = maskFile;
    }

    // Edit image using DALL-E 2
    const response = await openai.images.edit(params);

    const imageUrl = response.data[0].url;

    return NextResponse.json({
      imageUrl,
    });

  } catch (error: any) {
    console.error('Error editing image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to edit image' },
      { status: 500 }
    );
  }
}
