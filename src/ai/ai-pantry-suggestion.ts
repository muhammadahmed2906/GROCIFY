'use server';

/**
 * @fileOverview Pantry suggestion AI agent.
 *
 * - suggestRecipesFromExpiringItems - A function that handles the recipe suggestion process.
 * - SuggestRecipesFromExpiringItemsInput - The input type for the suggestRecipesFromExpiringItems function.
 * - SuggestRecipesFromExpiringItemsOutput - The return type for the suggestRecipesFromExpiringItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRecipesFromExpiringItemsInputSchema = z.object({
  expiringItems: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
  })).describe('A list of expiring items in the pantry.'),
  numberOfPeople: z.number().describe('The number of people the recipe should serve.'),
});
export type SuggestRecipesFromExpiringItemsInput = z.infer<typeof SuggestRecipesFromExpiringItemsInputSchema>;

const RecipeSchema = z.object({
  name: z.string().describe('The name of the dish/meal.'),
  ingredients: z.string().describe('A list of ingredients required for the recipe. Each ingredient should be on a new line.'),
  instructions: z.string().describe('Cooking instructions for the recipe. Each step should be on a new line and should not be numbered.'),
});

const SuggestRecipesFromExpiringItemsOutputSchema = z.object({
  recipes: z.array(RecipeSchema).describe('A list of recipes that can be made from the expiring items.'),
});
export type SuggestRecipesFromExpiringItemsOutput = z.infer<typeof SuggestRecipesFromExpiringItemsOutputSchema>;

export async function suggestRecipesFromExpiringItems(input: SuggestRecipesFromExpiringItemsInput): Promise<SuggestRecipesFromExpiringItemsOutput> {
  return suggestRecipesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRecipesPrompt',
  input: {schema: SuggestRecipesFromExpiringItemsInputSchema},
  output: {schema: SuggestRecipesFromExpiringItemsOutputSchema},
  prompt: `You are an expert chef who provides recipes based on expiring items.
For the given list of expiring items and number of people, provide a list of recipes that can be made.

- List each ingredient on a new line.
- List each instruction on a new line.
- Do not number the instructions.
- Do not add any introductory or concluding text.

Expiring Items:
{{#each expiringItems}}
- {{this.quantity}} {{this.unit}} of {{this.name}}
{{/each}}
Number of People: {{numberOfPeople}}

Recipes:`,
});

const suggestRecipesFlow = ai.defineFlow(
  {
    name: 'suggestRecipesFlow',
    inputSchema: SuggestRecipesFromExpiringItemsInputSchema,
    outputSchema: SuggestRecipesFromExpiringItemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
