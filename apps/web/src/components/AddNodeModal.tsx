'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Anchor, Layers, CheckCircle2, Package, Circle } from 'lucide-react';
import { HierarchyNode, NodeType } from '../lib/hierarchy';
import { useDataStore } from '../store/dataStore';
import { useUIStore } from '../store/uiStore';
import { canCreateChild, getParentProject, getValidChildTypes } from '../lib/engine';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorNode: HierarchyNode;
}

export const AddNodeModal = ({ isOpen, onClose, anchorNode }: AddNodeModalProps) => {
  const { addNode, hierarchy } = useDataStore();
  const { activePersona, currentUserId, featureConfig } = useUIStore();

  const parentProject = getParentProject(hierarchy, anchorNode.id);
  
  const validTypes = useMemo(() => {
    const allValidTypes = getValidChildTypes(anchorNode.type);
    return allValidTypes.filter(t => 
      canCreateChild(activePersona, anchorNode, t, currentUserId, featureConfig, parentProject)
    );
  }, [anchorNode.type, anchorNode.id, activePersona, currentUserId, featureConfig, parentProject]);
  
  const [type, setType] = useState<NodeType>(validTypes[0] || 'task');
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState<string>('');

  const titleInputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when modal opens or anchor changes
  useEffect(() => {
    if (isOpen) {
      const initialType = validTypes[0] || 'task';
      setType(initialType);
      setTitle('');
      setBudget('');
      
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, anchorNode.id]); // Only reset when modal opens or anchor changes

  if (!isOpen) return null;

  const allowed = canCreateChild(activePersona, anchorNode, type, currentUserId, featureConfig, parentProject);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !allowed) return;

    const newNode: Partial<HierarchyNode> = {
      type,
      title,
      status: 'pending',
      ownerId: currentUserId,
      anchorId: anchorNode.id,
      anchorType: anchorNode.type as any,
      children: []
    };

    if (type === 'task') {
      newNode.priority = 'medium';
      newNode.assignee = 'Unassigned';
    }

    if (type === 'package' && budget) {
      newNode.budget = parseFloat(budget);
    }

    addNode(anchorNode.id, newNode as any);
    onClose();
  };

  const getTypeIcon = (t: NodeType) => {
    switch (t) {
      case 'stage': return <Layers size={14} className="text-amber-500" />;
      case 'discipline': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'package': return <Package size={14} className="text-blue-500" />;
      case 'task': return <Circle size={14} className="text-zinc-400" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onMouseDown={onClose} />
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Add Item/Child</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Anchor size={12} className="text-zinc-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Under {anchorNode.type}: {anchorNode.title}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {!allowed && type === validTypes[0] ? (
          <div className="p-10 text-center space-y-4">
            <div className="text-zinc-400 italic text-sm">You do not have permission to create children here.</div>
            <button onClick={onClose} className="text-blue-600 font-bold text-xs uppercase">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Type Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Child Type</label>
              <div className="flex flex-wrap gap-2">
                {validTypes.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all",
                      type === t 
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-md" 
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                    )}
                  >
                    {getTypeIcon(t)}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Title</label>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`New ${type} title...`}
                className="w-full rounded-lg border-zinc-200 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {type === 'package' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Budget (Hours)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Allocate hours..."
                  className="w-full rounded-lg border-zinc-200 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-[9px] text-zinc-400 font-medium italic">Packages serve as the budget control layer.</p>
              </div>
            )}

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!allowed || !title.trim()}
                className={cn(
                  "px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg",
                  (allowed && title.trim()) 
                    ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200" 
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none"
                )}
              >
                Create
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
