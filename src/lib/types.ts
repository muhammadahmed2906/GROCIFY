export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  purchased: boolean;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: Date | null;
}

export interface Recipe {
  name: string;
  ingredients: string;
  instructions: string;
}

export interface AppState {
  groceryList: GroceryItem[];
  pantry: PantryItem[];
  pastPurchases: string[];
}

export type Action =
  | { type: 'ADD_GROCERY_ITEM'; payload: Omit<GroceryItem, 'id' | 'purchased'> }
  | { type: 'EDIT_GROCERY_ITEM'; payload: { id: string; updates: Partial<Pick<GroceryItem, 'quantity' | 'unit'>> } }
  | { type: 'TOGGLE_GROCERY_ITEM_PURCHASED'; payload: { id: string } }
  | { type: 'REMOVE_GROCERY_ITEM'; payload: { id: string } }
  | { type: 'ADD_PANTRY_ITEM'; payload: Omit<PantryItem, 'id'> }
  | { type: 'EDIT_PANTRY_ITEM'; payload: { id: string; updates: Partial<PantryItem> } }
  | { type: 'REMOVE_PANTRY_ITEM'; payload: { id: string } }
  | { type: 'SET_STATE'; payload: AppState };
