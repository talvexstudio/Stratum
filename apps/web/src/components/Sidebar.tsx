'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Settings, 
  Activity,
  ChevronLeft,
  ChevronRight,
  Info,
  HelpCircle
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Workspace', href: '/workspace', icon: LayoutDashboard },
  { name: 'Features', href: '/admin/features', icon: Settings, adminOnly: true },
  { name: 'Diagnostics', href: '/diagnostics', icon: Activity },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, activePersona, setActiveUtilityPanel } = useUIStore();

  const filteredItems = navItems.filter(item => !item.adminOnly || activePersona === 'admin');

  return (
    <aside 
      className={cn(
        "flex flex-col border-r bg-zinc-900 text-zinc-400 transition-all duration-300 ease-in-out shrink-0",
        sidebarCollapsed ? "w-14" : "w-60"
      )}
    >
      <div className="flex h-12 items-center justify-between border-b border-zinc-800 px-4 shrink-0">
        {!sidebarCollapsed && <span className="font-bold text-white tracking-tight">STRATUM</span>}
        <button 
          onClick={toggleSidebar}
          className="rounded-md p-1 hover:bg-zinc-800 text-zinc-500 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded px-2.5 py-2 text-xs font-medium transition-all group",
                isActive 
                  ? "bg-zinc-800 text-white" 
                  : "hover:bg-zinc-800/50 hover:text-zinc-200",
                sidebarCollapsed && "justify-center px-0"
              )}
              title={sidebarCollapsed ? item.name : ""}
            >
              <item.icon size={18} className={cn(sidebarCollapsed ? "" : "mr-3", isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300")} />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-2 shrink-0 space-y-0.5">
        <button
          onClick={() => setActiveUtilityPanel('about')}
          className={cn(
            "w-full flex items-center rounded px-2.5 py-2 text-[11px] font-medium transition-all hover:bg-zinc-800 hover:text-zinc-200 group",
            sidebarCollapsed && "justify-center px-0"
          )}
          title={sidebarCollapsed ? "About" : ""}
        >
          <Info size={16} className={cn(sidebarCollapsed ? "" : "mr-3", "text-zinc-500 group-hover:text-zinc-400")} />
          {!sidebarCollapsed && <span>About</span>}
        </button>
        <button
          onClick={() => setActiveUtilityPanel('help')}
          className={cn(
            "w-full flex items-center rounded px-2.5 py-2 text-[11px] font-medium transition-all hover:bg-zinc-800 hover:text-zinc-200 group",
            sidebarCollapsed && "justify-center px-0"
          )}
          title={sidebarCollapsed ? "Help" : ""}
        >
          <HelpCircle size={16} className={cn(sidebarCollapsed ? "" : "mr-3", "text-zinc-500 group-hover:text-zinc-400")} />
          {!sidebarCollapsed && <span>Help</span>}
        </button>
      </div>

      <div className="border-t border-zinc-800 p-3 shrink-0">
        {!sidebarCollapsed && (
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">
            System
          </div>
        )}
        <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}>
          <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 border border-zinc-700">V1</div>
          {!sidebarCollapsed && <span className="text-[10px] font-mono text-zinc-500">v1.2.0-alpha</span>}
        </div>
      </div>
    </aside>
  );
};
