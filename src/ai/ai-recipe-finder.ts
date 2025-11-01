'use server';

/**
 * @fileOverview A recipe finder AI agent.
 *
 * - findRecipe - A function that handles the recipe finding process.
 * - FindRecipeInput - The input type for the findRecipe function.
 * - FindRecipeOutput - The return type for the findRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindRecipeInputSchema = z.object({
  dishName: z.string().describe('The name of the dish/meal to find a recipe for.'),
  numberOfPeople: z.number().describe('The number of people the recipe should serve.'),
});
export type FindRecipeInput = z.infer<typeof FindRecipeInputSchema>;

const FindRecipeOutputSchema = z.object({
  ingredients: z.string().describe('A list of ingredients required for the recipe.'),
  instructions: z.string().describe('Cooking instructions for the recipe.'),
});
export type FindRecipeOutput = z.infer<typeof FindRecipeOutputSchema>;

export async function findRecipe(input: FindRecipeInput): Promise<FindRecipeOutput> {
  return findRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findRecipePrompt',
  input: {schema: FindRecipeInputSchema},
  output: {schema: FindRecipeOutputSchema},
  prompt: `You are an expert chef specializing in generating recipes.

You will generate a list of ingredients and cooking instructions for the specified dish, tailored to the specified number of people.

Dish Name: {{{dishName}}}
Number of People: {{{numberOfPeople}}}

Ingredients:
Instructions:`,
});

const findRecipeFlow = ai.defineFlow(
  {
    name: 'findRecipeFlow',
    inputSchema: FindRecipeInputSchema,
    outputSchema: FindRecipeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
