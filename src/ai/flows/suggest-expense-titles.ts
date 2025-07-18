'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting expense titles based on transaction amount and recent titles.
 *
 * - suggestExpenseTitles - A function that suggests expense titles based on the input.
 * - SuggestExpenseTitlesInput - The input type for the suggestExpenseTitles function.
 * - SuggestExpenseTitlesOutput - The output type for the suggestExpenseTitles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestExpenseTitlesInputSchema = z.object({
  transactionAmount: z.number().describe('The amount of the transaction.'),
  recentTitles: z.array(z.string()).describe('A list of recently used expense titles.'),
  userInput: z.string().describe('The user input so far for the expense title.'),
});
export type SuggestExpenseTitlesInput = z.infer<typeof SuggestExpenseTitlesInputSchema>;

const SuggestExpenseTitlesOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of suggested expense titles.'),
});
export type SuggestExpenseTitlesOutput = z.infer<typeof SuggestExpenseTitlesOutputSchema>;

export async function suggestExpenseTitles(input: SuggestExpenseTitlesInput): Promise<SuggestExpenseTitlesOutput> {
  return suggestExpenseTitlesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestExpenseTitlesPrompt',
  input: {schema: SuggestExpenseTitlesInputSchema},
  output: {schema: SuggestExpenseTitlesOutputSchema},
  prompt: `You are an AI assistant that suggests expense titles to the user.

  Given the transaction amount, recent expense titles, and the user's current input, suggest a list of expense titles that the user might be looking for. Ensure the suggestions are relevant to the transaction amount and recent titles.

  Transaction Amount: {{{transactionAmount}}}
  Recent Titles: {{#each recentTitles}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  User Input: {{{userInput}}}

  Suggestions:
`,
});

const suggestExpenseTitlesFlow = ai.defineFlow(
  {
    name: 'suggestExpenseTitlesFlow',
    inputSchema: SuggestExpenseTitlesInputSchema,
    outputSchema: SuggestExpenseTitlesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
