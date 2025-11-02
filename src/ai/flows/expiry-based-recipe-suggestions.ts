'use server';

/**
 * @fileOverview This file implements the Genkit flow for suggesting recipes based on items nearing expiry in the user's pantry.
 *
 * - suggestRecipesFromExpiringItems - A function that suggests recipes based on expiring pantry items.
 * - SuggestRecipesFromExpiringItemsInput - The input type for the suggestRecipesFromExpiringItems function.
 * - SuggestRecipesFromExpiringItemsOutput - The return type for the suggestRecipesFromExpiringItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRecipesFromExpiringItemsInputSchema = z.object({
  expiringItems: z.array(
    z.object({
      name: z.string().describe('The name of the expiring item.'),
      quantity: z.number().describe('The quantity of the expiring item.'),
      unit: z.string().describe('The unit of measurement for the expiring item.'),
    })
  ).describe('A list of items in the pantry that are nearing their expiry dates.'),
  numberOfPeople: z.number().describe('The number of people the recipe should serve.'),
});

export type SuggestRecipesFromExpiringItemsInput = z.infer<typeof SuggestRecipesFromExpiringItemsInputSchema>;

const SuggestRecipesFromExpiringItemsOutputSchema = z.array(
  z.object({
    name: z.string().describe('The name of the suggested recipe.'),
    ingredients: z.string().describe('A list of ingredients required for the recipe, including quantities.'),
    instructions: z.string().describe('Step-by-step instructions for preparing the recipe.'),
  })
).describe('A list of recipes that utilize the expiring items.');

export type SuggestRecipesFromExpiringItemsOutput = z.infer<typeof SuggestRecipesFromExpiringItemsOutputSchema>;

export async function suggestRecipesFromExpiringItems(input: SuggestRecipesFromExpiringItemsInput): Promise<SuggestRecipesFromExpiringItemsOutput> {
  return suggestRecipesFromExpiringItemsFlow(input);
}

const suggestRecipesFromExpiringItemsPrompt = ai.definePrompt({
  name: 'suggestRecipesFromExpiringItemsPrompt',
  input: {schema: SuggestRecipesFromExpiringItemsInputSchema},
  output: {schema: SuggestRecipesFromExpiringItemsOutputSchema},
  prompt: `You are a chef specializing in creating recipes that utilize ingredients that are about to expire, minimizing food waste.  Given a list of expiring items from a user's pantry, suggest recipes that prominently feature these ingredients. Provide detailed ingredients and cooking instructions tailored to the specified number of people.

Expiring Items:
{{{expiringItems}}}

Number of People: {{{numberOfPeople}}}

Recipes:`,
});

const suggestRecipesFromExpiringItemsFlow = ai.defineFlow(
  {
    name: 'suggestRecipesFromExpiringItemsFlow',
    inputSchema: SuggestRecipesFromExpiringItemsInputSchema,
    outputSchema: SuggestRecipesFromExpiringItemsOutputSchema,
  },
  async input => {
    const {output} = await suggestRecipesFromExpiringItemsPrompt(input);
    return output!;
  }
);
