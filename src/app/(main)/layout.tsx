import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { AppProvider } from '@/lib/store';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="relative flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 pb-20">{children}</main>
        <BottomNav />
      </div>
    </AppProvider>
  );
}
