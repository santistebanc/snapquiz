import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Container } from "../components/ui/container";
import { Card, CardContent } from "../components/ui/card";
import { Text } from "../components/ui/text";
import { CategoryInput } from "../components/CategoryInput";
import { QuestionList } from "../components/QuestionList";
import { useGameStore } from "../store";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertTriangle, Shuffle } from "lucide-react";
import type { Question } from "../types";
import { Button } from "../components/ui/button";

export default function Setup() {
  const { gameState, serverAction } = useGameStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticQuestions, setOptimisticQuestions] = useState<Question[]>([]);
  const prevCountRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const [categoryInputValue, setCategoryInputValue] = useState('');

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
    prevCountRef.current = optimisticQuestions.length;

    try {
      // Fire-and-forget to server; UI stays loading until update arrives
      serverAction("generateQuestions", categories);

      // Fallback timeout to ensure loading doesn't get stuck (20s)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setIsGenerating(false);
        timeoutRef.current = null;
      }, 20000) as unknown as number;
    } catch (err) {
      setError("Failed to generate questions. Please try again.");
      setIsGenerating(false);
      console.error("Generation error:", err);
    }
  }, [serverAction, optimisticQuestions.length]);

  // When questions list grows vs previous count, stop loading
  useEffect(() => {
    if (!isGenerating) return;
    if (optimisticQuestions.length > prevCountRef.current) {
      setIsGenerating(false);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [optimisticQuestions.length, isGenerating]);

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

  const handleShuffle = useCallback(() => {
    if (optimisticQuestions.length < 2) return;
    const shuffled = [...optimisticQuestions];
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setOptimisticQuestions(shuffled);
    serverAction("updateQuestions", shuffled);
  }, [optimisticQuestions, serverAction]);

  const handleCategoryBadgeClick = useCallback((category: string) => {
    setCategoryInputValue(category);
  }, []);

  const hasQuestions = optimisticQuestions.length > 0;

  // Build category counts from current questions
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of optimisticQuestions) {
      const key = (q.category || "Uncategorized").trim();
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [optimisticQuestions]);

  return (
    <Container variant="page">
      <div className="max-w-7xl mx-auto space-y-6">
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
                roomId={gameState.roomId || ""}
                inputValue={categoryInputValue}
                onInputValueChange={setCategoryInputValue}
              />

              {/* Category usage summary */}
              {Object.keys(categoryCounts).length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <div
                      key={cat}
                      onClick={() => handleCategoryBadgeClick(cat)}
                      className="flex items-center gap-2 pl-2 pr-2 py-1 bg-border-muted/20 border border-border-muted/30 rounded-sm text-warm-cream/90 cursor-pointer hover:bg-border-muted/30 transition-colors"
                    >
                      <span className="text-sm">{cat}</span>
                      <span className="text-[11px] min-w-5 h-5 px-1 inline-flex items-center justify-center rounded-full bg-card-dark/60 border border-border-muted/30">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}

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
              rightActions={(
                <Button
                  onClick={handleShuffle}
                  disabled={!hasQuestions}
                  variant="outline"
                  className="border-border-muted/30 bg-card-dark/50 hover:bg-border-muted/30 text-warm-cream/80"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Shuffle
                </Button>
              )}
            />
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}