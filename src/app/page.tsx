'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons/Logo';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2000); // 2-second delay

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className="flex h-screen w-full flex-col items-center justify-center"
      style={{ backgroundColor: '#4b39ef' }}
    >
      <div className="flex flex-col items-center justify-center text-white animate-fade-in">
        <Logo className="h-24 w-24 mb-4" />
        <h1 className="text-5xl font-headline font-bold tracking-wider">
          GROCIFY
        </h1>
      </div>
    </div>
  );
}
