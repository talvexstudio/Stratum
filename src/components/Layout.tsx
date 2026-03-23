
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TEMPORARY_PERSONAS } from '../personas';
import { useActivePersona } from '../hooks/useActivePersona';
import { useAdminGate } from '../hooks/useAdminGate';
import { getLinkWithPersona } from '../lib/navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const { activePersona, isMounted, switchPersona, isAdmin } = useActivePersona();
  const { isUnauthorized } = useAdminGate(activePersona, isMounted);

  if (!isMounted || isUnauthorized) {
    return <div className="min-h-screen bg-stone-50" />;
  }

  const link = (path: string) => getLinkWithPersona(path, activePersona);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col">
      <header className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link href={link('/')} className="text-xl font-semibold tracking-tight text-stone-900">
            Talvex Stratum
          </Link>
        </div>

        <nav className="flex items-center gap-6">
          {/* On /stratum: show Settings ONLY if admin */}
          {pathname.startsWith('/stratum') && isAdmin && (
            <Link 
              href={link('/admin')} 
              className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
            >
              Settings
            </Link>
          )}

          {/* On /admin: show Stratum ALWAYS */}
          {pathname.startsWith('/admin') && (
            <Link 
              href={link('/stratum')} 
              className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
            >
              Stratum
            </Link>
          )}

          {/* On root /: show both for convenience */}
          {pathname === '/' && (
            <>
              <Link 
                href={link('/stratum')} 
                className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
              >
                Stratum
              </Link>
              {isAdmin && (
                <Link 
                  href={link('/admin')} 
                  className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
                >
                  Settings
                </Link>
              )}
            </>
          )}

          <div className="h-4 w-px bg-stone-200 mx-2" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Persona:</span>
            <select 
              value={activePersona?.id || ''} 
              onChange={(e) => switchPersona(e.target.value)}
              className="text-sm bg-stone-100 border-none rounded-md px-2 py-1 focus:ring-2 focus:ring-stone-200 outline-none cursor-pointer"
            >
              {TEMPORARY_PERSONAS.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.roleId})</option>
              ))}
            </select>
          </div>
        </nav>
      </header>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
