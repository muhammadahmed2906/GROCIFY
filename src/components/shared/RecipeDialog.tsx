'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <div className="relative h-48 w-full -mx-6 -mt-6 mb-4 rounded-t-lg overflow-hidden">
            <Image
              src={placeholderImage.imageUrl}
              alt={placeholderImage.description}
              data-ai-hint={placeholderImage.imageHint}
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <DialogTitle className="font-headline text-2xl">{recipe.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[50vh] pr-4 -mr-4">
            <div className="space-y-4">
                <div>
                    <h3 className="font-semibold font-headline mb-2">Ingredients</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{recipe.ingredients}</p>
                </div>
                <div>
                    <h3 className="font-semibold font-headline mb-2">Instructions</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{recipe.instructions}</p>
                </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
