import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Container } from "../components/ui/container";
import { Card, CardContent } from "../components/ui/card";
import { Text } from "../components/ui/text";
import { CategoryInput } from "../components/CategoryInput";
import { QuestionList } from "../components/QuestionList";
import { useGameStore } from "../store";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertTriangle, Shuffle, Shield, ShieldOff, User, Volume2, ChevronDown, Plus } from "lucide-react";
import type { Question } from "../types";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Label } from "../components/ui/label";
import { Howl } from "howler";

// Language flag mapping
const languageFlags: Record<string, string> = {
  'American': 'https://flagcdn.com/w40/us.png',
  'Chinese': 'https://flagcdn.com/w40/cn.png',
  'Spanish': 'https://flagcdn.com/w40/es.png',
  'French': 'https://flagcdn.com/w40/fr.png',
  'Hindi': 'https://flagcdn.com/w40/in.png',
  'Italian': 'https://flagcdn.com/w40/it.png',
  'Portuguese': 'https://flagcdn.com/w40/pt.png',
};

const languages = ['American', 'Chinese', 'Spanish', 'French', 'Hindi', 'Italian', 'Portuguese'];

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
}

function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative w-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-[46.67px] w-auto min-w-fit rounded-l-none rounded-r-md border-l-0 border-r border-t border-b border-border-muted/30 bg-card-dark/50 px-2 text-warm-cream ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-yellow focus-visible:ring-offset-2 items-center justify-center"
      >
        <img 
          src={languageFlags[value] || languageFlags['American']} 
          alt={value}
          className="w-6 h-4 object-cover rounded"
        />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-auto min-w-fit mt-1 bg-card-dark border border-border-muted/30 rounded-md shadow-lg">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {languages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  onChange(lang);
                  setIsOpen(false);
                }}
                className={`w-full px-2 py-2 text-left text-warm-cream hover:bg-border-muted/30 transition-colors flex items-center justify-center ${
                  value === lang ? 'bg-teal-primary/30' : ''
                }`}
              >
                <img 
                  src={languageFlags[lang]} 
                  alt={lang}
                  className="w-6 h-4 object-cover rounded"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface VoiceSelectProps {
  value: string;
  onChange: (value: string) => void;
  ttsProvider: 'unrealspeech' | 'openai';
  language: string;
}

function VoiceSelect({ value, onChange, ttsProvider, language }: VoiceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Get available voices based on TTS provider
  const getVoices = () => {
    if (ttsProvider === 'openai') {
      return [
        { name: 'alloy', description: 'Alloy' },
        { name: 'echo', description: 'Echo' },
        { name: 'fable', description: 'Fable' },
        { name: 'onyx', description: 'Onyx' },
        { name: 'nova', description: 'Nova' },
        { name: 'shimmer', description: 'Shimmer' },
      ];
    }
    
    // UnrealSpeech voices (language-specific)
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
    return voices.map(v => ({ name: v.name, description: v.name }));
  };

  const voices = getVoices();
  const currentVoice = voices.find(v => v.name.toLowerCase() === value.toLowerCase()) || voices[0];
  const displayText = currentVoice?.description || value;

  return (
    <div className="relative w-auto min-w-fit" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-[46.67px] w-auto min-w-fit rounded-l-none rounded-r-md border-l-0 border-r border-t border-b border-border-muted/30 bg-card-dark/50 px-3 text-warm-cream text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-yellow focus-visible:ring-offset-2 items-center justify-center whitespace-nowrap"
      >
        {displayText}
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-auto min-w-fit mt-1 bg-card-dark border border-border-muted/30 rounded-md shadow-lg">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {voices.map((voice) => (
              <button
                key={voice.name}
                type="button"
                onClick={() => {
                  onChange(voice.name);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-warm-cream hover:bg-border-muted/30 transition-colors whitespace-nowrap ${
                  value.toLowerCase() === voice.name.toLowerCase() ? 'bg-teal-primary/30' : ''
                }`}
              >
                {voice.description}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
        // Determine format based on URL type
        const isDataUrl = data.audioUrl.startsWith('data:');
        
        // For data URLs, don't specify format (MIME type is in the data URL itself)
        const howlConfig: any = {
          src: [data.audioUrl],
          html5: true,
          volume: 1.0,
          onend: () => {
            setIsTestingVoice(false);
            testAudioRef.current = null;
          },
          onplayerror: (id, error) => {
            console.error('Play error:', error, data.audioUrl.substring(0, 50));
            setIsTestingVoice(false);
            testAudioRef.current = null;
          },
          onloaderror: (id, error) => {
            console.error('Load error:', error, data.audioUrl.substring(0, 50));
            setIsTestingVoice(false);
            testAudioRef.current = null;
          }
        };
        
        // Only specify format for non-data URLs
        if (!isDataUrl) {
          howlConfig.format = ['mp3'];
        }
        
        const howl = new Howl(howlConfig);
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
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-card-dark/60 backdrop-blur-sm border-border-muted/30">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <Text variant="large" className="text-warm-cream text-4xl font-bold mb-3">
                  Game Settings
                </Text>
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

              {/* Generate Questions Section with Language/Voice inline */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-0 items-end">
                  <div className="flex-1">
                    <CategoryInput
                      onCategoriesChange={handleCategoriesChange}
                      onGenerate={handleGenerate}
                      isGenerating={isGenerating}
                      roomId={gameState.roomId || ""}
                      inputValue={categoryInputValue}
                      onInputValueChange={setCategoryInputValue}
                      showGenerateButton={false}
                      roundedRight={false}
                    />
                  </div>
                  <div className="flex gap-0 items-end">
                    <LanguageSelect
                      value={gameState.settings?.language || 'American'}
                      onChange={(value) => serverAction("updateLanguage", value)}
                    />
                    <VoiceSelect
                      value={gameState.settings?.voiceId || 'Daniel'}
                      onChange={(value) => serverAction("updateVoice", value)}
                      ttsProvider={gameState.settings?.ttsProvider || 'unrealspeech'}
                      language={gameState.settings?.language || 'American'}
                    />
                    <Button
                      onClick={handleTestVoice}
                      disabled={isTestingVoice}
                      variant="outline"
                      size="sm"
                      className="h-[46.67px] rounded-l-none border-l-0 border-r border-t border-b border-border-muted/30 bg-card-dark/50 hover:bg-border-muted/30 text-warm-cream/80"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                    <div className="flex h-[46.67px] rounded-l-none rounded-r-md border-l-0 border-r border-t border-b border-border-muted/30 bg-card-dark/50 overflow-hidden">
                      <button
                        onClick={() => serverAction("updateTTSProvider", "unrealspeech")}
                        className={`px-3 py-2 text-xs font-medium transition-colors ${
                          (gameState.settings?.ttsProvider || 'unrealspeech') === 'unrealspeech'
                            ? 'bg-teal-primary text-warm-cream'
                            : 'text-warm-cream/60 hover:text-warm-cream hover:bg-border-muted/30'
                        }`}
                        title="UnrealSpeech (with accurate timestamps)"
                      >
                        US
                      </button>
                      <button
                        onClick={() => serverAction("updateTTSProvider", "openai")}
                        className={`px-3 py-2 text-xs font-medium transition-colors border-l border-border-muted/30 ${
                          gameState.settings?.ttsProvider === 'openai'
                            ? 'bg-teal-primary text-warm-cream'
                            : 'text-warm-cream/60 hover:text-warm-cream hover:bg-border-muted/30'
                        }`}
                        title="OpenAI TTS (with estimated timestamps)"
                      >
                        AI
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end sm:justify-start">
                  <Button
                    onClick={() => {
                      const category = categoryInputValue.trim();
                      if (category.length > 0) {
                        handleGenerate([category]);
                      }
                    }}
                    disabled={categoryInputValue.trim().length === 0 || isGenerating}
                    className="bg-warm-orange hover:bg-warm-orange/90 text-white disabled:opacity-50 text-base px-4 h-[46.67px] transition-all duration-200"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="font-medium">Generating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">Generate</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>

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