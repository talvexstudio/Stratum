
"use client";

import React from 'react';
import { AdminSnapshot } from '../types';
import { motion } from 'motion/react';
import { User } from 'lucide-react';

interface LoginModalProps {
  snapshot: AdminSnapshot;
  onSelect: (id: string) => void;
}

export function LoginModal({ snapshot, onSelect }: LoginModalProps) {
  const peopleDb = snapshot.databases["people"];
  const roles = ["admin", "manager", "contributor"];

  return (
    <div className="fixed inset-0 bg-stone-100 flex items-center justify-center p-4 z-[200]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden"
      >
        <div className="p-8 text-center border-b border-stone-100">
          <div className="w-16 h-16 bg-stone-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <LayoutGridIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Welcome to Stratum</h1>
          <p className="text-stone-500 mt-2">Select a persona to begin your session</p>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map(role => {
            const people = peopleDb.records.filter(p => p.values.roleId === role);
            return (
              <div key={role} className="space-y-3">
                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2">{role}s</h3>
                <div className="space-y-2">
                  {people.map(p => (
                    <button
                      key={p.id}
                      onClick={() => onSelect(p.id)}
                      className="w-full group flex items-center gap-3 p-3 bg-stone-50 hover:bg-stone-900 hover:text-white rounded-2xl transition-all duration-200 text-left"
                    >
                      <div className="w-10 h-10 bg-white group-hover:bg-stone-800 text-stone-600 group-hover:text-stone-300 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm border border-stone-200 group-hover:border-stone-700 shrink-0">
                        {p.values.initials || (p.values.name ? p.values.name.substring(0, 2).toUpperCase() : '??')}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-sm truncate">{p.values.name}</p>
                        <p className="text-[10px] opacity-60 uppercase tracking-tighter">{role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 bg-stone-50 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-400">Stratum Demo Environment • 2026</p>
        </div>
      </motion.div>
    </div>
  );
}

function LayoutGridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}
