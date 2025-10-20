import React, { useState, type ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuestionItem } from './QuestionItem';
import { Text } from './ui/text';
import type { Question } from '../types';

interface QuestionListProps {
  questions: Question[];
  onReorder: (oldIndex: number, newIndex: number) => void;
  onRemove: (questionId: string) => void;
  rightActions?: ReactNode;
}

function SortableQuestionItem({ 
  question, 
  isExpanded, 
  onToggleExpand, 
  onRemove 
}: {
  question: Question;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} key={question.id}>
      <QuestionItem
        question={question}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onRemove={onRemove}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function QuestionList({ questions, onReorder, onRemove, rightActions }: QuestionListProps) {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  const handleToggleExpand = (questionId: string) => {
    setExpandedQuestionId(expandedQuestionId === questionId ? null : questionId);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <Text variant="large" className="text-warm-cream/60 mb-2">
          No questions yet
        </Text>
        <Text className="text-warm-cream/40">
          Add categories above and generate questions to get started
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Text variant="large" className="text-warm-cream">
          Questions ({questions.length})
        </Text>
        {rightActions}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questions.map(q => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {questions.map((question) => (
              <SortableQuestionItem
                key={question.id}
                question={question}
                isExpanded={expandedQuestionId === question.id}
                onToggleExpand={() => handleToggleExpand(question.id)}
                onRemove={() => onRemove(question.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
