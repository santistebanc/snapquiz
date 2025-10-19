import React, { useState, useCallback, useEffect } from "react";
import { Container } from "../components/ui/container";
import { Card, CardContent } from "../components/ui/card";
import { Text } from "../components/ui/text";
import { CategoryInput } from "../components/CategoryInput";
import { QuestionList } from "../components/QuestionList";
import { useGameStore } from "../store";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function Setup() {
  const { gameState, serverAction } = useGameStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticQuestions, setOptimisticQuestions] = useState<Question[]>([]);

  // Sync optimistic questions with server state
  useEffect(() => {
    setOptimisticQuestions(gameState.questions);
  }, [gameState.questions]);

  const handleCategoriesChange = useCallback((categories: string[]) => {
    // Categories are managed locally in CategoryInput
  }, []);

  const handleGenerate = useCallback(async (categories: string[]) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Call the server action to generate questions
      await serverAction("generateQuestions", [categories]);
    } catch (err) {
      setError("Failed to generate questions. Please try again.");
      console.error("Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [serverAction]);

  const handleReorder = useCallback((oldIndex: number, newIndex: number) => {
    // Optimistic update - immediately update the UI
    const newQuestions = [...optimisticQuestions];
    const [movedQuestion] = newQuestions.splice(oldIndex, 1);
    newQuestions.splice(newIndex, 0, movedQuestion);
    setOptimisticQuestions(newQuestions);
    
    // Send to server
    serverAction("reorderQuestions", oldIndex, newIndex);
  }, [serverAction, optimisticQuestions]);

  const handleRemove = useCallback((questionId: string) => {
    serverAction("removeQuestion", questionId);
  }, [serverAction]);

  const hasQuestions = optimisticQuestions.length > 0;

  return (
    <Container variant="page">
      <div className="max-w-8xl mx-auto space-y-6">
        <Card className="bg-card-dark/60 backdrop-blur-sm border-border-muted/30">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <Text variant="large" className="text-warm-cream text-4xl font-bold mb-3">
                  Game Setup
                </Text>
                <Text className="text-warm-cream/80 text-lg">
                  Manage your quiz questions and generate new ones with AI
                </Text>
              </div>

              <CategoryInput
                onCategoriesChange={handleCategoriesChange}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />

              {error && (
                <Alert className="border-red-500/30 bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <AlertDescription className="text-red-400 text-base">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {!hasQuestions && (
                <Alert className="border-yellow-500/30 bg-yellow-500/10">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <AlertDescription className="text-yellow-400 text-base">
                    You need at least one question to start the game. Add questions manually or generate them using the categories above.
                  </AlertDescription>
                </Alert>
              )}

            <QuestionList
              questions={optimisticQuestions}
              onReorder={handleReorder}
              onRemove={handleRemove}
            />
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}