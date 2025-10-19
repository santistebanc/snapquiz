import React, { useState, useRef, type KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CategoryInputProps {
  onCategoriesChange: (categories: string[]) => void;
  onGenerate: (categories: string[]) => void;
  isGenerating: boolean;
}

const predefinedCategories = [
  'Science', 'History', 'Geography', 'Sports', 'Movies', 
  'Music', 'Literature', 'Technology', 'Art', 'Food',
  'Nature', 'Space', 'Animals', 'Math', 'Language'
];

export function CategoryInput({ onCategoriesChange, onGenerate, isGenerating }: CategoryInputProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addCategory = (category: string) => {
    const trimmedCategory = category.trim();
    if (trimmedCategory && !categories.includes(trimmedCategory)) {
      const newCategories = [...categories, trimmedCategory];
      setCategories(newCategories);
      onCategoriesChange(newCategories);
      setInputValue('');
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    const newCategories = categories.filter(cat => cat !== categoryToRemove);
    setCategories(newCategories);
    onCategoriesChange(newCategories);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCategory(inputValue);
    }
  };

  const handleGenerate = () => {
    if (categories.length > 0) {
      onGenerate(categories);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="flex flex-wrap items-center gap-1 p-1.5 bg-card-dark/60 border border-border-muted/30 rounded-md h-[46.67px]">
            {categories.map((category) => (
              <div
                key={category}
                className="flex items-center gap-1 pl-2 pr-1 py-1 bg-warm-orange/20 border border-warm-orange/30 rounded-sm text-warm-cream"
              >
                <span className="text-base">{category}</span>
                <button
                  onClick={() => removeCategory(category)}
                  disabled={isGenerating}
                  className="hover:bg-warm-orange/40 rounded-full p-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isGenerating ? "Generating questions..." : categories.length === 0 ? "Enter categories (e.g., Science, History)..." : "Add more categories..."}
              disabled={isGenerating}
              className="flex-1 bg-transparent text-warm-cream placeholder:text-warm-cream/60 border-none outline-none min-w-[200px] text-base pl-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        
        <Button
          onClick={handleGenerate}
          disabled={categories.length === 0 || isGenerating}
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
  );
}
