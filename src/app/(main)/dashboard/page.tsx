import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, AlertTriangle, ChefHat, BrainCircuit, Icon } from 'lucide-react';
import type { FC } from 'react';

interface DashboardCardProps {
  href: string;
  icon: Icon;
  title: string;
  description: string;
  className?: string;
}

const DashboardCard: FC<DashboardCardProps> = ({ href, icon: Icon, title, description, className }) => (
  <Link href={href} className="block">
    <Card className={`hover:bg-primary/5 transition-colors h-full ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Icon className="w-8 h-8 text-primary" />
          <div>
            <CardTitle className="font-headline">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  </Link>
);


export default function DashboardPage() {
  const features = [
    {
      href: '/grocery-list#smart-suggestions',
      icon: Lightbulb,
      title: 'Smart Suggestions',
      description: 'AI-powered ideas for your next grocery run.',
    },
    {
      href: '/my-pantry#expiry-alert',
      icon: AlertTriangle,
      title: 'Expiry Alert',
      description: 'Check items that are expiring soon.',
    },
    {
      href: '/my-pantry#use-it-or-lose-it',
      icon: ChefHat,
      title: 'Use It or Lose It',
      description: 'Get recipes for ingredients near expiry.',
    },
    {
      href: '/my-pantry#pantry-genius',
      icon: BrainCircuit,
      title: 'Pantry Genius',
      description: 'Discover meals you can make right now.',
    },
  ];

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your smart kitchen at a glance.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((feature) => (
          <DashboardCard key={feature.title} {...feature} />
        ))}
      </div>
    </div>
  );
}
