import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Container } from "../components/ui/container";
import { Card, CardContent } from "../components/ui/card";
import { Text } from "../components/ui/text";
import { CategoryInput } from "../components/CategoryInput";
import { QuestionList } from "../components/QuestionList";
import { useGameStore } from "../store";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertTriangle, Shuffle, Shield, ShieldOff, User, Volume2 } from "lucide-react";
import type { Question } from "../types";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { PlayerDrawer } from "../components/PlayerDrawer";
import { Label } from "../components/ui/label";
import { Howl } from "howler";

export default function Settings() {
  const { gameState, serverAction } = useGameStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticQuestions, setOptimisticQuestions] = useState<Question[]>([]);
  const prevCountRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const [categoryInputValue, setCategoryInputValue] = useState('');
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const testAudioRef = useRef<Howl | null>(null);

  // Sync optimistic questions with server state
  useEffect(() => {
    setOptimisticQuestions(gameState.questions);
  }, [gameState.questions]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (testAudioRef.current) {
        testAudioRef.current.stop();
        testAudioRef.current.unload();
        testAudioRef.current = null;
      }
    };
  }, []);

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

  const handleToggleAdmin = useCallback((playerId: string) => {
    serverAction("togglePlayerAdmin", playerId);
  }, [serverAction]);

  const handleTestVoice = useCallback(async () => {
    const voiceId = gameState.settings?.voiceId || 'Daniel';
    setIsTestingVoice(true);
    
    // Stop any currently playing test audio
    if (testAudioRef.current) {
      testAudioRef.current.stop();
      testAudioRef.current.unload();
      testAudioRef.current = null;
    }

    try {
      // Get PartyKit host (same logic as store.ts)
      const getPartyKitHost = (): string => {
        if (window.location.hostname !== "localhost") {
          return window.location.host;
        }
        const currentPort = window.location.port;
        if (currentPort && currentPort !== "80" && currentPort !== "443") {
          return `localhost:${currentPort}`;
        }
        return `localhost:1999`;
      };
      
      const host = getPartyKitHost();
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const roomId = gameState.roomId || '';
      const response = await fetch(`${protocol}//${host}/parties/main/${roomId}/test-voice?voiceId=${encodeURIComponent(voiceId)}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate test audio');
      }
      
      const data = await response.json();
      
      if (data.audioUrl) {
        // Play the audio using Howler
        const howl = new Howl({
          src: [data.audioUrl],
          html5: true,
          format: ['mp3'],
          volume: 1.0,
          onend: () => {
            setIsTestingVoice(false);
            testAudioRef.current = null;
          },
          onplayerror: () => {
            setIsTestingVoice(false);
            testAudioRef.current = null;
          }
        });
        
        testAudioRef.current = howl;
        howl.play();
      } else {
        setIsTestingVoice(false);
      }
    } catch (error) {
      console.error('Error testing voice:', error);
      setIsTestingVoice(false);
    }
  }, [gameState.settings?.voiceId, gameState.roomId]);

  const hasQuestions = optimisticQuestions.length > 0;
  
  const playersList = useMemo(() => Object.values(gameState.players), [gameState.players]);

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
      <PlayerDrawer
        players={Object.values(gameState.players)}
        isPlayerMode={true}
      />
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-card-dark/60 backdrop-blur-sm border-border-muted/30">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <Text variant="large" className="text-warm-cream text-4xl font-bold mb-3">
                  Game Settings
                </Text>
              </div>

              {/* Voice Selection Section */}
              <div className="space-y-3">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language-select" className="text-warm-cream/90">
                      Language
                    </Label>
                    <select
                      id="language-select"
                      value={gameState.settings?.language || 'American'}
                      onChange={(e) => serverAction("updateLanguage", e.target.value)}
                      className="themed-select flex h-10 w-full rounded-md border border-border-muted/30 bg-card-dark/50 px-3 py-2 text-warm-cream text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-yellow focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    >
                      <option value="American">American</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Italian">Italian</option>
                      <option value="Portuguese">Portuguese</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voice-select" className="text-warm-cream/90">
                      Voice
                    </Label>
                    <select
                      id="voice-select"
                      value={gameState.settings?.voiceId || 'Daniel'}
                      onChange={(e) => serverAction("updateVoice", e.target.value)}
                      className="themed-select flex h-10 w-full rounded-md border border-border-muted/30 bg-card-dark/50 px-3 py-2 text-warm-cream text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-yellow focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    >
                      {(() => {
                        const language = gameState.settings?.language || 'American';
                        const languageToVoices: Record<string, { name: string; gender: string }[]> = {
                          'American': [
                            { name: 'Noah', gender: 'Male' },
                            { name: 'Jasper', gender: 'Male' },
                            { name: 'Caleb', gender: 'Male' },
                            { name: 'Ronan', gender: 'Male' },
                            { name: 'Ethan', gender: 'Male' },
                            { name: 'Daniel', gender: 'Male' },
                            { name: 'Zane', gender: 'Male' },
                            { name: 'Autumn', gender: 'Female' },
                            { name: 'Melody', gender: 'Female' },
                            { name: 'Hannah', gender: 'Female' },
                            { name: 'Emily', gender: 'Female' },
                            { name: 'Ivy', gender: 'Female' },
                            { name: 'Kaitlyn', gender: 'Female' },
                            { name: 'Luna', gender: 'Female' },
                            { name: 'Willow', gender: 'Female' },
                            { name: 'Lauren', gender: 'Female' },
                            { name: 'Sierra', gender: 'Female' },
                          ],
                          'Chinese': [
                            { name: 'Wei', gender: 'Male' },
                            { name: 'Jian', gender: 'Male' },
                            { name: 'Hao', gender: 'Male' },
                            { name: 'Sheng', gender: 'Male' },
                            { name: 'Mei', gender: 'Female' },
                            { name: 'Lian', gender: 'Female' },
                            { name: 'Ting', gender: 'Female' },
                            { name: 'Jing', gender: 'Female' },
                          ],
                          'Spanish': [
                            { name: 'Mateo', gender: 'Male' },
                            { name: 'Javier', gender: 'Male' },
                            { name: 'Lucía', gender: 'Female' },
                          ],
                          'French': [
                            { name: 'Élodie', gender: 'Female' },
                          ],
                          'Hindi': [
                            { name: 'Arjun', gender: 'Male' },
                            { name: 'Rohan', gender: 'Male' },
                            { name: 'Ananya', gender: 'Female' },
                            { name: 'Priya', gender: 'Female' },
                          ],
                          'Italian': [
                            { name: 'Luca', gender: 'Male' },
                            { name: 'Giulia', gender: 'Female' },
                          ],
                          'Portuguese': [
                            { name: 'Thiago', gender: 'Male' },
                            { name: 'Rafael', gender: 'Male' },
                            { name: 'Camila', gender: 'Female' },
                          ],
                        };
                        const voices = languageToVoices[language] || [];
                        return (
                          <>
                            {voices.map(voice => (
                              <option key={voice.name} value={voice.name}>{voice.name}</option>
                            ))}
                          </>
                        );
                      })()}
                    </select>
                  </div>
                  <Text className="text-warm-cream/60 text-sm">
                    Select the language and voice used for reading questions aloud
                  </Text>
                  <Button
                    onClick={handleTestVoice}
                    disabled={isTestingVoice}
                    variant="outline"
                    className="mt-2 border-border-muted/30 bg-card-dark/50 hover:bg-border-muted/30 text-warm-cream/80"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    {isTestingVoice ? 'Generating...' : 'Test Voice'}
                  </Button>
                </div>
              </div>

              {/* Player Management Section */}
              {playersList.length > 0 && (
                <div className="space-y-3">
                  <Text variant="large" className="text-warm-cream text-2xl font-bold">
                    Players
                  </Text>
                  <div className="grid gap-3">
                    {playersList.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-4 bg-border-muted/20 border border-border-muted/30 rounded-lg hover:bg-border-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-warm-yellow">
                            <AvatarFallback className="bg-warm-orange text-white text-lg font-bold">
                              {player.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <Text className="text-warm-cream font-semibold text-lg">
                              {player.name || "Anonymous"}
                            </Text>
                            <Text className="text-warm-cream/60 text-sm">
                              {player.points} points
                            </Text>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleToggleAdmin(player.id)}
                          variant={player.isAdmin ? "default" : "outline"}
                          size="sm"
                          className={player.isAdmin 
                            ? "bg-warm-yellow hover:bg-warm-yellow/90 text-white" 
                            : "border-border-muted/30 bg-card-dark/50 hover:bg-border-muted/30 text-warm-cream/80"
                          }
                        >
                          {player.isAdmin ? (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 mr-2" />
                              Player
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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