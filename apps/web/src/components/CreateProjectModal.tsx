'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Folder, User, Activity, AlertCircle, Clock, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { HierarchyNode, NodeStatus, NodePriority, PROJECT_TYPES } from '../lib/hierarchy';
import { useDataStore } from '../store/dataStore';
import { useUIStore, SIMULATED_USERS } from '../store/uiStore';
import { canCreateProject } from '../lib/engine';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

export const CreateProjectModal = ({ isOpen, onClose, onSuccess }: CreateProjectModalProps) => {
  const router = useRouter();
  const { addNode, hierarchy, setSelectedNodeId } = useDataStore();
  const { activePersona, currentUserId } = useUIStore();

  const typologies = useMemo(() => {
    return hierarchy.filter(node => node.type === 'area');
  }, [hierarchy]);

  const [title, setTitle] = useState('');
  const [typologyId, setTypologyId] = useState(typologies[0]?.id || '');
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [ownerId, setOwnerId] = useState(currentUserId);
  const [status, setStatus] = useState<NodeStatus>('pending');
  const [assignee, setAssignee] = useState('Unassigned');
  const [priority, setPriority] = useState<NodePriority>('medium');
  const [creationMode, setCreationMode] = useState<'blank' | 'template'>('blank');
  const [templateId, setTemplateId] = useState('');

  const templates = useMemo(() => {
    const found: HierarchyNode[] = [];
    const traverse = (nodes: HierarchyNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'project' && node.isTemplate) {
          found.push(node);
        }
        if (node.children) traverse(node.children);
      });
    };
    traverse(hierarchy);
    return found;
  }, [hierarchy]);

  useEffect(() => {
    if (templates.length > 0 && !templateId) {
      setTemplateId(templates[0].id);
    }
  }, [templates, templateId]);

  const titleInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTypologyId(typologies[0]?.id || '');
      setProjectType(PROJECT_TYPES[0]);
      setOwnerId(currentUserId);
      setStatus('pending');
      setAssignee('Unassigned');
      setPriority('medium');
      setCreationMode('blank');
      setTemplateId(templates[0]?.id || '');
      
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, typologies, currentUserId, templates]);

  if (!isOpen) return null;

  const allowed = canCreateProject(activePersona);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !typologyId || !allowed) return;

    const newNode: Partial<HierarchyNode> = {
      type: 'project',
      title,
      status,
      priority,
      ownerId,
      assignee,
      projectType,
      children: []
    };

    const newId = addNode(typologyId, newNode as any, creationMode === 'template' ? templateId : undefined);
    
    // Navigate to the new project's workspace
    setSelectedNodeId(newId);
    router.push('/workspace');
    
    onClose();
    if (onSuccess) {
      onSuccess(newId); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onMouseDown={onClose} />
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Create New Project</h3>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Define the core parameters for your new project scope.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {!allowed ? (
          <div className="p-10 text-center space-y-4">
            <div className="text-zinc-400 italic text-sm">You do not have permission to create projects.</div>
            <button onClick={onClose} className="text-blue-600 font-bold text-xs uppercase">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Project Name *</label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Hudson Yards Tower C"
                    className="w-full rounded-lg border-zinc-200 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Typology (Area) *</label>
                  <div className="relative">
                    <select
                      value={typologyId}
                      onChange={(e) => setTypologyId(e.target.value)}
                      className="w-full appearance-none rounded-lg border-zinc-200 py-2.5 pl-3 pr-10 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                    >
                      {typologies.map(area => (
                        <option key={area.id} value={area.id}>{area.title}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Project Type</label>
                  <div className="relative">
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full appearance-none rounded-lg border-zinc-200 py-2.5 pl-3 pr-10 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      {PROJECT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Creation Mode</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCreationMode('blank')}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all",
                        creationMode === 'blank' ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
                      )}
                    >
                      Blank Project
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreationMode('template')}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all",
                        creationMode === 'template' ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
                      )}
                    >
                      From Template
                    </button>
                  </div>
                </div>

                {creationMode === 'template' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Select Template *</label>
                    <div className="relative">
                      <select
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        className="w-full appearance-none rounded-lg border-zinc-200 py-2.5 pl-3 pr-10 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                        required={creationMode === 'template'}
                      >
                        {templates.length === 0 && <option value="" disabled>No templates available</option>}
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Owner</label>
                  <div className="relative">
                    <select
                      value={ownerId}
                      onChange={(e) => setOwnerId(e.target.value)}
                      className="w-full appearance-none rounded-lg border-zinc-200 py-2.5 pl-10 pr-10 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      {SIMULATED_USERS.map(user => (
                        <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                      ))}
                    </select>
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Assignee</label>
                  <div className="relative">
                    <select
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      className="w-full appearance-none rounded-lg border-zinc-200 py-2.5 pl-10 pr-10 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="Unassigned">Unassigned</option>
                      {SIMULATED_USERS.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Initial Status</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as NodeStatus)}
                      className="w-full appearance-none rounded-lg border-zinc-200 py-2.5 pl-10 pr-10 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                      <option value="completed">Completed</option>
                    </select>
                    <Activity size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Priority</label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as NodePriority)}
                      className="w-full appearance-none rounded-lg border-zinc-200 py-2.5 pl-10 pr-10 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <AlertCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Creation will be logged to activity feed</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!allowed || !title.trim() || !typologyId || (creationMode === 'template' && !templateId)}
                  className={cn(
                    "px-8 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg",
                    (allowed && title.trim() && typologyId && (creationMode === 'blank' || templateId)) 
                      ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200" 
                      : "bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none"
                  )}
                >
                  Create Project
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
