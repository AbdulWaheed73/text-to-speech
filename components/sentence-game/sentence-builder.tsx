"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmojiCard } from "@/components/landing-page/emoji-card"
import { PartyPopper, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

type WordCard = {
  id: string
  text: string
  emoji: string
  type: "subject" | "action-verb" | "state-verb" | "object" | "state"
}

const wordCards: WordCard[] = [
  { id: "i", text: "I", emoji: "👤", type: "subject" },
  { id: "want", text: "want", emoji: "🙏", type: "action-verb" },
  { id: "need", text: "need", emoji: "💭", type: "action-verb" },
  { id: "am", text: "am", emoji: "🙋", type: "state-verb" },
  { id: "food", text: "food", emoji: "🍔", type: "object" },
  { id: "water", text: "water", emoji: "💧", type: "object" },
  { id: "help", text: "help", emoji: "🆘", type: "object" },
  { id: "hungry", text: "hungry", emoji: "😋", type: "state" },
  { id: "thirsty", text: "thirsty", emoji: "🥤", type: "state" },
  { id: "tired", text: "tired", emoji: "😴", type: "state" },
]

type SentenceSlot = {
  position: number
  word: WordCard | null
}

export function SentenceBuilder() {
  const [score, setScore] = React.useState(0)
  const [sentenceSlots, setSentenceSlots] = React.useState<SentenceSlot[]>([
    { position: 0, word: null },
    { position: 1, word: null },
    { position: 2, word: null },
  ])
  const [showCelebration, setShowCelebration] = React.useState(false)
  const [usedCardIds, setUsedCardIds] = React.useState<Set<string>>(new Set())

  // Validate if the sentence makes sense
  const validateSentence = (slots: SentenceSlot[]): boolean => {
    const words = slots.map(slot => slot.word)

    // Check if all slots are filled
    if (words.some(word => word === null)) {
      return false
    }

    const [first, second, third] = words as WordCard[]

    // Valid patterns:
    // 1. "I want [food/water/help]"
    // 2. "I need [food/water/help]"
    // 3. "I am [hungry/thirsty/tired]"

    if (first.id === "i") {
      if ((second.id === "want" || second.id === "need") && third.type === "object") {
        return true
      }
      if (second.id === "am" && third.type === "state") {
        return true
      }
    }

    return false
  }

  const handleCardClick = (card: WordCard) => {
    // Don't allow selecting the same card twice
    if (usedCardIds.has(card.id)) {
      return
    }

    // Find the first empty slot
    const emptySlotIndex = sentenceSlots.findIndex(slot => slot.word === null)

    if (emptySlotIndex === -1) {
      // No empty slots available
      return
    }

    // Add card to the sentence
    const newSlots = [...sentenceSlots]
    newSlots[emptySlotIndex] = { ...newSlots[emptySlotIndex], word: card }
    setSentenceSlots(newSlots)
    setUsedCardIds(prev => new Set(prev).add(card.id))

    // Check if sentence is complete (all slots filled)
    const isComplete = newSlots.every(slot => slot.word !== null)

    if (isComplete) {
      // Validate the sentence
      const isValid = validateSentence(newSlots)

      if (isValid) {
        // Correct sentence - add points and show celebration
        setScore(score + 10)
        setShowCelebration(true)

        // Hide celebration after 2 seconds
        setTimeout(() => {
          setShowCelebration(false)
        }, 2000)
      } else {
        // Incorrect sentence - just play animation, no negative feedback
        // The animation will be subtle - just the cards will be placed
        // No points added, no error message (autism-friendly)
      }
    }
  }

  const handleReset = () => {
    setSentenceSlots([
      { position: 0, word: null },
      { position: 1, word: null },
      { position: 2, word: null },
    ])
    setUsedCardIds(new Set())
    setShowCelebration(false)
  }

  return (
    <Card className="max-w-4xl mx-auto my-8">
      <CardContent className="flex flex-col gap-6 p-6">
        {/* Score Display */}
        <div className="flex justify-center gap-4">
          <div className="px-6 py-3 bg-green-50 rounded-lg border-2 border-green-200">
            <span className="text-lg font-bold text-green-700">Score: {score}</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Make a Sentence</h1>
          <p className="text-muted-foreground">Tap the cards below to build your sentence</p>
        </div>

        {/* Sentence Slots - Top Section */}
        <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200 min-h-[180px]">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {sentenceSlots.map((slot, index) => (
              <div
                key={slot.position}
                className={cn(
                  "border-2 border-dashed border-blue-300 rounded-lg min-h-[140px] flex items-center justify-center transition-all duration-300",
                  slot.word && "border-solid border-blue-500 bg-white animate-in fade-in slide-in-from-bottom-4 duration-500"
                )}
              >
                {slot.word ? (
                  <div className="p-2">
                    <div className="text-4xl text-center mb-1">{slot.word.emoji}</div>
                    <p className="text-center text-sm font-semibold">{slot.word.text}</p>
                  </div>
                ) : (
                  <span className="text-blue-400 font-medium">{index + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Celebration Message */}
        {showCelebration && (
          <Card className="bg-green-50 border-green-200 animate-in fade-in slide-in-from-top-4 duration-500">
            <CardContent className="flex flex-col items-center gap-2 p-4">
              <PartyPopper className="h-12 w-12 text-green-600 animate-bounce" />
              <h3 className="text-xl font-bold text-green-600">Amazing!</h3>
              <p className="text-center text-sm">Great sentence! You earned 10 points!</p>
              <Button variant="outline" size="sm" className="bg-yellow-100 hover:bg-yellow-200 border-yellow-300">
                +10 points
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reset Button */}
        <div className="flex justify-center">
          <Button onClick={handleReset} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Start Over
          </Button>
        </div>

        {/* Word Cards Grid - Bottom Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-center">Choose Your Words</h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {wordCards.map((card) => {
              const isUsed = usedCardIds.has(card.id)
              return (
                <div
                  key={card.id}
                  onClick={() => !isUsed && handleCardClick(card)}
                  className={cn(
                    "transition-all duration-300",
                    isUsed ? "opacity-40 cursor-not-allowed scale-95" : "cursor-pointer hover:scale-105 hover:shadow-lg"
                  )}
                >
                  <EmojiCard
                    emoji={card.emoji}
                    text={card.text}
                    showListenButton={!isUsed}
                    className={cn(isUsed && "bg-gray-100")}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Helpful Instructions */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <p className="text-sm text-center text-purple-900">
              <strong>Tip:</strong> Try making sentences like &quot;I want food&quot; or &quot;I am hungry&quot;
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
