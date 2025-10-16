"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

type EmojiCardProps = {
  emoji: string
  text: string
  className?: string
  isCorrect?: boolean
  isWrong?: boolean
  showListenButton?: boolean
}

export function EmojiCard({ emoji, text, className, isCorrect, isWrong, showListenButton }: EmojiCardProps) {
  const handleListen = (e: React.MouseEvent) => {
    // Stop the click from bubbling up to parent elements
    e.stopPropagation()

    // Text-to-speech functionality
    const utterance = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <Card
      className={cn(
        "overflow-hidden relative",
        isCorrect && "border-green-500 bg-green-50",
        isWrong && "border-red-500 bg-red-50",
        className
      )}
    >
      {/* Checkmark or X indicator */}
      {isCorrect && (
        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}
      {isWrong && (
        <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
          <X className="h-4 w-4 text-white" />
        </div>
      )}

      <CardContent className="flex flex-col items-center justify-center p-4">
        <div className="text-5xl mb-2">{emoji}</div>
        <p className="text-center text-sm font-medium mb-2">{text}</p>
        {showListenButton && (
          <Button onClick={handleListen} variant="outline" size="sm" className="mt-2">
            <Volume2 className="mr-2 h-4 w-4" />
            Listen
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
