import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type definitions
interface CardImpression {
  cardId: string;
  cardName: string;
  impressions: number;
  successRate: number;
  lastUsed: string;
}

interface InteractionData {
  childAge: number;
  rightSentences: string[];
  wrongSentences: string[];
  cardImpressions: CardImpression[];
  sessionCount: number;
  totalInteractions: number;
}

interface ImagePromptResult {
  concept: string;
  prompt: string;
  reason: string;
  difficulty: 'reinforce' | 'progress' | 'new';
}

interface AnalysisResponse {
  reasoning: string;
  imagePrompts: ImagePromptResult[];
}

export async function POST(req: NextRequest) {
  try {
    const interactionData: InteractionData = await req.json();

    // Validate input
    if (!interactionData.childAge || !interactionData.rightSentences || !interactionData.wrongSentences) {
      return NextResponse.json(
        { error: 'Missing required interaction data' },
        { status: 400 }
      );
    }

    // Step 1: Analyze interaction data with GPT-4
    console.log('Analyzing interaction data with GPT-4...');

    const analysisPrompt = `You are an expert educational content generator for autistic children. Analyze the following interaction data and determine what new visual content should be generated to help the child learn better.

INTERACTION DATA:
- Child Age: ${interactionData.childAge} years old
- Correct Sentences Made: ${JSON.stringify(interactionData.rightSentences)}
- Wrong Sentences Made: ${JSON.stringify(interactionData.wrongSentences)}
- Card Impressions (most clicked cards): ${JSON.stringify(interactionData.cardImpressions)}
- Total Sessions: ${interactionData.sessionCount}
- Total Interactions: ${interactionData.totalInteractions}

INSTRUCTIONS:
1. Identify which concepts the child is struggling with (from wrong sentences)
2. Identify which concepts the child has mastered (from right sentences)
3. Look at card impression data - high clicks + wrong sentences = confusing card, high clicks + right sentences = helpful card
4. Based on the age, determine if content should be simplified (more wrong sentences) or progressed (more right sentences)

OUTPUT FORMAT (JSON):
{
  "reasoning": "Brief analysis of what patterns you see and why you're recommending these changes",
  "imagePrompts": [
    {
      "concept": "concept name (e.g., 'need', 'food', 'emotions')",
      "prompt": "Detailed DALL-E prompt for generating the image",
      "reason": "Why this specific image will help",
      "difficulty": "reinforce | progress | new"
    }
  ]
}

Generate 2-3 image prompts that will most effectively help this child learn. Focus on:
- Reinforcing struggling concepts with clearer visuals
- Progressing mastered concepts with new variations
- Ensuring images are appropriate for autistic children (high contrast, clear subject, minimal distractions, simple backgrounds)`;

    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an educational content strategist specializing in creating learning materials for autistic children. You analyze interaction data and recommend visual content that will optimize learning outcomes.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const analysis: AnalysisResponse = JSON.parse(
      analysisResponse.choices[0].message.content || '{}'
    );

    console.log('Analysis complete:', analysis.reasoning);

    // Step 2: Generate images using DALL-E based on the analysis
    console.log(`Generating ${analysis.imagePrompts.length} images...`);

    const imageGenerationPromises = analysis.imagePrompts.map(async (promptData) => {
      try {
        const imageResponse = await openai.images.generate({
          model: 'dall-e-3',
          prompt: promptData.prompt,
          n: 1,
          size: '1024x1024',
          quality: 'hd',
          style: 'natural',
        });

        return {
          concept: promptData.concept,
          reason: promptData.reason,
          difficulty: promptData.difficulty,
          imageUrl: imageResponse.data?.[0]?.url,
          revisedPrompt: imageResponse.data?.[0]?.revised_prompt,
          originalPrompt: promptData.prompt,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error generating image for ${promptData.concept}:`, error);
        return {
          concept: promptData.concept,
          reason: promptData.reason,
          difficulty: promptData.difficulty,
          error: errorMessage,
        };
      }
    });

    const generatedImages = await Promise.all(imageGenerationPromises);

    // Step 3: Return results
    return NextResponse.json({
      success: true,
      analysis: {
        reasoning: analysis.reasoning,
        recommendations: analysis.imagePrompts.length,
      },
      generatedContent: generatedImages,
      metadata: {
        processedAt: new Date().toISOString(),
        childAge: interactionData.childAge,
        analysisModel: 'gpt-4',
        imageModel: 'dall-e-3',
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate content';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    console.error('Error in content generation pipeline:', error);
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}
