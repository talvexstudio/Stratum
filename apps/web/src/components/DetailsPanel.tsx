'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Calendar, 
  User, 
  Tag, 
  MessageSquare, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  Link as LinkIcon,
  Shield,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  X,
  Check,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { HierarchyNode, NodeStatus, NodePriority, NodeType, TimeEntry, PROJECT_TYPES } from '../lib/hierarchy';
import { useUIStore, SIMULATED_USERS } from '../store/uiStore';
import { useDataStore } from '../store/dataStore';
import { 
  canEditField, 
  calculateRollup, 
  getParentProject, 
  canLogTime, 
  canEditBudget, 
  canEditTimeEntry, 
  canDeleteNode,
  canMarkAsTemplate
} from '../lib/engine';
import { getTeamLoad, getBudgetState, getExecutionMetrics } from '../lib/analytics';
import { LogTimeModal } from './LogTimeModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NodeIcon = ({ type }: { type: NodeType }) => {
  switch (type) {
    case 'area': return <div className="w-2 h-2 rounded-full bg-zinc-400" />;
    case 'project': return <div className="w-2 h-2 rounded-full bg-blue-500" />;
    case 'stage': return <div className="w-2 h-2 rounded-full bg-purple-500" />;
    case 'discipline': return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
    case 'package': return <div className="w-2 h-2 rounded-full bg-amber-500" />;
    case 'task': return <div className="w-2 h-2 rounded-full bg-zinc-400" />;
    default: return null;
  }
};

export const DetailsPanel = ({ 
  node, 
  isCollapsed = false, 
  onToggle,
  onDelete
}: { 
  node: HierarchyNode;
  isCollapsed?: boolean;
  onToggle?: () => void;
  onDelete?: () => void;
}) => {
  const { activePersona, currentUserId, featureConfig } = useUIStore();
  const { updateNode, hierarchy, updateTimeEntry, deleteTimeEntry, toggleTemplate } = useDataStore();
  const [localTitle, setLocalTitle] = useState(node.title);
  const [localNotes, setLocalNotes] = useState(node.notes || '');
  const [localBudget, setLocalBudget] = useState(node.budget?.toString() || '');
  const [showLogTime, setShowLogTime] = useState(false);
  const [isEntriesExpanded, setIsEntriesExpanded] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editEntryData, setEditEntryData] = useState<Partial<TimeEntry>>({});

  const parentProject = getParentProject(hierarchy, node.id);

  // Reset local state when node changes to prevent stale values
  useEffect(() => {
    setLocalTitle(node.title);
    setLocalNotes(node.notes || '');
    setLocalBudget(node.budget?.toString() || '');
    setEditingEntryId(null);
  }, [node.id, node.title, node.notes, node.budget]);

  const handleUpdate = (field: keyof HierarchyNode, value: any) => {
    if (!canEditField(activePersona, node, field, currentUserId, featureConfig, parentProject)) return;
    updateNode(node.id, { [field]: value });
  };

  const handleBudgetUpdate = () => {
    if (!canEditBudget(activePersona, node, currentUserId, featureConfig, parentProject)) return;
    const val = localBudget === '' ? undefined : parseFloat(localBudget);
    if (val !== undefined && (isNaN(val) || val < 0)) return;
    updateNode(node.id, { budget: val });
  };

  const rollup = calculateRollup(node);
  const isTask = node.type === 'task';
  const isProject = node.type === 'project';

  const budgetState = getBudgetState(node);
  const metrics = getExecutionMetrics(node);
  const canLog = canLogTime(activePersona, node, currentUserId, featureConfig, parentProject);

  const isEditable = (field: keyof HierarchyNode) => canEditField(activePersona, node, field, currentUserId, featureConfig, parentProject);

  const isProjectOwner = parentProject?.ownerId === currentUserId;

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-l transition-all duration-300 ease-in-out overflow-hidden shrink-0 relative",
      isCollapsed ? "w-12" : "w-80"
    )}>
      {/* Header */}
      <div className={cn(
        "p-4 border-b flex items-center bg-zinc-50/50",
        isCollapsed ? "flex-col justify-start gap-4 px-0" : "justify-between"
      )}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <NodeIcon type={node.type} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{node.type}</span>
              {isProjectOwner && (
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold uppercase tracking-tighter border border-blue-100">
                  Owned by you
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={onToggle}
                className="p-1.5 hover:bg-zinc-200 rounded text-zinc-400 transition-colors"
                title="Collapse Sidebar"
              >
                <PanelRightClose size={14} />
              </button>
              {canDeleteNode(activePersona, node, currentUserId) && (
                <button 
                  onClick={onDelete}
                  className="p-1.5 hover:bg-red-100 rounded text-zinc-400 hover:text-red-600 transition-colors"
                  title="Delete Node"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </>
        ) : (
          <button 
            onClick={onToggle}
            className="p-3 hover:bg-zinc-200 rounded text-zinc-400 transition-colors"
            title="Expand Sidebar"
          >
            <PanelRightOpen size={18} />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
        {/* 1. Title Section */}
        <section>
          <div className="group relative">
            {isEditable('title') ? (
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Title (Editable)</label>
                <textarea
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  onBlur={() => handleUpdate('title', localTitle)}
                  className="w-full text-lg font-bold text-zinc-900 bg-zinc-50/50 border border-transparent hover:border-zinc-200 focus:border-blue-500 focus:bg-white focus:ring-0 p-2 rounded-lg resize-none leading-tight transition-all"
                  rows={2}
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Title</label>
                <h3 className="text-lg font-bold text-zinc-900 leading-tight px-2">{node.title}</h3>
              </div>
            )}
          </div>
        </section>

        {/* 2. Ownership Context */}
        <section className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
            <Shield size={10} /> Ownership Context
          </h4>
          <div className="p-3 rounded-lg border bg-zinc-50/50 text-xs space-y-2">
            {isProject && canMarkAsTemplate(activePersona, node, currentUserId) && (
              <div className="space-y-1.5 pb-2 border-b border-zinc-100 mb-2 flex items-center justify-between">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Mark as Template</label>
                  <p className="text-[10px] text-zinc-500">Templates are hidden from normal views</p>
                </div>
                <button
                  onClick={() => toggleTemplate(node.id)}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors relative",
                    node.isTemplate ? "bg-amber-600" : "bg-zinc-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform",
                    node.isTemplate ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>
            )}
            {isProject && (
              <div className="space-y-1.5 pb-2 border-b border-zinc-100 mb-2">
                <label className={cn(
                  "text-[9px] font-bold uppercase tracking-wider",
                  isEditable('projectType') ? "text-blue-600" : "text-zinc-400"
                )}>Project Type</label>
                {isEditable('projectType') ? (
                  <select
                    value={node.projectType || ''}
                    onChange={(e) => handleUpdate('projectType', e.target.value)}
                    className="w-full text-xs font-bold text-zinc-900 bg-transparent border-none p-0 focus:ring-0 h-5 appearance-none cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    {!node.projectType && <option value="">Unspecified</option>}
                    {node.projectType && !PROJECT_TYPES.includes(node.projectType) && (
                      <option value={node.projectType}>{node.projectType} (Legacy)</option>
                    )}
                    {PROJECT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs font-bold text-zinc-900">{node.projectType || '—'}</div>
                )}
              </div>
            )}
            {!isProject && (
              <div className="flex justify-between pb-1 border-b border-zinc-100/50 mb-1">
                <span className="text-zinc-500">Project Owner</span>
                <span className={cn("font-bold", isProjectOwner ? "text-blue-600" : "text-zinc-900")}>
                  {parentProject?.ownerId || 'N/A'}
                </span>
              </div>
            )}
            <div className="space-y-1">
              <label className={cn(
                "text-[9px] font-bold uppercase tracking-wider",
                isEditable('ownerId') ? "text-blue-600" : "text-zinc-400"
              )}>
                {isProject ? "Project Owner" : "Node Owner"} {isEditable('ownerId') && "•"}
              </label>
              {isEditable('ownerId') ? (
                <select
                  value={node.ownerId}
                  onChange={(e) => handleUpdate('ownerId', e.target.value)}
                  className="w-full text-xs font-bold text-zinc-900 bg-transparent border-none p-0 focus:ring-0 h-5 appearance-none cursor-pointer hover:text-blue-600 transition-colors"
                >
                  {SIMULATED_USERS.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.id})</option>
                  ))}
                </select>
              ) : (
                <div className="text-xs font-bold text-zinc-900">
                  {SIMULATED_USERS.find(u => u.id === node.ownerId)?.name || node.ownerId}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Status & Priority */}
        <section className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={cn(
              "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
              isEditable('status') ? "text-blue-600" : "text-zinc-400"
            )}>
              <Activity size={10} /> Status {isEditable('status') && "•"}
            </label>
            <select
              value={node.status}
              disabled={!isEditable('status')}
              onChange={(e) => handleUpdate('status', e.target.value as NodeStatus)}
              className={cn(
                "w-full text-xs font-medium rounded-lg border-zinc-200 py-2 focus:ring-blue-500 focus:border-blue-500 transition-all",
                !isEditable('status') ? "bg-zinc-50 text-zinc-500 cursor-not-allowed border-zinc-100" : "bg-white text-zinc-900 border-zinc-200"
              )}
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={cn(
              "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
              isEditable('priority') ? "text-blue-600" : "text-zinc-400"
            )}>
              <AlertCircle size={10} /> Priority {isEditable('priority') && "•"}
            </label>
            <select
              value={node.priority}
              disabled={!isEditable('priority')}
              onChange={(e) => handleUpdate('priority', e.target.value as NodePriority)}
              className={cn(
                "w-full text-xs font-medium rounded-lg border-zinc-200 py-2 focus:ring-blue-500 focus:border-blue-500 transition-all",
                !isEditable('priority') ? "bg-zinc-50 text-zinc-500 cursor-not-allowed border-zinc-100" : "bg-white text-zinc-900 border-zinc-200"
              )}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </section>

        {/* 4. Assignee & Dates */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 w-full">
              <div className={cn(
                "p-2 rounded-lg text-zinc-500",
                isEditable('assignee') ? "bg-blue-50 text-blue-600" : "bg-zinc-100"
              )}>
                <User size={16} />
              </div>
              <div className="flex-1">
                <div className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isEditable('assignee') ? "text-blue-600" : "text-zinc-400"
                )}>Assignee {isEditable('assignee') && "•"}</div>
                {isEditable('assignee') ? (
                  <select
                    value={node.assignee || 'Unassigned'}
                    onChange={(e) => handleUpdate('assignee', e.target.value)}
                    className="w-full text-xs font-bold text-zinc-900 bg-transparent border-none p-0 focus:ring-0 h-5 appearance-none cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    <option value="Unassigned">Unassigned</option>
                    {SIMULATED_USERS.map(user => (
                      <option key={user.id} value={user.id}>{user.name} ({user.id})</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs font-bold text-zinc-900">
                    {SIMULATED_USERS.find(u => u.id === node.assignee)?.name || node.assignee || 'Unassigned'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg text-zinc-500",
                isEditable('startDate') ? "bg-blue-50 text-blue-600" : "bg-zinc-100"
              )}>
                <Calendar size={16} />
              </div>
              <div className="flex-1">
                <div className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isEditable('startDate') ? "text-blue-600" : "text-zinc-400"
                )}>Start {isEditable('startDate') && "•"}</div>
                {isEditable('startDate') ? (
                  <input
                    type="date"
                    value={node.startDate || ''}
                    onChange={(e) => handleUpdate('startDate', e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-xs font-bold text-zinc-900 bg-transparent border-none p-0 focus:ring-0 h-5 relative"
                  />
                ) : (
                  <div className="text-xs font-bold text-zinc-900">{node.startDate || 'No start date'}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg text-zinc-500",
                isEditable('dueDate') ? "bg-blue-50 text-blue-600" : "bg-zinc-100"
              )}>
                <Calendar size={16} />
              </div>
              <div className="flex-1">
                <div className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isEditable('dueDate') ? "text-blue-600" : "text-zinc-400"
                )}>Due {isEditable('dueDate') && "•"}</div>
                {isEditable('dueDate') ? (
                  <input
                    type="date"
                    value={node.dueDate || ''}
                    onChange={(e) => handleUpdate('dueDate', e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-xs font-bold text-zinc-900 bg-transparent border-none p-0 focus:ring-0 h-5 relative"
                  />
                ) : (
                  <div className="text-xs font-bold text-zinc-900">{node.dueDate || 'No due date'}</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 5. Time Entries (for Items) */}
        {isTask && featureConfig.timeTracking && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                <Clock size={10} /> Time Tracking
              </h4>
              {canLog && (
                <button 
                  onClick={() => setShowLogTime(true)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                >
                  Log Time
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl border bg-zinc-50/50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Total Spent</span>
                <span className="text-lg font-bold text-zinc-900">{node.spent || 0}h</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Recent Entries</div>
                  {node.timeEntries && node.timeEntries.length > 0 && (
                    <button 
                      onClick={() => setIsEntriesExpanded(!isEntriesExpanded)}
                      className="flex items-center gap-1 text-[9px] font-bold text-zinc-500 hover:text-zinc-700 uppercase tracking-widest transition-colors"
                    >
                      {isEntriesExpanded ? (
                        <>Collapse <ChevronUp size={10} /></>
                      ) : (
                        <>Show All ({node.timeEntries.length}) <ChevronDown size={10} /></>
                      )}
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {node.timeEntries && node.timeEntries.length > 0 ? (
                    isEntriesExpanded ? (
                      [...node.timeEntries].reverse().map(entry => {
                        const canEdit = canEditTimeEntry(activePersona, entry.userId, currentUserId, featureConfig, parentProject);
                        const isEditing = editingEntryId === entry.id;

                        return (
                          <div key={entry.id} className="group relative flex flex-col p-2 bg-white rounded-lg border border-zinc-100 shadow-sm transition-all hover:border-zinc-200">
                            {isEditing ? (
                              <div className="space-y-2 p-1">
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={editEntryData.hours || ''}
                                    onChange={(e) => setEditEntryData({ ...editEntryData, hours: parseFloat(e.target.value) })}
                                    className="w-16 text-[10px] font-bold border-zinc-200 rounded focus:ring-blue-500 focus:border-blue-500 p-1"
                                  />
                                  <input
                                    type="date"
                                    value={editEntryData.date || ''}
                                    onChange={(e) => setEditEntryData({ ...editEntryData, date: e.target.value })}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 text-[10px] font-bold border-zinc-200 rounded focus:ring-blue-500 focus:border-blue-500 p-1 relative"
                                  />
                                </div>
                                <textarea
                                  value={editEntryData.notes || ''}
                                  onChange={(e) => setEditEntryData({ ...editEntryData, notes: e.target.value })}
                                  placeholder="Notes..."
                                  className="w-full text-[10px] border-zinc-200 rounded focus:ring-blue-500 focus:border-blue-500 p-1 resize-none"
                                  rows={2}
                                />
                                <div className="flex justify-end gap-1">
                                  <button 
                                    onClick={() => setEditingEntryId(null)}
                                    className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                                  >
                                    <X size={12} />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      updateTimeEntry(node.id, entry.id, editEntryData);
                                      setEditingEntryId(null);
                                    }}
                                    className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors"
                                  >
                                    <Check size={12} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start">
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] font-bold text-zinc-900">{entry.userName}</div>
                                    <div className="text-[9px] text-zinc-400">{entry.date}</div>
                                    {entry.notes && <div className="text-[9px] text-zinc-500 italic line-clamp-1">{entry.notes}</div>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-[10px] font-bold text-zinc-900">{entry.hours}h</div>
                                    {canEdit && (
                                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => {
                                            setEditingEntryId(entry.id);
                                            setEditEntryData({ hours: entry.hours, date: entry.date, notes: entry.notes });
                                          }}
                                          className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-blue-600 transition-colors"
                                        >
                                          <Edit2 size={10} />
                                        </button>
                                        <button 
                                          onClick={() => {
                                            // Removed confirm as it's unreliable in iframe
                                            deleteTimeEntry(node.id, entry.id);
                                          }}
                                          className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-red-600 transition-colors"
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    ) : null
                  ) : (
                    <div className="text-[10px] text-zinc-400 italic text-center py-2 bg-white/50 rounded-lg border border-dashed border-zinc-200">
                      No time logged yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6. Budget Section (for Structural Nodes) */}
        {budgetState && featureConfig.budgeting && (
          <section className="p-4 rounded-xl border bg-zinc-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {budgetState.isExplicit ? 'Package Budget' : 'Rolled-up Budget'}
                </h4>
                {!budgetState.isExplicit && !budgetState.isNoBudget && (
                  <p className="text-[8px] text-zinc-400 font-medium uppercase leading-none">Derived from packages</p>
                )}
              </div>
              <div className={cn(
                "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter border",
                budgetState.isNoBudget ? "bg-zinc-100 text-zinc-500 border-zinc-200" :
                budgetState.status === 'over' ? "bg-red-50 text-red-600 border-red-100" :
                budgetState.status === 'near' ? "bg-amber-50 text-amber-600 border-amber-100" :
                "bg-emerald-50 text-emerald-600 border-emerald-100"
              )}>
                {budgetState.isNoBudget ? 'No Budget Set' :
                 budgetState.status === 'over' ? 'Over Budget' : 
                 budgetState.status === 'near' ? 'Near Budget' : 'On Track'}
              </div>
            </div>

            {budgetState.isExplicit && canEditBudget(activePersona, node, currentUserId, featureConfig, parentProject) ? (
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Set Budget (Hours)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={localBudget}
                  onChange={(e) => setLocalBudget(e.target.value)}
                  onBlur={handleBudgetUpdate}
                  placeholder="No budget set"
                  className="w-full text-xs font-bold text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-0 p-2 rounded-lg transition-all"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Spent vs Budget</span>
                  <span className="font-bold text-zinc-900">
                    {budgetState.spent}h / {budgetState.isNoBudget ? '--' : `${budgetState.budget}h`}
                  </span>
                </div>
                
                {!budgetState.isNoBudget && (
                  <>
                    <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500",
                          budgetState.status === 'over' ? "bg-red-500" :
                          budgetState.status === 'near' ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(budgetState.utilization, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-zinc-400">Utilization</span>
                      <span className={cn(
                        budgetState.status === 'over' ? "text-red-600" :
                        budgetState.status === 'near' ? "text-amber-600" : "text-emerald-600"
                      )}>{Math.round(budgetState.utilization)}%</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {!budgetState.isNoBudget && (
              <div className="pt-2 border-t border-zinc-200/50 flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Remaining</span>
                <span className={cn(
                  "text-xs font-bold",
                  budgetState.remaining < 0 ? "text-red-600" : "text-zinc-900"
                )}>{budgetState.remaining}h</span>
              </div>
            )}
          </section>
        )}

        {/* 7. Team Load Summary */}
        {!isTask && (
          <section className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
              <User size={10} /> Team Load Summary
            </h4>
            <div className="space-y-2">
              {getTeamLoad(node).map(member => (
                <div key={member.assignee} className="p-2 rounded-lg border bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] font-bold text-zinc-500 uppercase">
                        {member.assignee.substring(0, 2)}
                      </div>
                      <span className="text-[11px] font-bold text-zinc-700">{member.assignee}</span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400">{member.openTasks} open</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: `${(member.completedTasks / member.totalTasks) * 100}%` }}
                      />
                      <div 
                        className="h-full bg-zinc-300" 
                        style={{ width: `${(member.openTasks / member.totalTasks) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-zinc-500 w-6 text-right">{member.totalTasks}</span>
                  </div>
                </div>
              ))}
              {getTeamLoad(node).length === 0 && (
                <div className="text-[10px] text-zinc-400 italic text-center py-2">
                  No item assignments found.
                </div>
              )}
            </div>
          </section>
        )}

        {/* 8. Notes */}
        <section className="space-y-2">
          <label className={cn(
            "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
            isEditable('notes') ? "text-blue-600" : "text-zinc-400"
          )}>
            <MessageSquare size={10} /> Notes {isEditable('notes') && "•"}
          </label>
          {isEditable('notes') ? (
            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={() => handleUpdate('notes', localNotes)}
              placeholder="Add notes or description..."
              className="w-full text-xs text-zinc-600 bg-white border border-zinc-200 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-none transition-all"
            />
          ) : (
            <div className="text-xs text-zinc-600 bg-zinc-50 border border-zinc-100 rounded-lg p-3 min-h-[120px] whitespace-pre-wrap">
              {node.notes || 'No notes provided.'}
            </div>
          )}
        </section>

        {/* 9. Tags */}
        {featureConfig.tags && (
          <section className="space-y-2">
            <label className={cn(
              "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
              isEditable('tags') ? "text-blue-600" : "text-zinc-400"
            )}>
              <Tag size={10} /> Tags {isEditable('tags') && "•"}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {node.tags?.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-medium border border-zinc-200">
                  {tag}
                </span>
              ))}
              {isEditable('tags') && (
                <button className="px-2 py-0.5 border border-dashed border-zinc-300 text-zinc-400 rounded text-[10px] hover:border-blue-400 hover:text-blue-600 transition-colors">
                  + Add Tag
                </button>
              )}
            </div>
          </section>
        )}

        {/* Anchor Context (for items) */}
        {isTask && (
          <section className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
              <LinkIcon size={10} /> Anchor Context
            </h4>
            <div className="p-3 rounded-lg border bg-white text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Anchor Type</span>
                <span className="font-bold text-zinc-900 uppercase tracking-tighter">{node.anchorType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Anchor ID</span>
                <span className="font-mono text-[10px] text-zinc-400">{node.anchorId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Resolved Project</span>
                <span className="font-mono text-[10px] text-zinc-400">{node.resolvedProjectId}</span>
              </div>
            </div>
          </section>
        )}
      </div>
      )}
      
      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t bg-zinc-50/50 flex items-center justify-between">
        <div className="text-[9px] text-zinc-400 font-mono">
          ID: {node.id}
        </div>
        {node.isTerminal && (
          <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 size={12} /> Verified
          </div>
        )}
      </div>
      )}

      {showLogTime && <LogTimeModal task={node} onClose={() => setShowLogTime(false)} />}
    </div>
  );
};
