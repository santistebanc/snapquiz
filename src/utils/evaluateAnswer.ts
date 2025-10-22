import type { Question } from '../types';

export async function evaluateAnswer(
    question: Question,
    playerAnswer: string,
    correctAnswer: string
): Promise<'correct' | 'wrong'> {
    const { createOpenAI } = await import('@ai-sdk/openai');
    const { generateObject } = await import('ai');
    const { z } = await import('zod');

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }

    const openai = createOpenAI({ apiKey });

    const EvaluationSchema = z.object({
        result: z.enum(['correct', 'wrong']).describe('Whether the answer is correct or wrong'),
    });

    const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: EvaluationSchema,
        prompt: `You are evaluating quiz answers. Determine if the player's answer is correct.

Question: "${question.text}"
Expected answer: "${correctAnswer}"
Player's answer: "${playerAnswer}"

Be lenient with spelling and phrasing variations, but ensure the core meaning matches. Return "correct" if the answer is right, "wrong" if it's not.`,
        temperature: 0,
    });
    return object.result;
}

