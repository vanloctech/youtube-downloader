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
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Gradient background */}
      <div className="fixed inset-0 gradient-bg pointer-events-none" />
      
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
      
      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
