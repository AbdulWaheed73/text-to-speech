"use client"

import * as React from "react"
import { EmojiCard } from "./emoji-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PartyPopper, MessageCircle } from "lucide-react"

type Emotion = {
  emoji: string
  name: string
  description: string
}

type Question = {
  mainEmotion: Emotion
  correctAnswer: string
  options: Emotion[]
}

const questions: Question[] = [
  {
    mainEmotion: { emoji: "😊", name: "Happy", description: "This person is smiling and feeling good!" },
    correctAnswer: "Happy",
    options: [
      { emoji: "😊", name: "Happy", description: "" },
      { emoji: "😢", name: "Sad", description: "" },
      { emoji: "😠", name: "Angry", description: "" },
      { emoji: "😮", name: "Surprised", description: "" },
    ],
  },
  {
    mainEmotion: { emoji: "😢", name: "Sad", description: "This person is crying and feeling down." },
    correctAnswer: "Sad",
    options: [
      { emoji: "😊", name: "Happy", description: "" },
      { emoji: "😢", name: "Sad", description: "" },
      { emoji: "😆", name: "Excited", description: "" },
      { emoji: "😴", name: "Tired", description: "" },
    ],
  },
  {
    mainEmotion: { emoji: "😠", name: "Angry", description: "This person is upset and feeling angry." },
    correctAnswer: "Angry",
    options: [
      { emoji: "😊", name: "Happy", description: "" },
      { emoji: "😢", name: "Sad", description: "" },
      { emoji: "😠", name: "Angry", description: "" },
      { emoji: "😮", name: "Surprised", description: "" },
    ],
  },
  {
    mainEmotion: { emoji: "😮", name: "Surprised", description: "This person is amazed and surprised!" },
    correctAnswer: "Surprised",
    options: [
      { emoji: "😊", name: "Happy", description: "" },
      { emoji: "😢", name: "Sad", description: "" },
      { emoji: "😠", name: "Angry", description: "" },
      { emoji: "😮", name: "Surprised", description: "" },
    ],
  },
  {
    mainEmotion: { emoji: "😴", name: "Tired", description: "This person is sleepy and feeling tired." },
    correctAnswer: "Tired",
    options: [
      { emoji: "😊", name: "Happy", description: "" },
      { emoji: "😢", name: "Sad", description: "" },
      { emoji: "😴", name: "Tired", description: "" },
      { emoji: "😆", name: "Excited", description: "" },
    ],
  },
]

export function GameCard() {
  const [currentQuestion, setCurrentQuestion] = React.useState(0)
  const [score, setScore] = React.useState(0)
  const [selectedEmotion, setSelectedEmotion] = React.useState<string | null>(null)

  const question = questions[currentQuestion]
  const isCorrect = selectedEmotion === question.correctAnswer

  const handleEmotionClick = (emotionName: string) => {
    if (selectedEmotion) return // Prevent changing answer

    setSelectedEmotion(emotionName)

    // Update score if correct
    if (emotionName === question.correctAnswer) {
      setScore(score + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedEmotion(null)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto my-8">
      <CardContent className="flex flex-col gap-4 p-4">
        {/* Score and Question Tracker */}
        <div className="flex justify-center gap-4 text-sm font-medium">
          <div className="px-4 py-2 bg-blue-50 rounded-lg">
            Question {currentQuestion + 1}/{questions.length}
          </div>
          <div className="px-4 py-2 bg-green-50 rounded-lg">
            Score: {score}
          </div>
        </div>

        {/* Top Card - Main Emoji */}
        <EmojiCard
          emoji={question.mainEmotion.emoji}
          text={question.mainEmotion.name}
          showListenButton
        />

        {/* Question */}
        <div className="text-center">
          <h2 className="text-xl font-bold mb-1">How is this person feeling?</h2>
          <p className="text-muted-foreground text-sm">Tap on the correct emotion</p>
        </div>

        {/* Grid of 4 Emotion Options */}
        <div className="grid grid-cols-2 gap-3">
          {question.options.map((emotion) => {
            const isThisCorrect = emotion.name === question.correctAnswer
            const isThisSelected = selectedEmotion === emotion.name
            const showAsCorrect = selectedEmotion ? isThisCorrect : false
            const showAsWrong = isThisSelected && !isThisCorrect

            return (
              <div
                key={emotion.name}
                onClick={() => handleEmotionClick(emotion.name)}
                className="cursor-pointer"
              >
                <EmojiCard
                  emoji={emotion.emoji}
                  text={emotion.name}
                  isCorrect={showAsCorrect}
                  isWrong={showAsWrong}
                  className="hover:shadow-lg transition-shadow"
                  showListenButton
                />
              </div>
            )
          })}
        </div>

        {/* Feedback */}
        {selectedEmotion && (
          <Card className={isCorrect ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}>
            <CardContent className="flex flex-col items-center gap-2 p-4">
              {isCorrect ? (
                <>
                  <PartyPopper className="h-12 w-12 text-green-600" />
                  <h3 className="text-xl font-bold text-green-600">Amazing!</h3>
                  <p className="text-center text-sm">You got it right! Great job recognizing emotions!</p>
                  <Button variant="outline" size="sm" className="bg-yellow-100 hover:bg-yellow-200 border-yellow-300">
                    +20 coins
                  </Button>
                </>
              ) : (
                <>
                  <MessageCircle className="h-12 w-12 text-orange-600" />
                  <h3 className="text-xl font-bold text-orange-600">Not quite!</h3>
                  <p className="text-center text-sm">
                    The correct answer is {question.correctAnswer} {question.mainEmotion.emoji}
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    {question.mainEmotion.description}
                  </p>
                </>
              )}

              {currentQuestion < questions.length - 1 && (
                <Button onClick={handleNextQuestion} className="mt-2">
                  Next Question
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
