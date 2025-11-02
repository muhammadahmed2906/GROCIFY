'use server';

/**
 * @fileOverview Generates a grocery list based on planned meals and existing pantry items.
 *
 * - generateGroceryList - A function that generates a grocery list based on meal plans and pantry.
 * - MealPlannerInput - The input type for the generateGroceryList function.
 * - MealPlannerOutput - The return type for the generateGroceryList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MealSchema = z.object({
  name: z.string().describe('Name of the meal or dish.'),
});

const PantryItemSchema = z.object({
  name: z.string().describe('Name of the pantry item.'),
  quantity: z.number().describe('Quantity of the item in the pantry.'),
  unit: z.string().describe('Unit of measurement for the pantry item (e.g., kg, l, pcs).'),
  selected: z.boolean().describe('Whether the item should be excluded from the grocery list.'),
});

const MealPlannerInputSchema = z.object({
  numberOfPeople: z.number().describe('The number of people the meals are being planned for.'),
  meals: z.array(MealSchema).describe('A list of meals planned.'),
  pantryItems: z.array(PantryItemSchema).describe('A list of existing pantry items with their quantities and units.'),
});
export type MealPlannerInput = z.infer<typeof MealPlannerInputSchema>;

const GroceryItemSchema = z.object({
  name: z.string().describe('Name of the grocery item.'),
  quantity: z.number().describe('Quantity of the grocery item needed.'),
  unit: z.string().describe('Unit of measurement for the grocery item (e.g., kg, l, pcs).'),
});

const MealPlannerOutputSchema = z.object({
  groceryList: z.array(GroceryItemSchema).describe('A list of grocery items needed for the planned meals, accounting for pantry items.'),
});
export type MealPlannerOutput = z.infer<typeof MealPlannerOutputSchema>;

export async function generateGroceryList(input: MealPlannerInput): Promise<MealPlannerOutput> {
  return mealPlannerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mealPlannerPrompt',
  input: {schema: MealPlannerInputSchema},
  output: {schema: MealPlannerOutputSchema},
  prompt: `You are a helpful assistant that generates a grocery list based on planned meals and the number of people they are for, while taking into account existing pantry items.

  Number of People: {{numberOfPeople}}

  Meals:
  {{#each meals}}
  - {{name}}
  {{/each}}

  Pantry Items:
  {{#each pantryItems}}
  - {{name}} (Quantity: {{quantity}} {{unit}}) - exclude: {{selected}}
  {{/each}}

  Generate a grocery list with the necessary items and quantities, considering the pantry items. If a pantry item is selected to be excluded, reduce the item quantity appropriately.
  `,
});

const mealPlannerFlow = ai.defineFlow(
  {
    name: 'mealPlannerFlow',
    inputSchema: MealPlannerInputSchema,
    outputSchema: MealPlannerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
