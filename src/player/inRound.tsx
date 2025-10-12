import React, { useState, useEffect } from "react";
import { useGameStore } from "../store";
import { Card, CardContent } from "../components/ui/card";
import { Container } from "../components/ui/container";
import { Text } from "../components/ui/text";
import { QuestionDisplay } from "../components/QuestionDisplay";
import { TimerBar } from "../components/TimerBar";
import { OptionsDisplay } from "../components/OptionsDisplay";
import { Phase } from "../types";

export default function InRound() {
  const { gameState, sendMessage, connectionId } = useGameStore();
  const [revealedWords, setRevealedWords] = useState<string[]>([]);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(3000);

  // Get current round and question
  const currentRound = gameState.rounds && gameState.rounds.length > 0 ? 
    gameState.rounds[gameState.currentRound - 1] : null;
  const currentQuestion = currentRound ? 
    gameState.questions.find(q => q.id === currentRound.questionId) : null;
  
  // Get player's selected option from server state
  const playerSelectedOption = currentRound && connectionId ? 
    (currentRound.chosenOptions instanceof Map 
      ? currentRound.chosenOptions.get(connectionId)
      : currentRound.chosenOptions[connectionId]) : null;

  // Handle server messages for word reveal and timer
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "wordReveal") {
          setRevealedWords(prev => [...prev, message.data.word]);
        } else if (message.type === "timerCountdown") {
          setTimerSeconds(message.data.secondsRemaining);
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
    setTimerSeconds(0);
    setTimeRemaining(3000);
  }, [gameState.currentRound]);

  // Debug logging
  useEffect(() => {
    console.log('Player selectedOption:', playerSelectedOption);
    console.log('Current game phase:', gameState.phase);
    console.log('Current question answer:', currentQuestion?.answer);
    console.log('Current round chosenOptions:', currentRound?.chosenOptions);
    console.log('Connection ID:', connectionId);
  }, [playerSelectedOption, gameState.phase, currentQuestion?.answer, currentRound?.chosenOptions, connectionId]);

  const handleOptionSelect = (option: string) => {
    console.log('Player selecting option:', option);
    console.log('Sending selectOption message with connectionId:', connectionId);
    sendMessage({
      type: "selectOption",
      data: {
        option: option,
        connectionId: connectionId
      }
    });
  };

  const renderContent = () => {
    if (!currentQuestion) return null;

    const questionProps = {
      question: currentQuestion,
      revealedWords,
      phase: gameState.phase,
      isPlayerMode: true
    };

    if (gameState.phase === Phase.QUESTIONING) {
      return <QuestionDisplay {...questionProps} />;
    }

    if (gameState.phase === Phase.WAIT_AFTER_QUESTION) {
      return (
        <div className="space-y-6">
          <QuestionDisplay {...questionProps} />
          <TimerBar timeRemaining={timeRemaining} isPlayerMode={true} />
        </div>
      );
    }

    if (gameState.phase === Phase.SHOWING_OPTIONS) {
      return (
        <div className="space-y-6">
          <QuestionDisplay {...questionProps} />
          <OptionsDisplay 
            options={currentQuestion.options}
            correctAnswer={currentQuestion.answer}
            selectedOption={playerSelectedOption || undefined}
            onOptionSelect={handleOptionSelect}
            isPlayerMode={true}
          />
        </div>
      );
    }

    if (gameState.phase === Phase.REVEALING_ANSWER) {
      return (
        <div className="space-y-6">
          <QuestionDisplay {...questionProps} />
          <OptionsDisplay 
            options={currentQuestion.options}
            correctAnswer={currentQuestion.answer}
            selectedOption={playerSelectedOption || undefined}
            isPlayerMode={true}
            disabled={true}
          />
        </div>
      );
    }

    return <QuestionDisplay {...questionProps} />;
  };

  return (
    <Container variant="page">
      <Card className="w-full max-w-2xl">
        <CardContent className="text-center p-8">
          {renderContent() || (
            <div>
              <h1 className="text-4xl font-bold mb-4">In Round</h1>
              <Text variant="muted" className="text-lg">
                Waiting for the game to continue...
              </Text>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
