import React, { useState, useEffect } from "react";
import { useGameStore } from "../store";
import { QuestionDisplay } from "./QuestionDisplay";
import { TimerBar } from "./TimerBar";
import { OptionsDisplay } from "./OptionsDisplay";
import { Phase } from "../types";

interface InRoundContentProps {
  isPlayerMode: boolean;
}

export function InRoundContent({ isPlayerMode }: InRoundContentProps) {
  const { gameState, sendMessage, connectionId } = useGameStore();
  const [revealedWords, setRevealedWords] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(3000);

  // Get current round and question
  const currentRound =
    gameState.rounds && gameState.rounds.length > 0
      ? gameState.rounds[gameState.currentRound - 1]
      : null;
  const currentQuestion = currentRound
    ? gameState.questions.find((q) => q.id === currentRound.questionId)
    : null;

  // Get player's selected option from server state (only for player mode)
  const playerSelectedOption =
    isPlayerMode && currentRound && connectionId
      ? currentRound.chosenOptions instanceof Map
        ? currentRound.chosenOptions.get(connectionId)
        : currentRound.chosenOptions[connectionId]
      : null;

  // Handle server messages for word reveal and timer
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "wordReveal") {
          setRevealedWords((prev) => [...prev, message.data.word]);
        } else if (message.type === "timerCountdown") {
          setTimeRemaining(message.data.timeRemaining);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    // Listen for messages from the game store's socket
    const socket = (useGameStore.getState() as any).socket;
    if (socket) {
      socket.addEventListener("message", handleMessage);
      return () => socket.removeEventListener("message", handleMessage);
    }
  }, []);

  // Reset revealed words when round changes
  useEffect(() => {
    setRevealedWords([]);
    setTimeRemaining(3000);
  }, [gameState.currentRound]);

  // Handle option selection (only for player mode)
  const handleOptionSelect = (option: string) => {
    if (!isPlayerMode) return;
    
    console.log("Player selecting option:", option);
    console.log(
      "Sending selectOption message with connectionId:",
      connectionId
    );
    sendMessage({
      type: "selectOption",
      data: {
        option: option,
        connectionId: connectionId,
      },
    });
  };
  if (!currentQuestion) return null;

  const questionProps = {
    question: currentQuestion,
    revealedWords,
    phase: gameState.phase,
    isPlayerMode,
  };

  // Use unified layout for both screen and player modes
  return (
    <div className="space-y-8">
      {gameState.phase >= Phase.QUESTIONING && (
        <QuestionDisplay {...questionProps} />
      )}
      {gameState.phase === Phase.WAIT_AFTER_QUESTION && (
        <TimerBar timeRemaining={timeRemaining} isPlayerMode={isPlayerMode} />
      )}
      {gameState.phase >= Phase.SHOWING_OPTIONS && (
        <OptionsDisplay
          options={currentQuestion.options}
          correctAnswer={currentQuestion.answer}
          selectedOption={isPlayerMode ? (playerSelectedOption || undefined) : undefined}
          onOptionSelect={isPlayerMode ? handleOptionSelect : undefined}
          isPlayerMode={isPlayerMode}
          disabled={gameState.phase === Phase.REVEALING_ANSWER}
        />
      )}
    </div>
  );
}
