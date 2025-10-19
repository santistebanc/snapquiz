import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import OpenAI from 'openai';
import type { Question } from '../types';

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
  existingQuestions: Question[],
  apiKey: string
): Promise<Question[]> {
  console.log('generateQuestions called with categories:', categories);
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const categoryText = categories.join(', ');
  const existingTexts = existingQuestions.map(q => q.text.toLowerCase());

  // Try Vercel AI SDK first, fallback to direct OpenAI if it fails
  try {
    console.log('Trying Vercel AI SDK...');
    const openai = createOpenAI({
      apiKey: apiKey,
    });

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: QuestionsResponseSchema,
      prompt: `Generate 5 unique quiz questions about ${categoryText}. 
Each question should have:
- A clear, engaging question text
- 4 multiple choice options (provide only the text content, no letters like A, B, C, D)
- One correct answer (the full text of the correct option, not the letter)
- A relevant category from: ${categoryText}

IMPORTANT: The options array should contain only the text content of each option, without any letter prefixes like "A.", "B.", etc.

Make sure questions are unique and not similar to these existing questions: ${existingTexts.join(', ')}`,
      temperature: 0.7,
    });

    console.log('Vercel AI SDK succeeded, processing questions...');
    
    // Validate and format the questions
    const formattedQuestions: Question[] = object.questions.map((q, index: number) => ({
      id: `generated-${Date.now()}-${index}`,
      text: q.text,
      category: q.category,
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

    return uniqueQuestions;
  } catch (vercelError) {
    console.log('Vercel AI SDK failed, falling back to direct OpenAI:', vercelError instanceof Error ? vercelError.message : String(vercelError));
    
    // Fallback to direct OpenAI implementation
    try {
      const openai = new OpenAI({
        apiKey: apiKey,
      });

      const prompt = `Generate 5 unique quiz questions about ${categoryText}. 
Each question should have:
- A clear, engaging question text
- 4 multiple choice options (provide only the text content, no letters like A, B, C, D)
- One correct answer (the full text of the correct option, not the letter)
- A relevant category from: ${categoryText}

IMPORTANT: The options array should contain only the text content of each option, without any letter prefixes like "A.", "B.", etc.

Format as JSON array:
[
  {
    "text": "Question text here?",
    "category": "Category name",
    "options": ["First option text", "Second option text", "Third option text", "Fourth option text"],
    "answer": "Second option text"
  }
]

Make sure questions are unique and not similar to these existing questions: ${existingTexts.join(', ')}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a quiz question generator. Always respond with valid JSON only, no additional text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const generatedQuestions = JSON.parse(responseText);
      
      // Validate and format the questions
      const formattedQuestions: Question[] = generatedQuestions.map((q: any, index: number) => ({
        id: `generated-${Date.now()}-${index}`,
        text: q.text,
        category: q.category,
        options: q.options,
        answer: q.answer, // Direct text answer
        revealedQuestion: false,
        openOptions: false,
      }));

      // Filter out duplicates by checking text similarity
      const uniqueQuestions = formattedQuestions.filter(newQ => 
        !existingTexts.some(existingText => 
          calculateSimilarity(newQ.text.toLowerCase(), existingText) > 0.8
        )
      );

      return uniqueQuestions;
    } catch (fallbackError) {
      console.error('Both Vercel AI and OpenAI fallback failed:', fallbackError);
      throw new Error('Failed to generate questions. Please try again.');
    }
  }
}

// Simple similarity calculation using Jaccard similarity
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

