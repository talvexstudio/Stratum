'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { UtilityPanels } from './UtilityPanels';
import { useUIStore } from '../store/uiStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GlobalLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { sidebarCollapsed, hasEnteredDemo } = useUIStore();

  const isLandingPage = pathname === '/';

  if (isLandingPage && !hasEnteredDemo) {
    return <div className="min-h-screen w-full overflow-y-auto bg-white font-sans antialiased">{children}</div>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50 font-sans antialiased">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
      <UtilityPanels />
    </div>
  );
};
