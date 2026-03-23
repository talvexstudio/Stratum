'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { HierarchyNode } from '../lib/hierarchy';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DeleteNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  node: HierarchyNode;
}

export const DeleteNodeModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  node 
}: DeleteNodeModalProps) => {
  if (!isOpen) return null;

  const countDescendants = (n: HierarchyNode): number => {
    let count = 0;
    if (n.children) {
      count += n.children.length;
      n.children.forEach(child => {
        count += countDescendants(child);
      });
    }
    return count;
  };

  const descendantCount = countDescendants(node);
  const hasDescendants = descendantCount > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b bg-zinc-50/50">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Confirm Deletion</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-zinc-200 rounded-lg text-zinc-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-zinc-600 leading-relaxed">
              You are about to delete <span className="font-bold text-zinc-900">"{node.title}"</span>.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Node Type:</span>
              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-bold uppercase border border-zinc-200">
                {node.type}
              </span>
            </div>
          </div>

          <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-3">
            <p className="text-xs font-bold text-red-700 uppercase tracking-tight">Destructive Action</p>
            <p className="text-xs text-red-600 leading-normal">
              This action is permanent and cannot be undone. All data associated with this node will be removed immediately.
            </p>
            
            {hasDescendants && (
              <div className="pt-3 border-t border-red-200/50 space-y-2">
                <p className="text-xs font-bold text-red-700">Warning: Cascade Deletion</p>
                <p className="text-xs text-red-600 leading-normal">
                  This node has <span className="font-bold underline">{descendantCount} descendants</span>. Deleting this node will also delete all children and their sub-hierarchy.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-zinc-50 border-t flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-200 transition-all uppercase tracking-widest"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-6 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 uppercase tracking-widest"
          >
            Delete Node
          </button>
        </div>
      </div>
    </div>
  );
};
