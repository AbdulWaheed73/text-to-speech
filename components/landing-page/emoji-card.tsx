"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"

type EmojiCardProps = {
  emoji: string
  text: string
  className?: string
  isSelected?: boolean
  showListenButton?: boolean
}

export function EmojiCard({ emoji, text, className, isSelected, showListenButton }: EmojiCardProps) {
  const handleListen = (e: React.MouseEvent) => {
    // Stop the click from bubbling up to parent elements
    e.stopPropagation()

    // Text-to-speech functionality
    const utterance = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <Card className={cn("overflow-hidden", isSelected && "border-green-500 bg-green-50", className)}>
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">{emoji}</div>
        <p className="text-center text-sm font-medium mb-4">{text}</p>
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
