import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import type { Page } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export function MainLayout({ children, currentPage, onPageChange }: MainLayoutProps) {
  return (
    <div className="h-screen flex overflow-hidden bg-background relative">
      {/* Gradient background overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% -20%, hsl(var(--gradient-from) / 0.12), transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 0%, hsl(var(--gradient-via) / 0.10), transparent 50%),
            radial-gradient(ellipse 50% 30% at 50% 100%, hsl(var(--gradient-to) / 0.08), transparent 50%)
          `
        }}
      />
      
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
      
      {/* Main content - floating card style */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 py-3 pr-3">
        <main className="flex-1 flex flex-col overflow-hidden rounded-2xl bg-card/40 backdrop-blur-xl border border-white/10 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          {children}
        </main>
      </div>
    </div>
  );
}
