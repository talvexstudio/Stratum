'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore, SIMULATED_USERS } from '../store/uiStore';
import { UserCircle, ShieldCheck, User, Eye, Settings, LogOut } from 'lucide-react';

export const TopBar = () => {
  const router = useRouter();
  const { 
    currentUserId, 
    setSimulatedUser, 
    currentProject, 
    breadcrumb, 
    activePersona, 
    currentUserName,
    setHasEnteredDemo
  } = useUIStore();

  const handleLogout = () => {
    setHasEnteredDemo(false);
    router.push('/');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldCheck size={12} className="text-red-500" />;
      case 'manager': return <Settings size={12} className="text-blue-500" />;
      case 'contributor': return <User size={12} className="text-emerald-500" />;
      case 'observer': return <Eye size={12} className="text-zinc-500" />;
      default: return null;
    }
  };

  return (
    <header className="flex h-12 items-center justify-between border-b bg-white px-4 shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm font-bold text-zinc-900 truncate leading-tight">
            {currentProject || 'Stratum'}
          </h2>
          {breadcrumb.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
              {breadcrumb.map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-zinc-300">/</span>}
                  <span className="truncate">{item.title}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-1">
            <span className="text-[10px] font-bold text-zinc-900 leading-none">{currentUserName}</span>
            <div className="flex items-center gap-1 mt-0.5">
              {getRoleIcon(activePersona)}
              <span className="text-[8px] font-bold uppercase tracking-tighter text-zinc-400">{activePersona}</span>
            </div>
          </div>
          <select 
            value={currentUserId}
            onChange={(e) => setSimulatedUser(e.target.value)}
            className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
          >
            {SIMULATED_USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.id} ({u.role})
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2 pl-2">
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-red-600 transition-colors"
            title="Exit Demo"
          >
            <LogOut size={16} />
          </button>
          <div className="h-7 w-7 rounded bg-zinc-100 flex items-center justify-center text-zinc-500 border border-zinc-200">
            <UserCircle size={16} />
          </div>
        </div>
      </div>
    </header>
  );
};
