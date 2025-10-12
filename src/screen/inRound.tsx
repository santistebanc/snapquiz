import { useState, useEffect } from "react";
import { useGameStore } from "../store";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Container } from "../components/ui/container";
import { QuestionDisplay } from "../components/QuestionDisplay";
import { TimerBar } from "../components/TimerBar";
import { OptionsDisplay } from "../components/OptionsDisplay";
import { PlayerDrawer } from "../components/PlayerDrawer";
import { Phase } from "../types";

export default function InRound() {
  const { gameState, sendMessage } = useGameStore();
  const [revealedWords, setRevealedWords] = useState<string[]>([]);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(3000);

  // Get current round and question
  const currentRound = gameState.rounds && gameState.rounds.length > 0 ? 
    gameState.rounds[gameState.currentRound - 1] : null;
  const currentQuestion = currentRound ? 
    gameState.questions.find(q => q.id === currentRound.questionId) : null;

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

  const handleResetGame = () => {
    sendMessage({
      type: "resetGame",
      data: {},
    });
  };

  const renderContent = () => {
    if (!currentQuestion) return null;

    const questionProps = {
      question: currentQuestion,
      revealedWords,
      phase: gameState.phase,
      isPlayerMode: false
    };

    if (gameState.phase === Phase.QUESTIONING) {
      return <QuestionDisplay {...questionProps} />;
    }

    if (gameState.phase === Phase.WAIT_AFTER_QUESTION) {
      return (
        <div className="space-y-8">
          <QuestionDisplay {...questionProps} />
          <TimerBar timeRemaining={timeRemaining} />
        </div>
      );
    }

    if (gameState.phase === Phase.SHOWING_OPTIONS) {
      return (
        <div className="space-y-8">
          <QuestionDisplay {...questionProps} />
          <OptionsDisplay 
            options={currentQuestion.options}
            correctAnswer={currentQuestion.answer}
            isPlayerMode={false}
          />
        </div>
      );
    }

    if (gameState.phase === Phase.REVEALING_ANSWER) {
      return (
        <div className="space-y-8">
          <QuestionDisplay {...questionProps} />
          <OptionsDisplay 
            options={currentQuestion.options}
            correctAnswer={currentQuestion.answer}
            isPlayerMode={false}
            disabled={true}
          />
        </div>
      );
    }

    return <QuestionDisplay {...questionProps} />;
  };

  return (
    <Container variant="page">
      <PlayerDrawer players={Array.from(gameState.players.values())} />
      <Card className="w-full max-w-6xl">
        <CardContent className="text-center p-8 space-y-6">
          {renderContent()}
          
          <div className="pt-8">
            <Button onClick={handleResetGame} size="lg">
              Reset Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
