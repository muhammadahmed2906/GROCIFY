'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lightbulb, PlusCircle, Edit, RefreshCw, Trash2 } from 'lucide-react';
import { ITEM_UNITS } from '@/lib/constants';
import type { GroceryItem } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { getSmartGrocerySuggestions } from '@/ai/flows/ai-smart-grocery-suggestions';
import { useToast } from '@/hooks/use-toast';

const groceryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be greater than 0.'),
  unit: z.string().min(1, 'Unit is required.'),
});

function AddGroceryItemForm({ onFinished }: { onFinished: () => void }) {
  const { dispatch } = useApp();
  const form = useForm<z.infer<typeof groceryItemSchema>>({
    resolver: zodResolver(groceryItemSchema),
    defaultValues: { name: '', quantity: 1, unit: ITEM_UNITS[0] },
  });

  function onSubmit(values: z.infer<typeof groceryItemSchema>) {
    dispatch({ type: 'ADD_GROCERY_ITEM', payload: values });
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Item Name</FormLabel>
            <FormControl><Input placeholder="e.g., Apples" {...field} /></FormControl>
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
        <Button type="submit" className="w-full">Add to List</Button>
      </form>
    </Form>
  );
}

function EditGroceryItemForm({ item, onFinished }: { item: GroceryItem, onFinished: () => void }) {
    const { dispatch } = useApp();
    const form = useForm<z.infer<typeof groceryItemSchema>>({
      resolver: zodResolver(groceryItemSchema),
      defaultValues: item,
    });
  
    function onSubmit(values: z.infer<typeof groceryItemSchema>) {
      dispatch({ type: 'EDIT_GROCERY_ITEM', payload: { id: item.id, updates: values } });
      onFinished();
    }
  
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl><Input {...field} readOnly className="bg-muted" /></FormControl>
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
          <Button type="submit" className="w-full">Save Changes</Button>
        </form>
      </Form>
    );
  }

function GroceryListItem({ item }: { item: GroceryItem }) {
  const { dispatch } = useApp();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = () => {
    dispatch({ type: 'REMOVE_GROCERY_ITEM', payload: { id: item.id } });
  }

  return (
    <div className="flex items-center space-x-4 py-3">
      <Checkbox
        id={item.id}
        checked={item.purchased}
        onCheckedChange={() => dispatch({ type: 'TOGGLE_GROCERY_ITEM_PURCHASED', payload: { id: item.id } })}
        aria-label={`Mark ${item.name} as ${item.purchased ? 'not purchased' : 'purchased'}`}
      />
      <div className="flex-1">
        <label htmlFor={item.id} className={`font-medium transition-colors ${item.purchased ? 'line-through text-muted-foreground' : ''}`}>
          {item.name}
        </label>
        <p className={`text-sm transition-colors ${item.purchased ? 'text-muted-foreground/80' : 'text-muted-foreground'}`}>
          {item.quantity} {item.unit}
        </p>
      </div>
      <div className='flex items-center'>
        {!item.purchased && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className='font-headline'>Edit Item</DialogTitle></DialogHeader>
                <EditGroceryItemForm item={item} onFinished={() => setIsEditDialogOpen(false)} />
              </DialogContent>
            </Dialog>
        )}
        <Button variant="ghost" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 text-destructive/80" />
        </Button>
      </div>
    </div>
  );
}

function SmartSuggestions() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await getSmartGrocerySuggestions({ pastPurchases: state.pastPurchases });
      setSuggestions(result.suggestedItems);
    } catch (error) {
      console.error(error);
      toast({ title: "AI Error", description: "Could not fetch suggestions.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleAddSuggestion = (name: string) => {
    dispatch({ type: 'ADD_GROCERY_ITEM', payload: { name, quantity: 1, unit: 'pcs' } });
    toast({ title: 'Item Added', description: `${name} added to your list. You can edit the quantity and unit.` });
    setSuggestions(current => current.filter(s => s !== name));
  };
  
  useEffect(() => {
    if (state.pastPurchases.length > 0) {
        fetchSuggestions();
    }
  }, []);

  return (
    <Card id="smart-suggestions">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className='flex items-center gap-3'>
                <Lightbulb className="w-6 h-6 text-primary" />
                <div>
                    <CardTitle className="font-headline">Smart Suggestions</CardTitle>
                    <CardDescription>AI-powered ideas for your list.</CardDescription>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchSuggestions} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && suggestions.length === 0 && <p className="text-sm text-muted-foreground">Thinking...</p>}
        {!isLoading && suggestions.length === 0 && <p className="text-sm text-muted-foreground">No suggestions right now. Try again!</p>}
        <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
            <Button key={index} variant="outline" size="sm" onClick={() => handleAddSuggestion(suggestion)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {suggestion}
            </Button>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function GroceryListPage() {
  const { state } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const toBuyItems = state.groceryList.filter(item => !item.purchased);
  const purchasedItems = state.groceryList.filter(item => item.purchased);

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Grocery List</h1>
          <p className="text-muted-foreground">Plan your next shopping trip.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-headline">Add Item to Grocery List</DialogTitle></DialogHeader>
            <AddGroceryItemForm onFinished={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <SmartSuggestions />
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold font-headline mb-2">To Buy ({toBuyItems.length})</h2>
          <Card>
            <CardContent className="p-4 divide-y">
              {toBuyItems.length > 0 ? (
                toBuyItems.map(item => <GroceryListItem key={item.id} item={item} />)
              ) : (
                <p className="py-4 text-center text-muted-foreground">Nothing to buy!</p>
              )}
            </CardContent>
          </Card>
        </section>

        {purchasedItems.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold font-headline mb-2">Purchased ({purchasedItems.length})</h2>
            <Card>
              <CardContent className="p-4 divide-y">
                {purchasedItems.map(item => <GroceryListItem key={item.id} item={item} />)}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
