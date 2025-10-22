import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import type { Question } from '../types';
import { generateAudioWithTimestamps } from './generateAudio';

// Define the schema for structured output
const QuestionSchema = z.object({
  text: z.string().describe('The question text'),
  category: z.string().describe('The category of the question'),
  options: z.array(z.string()).length(4).describe('Four multiple choice options'),
  answer: z.string().describe('The correct answer text (must match one of the options)'),
});

const QuestionsResponseSchema = z.object({
  questions: z.array(QuestionSchema).length(5).describe('Array of 5 quiz questions'),
});

// This will be called from the server side with PartyKit environment
export async function generateQuestions(
  categories: string[],
  existingQuestions: Question[]
): Promise<Question[]> {
  console.log('generateQuestions called with categories:', categories);

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const singleCategory = (categories[0] || '').trim();
  const categoryText = singleCategory || categories.join(', ');
  const existingTexts = existingQuestions.map(q => q.text.toLowerCase());

  console.log('Generating questions with Vercel AI SDK...');
  const openai = createOpenAI({
    apiKey: apiKey,
  });

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: QuestionsResponseSchema,
    prompt: `Generate 5 unique quiz questions strictly in the category "${categoryText}".
Each question must have:
- A clear, engaging question text
- 4 multiple choice options (provide only the text content, no letters like A, B, C, D)
- One correct answer (the full text of the correct option, not the letter)
- The field "category" set EXACTLY to "${categoryText}" for every question (do not invent or substitute another category)

IMPORTANT:
- The options array should contain only the text content of each option, without any letter prefixes like "A.", "B.", etc.
- Do not create new categories. Use exactly "${categoryText}" as category for all questions.

Make sure questions are unique and not similar to these existing questions: ${existingTexts.join(', ')}`,
    temperature: 0.7,
  });

  console.log('Questions generated successfully, processing...');

  // Validate and format the questions (force category to the exact requested one)
  const formattedQuestions: Question[] = object.questions.map((q, index: number) => ({
    id: `generated-${Date.now()}-${index}`,
    text: q.text,
    category: categoryText,
    options: q.options,
    answer: q.answer, // Direct text answer from structured output
    revealedQuestion: false,
    openOptions: false,
  }));

  // Filter out duplicates by checking text similarity
  const uniqueQuestions = formattedQuestions.filter(newQ =>
    !existingTexts.some(existingText =>
      calculateSimilarity(newQ.text.toLowerCase(), existingText) > 0.8
    )
  );

  // Generate audio with timestamps for each question
  console.log('Generating audio for questions with UnrealSpeech...');
  const questionsWithAudio = await Promise.all(
    uniqueQuestions.map(async (question) => {
      try {
        const { audioUrl, wordTimestamps } = await generateAudioWithTimestamps(
          question.text
        );
        return {
          ...question,
          audioUrl,
          wordTimestamps,
        };
      } catch (error) {
        console.error(`Failed to generate audio for question: ${question.text}`, error);
        return question; // Return question without audio if generation fails
      }
    })
  );
  console.log('Audio generated successfully', questionsWithAudio[0]);
  return questionsWithAudio;
}

// Simple similarity calculation using Jaccard similarity
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

