
"use client";

import React, { useState } from 'react';
import { AdminSnapshot, Database, RecordDef, FieldDef } from '../types';
import { 
  Database as DbIcon, 
  Table, 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Check, 
  ChevronRight,
  Eye,
  EyeOff,
  Edit3,
  Layers,
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';
import { adminStore } from '../store/adminStore';
import { SCHEMA_REGISTRY } from '../lib/schemaRegistry';

interface AdminViewProps {
  snapshot: AdminSnapshot;
  remember: boolean;
  setRemember: (val: boolean) => void;
  onReset: (mode: 'seed') => void;
  isHydrated: boolean;
  updateSnapshot: (updater: (prev: AdminSnapshot) => AdminSnapshot) => void;
}

export function AdminView({ 
  snapshot, 
  remember, 
  setRemember, 
  onReset, 
  isHydrated,
  updateSnapshot 
}: AdminViewProps) {
  const [view, setView] = useState<'databases' | 'metadata'>('databases');
  const [selectedDbId, setSelectedDbId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [newRecordData, setNewRecordData] = useState<Record<string, any> | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<{ dbId: string; fieldId: string } | null>(null);
  const [isAddingField, setIsAddingField] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{ message: string; dependencies: any[] } | null>(null);

  const dbIds = Object.keys(snapshot.databases);
  const selectedDb = selectedDbId ? snapshot.databases[selectedDbId] : null;

  const handleUpdateMetadata = (key: string, value: string) => {
    adminStore.updateMetadata(key, value);
  };

  const handleAddField = (dbId: string) => {
    const id = `field_${Date.now()}`;
    const newField: FieldDef = {
      id,
      label: 'New Field',
      type: 'text',
      showInList: true,
      showInDetails: true
    };
    adminStore.addField(dbId, newField);
    setEditingFieldId({ dbId, fieldId: id });
    setIsAddingField(null);
  };

  const handleUpdateField = (dbId: string, fieldId: string, updates: Partial<FieldDef>) => {
    adminStore.updateField(dbId, fieldId, updates);
  };

  const handleDeleteField = (dbId: string, fieldId: string) => {
    if (!confirm("Delete this field? Data in this field will be lost.")) return;
    adminStore.deleteField(dbId, fieldId);
    if (editingFieldId?.fieldId === fieldId) setEditingFieldId(null);
  };

  const handleAddRecord = (dbId: string) => {
    if (!newRecordData) return;
    const newId = `rec_${Date.now()}`;
    adminStore.addRecord(dbId, { id: newId, values: newRecordData });
    setNewRecordData(null);
  };

  const handleUpdateRecord = (dbId: string, recordId: string, values: Record<string, any>) => {
    adminStore.updateRecord(dbId, recordId, values);
  };

  const handleDeleteRecord = (dbId: string, recordId: string) => {
    const dependencies = adminStore.checkDependencies(dbId, recordId);
    if (dependencies.length > 0) {
      setDeleteError({
        message: `Cannot delete record ${recordId}. It is referenced by other records.`,
        dependencies
      });
      return;
    }
    if (!confirm("Are you sure you want to delete this record?")) return;
    adminStore.deleteRecord(dbId, recordId);
  };

  const isProtectedField = (dbId: string, fieldId: string) => {
    if (fieldId === 'id') return true;
    if (dbId === 'tasks' && fieldId === 'title') return true;
    if (['roles', 'statuses', 'priorities'].includes(dbId) && fieldId === 'label') return true;
    if (['people', 'areas', 'projects', 'stages', 'disciplines', 'packages'].includes(dbId) && fieldId === 'name') return true;
    
    // Protected relations
    const protectedRels: Record<string, string> = {
      projects: 'areaId',
      stages: 'projectId',
      disciplines: 'stageId',
      packages: 'disciplineId'
    };
    if (protectedRels[dbId] === fieldId) return true;

    return false;
  };

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden font-sans text-stone-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-stone-200 bg-white flex flex-col shrink-0">
        <div className="p-6 border-b border-stone-200">
          <h1 className="text-xl font-bold tracking-tight">Stratum Admin</h1>
          <p className="text-[10px] text-stone-500 mt-1 uppercase tracking-widest font-bold">Engine v1 Console</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="px-3 py-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">System</span>
            </div>
            <button
              onClick={() => { setView('metadata'); setSelectedDbId(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'metadata' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
            >
              <Layers className="w-4 h-4" />
              <span>Level Labels</span>
            </button>
          </div>

          <div>
            <div className="px-3 py-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Databases</span>
            </div>
            <div className="space-y-1">
              {dbIds.map(id => (
                <button
                  key={id}
                  onClick={() => { setView('databases'); setSelectedDbId(id); setEditingRecordId(null); setNewRecordData(null); setEditingFieldId(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDbId === id ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <DbIcon className="w-4 h-4" />
                    <span>{snapshot.databases[id].name}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedDbId === id ? 'bg-white/20' : 'bg-stone-100'}`}>
                    {snapshot.databases[id].records.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-stone-200 bg-stone-50">
          <button
            onClick={() => onReset('seed')}
            className="w-full py-2 text-xs font-bold text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg bg-white transition-colors"
          >
            Reset System State
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Deletion Error Overlay */}
        {deleteError && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-white border border-rose-200 shadow-2xl rounded-2xl p-8">
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Deletion Blocked</h3>
              </div>
              <p className="text-sm text-stone-600 mb-6">{deleteError.message}</p>
              <div className="space-y-2 mb-8">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Dependencies Found:</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {deleteError.dependencies.map((d, i) => (
                    <div key={i} className="text-[10px] font-mono bg-stone-50 p-2 rounded border border-stone-100">
                      DB: <span className="text-stone-900 font-bold">{d.dbId}</span> • 
                      Record: <span className="text-stone-900 font-bold">{d.recordId}</span> • 
                      Field: <span className="text-stone-900 font-bold">{d.fieldId}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setDeleteError(null)}
                className="w-full py-3 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-colors"
              >
                Acknowledge
              </button>
            </div>
          </div>
        )}

        {view === 'metadata' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-16 border-b border-stone-200 bg-white px-8 flex items-center shrink-0">
              <h2 className="text-lg font-bold">Hierarchy Level Labels</h2>
            </header>
            <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto w-full space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800">
                  Labels defined here propagate to the Stratum Workspace and Diagnostics. 
                  The structural order (1-6) is fixed by the Stratum Engine.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3, 4, 5, 6].map(level => (
                  <div key={level} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-stone-200">
                    <span className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-full text-xs font-bold text-stone-400">
                      {level}
                    </span>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 block">Level {level} Label</label>
                      <input 
                        type="text"
                        value={snapshot.metadata[`level${level}` as keyof typeof snapshot.metadata] || ''}
                        onChange={(e) => handleUpdateMetadata(`level${level}`, e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : selectedDb ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* DB Header */}
            <header className="h-16 border-b border-stone-200 bg-white px-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-stone-100 rounded-lg">
                  <Table className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{selectedDb.name}</h2>
                  <p className="text-xs text-stone-500 uppercase font-bold tracking-tighter">
                    {selectedDb.type} Database • {selectedDb.records.length} Records
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const data: Record<string, any> = {};
                  selectedDb.fields.forEach(f => {
                    if (f.type === 'number') data[f.id] = 0;
                    else if (f.type === 'boolean') data[f.id] = false;
                    else data[f.id] = '';
                  });
                  setNewRecordData(data);
                  setEditingRecordId(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-lg hover:bg-stone-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Record
              </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* Field Config & Record List */}
              <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
                {/* Field Configuration */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-stone-400" />
                      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Schema Definition</h3>
                    </div>
                    <button 
                      onClick={() => handleAddField(selectedDb.id)}
                      className="text-[10px] font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Field
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedDb.fields.map(field => (
                      <div key={field.id} className={`bg-white p-4 rounded-xl border transition-all ${editingFieldId?.fieldId === field.id ? 'border-stone-900 ring-1 ring-stone-900' : 'border-stone-200 shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-stone-900">{field.label}</span>
                            {isProtectedField(selectedDb.id, field.id) && (
                              <span className="text-[8px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-bold uppercase">Protected</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {!isProtectedField(selectedDb.id, field.id) && (
                              <>
                                <button onClick={() => setEditingFieldId({ dbId: selectedDb.id, fieldId: field.id })} className="p-1 text-stone-400 hover:text-stone-900"><Edit3 className="w-3 h-3" /></button>
                                <button onClick={() => handleDeleteField(selectedDb.id, field.id)} className="p-1 text-stone-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {editingFieldId?.fieldId === field.id ? (
                          <div className="space-y-3 mt-4 pt-4 border-t border-stone-100">
                            <div>
                              <label className="text-[8px] font-bold text-stone-400 uppercase block mb-1">Label</label>
                              <input 
                                type="text"
                                value={field.label}
                                onChange={(e) => handleUpdateField(selectedDb.id, field.id, { label: e.target.value })}
                                className="w-full px-2 py-1 text-xs border rounded outline-none focus:border-stone-900"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold text-stone-400 uppercase block mb-1">Type</label>
                              <select 
                                value={field.type}
                                onChange={(e) => handleUpdateField(selectedDb.id, field.id, { type: e.target.value as any })}
                                className="w-full px-2 py-1 text-xs border rounded outline-none"
                              >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="boolean">Boolean</option>
                                <option value="date">Date</option>
                                <option value="relation">Relation</option>
                              </select>
                            </div>
                            {field.type === 'relation' && (
                              <div>
                                <label className="text-[8px] font-bold text-stone-400 uppercase block mb-1">Target Database</label>
                                <select 
                                  value={field.targetDatabaseId || ''}
                                  onChange={(e) => handleUpdateField(selectedDb.id, field.id, { targetDatabaseId: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border rounded outline-none"
                                >
                                  <option value="">Select Target...</option>
                                  {dbIds.map(id => <option key={id} value={id}>{snapshot.databases[id].name}</option>)}
                                </select>
                              </div>
                            )}
                            <button 
                              onClick={() => setEditingFieldId(null)}
                              className="w-full py-1.5 bg-stone-900 text-white text-[10px] font-bold rounded"
                            >
                              Save Field
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-stone-400 uppercase">{field.type}</span>
                              {field.type === 'relation' && (
                                <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold">
                                  <LinkIcon className="w-3 h-3" />
                                  {field.targetDatabaseId}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleUpdateField(selectedDb.id, field.id, { showInList: !field.showInList })}
                                className={`p-1 rounded transition-colors ${field.showInList ? 'text-emerald-500 bg-emerald-50' : 'text-stone-300'}`}
                                title="Show in List"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleUpdateField(selectedDb.id, field.id, { showInDetails: !field.showInDetails })}
                                className={`p-1 rounded transition-colors ${field.showInDetails ? 'text-blue-500 bg-blue-50' : 'text-stone-300'}`}
                                title="Show in Details"
                              >
                                <EyeOff className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Record List */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Table className="w-4 h-4 text-stone-400" />
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Records</h3>
                  </div>
                  <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200">
                          <th className="py-3 px-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">ID</th>
                          {selectedDb.fields.filter(f => f.showInList).slice(0, 3).map(f => (
                            <th key={f.id} className="py-3 px-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">{f.label}</th>
                          ))}
                          <th className="py-3 px-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDb.records.map(record => (
                          <tr key={record.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                            <td className="py-3 px-4 text-xs font-mono text-stone-400">{record.id}</td>
                            {selectedDb.fields.filter(f => f.showInList).slice(0, 3).map(f => (
                              <td key={f.id} className="py-3 px-4 text-sm text-stone-600">
                                {f.type === 'relation' ? (
                                  <span className="text-blue-500 font-bold text-[10px]">{record.values[f.id] || '-'}</span>
                                ) : String(record.values[f.id] || '-')}
                              </td>
                            ))}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => { setEditingRecordId(record.id); setNewRecordData(null); }}
                                  className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteRecord(selectedDb.id, record.id)}
                                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* Record Editor Panel */}
              {(editingRecordId || newRecordData) && (
                <aside className="w-96 border-l border-stone-200 bg-white flex flex-col shrink-0 overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-stone-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{editingRecordId ? 'Edit Record' : 'New Record'}</h3>
                      <p className="text-[10px] text-stone-400 font-mono">{editingRecordId || 'Draft'}</p>
                    </div>
                    <button 
                      onClick={() => { setEditingRecordId(null); setNewRecordData(null); }}
                      className="text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {selectedDb.fields.map(field => {
                      const record = editingRecordId ? selectedDb.records.find(r => r.id === editingRecordId) : null;
                      const value = editingRecordId ? record?.values[field.id] : newRecordData?.[field.id];
                      
                      return (
                        <div key={field.id} className="space-y-1.5">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex justify-between">
                            <span>{field.label}</span>
                            <span className="opacity-50 font-mono">{field.type}</span>
                          </label>
                          
                          {field.type === 'relation' ? (
                            <select
                              value={value || ''}
                              onChange={(e) => {
                                if (editingRecordId) handleUpdateRecord(selectedDb.id, editingRecordId, { [field.id]: e.target.value });
                                else setNewRecordData({ ...newRecordData!, [field.id]: e.target.value });
                              }}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                            >
                              <option value="">None</option>
                              {field.targetDatabaseId && snapshot.databases[field.targetDatabaseId]?.records.map(r => {
                                const targetDef = SCHEMA_REGISTRY[field.targetDatabaseId as any];
                                const primaryFieldId = targetDef?.fields[0].id || 'name';
                                return <option key={r.id} value={r.id}>{String(r.values[primaryFieldId] || r.id)}</option>;
                              })}
                            </select>
                          ) : field.type === 'boolean' ? (
                            <button
                              onClick={() => {
                                const next = !value;
                                if (editingRecordId) handleUpdateRecord(selectedDb.id, editingRecordId, { [field.id]: next });
                                else setNewRecordData({ ...newRecordData!, [field.id]: next });
                              }}
                              className={`w-full px-3 py-2 border rounded-lg text-xs font-bold transition-all ${value ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-stone-50 border-stone-200 text-stone-400'}`}
                            >
                              {value ? 'TRUE / ENABLED' : 'FALSE / DISABLED'}
                            </button>
                          ) : (
                            <input 
                              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                              value={value || ''}
                              onChange={(e) => {
                                const val = field.type === 'number' ? Number(e.target.value) : e.target.value;
                                if (editingRecordId) handleUpdateRecord(selectedDb.id, editingRecordId, { [field.id]: val });
                                else setNewRecordData({ ...newRecordData!, [field.id]: val });
                              }}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-6 border-t border-stone-200 bg-stone-50">
                    {!editingRecordId && (
                      <button 
                        onClick={() => handleAddRecord(selectedDb.id)}
                        className="w-full py-3 bg-stone-900 text-white text-sm font-bold rounded-xl hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Create Record
                      </button>
                    )}
                    {editingRecordId && (
                      <button 
                        onClick={() => setEditingRecordId(null)}
                        className="w-full py-3 bg-stone-100 text-stone-900 text-sm font-bold rounded-xl hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Done Editing
                      </button>
                    )}
                  </div>
                </aside>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-12 text-center">
            <DbIcon className="w-16 h-16 mb-6 opacity-10" />
            <h2 className="text-xl font-bold text-stone-900">Stratum Engine v1 Console</h2>
            <p className="max-w-xs mx-auto mt-2 text-sm">Select a database or system setting from the sidebar to manage your project schema and records.</p>
          </div>
        )}
      </main>
    </div>
  );
}
