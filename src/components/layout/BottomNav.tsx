'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  List,
  Search,
  UtensilsCrossed,
  Warehouse,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/grocery-list', label: 'Groceries', icon: List },
  { href: '/meal-planner', label: 'Planner', icon: UtensilsCrossed },
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/my-pantry', label: 'Pantry', icon: Warehouse },
  { href: '/recipe-finder', label: 'Recipes', icon: Search },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 z-40 w-full border-t bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-md p-2 text-sm font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
