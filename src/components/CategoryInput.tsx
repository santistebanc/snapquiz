import React, { useState, useRef, type KeyboardEvent, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface CategoryInputProps {
  onCategoriesChange: (categories: string[]) => void;
  onGenerate: (categories: string[]) => void;
  isGenerating: boolean;
  roomId: string;
  inputValue?: string;
  onInputValueChange?: (value: string) => void;
}

export function CategoryInput({ onCategoriesChange, onGenerate, isGenerating, roomId, inputValue: externalInputValue, onInputValueChange }: CategoryInputProps) {
  const [internalInputValue, setInternalInputValue] = useState('');
  const inputValue = externalInputValue !== undefined ? externalInputValue : internalInputValue;
  const setInputValue = onInputValueChange || setInternalInputValue;
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Debounced suggestions
  useEffect(() => {
    if (suggestAbortRef.current) {
      suggestAbortRef.current.abort();
    }
    const controller = new AbortController();
    suggestAbortRef.current = controller;

    const id = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        if (!roomId) {
          setSuggestions([]);
        } else {
          const url = `/parties/room/${encodeURIComponent(roomId)}/suggest-category?q=${encodeURIComponent(inputValue)}`;
          const resp = await fetch(url, { signal: controller.signal });
          const data = await resp.json().catch(() => ({ suggestions: [] }));
          setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        }
      } catch (_) {
        // ignore
      } finally {
        setIsSuggesting(false);
      }
    }, 200);

    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [inputValue, roomId]);

  // Best inline completion that starts with typed text
  const bestSuggestion = (() => {
    if (!inputValue) return '';
    const lower = inputValue.toLowerCase();
    const candidate = suggestions.find(s => s.toLowerCase().startsWith(lower));
    return candidate || '';
  })();
  const remainder = bestSuggestion ? bestSuggestion.slice(inputValue.length) : '';

  const acceptInlineSuggestion = () => {
    if (bestSuggestion) {
      setInputValue(bestSuggestion);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const selectSuggestionByIndex = (index: number) => {
    if (index >= 0 && index < suggestions.length) {
      selectSuggestion(suggestions[index]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
      if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        e.stopPropagation();
        selectSuggestionByIndex(selectedIndex);
        return;
      }
    }
    
    if (e.key === 'Tab' || e.key === 'ArrowRight') {
      if (remainder) {
        e.preventDefault();
        e.stopPropagation();
        acceptInlineSuggestion();
        return;
      }
    }
    if (e.key === 'Enter') {
      // Enter always submits (generate), it does NOT accept the suggestion
      e.preventDefault();
      e.stopPropagation();
      handleGenerate();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleGenerate = () => {
    const category = inputValue.trim();
    if (category.length === 0) return;
    onCategoriesChange([category]);
    onGenerate([category]);
    setShowDropdown(false);
  };

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Auto-scroll to selected item within dropdown only
  useEffect(() => {
    if (selectedItemRef.current && dropdownRef.current) {
      const selectedElement = selectedItemRef.current;
      const dropdownElement = dropdownRef.current;
      
      const selectedRect = selectedElement.getBoundingClientRect();
      const dropdownRect = dropdownElement.getBoundingClientRect();
      
      // Calculate if the selected item is outside the dropdown's visible area
      const isAbove = selectedRect.top < dropdownRect.top;
      const isBelow = selectedRect.bottom > dropdownRect.bottom;
      
      if (isAbove || isBelow) {
        // Calculate the scroll position within the dropdown container
        const itemOffsetTop = selectedElement.offsetTop;
        const dropdownScrollTop = dropdownElement.scrollTop;
        const dropdownHeight = dropdownElement.clientHeight;
        const itemHeight = selectedElement.offsetHeight;
        
        let newScrollTop;
        if (isAbove) {
          // Scroll to show the item at the top of the dropdown
          newScrollTop = itemOffsetTop;
        } else {
          // Scroll to show the item at the bottom of the dropdown
          newScrollTop = itemOffsetTop - dropdownHeight + itemHeight;
        }
        
        // Smooth scroll within the dropdown container only
        dropdownElement.scrollTo({
          top: newScrollTop,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  // Show dropdown when there are suggestions and input has focus
  const shouldShowDropdown = showDropdown && suggestions.length > 0 && inputValue.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <div className="relative flex items-center p-1.5 bg-card-dark/60 border border-border-muted/30 rounded-md h-[46.67px]">
            {/* Inline autocomplete: mask typed text, show remainder with identical typography */}
            {!!remainder && (
              <div className="absolute inset-0 pointer-events-none flex items-center">
                <span className="pl-4 text-base whitespace-pre select-none font-inherit leading-normal tracking-normal">
                  <span className="opacity-0">{inputValue}</span>
                  <span className="text-warm-cream/30">{remainder}</span>
                </span>
              </div>
            )}
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => {
                // Delay hiding to allow clicking on suggestions
                setTimeout(() => setShowDropdown(false), 150);
              }}
              placeholder={isGenerating ? "Generating questions..." : "Enter a category (e.g., Science)"}
              disabled={isGenerating}
              className="relative z-10 flex-1 bg-transparent text-warm-cream placeholder:text-warm-cream/60 border-none outline-none min-w-[120px] text-base pl-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              type="text"
              autoComplete="off"
            />
            {isSuggesting && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-warm-cream/60" />
            )}
          </div>
          
          {/* Suggestions Dropdown */}
          {shouldShowDropdown && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card-dark border border-border-muted/30 rounded-md shadow-lg">
              <div 
                ref={dropdownRef}
                className="max-h-48 overflow-y-auto custom-scrollbar"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
                }}
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    ref={index === selectedIndex ? selectedItemRef : null}
                    onClick={() => selectSuggestion(suggestion)}
                    className={`w-full px-3 py-2 text-left text-warm-cream hover:bg-border-muted/30 transition-colors text-sm flex items-center ${
                      index === selectedIndex ? 'bg-border-muted/30' : ''
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end sm:justify-start">
          <Button
            onClick={handleGenerate}
            disabled={inputValue.trim().length === 0 || isGenerating}
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
    </div>
  );
}
