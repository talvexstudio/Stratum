'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Clock } from 'lucide-react';
import { HierarchyNode } from '../lib/hierarchy';
import { useDataStore } from '../store/dataStore';
import { useUIStore } from '../store/uiStore';

interface LogTimeModalProps {
  task: HierarchyNode;
  onClose: () => void;
}

export const LogTimeModal = ({ task, onClose }: LogTimeModalProps) => {
  const { addTimeEntry } = useDataStore();
  const { currentUserId, activePersona } = useUIStore();
  
  const [hours, setHours] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const hoursInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      hoursInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const h = parseFloat(hours);
    if (isNaN(h) || h <= 0) {
      setError('Please enter a positive number of hours.');
      return;
    }

    if (!date) {
      setError('Date is required.');
      return;
    }

    addTimeEntry(task.id, {
      hours: h,
      date,
      notes,
      userId: currentUserId,
      userName: activePersona === 'admin' ? 'Administrator' : 
                activePersona === 'manager' ? (currentUserId === 'manager-1' ? 'Manager One' : 'Manager Two') :
                'Contributor'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onMouseDown={onClose} />
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Log Time</h3>
              <p className="text-[10px] text-zinc-500 font-medium truncate max-w-[200px]">{task.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hours</label>
              <input
                ref={hoursInputRef}
                type="number"
                step="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all relative"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on?"
              rows={3}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all resize-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
            >
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
