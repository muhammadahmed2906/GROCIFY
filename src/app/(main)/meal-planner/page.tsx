'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Users } from 'lucide-react';
import { generateGroceryList, type MealPlannerOutput } from '@/ai/ai-meal-planner-grocery-list';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function MealPlannerPage() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [meals, setMeals] = useState<string[]>(['Chicken Alfredo', 'Taco Salad']);
  const [newMeal, setNewMeal] = useState('');
  const [selectedPantryItems, setSelectedPantryItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [generatedList, setGeneratedList] = useState<MealPlannerOutput['groceryList']>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddMeal = () => {
    if (newMeal.trim()) {
      setMeals([...meals, newMeal.trim()]);
      setNewMeal('');
    }
  };
  
  const handleRemoveMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index));
  };

  const handlePantryItemToggle = (itemId: string) => {
    const newSelection = new Set(selectedPantryItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedPantryItems(newSelection);
  };
  
  const handleSelectAllPantry = (checked: boolean) => {
    if (checked) {
      setSelectedPantryItems(new Set(state.pantry.map(item => item.id)));
    } else {
      setSelectedPantryItems(new Set());
    }
  };
  
  const handleGenerate = async () => {
    if (meals.length === 0) {
      toast({
        title: 'No Meals Planned',
        description: 'Please add at least one meal to generate a grocery list.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const pantryItemsForAI = state.pantry.map(item => ({
        ...item,
        selected: selectedPantryItems.has(item.id),
      }));

      const result = await generateGroceryList({
        numberOfPeople,
        meals: meals.map(name => ({ name })),
        pantryItems: pantryItemsForAI,
      });

      if (result.groceryList && result.groceryList.length > 0) {
        setGeneratedList(result.groceryList);
        setIsDialogOpen(true);
      } else {
        toast({
            title: 'List is Empty',
            description: 'The AI could not generate any items for your list.',
        });
      }
    } catch (error) {
      console.error('AI Error:', error);
      toast({
        title: 'AI Error',
        description: 'Could not generate grocery list.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGeneratedItem = (itemToAdd: MealPlannerOutput['groceryList'][0]) => {
    dispatch({ type: 'ADD_GROCERY_ITEM', payload: itemToAdd });
    setGeneratedList(prevList => prevList.filter(item => item.name !== itemToAdd.name));
    toast({
        title: 'Item Added',
        description: `${itemToAdd.name} has been added to your grocery list.`,
    });
  };

  const handleAddAllGenerated = () => {
    generatedList.forEach(item => {
        dispatch({ type: 'ADD_GROCERY_ITEM', payload: item });
    });
    toast({
        title: 'All Items Added',
        description: `${generatedList.length} items have been added to your grocery list.`,
    });
    setIsDialogOpen(false);
    setGeneratedList([]);
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Meal Planner</h1>
        <p className="text-muted-foreground">Generate a grocery list from your meal ideas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Inputs */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">1. Plan Your Meals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="people" className="flex items-center gap-2"><Users className="h-4 w-4" /> Number of People</Label>
                <Input id="people" type="number" value={numberOfPeople} onChange={e => setNumberOfPeople(Math.max(1, parseInt(e.target.value)))} min="1" />
              </div>
              <div className="space-y-2">
                <Label>Meals/Dishes</Label>
                <div className="space-y-2">
                  {meals.map((meal, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={meal} readOnly className="bg-muted" />
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveMeal(index)}><Trash2 className="h-4 w-4 text-destructive/80" /></Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Input 
                    placeholder="Add a new meal" 
                    value={newMeal} 
                    onChange={e => setNewMeal(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleAddMeal()}
                  />
                  <Button onClick={handleAddMeal}><PlusCircle className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Pantry & Generation */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">2. Check Your Pantry</CardTitle>
              <CardDescription>Select items you already have.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox id="select-all" onCheckedChange={(checked) => handleSelectAllPantry(!!checked)} />
                <Label htmlFor="select-all">Select All</Label>
              </div>
              <ScrollArea className="h-48 rounded-md border p-4">
                {state.pantry.length > 0 ? (
                  state.pantry.map(item => (
                    <div key={item.id} className="flex items-center space-x-2 mb-2">
                      <Checkbox 
                        id={`pantry-${item.id}`} 
                        checked={selectedPantryItems.has(item.id)}
                        onCheckedChange={() => handlePantryItemToggle(item.id)}
                      />
                      <Label htmlFor={`pantry-${item.id}`} className="flex-1">{item.name} <span className="text-muted-foreground">({item.quantity} {item.unit})</span></Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-center text-muted-foreground">Your pantry is empty.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
          
          <Button className="w-full text-lg py-6" onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Grocery List'}
          </Button>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
                <DialogTitle className="font-headline">Generated Grocery List</DialogTitle>
                <DialogDescription>Click on items to add them to your main list, or add all at once.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[50vh] pr-4 -mr-4">
                <div className="space-y-2">
                    {generatedList.length > 0 ? generatedList.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                            <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{item.quantity} {item.unit}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleAddGeneratedItem(item)}>
                                <PlusCircle className="h-5 w-5 text-primary" />
                            </Button>
                        </div>
                    )) : <p className="text-sm text-center text-muted-foreground py-4">All items have been added.</p>}
                </div>
            </ScrollArea>
            {generatedList.length > 0 && (
                <Button onClick={handleAddAllGenerated} className="mt-4 w-full">Add All to List</Button>
            )}
          </DialogContent>
      </Dialog>
    </div>
  );
}
