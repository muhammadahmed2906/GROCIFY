'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Search } from 'lucide-react';
import { Recipe } from '@/lib/types';
import { RecipeDialog } from '@/components/shared/RecipeDialog';
import { findRecipe } from '@/ai/ai-recipe-finder';

export default function RecipeFinderPage() {
  const { toast } = useToast();
  const [dishName, setDishName] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);

  const handleFindRecipe = async () => {
    if (!dishName) {
      toast({ title: 'Missing Dish Name', description: 'Please enter a meal to find.', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await findRecipe({ dishName, numberOfPeople });
      if (result) {
        setRecipe({ name: dishName, ...result });
        setIsRecipeOpen(true);
      } else {
        toast({ title: "Recipe not found", description: `Couldn't find a recipe for ${dishName}.`, variant: 'destructive'});
      }
    } catch (error) {
      console.error("AI Error:", error)
      toast({ title: 'AI Error', description: 'Something went wrong while finding the recipe.', variant: 'destructive' });
    }

    setIsLoading(false);
  };

  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Recipe Finder</h1>
        <p className="text-muted-foreground">Looking for a specific recipe? Find it here.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Find a Recipe</CardTitle>
          <CardDescription>Enter a dish name and number of people.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dishName">Dish/Meal Name</Label>
            <Input 
              id="dishName" 
              placeholder="e.g., Lasagna"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFindRecipe()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="people" className="flex items-center gap-2"><Users className="h-4 w-4" /> Number of People</Label>
            <Input 
              id="people" 
              type="number"
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(Math.max(1, parseInt(e.target.value)))}
              min="1"
            />
          </div>
          <Button className="w-full !mt-6" onClick={handleFindRecipe} disabled={isLoading}>
            {isLoading ? 'Searching...' : <><Search className="mr-2 h-4 w-4" /> Find Recipe</>}
          </Button>
        </CardContent>
      </Card>

      <RecipeDialog recipe={recipe} isOpen={isRecipeOpen} onOpenChange={setIsRecipeOpen} />
    </div>
  );
}
