'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  Database, 
  Shield, 
  Zap, 
  Plus,
  Search,
  ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useUIStore } from '../../src/store/uiStore';
import { useDataStore } from '../../src/store/dataStore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const adminSections = [
  { id: 'schema', name: 'Hierarchy Schema', icon: Database, description: 'Define project, phase, and deliverable labels.' },
  { id: 'users', name: 'User Management', icon: Users, description: 'Manage team members and their access levels.' },
  { id: 'roles', name: 'Roles & Permissions', icon: Shield, description: 'Configure granular permissions for each persona.' },
  { id: 'integrations', name: 'Integrations', icon: Zap, description: 'Connect external tools and services.' },
  { id: 'general', name: 'General Settings', icon: Settings, description: 'System-wide configuration and branding.' },
  { id: 'diagnostic', name: 'Diagnostic & Seed Data', icon: Database, description: 'Manage application state and seed data for testing.' },
];

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('schema');
  const { setBreadcrumb, setCurrentProject } = useUIStore();
  const { setSeedData, currentSeedType } = useDataStore();

  React.useEffect(() => {
    setCurrentProject('System Admin');
    setBreadcrumb([
      { id: 'console', title: 'Console' },
      { id: activeSection, title: activeSection.charAt(0).toUpperCase() + activeSection.slice(1) }
    ]);
  }, [activeSection, setBreadcrumb, setCurrentProject]);

  return (
    <div className="flex h-full bg-zinc-50/30">
      {/* Admin Sidebar */}
      <div className="w-64 border-r bg-white flex flex-col shrink-0">
        <div className="p-4 border-b">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-900">Admin Console</h2>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {adminSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all text-left",
                activeSection === section.id 
                  ? "bg-zinc-100 text-zinc-900" 
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <section.icon size={16} className={activeSection === section.id ? "text-blue-600" : "text-zinc-400"} />
              {section.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Admin Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                {adminSections.find(s => s.id === activeSection)?.name}
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                {adminSections.find(s => s.id === activeSection)?.description}
              </p>
            </div>
            <button className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors">
              <Plus size={14} />
              Add New
            </button>
          </div>

          {activeSection === 'schema' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border shadow-sm divide-y divide-zinc-100">
                {[
                  { level: 1, label: 'Area', icon: 'Map', count: 2 },
                  { level: 2, label: 'Project', icon: 'Folder', count: 12 },
                  { level: 3, label: 'Stage', icon: 'Activity', count: 45 },
                  { level: 4, label: 'Discipline', icon: 'Shield', count: 128 },
                  { level: 5, label: 'Package', icon: 'Box', count: 512 },
                ].map((item) => (
                  <div key={item.level} className="p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-500 font-mono text-xs border">
                        L{item.level}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-900">{item.label}</div>
                        <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Level {item.level} Structural Node</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs font-bold text-zinc-900">{item.count}</div>
                        <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Instances</div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-blue-50 border border-blue-100 rounded-lg">
                <h3 className="text-sm font-bold text-blue-900 mb-2">Hierarchy Engine Configuration</h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                  The Stratum Engine v1 uses a fixed structural hierarchy: Area → Project → Stage → Discipline → Package. 
                  Display labels can be customized here, but the underlying structural logic remains constant to ensure cross-project coordination.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'diagnostic' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h3 className="text-sm font-bold text-zinc-900 mb-4">Seed Data Management</h3>
                <p className="text-xs text-zinc-500 mb-6">
                  Select a seed data preset to load into the application. This will overwrite all current data.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setSeedData('blank')}
                    className={cn(
                      "p-4 border rounded-lg text-left transition-colors",
                      currentSeedType === 'blank' 
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" 
                        : "hover:border-blue-500 hover:bg-blue-50"
                    )}
                  >
                    <div className="font-bold text-sm text-zinc-900 mb-1">Blank Seed</div>
                    <div className="text-xs text-zinc-500">Clean onboarding experience with a single project and no operational data.</div>
                  </button>
                  <button
                    onClick={() => setSeedData('core')}
                    className={cn(
                      "p-4 border rounded-lg text-left transition-colors",
                      currentSeedType === 'core' 
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" 
                        : "hover:border-blue-500 hover:bg-blue-50"
                    )}
                  >
                    <div className="font-bold text-sm text-zinc-900 mb-1">Core Seed (Default)</div>
                    <div className="text-xs text-zinc-500">Credible, active portfolio with understandable project variations.</div>
                  </button>
                  <button
                    onClick={() => setSeedData('advanced')}
                    className={cn(
                      "p-4 border rounded-lg text-left transition-colors",
                      currentSeedType === 'advanced' 
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" 
                        : "hover:border-blue-500 hover:bg-blue-50"
                    )}
                  >
                    <div className="font-bold text-sm text-zinc-900 mb-1">Advanced Seed</div>
                    <div className="text-xs text-zinc-500">Richer portfolio showcasing deeper hierarchies and operational tension.</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection !== 'schema' && activeSection !== 'diagnostic' && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-dashed border-zinc-200">
              <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 mb-4">
                {React.createElement(adminSections.find(s => s.id === activeSection)!.icon, { size: 24 })}
              </div>
              <h3 className="text-sm font-bold text-zinc-900">Module Under Development</h3>
              <p className="text-xs text-zinc-500 mt-1">This administrative module will be implemented in a future step.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
