'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, isBefore, addDays, differenceInDays } from 'date-fns';
import { CalendarIcon, ChefHat, BrainCircuit, PlusCircle, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ITEM_UNITS } from '@/lib/constants';
import type { PantryItem, Recipe } from '@/lib/types';
import { suggestRecipesFromExpiringItems } from '@/ai/ai-pantry-suggestion';
import { useToast } from '@/hooks/use-toast';
import { RecipeDialog } from '@/components/shared/RecipeDialog';

const pantryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be greater than 0.'),
  unit: z.string().min(1, 'Unit is required.'),
  expiryDate: z.date().nullable(),
});

function PantryItemForm({ item, onFinished }: { item?: PantryItem, onFinished: () => void }) {
  const { dispatch } = useApp();
  const form = useForm<z.infer<typeof pantryItemSchema>>({
    resolver: zodResolver(pantryItemSchema),
    defaultValues: item ? { ...item, expiryDate: item.expiryDate ? new Date(item.expiryDate) : null } : { name: '', quantity: 1, unit: ITEM_UNITS[0], expiryDate: null },
  });

  function onSubmit(values: z.infer<typeof pantryItemSchema>) {
    if (item) {
      dispatch({ type: 'EDIT_PANTRY_ITEM', payload: { id: item.id, updates: values } });
    } else {
      dispatch({ type: 'ADD_PANTRY_ITEM', payload: values });
    }
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Item Name</FormLabel>
            <FormControl><Input placeholder="e.g., Flour" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex gap-4">
          <FormField control={form.control} name="quantity" render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Quantity</FormLabel>
              <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="unit" render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Unit</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select a unit" /></SelectTrigger></FormControl>
                <SelectContent>
                  {ITEM_UNITS.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="expiryDate" render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Expiry Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} initialFocus />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full">{item ? 'Save Changes' : 'Add Item'}</Button>
      </form>
    </Form>
  );
}

function RecipeSuggestionDialog({ recipes, isOpen, onOpenChange, onSelectRecipe }: { recipes: Recipe[] | null, isOpen: boolean, onOpenChange: (isOpen: boolean) => void, onSelectRecipe: (recipe: Recipe) => void }) {
  if (!recipes) return null;

  const handleSelect = (recipe: Recipe) => {
    onSelectRecipe(recipe);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suggested Recipes</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {recipes.map((recipe, index) => (
            <Button key={index} variant="outline" className="w-full justify-start" onClick={() => handleSelect(recipe)}>
              {recipe.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AISection() {
  const { state } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[] | null>(null);
  const [isSuggestionListOpen, setIsSuggestionListOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);

  const expiringItems = state.pantry.filter(item => item.expiryDate && isBefore(item.expiryDate, addDays(new Date(), 30)));
  const allPantryItems = state.pantry;
  
  const handleSuggest = async (items: PantryItem[], type: 'expiring' | 'all') => {
    if (items.length === 0) {
      toast({ title: 'No Items', description: `There are no ${type === 'expiring' ? 'expiring' : ''} items to suggest recipes for.`, variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const input = {
        expiringItems: items.map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit })),
        numberOfPeople: 2,
      };
      const result = await suggestRecipesFromExpiringItems(input);
      if (result && result.recipes && result.recipes.length > 0) {
        setSuggestedRecipes(result.recipes);
        setIsSuggestionListOpen(true);
      } else {
        toast({ title: 'No Recipes Found', description: 'Our AI chef couldn\'t find a recipe for these items.' });
      }
    } catch (error) {
      console.error('AI Error:', error);
      toast({ title: 'AI Error', description: 'Something went wrong while suggesting recipes.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card id="use-it-or-lose-it">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ChefHat className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="font-headline">Use It or Lose It</CardTitle>
                <CardDescription>Recipes for items expiring soon.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => handleSuggest(expiringItems, 'expiring')} disabled={isLoading}>
              {isLoading ? 'Thinking...' : `Suggest from ${expiringItems.length} items`}
            </Button>
          </CardContent>
        </Card>
        <Card id="pantry-genius">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-accent" />
              <div>
                <CardTitle className="font-headline">Pantry Genius</CardTitle>
                <CardDescription>What can you make right now?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full" onClick={() => handleSuggest(allPantryItems, 'all')} disabled={isLoading}>
              {isLoading ? 'Thinking...' : 'Find Recipe'}
            </Button>
          </CardContent>
        </Card>
      </div>
      <RecipeSuggestionDialog 
        recipes={suggestedRecipes} 
        isOpen={isSuggestionListOpen} 
        onOpenChange={setIsSuggestionListOpen} 
        onSelectRecipe={(recipe) => {
          setSelectedRecipe(recipe);
          setIsRecipeOpen(true);
        }}
      />
      <RecipeDialog recipe={selectedRecipe} isOpen={isRecipeOpen} onOpenChange={setIsRecipeOpen} />
    </>
  );
}

export default function MyPantryPage() {
  const { state, dispatch } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | undefined>(undefined);

  const getRowClass = (item: PantryItem) => {
    if (!item.expiryDate) return '';
    const today = new Date();
    if (isBefore(item.expiryDate, today)) return 'bg-destructive/20 hover:bg-destructive/30';
    if (isBefore(item.expiryDate, addDays(today, 15))) return 'bg-destructive/10 hover:bg-destructive/20';
    return '';
  };
  
  const getExpiryText = (item: PantryItem) => {
    if (!item.expiryDate) return <span className="text-muted-foreground">N/A</span>;
    const diff = differenceInDays(item.expiryDate, new Date());
    if (diff < 0) return <span className="text-destructive font-semibold">Expired {-diff}d ago</span>;
    if (diff <= 30) return <span className="text-destructive/80 font-medium">Expires in {diff}d</span>;
    return format(item.expiryDate, 'PP');
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight" id="expiry-alert">My Pantry</h1>
          <p className="text-muted-foreground">Your current kitchen inventory.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-headline">Add to Pantry</DialogTitle>
            </DialogHeader>
            <PantryItemForm onFinished={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      <AISection />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.pantry.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Your pantry is empty.</TableCell></TableRow>
              ) : (
                state.pantry.map(item => (
                  <TableRow key={item.id} className={getRowClass(item)}>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.quantity} {item.unit}</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{getExpiryText(item)}</TableCell>
                    <TableCell className="text-right">
                      <Dialog open={editingItem?.id === item.id} onOpenChange={(isOpen) => !isOpen && setEditingItem(undefined)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}><Edit className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle className="font-headline">Edit Pantry Item</DialogTitle></DialogHeader>
                          <PantryItemForm item={item} onFinished={() => setEditingItem(undefined)} />
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'REMOVE_PANTRY_ITEM', payload: { id: item.id } })}>
                        <Trash2 className="h-4 w-4 text-destructive/80" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
