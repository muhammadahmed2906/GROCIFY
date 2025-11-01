'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card/80 px-4 backdrop-blur-sm sm:px-6">
      <h1 className="text-2xl font-bold font-headline text-primary">GROCIFY</h1>
      <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
        <LogOut className="h-5 w-5" />
      </Button>
    </header>
  );
}
