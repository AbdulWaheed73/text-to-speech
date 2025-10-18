'use client';

import { useState } from 'react';
import Image from 'next/image';

// Mock interaction data - detailed format
const mockInteractionData = {
  childAge: 4,
  rightSentences: [
    'I need food',
    'I am happy',
    'I see dog',
    'I want water',
    'Dog is big',
  ],
  wrongSentences: [
    'I food need',
    'I happy am',
    'food I need',
    'want I water',
    'I need am happy',
  ],
  cardImpressions: [
    { cardId: 'card_food', cardName: 'food', impressions: 15, successRate: 0.6, lastUsed: '2025-10-17T10:30:00Z' },
    { cardId: 'card_need', cardName: 'need', impressions: 12, successRate: 0.5, lastUsed: '2025-10-17T10:28:00Z' },
    { cardId: 'card_I', cardName: 'I', impressions: 20, successRate: 0.85, lastUsed: '2025-10-17T10:32:00Z' },
    { cardId: 'card_happy', cardName: 'happy', impressions: 8, successRate: 0.75, lastUsed: '2025-10-17T10:15:00Z' },
    { cardId: 'card_am', cardName: 'am', impressions: 6, successRate: 0.67, lastUsed: '2025-10-17T10:20:00Z' },
    { cardId: 'card_dog', cardName: 'dog', impressions: 10, successRate: 0.9, lastUsed: '2025-10-17T10:25:00Z' },
    { cardId: 'card_want', cardName: 'want', impressions: 7, successRate: 0.71, lastUsed: '2025-10-17T10:18:00Z' },
    { cardId: 'card_water', cardName: 'water', impressions: 5, successRate: 0.8, lastUsed: '2025-10-17T10:10:00Z' },
  ],
  sessionCount: 12,
  totalInteractions: 83,
};

interface GeneratedContent {
  concept: string;
  reason: string;
  difficulty: string;
  imageUrl?: string;
  revisedPrompt?: string;
  originalPrompt?: string;
  error?: string;
}

interface ApiResponse {
  success: boolean;
  analysis: {
    reasoning: string;
    recommendations: number;
  };
  generatedContent: GeneratedContent[];
  metadata: {
    processedAt: string;
    childAge: number;
    analysisModel: string;
    imageModel: string;
  };
}

export default function RefTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateContent = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ref', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockInteractionData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      setResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate content';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Content Generation Test Page
        </h1>
        <p className="text-gray-600 mb-8">
          Test the AI-powered content generation system with mock interaction data
        </p>

        {/* Mock Data Display */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mock Interaction Data</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-green-700">Right Sentences ✓</h3>
              <ul className="space-y-1">
                {mockInteractionData.rightSentences.map((sentence, idx) => (
                  <li key={idx} className="text-green-600">• {sentence}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-red-700">Wrong Sentences ✗</h3>
              <ul className="space-y-1">
                {mockInteractionData.wrongSentences.map((sentence, idx) => (
                  <li key={idx} className="text-red-600">• {sentence}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-3">Card Impressions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mockInteractionData.cardImpressions
                .sort((a, b) => b.impressions - a.impressions)
                .map((card) => (
                  <div
                    key={card.cardId}
                    className="border rounded-lg p-3 bg-gray-50"
                  >
                    <div className="font-medium text-gray-900">{card.cardName}</div>
                    <div className="text-sm text-gray-600">
                      {card.impressions} clicks
                    </div>
                    <div className="text-xs text-gray-500">
                      {(card.successRate * 100).toFixed(0)}% success
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <div className="text-sm text-gray-600">Child Age</div>
              <div className="text-xl font-semibold">{mockInteractionData.childAge} years</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Sessions</div>
              <div className="text-xl font-semibold">{mockInteractionData.sessionCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Interactions</div>
              <div className="text-xl font-semibold">{mockInteractionData.totalInteractions}</div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleGenerateContent}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
          >
            {isLoading ? 'Generating Content...' : 'Generate New Content'}
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-700 font-medium">
              Analyzing interaction data and generating images...
            </p>
            <p className="text-blue-600 text-sm mt-2">
              This may take 30-60 seconds
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* AI Analysis */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-purple-900 mb-3">
                AI Analysis
              </h2>
              <p className="text-purple-800 leading-relaxed">
                {result.analysis.reasoning}
              </p>
              <div className="mt-4 text-sm text-purple-700">
                {result.analysis.recommendations} recommendations generated
              </div>
            </div>

            {/* Generated Content */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Generated Content</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {result.generatedContent.map((content, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200"
                  >
                    {content.imageUrl && (
                      <div className="relative w-full h-64">
                        <Image
                          src={content.imageUrl}
                          alt={content.concept}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}

                    {content.error && (
                      <div className="h-64 bg-red-50 flex items-center justify-center">
                        <div className="text-red-600 text-center p-4">
                          <p className="font-semibold">Error generating image</p>
                          <p className="text-sm mt-2">{content.error}</p>
                        </div>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {content.concept}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            content.difficulty === 'reinforce'
                              ? 'bg-yellow-100 text-yellow-800'
                              : content.difficulty === 'progress'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {content.difficulty}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Why this helps:
                        </p>
                        <p className="text-gray-600 text-sm">{content.reason}</p>
                      </div>

                      {content.originalPrompt && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-500 hover:text-gray-700 font-medium mb-2">
                            View prompts
                          </summary>
                          <div className="bg-gray-50 p-3 rounded space-y-2">
                            <div>
                              <div className="font-medium text-gray-700">Original:</div>
                              <div className="text-gray-600">{content.originalPrompt}</div>
                            </div>
                            {content.revisedPrompt && (
                              <div>
                                <div className="font-medium text-gray-700">Revised by DALL-E:</div>
                                <div className="text-gray-600">{content.revisedPrompt}</div>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
              <div className="font-medium text-gray-700 mb-2">Generation Metadata</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="font-medium">Processed:</span>{' '}
                  {new Date(result.metadata.processedAt).toLocaleTimeString()}
                </div>
                <div>
                  <span className="font-medium">Child Age:</span> {result.metadata.childAge}
                </div>
                <div>
                  <span className="font-medium">Analysis Model:</span> {result.metadata.analysisModel}
                </div>
                <div>
                  <span className="font-medium">Image Model:</span> {result.metadata.imageModel}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
