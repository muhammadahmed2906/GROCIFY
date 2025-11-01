'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import type { AppState, Action, GroceryItem, PantryItem } from './types';
import { addDays, subDays } from 'date-fns';

const initialState: AppState = {
  groceryList: [
    { id: 'g-1', name: 'Milk', quantity: 1, unit: 'l', purchased: false },
    { id: 'g-2', name: 'Bread', quantity: 1, unit: 'pack', purchased: false },
    { id: 'g-3', name: 'Eggs', quantity: 12, unit: 'pcs', purchased: true },
  ],
  pantry: [
    { id: 'p-1', name: 'Eggs', quantity: 12, unit: 'pcs', expiryDate: addDays(new Date(), 25) },
    { id: 'p-2', name: 'Chicken Breast', quantity: 500, unit: 'g', expiryDate: subDays(new Date(), 2) },
    { id: 'p-3', name: 'Tomatoes', quantity: 5, unit: 'pcs', expiryDate: addDays(new Date(), 5) },
    { id: 'p-4', name: 'Pasta', quantity: 1, unit: 'box', expiryDate: addDays(new Date(), 300) },
  ],
  pastPurchases: ['Eggs', 'Milk', 'Bread', 'Chicken Breast', 'Tomatoes', 'Pasta', 'Olive Oil', 'Garlic', 'Onions'],
};

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

const generateUniqueId = (prefix = '') => {
  // Uses the browser's built-in crypto API for generating a UUID.
  return `${prefix}${crypto.randomUUID()}`;
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
        return action.payload;
    
    case 'ADD_GROCERY_ITEM': {
      const newItem: GroceryItem = {
        ...action.payload,
        id: generateUniqueId('g-'),
        purchased: false,
      };
      return {
        ...state,
        groceryList: [...state.groceryList, newItem],
      };
    }

    case 'EDIT_GROCERY_ITEM': {
        return {
            ...state,
            groceryList: state.groceryList.map(item => 
                item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
            )
        }
    }

    case 'REMOVE_GROCERY_ITEM': {
        return {
            ...state,
            groceryList: state.groceryList.filter(item => item.id !== action.payload.id),
        };
    }

    case 'TOGGLE_GROCERY_ITEM_PURCHASED': {
      const { id } = action.payload;
      const groceryItem = state.groceryList.find(item => item.id === id);
      if (!groceryItem) return state;
    
      const isNowPurchased = !groceryItem.purchased;
    
      // Update the grocery list item's purchased status
      const updatedGroceryList = state.groceryList.map(item =>
        item.id === id ? { ...item, purchased: isNowPurchased } : item
      );
    
      let newPantry = [...state.pantry];
      let newPastPurchases = [...state.pastPurchases];
    
      const pantryItemIndex = newPantry.findIndex(p => p.name.toLowerCase() === groceryItem.name.toLowerCase() && p.unit.toLowerCase() === groceryItem.unit.toLowerCase());
    
      if (isNowPurchased) {
        // Item is marked as purchased, add/update it in the pantry
        if (pantryItemIndex > -1) {
          // Item exists, update its quantity
          const existingItem = newPantry[pantryItemIndex];
          newPantry[pantryItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + groceryItem.quantity,
          };
        } else {
          // Item does not exist, add it to the pantry
          newPantry.push({
            id: generateUniqueId('p-'),
            name: groceryItem.name,
            quantity: groceryItem.quantity,
            unit: groceryItem.unit,
            expiryDate: null,
          });
        }
    
        // Add to past purchases if not already there
        if (!newPastPurchases.some(p => p.toLowerCase() === groceryItem.name.toLowerCase())) {
          newPastPurchases.push(groceryItem.name);
        }
      } else {
        // Purchase is being undone, subtract quantity from pantry
        if (pantryItemIndex > -1) {
          const existingItem = newPantry[pantryItemIndex];
          const updatedQuantity = existingItem.quantity - groceryItem.quantity;
    
          if (updatedQuantity > 0) {
            newPantry[pantryItemIndex] = { ...existingItem, quantity: updatedQuantity };
          } else {
            // Remove the item if quantity is zero or less
            newPantry.splice(pantryItemIndex, 1);
          }
        }
      }
    
      return {
        ...state,
        groceryList: updatedGroceryList,
        pantry: newPantry,
        pastPurchases: newPastPurchases,
      };
    }
    
    case 'ADD_PANTRY_ITEM': {
      const { name, unit, quantity } = action.payload;
      const existingPantryItemIndex = state.pantry.findIndex(p => p.name.toLowerCase() === name.toLowerCase() && p.unit.toLowerCase() === unit.toLowerCase());
    
      if (existingPantryItemIndex > -1) {
        // Item exists, update quantity
        const updatedPantry = [...state.pantry];
        const existingItem = updatedPantry[existingPantryItemIndex];
        updatedPantry[existingPantryItemIndex] = { 
            ...existingItem, 
            quantity: existingItem.quantity + quantity,
            expiryDate: action.payload.expiryDate || existingItem.expiryDate,
        };
        return {
            ...state,
            pantry: updatedPantry
        }
      } else {
        // Item does not exist, add it as a new item
        const newItem: PantryItem = {
            ...action.payload,
            id: generateUniqueId('p-'),
        };
        return {
            ...state,
            pantry: [...state.pantry, newItem],
        };
      }
    }

    case 'EDIT_PANTRY_ITEM': {
        return {
            ...state,
            pantry: state.pantry.map(item => 
                item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
            )
        }
    }

    case 'REMOVE_PANTRY_ITEM': {
        return {
            ...state,
            pantry: state.pantry.filter(item => item.id !== action.payload.id)
        }
    }

    default:
      return state;
  }
}

const LOCAL_STORAGE_KEY = 'grociSmartState';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    try {
      const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        // Dates need to be re-hydrated
        if (parsedState.pantry) {
          parsedState.pantry.forEach((item: PantryItem) => {
              if (item.expiryDate) {
                  item.expiryDate = new Date(item.expiryDate);
              }
          });
        }
        dispatch({ type: 'SET_STATE', payload: parsedState });
      }
    } catch (error) {
      console.error("Could not load state from localStorage", error);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error("Could not save state to localStorage", error);
        }
    }
  }, [state, isInitialized]);


  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {isInitialized ? children : null}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
