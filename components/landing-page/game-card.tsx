"use client"

import * as React from "react"
import { EmojiCard } from "./emoji-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const emotions = [
  { emoji: "😊", name: "Happy", isCorrect: true },
  { emoji: "😢", name: "Sad", isCorrect: false },
  { emoji: "😠", name: "Angry", isCorrect: false },
  { emoji: "😮", name: "Surprised", isCorrect: false },
]

export function GameCard() {
  const [selectedEmotion, setSelectedEmotion] = React.useState<string | null>(null)

  const handleEmotionClick = (emotionName: string) => {
    setSelectedEmotion(emotionName)
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        {/* Top Card - Main Emoji */}
        <EmojiCard
          emoji="😊"
          text="happy"
          showListenButton
        />

        {/* Question */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">How is this person feeling?</h2>
          <p className="text-muted-foreground">Tap on the correct emotion</p>
        </div>

        {/* Grid of 4 Emotion Options */}
        <div className="grid grid-cols-2 gap-4">
          {emotions.map((emotion) => (
            <div
              key={emotion.name}
              onClick={() => handleEmotionClick(emotion.name)}
              className="cursor-pointer"
            >
              <EmojiCard
                emoji={emotion.emoji}
                text={emotion.name}
                isSelected={selectedEmotion === emotion.name && emotion.isCorrect}
                className="hover:shadow-lg transition-shadow"
                showListenButton
              />
            </div>
          ))}
        </div>

        {/* Feedback */}
        {selectedEmotion && (
          <div className="text-center">
            {emotions.find((e) => e.name === selectedEmotion)?.isCorrect ? (
              <p className="text-green-600 font-semibold text-lg">
                Great job! That&apos;s correct! 🎉
              </p>
            ) : (
              <p className="text-orange-600 font-semibold text-lg">
                Try again! Think about the smile. 😊
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
