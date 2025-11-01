'use server';

/**
 * @fileOverview AI-powered smart grocery suggestions based on user's past purchases.
 *
 * This file exports:
 * - `getSmartGrocerySuggestions` - A function to retrieve AI-powered grocery suggestions.
 * - `SmartGrocerySuggestionsInput` - The input type for the `getSmartGrocerySuggestions` function.
 * - `SmartGrocerySuggestionsOutput` - The output type for the `getSmartGrocerySuggestions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartGrocerySuggestionsInputSchema = z.object({
  pastPurchases: z
    .array(z.string())
    .describe('An array of the user past purchased grocery items.'),
});
export type SmartGrocerySuggestionsInput = z.infer<
  typeof SmartGrocerySuggestionsInputSchema
>;

const SmartGrocerySuggestionsOutputSchema = z.object({
  suggestedItems: z
    .array(z.string())
    .describe('An array of grocery items suggested by the AI.'),
});
export type SmartGrocerySuggestionsOutput = z.infer<
  typeof SmartGrocerySuggestionsOutputSchema
>;

export async function getSmartGrocerySuggestions(
  input: SmartGrocerySuggestionsInput
): Promise<SmartGrocerySuggestionsOutput> {
  return smartGrocerySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartGrocerySuggestionsPrompt',
  input: {schema: SmartGrocerySuggestionsInputSchema},
  output: {schema: SmartGrocerySuggestionsOutputSchema},
  prompt: `You are a helpful AI assistant that suggests grocery items based on a user's past purchases.

Given the following list of past purchases, suggest grocery items that the user might want to add to their grocery list.

Past Purchases:
{{#each pastPurchases}}- {{this}}\n{{/each}}

Suggested Items:`, 
});

const smartGrocerySuggestionsFlow = ai.defineFlow(
  {
    name: 'smartGrocerySuggestionsFlow',
    inputSchema: SmartGrocerySuggestionsInputSchema,
    outputSchema: SmartGrocerySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
