'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Recipe } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface RecipeDialogProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function RecipeDialog({ recipe, isOpen, onOpenChange }: RecipeDialogProps) {
  if (!recipe) return null;

  // Get a random placeholder image
  const placeholderImage = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];

  const ingredientsList = recipe.ingredients.split('\n').filter(item => item.trim() !== '');
  const instructionsList = recipe.instructions.split('\n').filter(item => item.trim() !== '');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full" aria-describedby="recipe-description">
        <DialogHeader>
          <div className="relative h-48 w-full -mx-6 -mt-6 mb-4 rounded-t-lg overflow-hidden">
            <Image
              src={placeholderImage.imageUrl}
              alt={placeholderImage.description}
              data-ai-hint={placeholderImage.imageHint}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 512px) 100vw, 512px"
            />
          </div>
          <DialogTitle>{recipe.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[50vh] pr-4 -mr-4">
            <div id="recipe-description">
              <div>
                <h3 className="font-semibold mb-2">Ingredients:</h3>
                <ul className="list-disc list-inside">
                  {ingredientsList.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Instructions:</h3>
                <ol className="list-decimal list-inside">
                  {instructionsList.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
