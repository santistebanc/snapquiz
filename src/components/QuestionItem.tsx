import React, { useState, useEffect } from 'react';
import { GripVertical, Eye, EyeOff, ChevronDown, ChevronUp, Trash2, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAudio } from '../contexts/AudioContext';
import type { Question } from '../types';

interface QuestionItemProps {
  question: Question;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  dragHandleProps?: any;
  onPlayAudio?: (questionId: string) => void;
}

// Large screen component (current layout)
function QuestionItemLarge({ 
  question, 
  isExpanded, 
  onToggleExpand, 
  onRemove, 
  dragHandleProps,
  isRevealed,
  toggleReveal,
  onPlayAudio
}: QuestionItemProps & { isRevealed: boolean; toggleReveal: () => void }) {
  return (
    <div className="bg-card-dark/60 border border-border-muted/30 rounded-lg p-2 hover:bg-card-dark/80 transition-colors">
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 hover:bg-border-muted/30 rounded bg-card-dark/40"
        >
          <GripVertical className="w-4 h-4 text-warm-cream/80" />
        </div>

        {/* Question Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Category Badge and Question Text */}
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className="bg-border-muted/30 text-warm-cream/80 border-border-muted/50 rounded-sm px-2 py-1 text-xs pointer-events-none"
                >
                  {question.category}
                </Badge>
                <p className={`text-warm-cream text-lg transition-all duration-300 ${
                  isRevealed ? 'blur-none' : 'blur-sm'
                }`}>
                  {question.text}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* First Slot: EyeOff button when revealed, empty when not revealed */}
              <div className="w-8 h-8 flex items-center justify-center">
                {isRevealed && (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleReveal();
                    }}
                    size="sm"
                    variant="outline"
                    className="border-border-muted/50 text-warm-cream bg-card-dark/80 hover:bg-border-muted/30 hover:text-white"
                    type="button"
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Second Slot: Expand/Collapse when revealed, Eye when not revealed */}
              <div className="w-8 h-8 flex items-center justify-center">
                {isRevealed ? (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleExpand();
                    }}
                    size="sm"
                    variant="outline"
                    className="border-border-muted/50 text-warm-cream bg-card-dark/80 hover:bg-border-muted/30 hover:text-white"
                    type="button"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                ) : (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleReveal();
                    }}
                    size="sm"
                    variant="outline"
                    className="border-border-muted/50 text-warm-cream bg-card-dark/80 hover:bg-border-muted/30 hover:text-white"
                    type="button"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Play Audio Button (if audioUrl exists and question is revealed) - positioned before trash button */}
              {isRevealed && question.audioUrl && onPlayAudio && (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onPlayAudio(question.id);
                  }}
                  size="sm"
                  variant="outline"
                  className="border-border-muted/50 text-warm-cream bg-card-dark/80 hover:bg-border-muted/30 hover:text-white"
                  type="button"
                  title="Play audio"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              )}

              {/* Remove Button (always visible) */}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }}
                size="sm"
                variant="outline"
                className="border-red-500/50 text-red-300 bg-red-500/20 hover:bg-red-500/40 hover:text-white"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Expanded Options */}
          {isExpanded && (
            <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
              <div className="grid gap-2">
                {question.options.map((option, index) => {
                  const isCorrect = option === question.answer;
                  return (
                    <div
                      key={index}
                      className={`p-2 rounded border ${
                        isCorrect
                          ? 'bg-correct-green/20 border-correct-green/50'
                          : 'bg-card-dark/40 border-border-muted/20'
                      } text-warm-cream/80`}
                    >
                      {option}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Small screen component (question text above, category badge and action buttons below)
function QuestionItemSmall({ 
  question, 
  isExpanded, 
  onToggleExpand, 
  onRemove, 
  dragHandleProps,
  isRevealed,
  toggleReveal,
  onPlayAudio
}: QuestionItemProps & { isRevealed: boolean; toggleReveal: () => void }) {
  return (
    <div className="bg-card-dark/60 border border-border-muted/30 rounded-lg p-2 hover:bg-card-dark/80 transition-colors">
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 hover:bg-border-muted/30 rounded bg-card-dark/40 mt-1"
        >
          <GripVertical className="w-4 h-4 text-warm-cream/80" />
        </div>

        {/* Question Content */}
        <div className="flex-1 min-w-0">
          {/* Question Text */}
          <p className={`text-warm-cream text-lg transition-all duration-300 mb-3 ${
            isRevealed ? 'blur-none' : 'blur-sm'
          }`}>
            {question.text}
          </p>

          {/* Category Badge and Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <Badge 
              variant="secondary" 
              className="bg-border-muted/30 text-warm-cream/80 border-border-muted/50 rounded-sm px-2 py-1 text-xs pointer-events-none"
            >
              {question.category}
            </Badge>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* First Slot: EyeOff button when revealed, empty when not revealed */}
              <div className="w-8 h-8 flex items-center justify-center">
                {isRevealed && (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleReveal();
                    }}
                    size="sm"
                    variant="outline"
                    className="border-border-muted/50 text-warm-cream bg-card-dark/80 hover:bg-border-muted/30 hover:text-white"
                    type="button"
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Second Slot: Expand/Collapse when revealed, Eye when not revealed */}
              <div className="w-8 h-8 flex items-center justify-center">
                {isRevealed ? (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleExpand();
                    }}
                    size="sm"
                    variant="outline"
                    className="border-border-muted/50 text-warm-cream bg-card-dark/80 hover:bg-border-muted/30 hover:text-white"
                    type="button"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                ) : (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleReveal();
                    }}
                    size="sm"
                    variant="outline"
                    className="border-border-muted/50 text-warm-cream bg-card-dark/80 hover:bg-border-muted/30 hover:text-white"
                    type="button"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Play Audio Button (if audioUrl exists and question is revealed) - positioned before trash button */}
              {isRevealed && question.audioUrl && onPlayAudio && (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onPlayAudio(question.id);
                  }}
                  size="sm"
                  variant="outline"
                  className="border-border-muted/50 text-warm-cream bg-card-dark/80 hover:bg-border-muted/30 hover:text-white"
                  type="button"
                  title="Play audio"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              )}

              {/* Remove Button (always visible) */}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }}
                size="sm"
                variant="outline"
                className="border-red-500/50 text-red-300 bg-red-500/20 hover:bg-red-500/40 hover:text-white"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Expanded Options */}
          {isExpanded && (
            <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
              <div className="grid gap-2">
                {question.options.map((option, index) => {
                  const isCorrect = option === question.answer;
                  return (
                    <div
                      key={index}
                      className={`p-2 rounded border ${
                        isCorrect
                          ? 'bg-correct-green/20 border-correct-green/50'
                          : 'bg-card-dark/40 border-border-muted/20'
                      } text-warm-cream/80`}
                    >
                      {option}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function QuestionItem({ 
  question, 
  isExpanded, 
  onToggleExpand, 
  onRemove, 
  dragHandleProps,
  onPlayAudio
}: QuestionItemProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  // Load revealed state from localStorage
  useEffect(() => {
    const revealedKey = `revealed-questions-${question.id}`;
    const revealed = localStorage.getItem(revealedKey) === 'true';
    setIsRevealed(revealed);
  }, [question.id]);

  const toggleReveal = () => {
    const newRevealed = !isRevealed;
    setIsRevealed(newRevealed);
    localStorage.setItem(`revealed-questions-${question.id}`, newRevealed.toString());
  };

  return (
    <>
      {/* Large screen layout */}
      <div className="hidden sm:block">
        <QuestionItemLarge
          question={question}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onRemove={onRemove}
          dragHandleProps={dragHandleProps}
          isRevealed={isRevealed}
          toggleReveal={toggleReveal}
          onPlayAudio={onPlayAudio}
        />
      </div>

      {/* Small screen layout */}
      <div className="block sm:hidden">
        <QuestionItemSmall
          question={question}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onRemove={onRemove}
          dragHandleProps={dragHandleProps}
          isRevealed={isRevealed}
          toggleReveal={toggleReveal}
          onPlayAudio={onPlayAudio}
        />
      </div>
    </>
  );
}
