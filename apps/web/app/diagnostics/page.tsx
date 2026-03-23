'use client';

import React from 'react';
import { useUIStore } from '../../src/store/uiStore';
import { useDataStore } from '../../src/store/dataStore';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DiagnosticsPage() {
  const { setBreadcrumb, setCurrentProject, resetUIState, setFeatureConfig } = useUIStore();
  const { resetDemoData, setSeedData, currentSeedType } = useDataStore();
  const router = useRouter();

  React.useEffect(() => {
    setCurrentProject('System Diagnostics');
    setBreadcrumb([
      { id: 'system', title: 'System' },
      { id: 'health', title: 'Health & Status' }
    ]);
  }, [setBreadcrumb, setCurrentProject]);

  const [isConfirming, setIsConfirming] = React.useState(false);

  React.useEffect(() => {
    if (isConfirming) {
      const timer = setTimeout(() => setIsConfirming(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isConfirming]);

  const handleReset = () => {
    if (!isConfirming) {
      console.log('Reset button clicked: entering confirmation state');
      setIsConfirming(true);
      return;
    }
    
    console.log('Reset confirmed: executing reset actions');
    try {
      resetDemoData();
      resetUIState();
      
      // Ensure feature config matches the seed after reset
      if (currentSeedType === 'advanced') {
        setFeatureConfig({
          timeTracking: true,
          budgeting: true,
          tags: true,
          subtasks: true,
        });
      } else {
        setFeatureConfig({
          timeTracking: false,
          budgeting: false,
          tags: false,
          subtasks: false,
        });
      }
      
      console.log('Reset actions completed, redirecting...');
      router.push('/projects');
    } catch (error) {
      console.error('Reset failed:', error);
      setIsConfirming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/30 overflow-y-auto">
      <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Diagnostics</h1>
            <p className="text-zinc-500 mt-1">Monitor system health, versioning, and environment configurations.</p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">System Status</div>
            <div className="text-2xl font-bold text-emerald-600">Healthy</div>
          </div>
          
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Version</div>
            <div className="text-2xl font-bold text-zinc-900">v1.0.0-alpha</div>
          </div>
          
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Environment</div>
            <div className="text-2xl font-bold text-zinc-900">Development</div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b bg-zinc-50/50">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">System Information</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3 text-sm">
                <span className="text-zinc-500 font-medium">Node.js Version</span>
                <span className="font-mono text-zinc-900 bg-zinc-50 px-2 py-1 rounded border border-zinc-100 text-xs">v22.x.x</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3 text-sm">
                <span className="text-zinc-500 font-medium">Framework</span>
                <span className="font-mono text-zinc-900 bg-zinc-50 px-2 py-1 rounded border border-zinc-100 text-xs">Next.js 15+</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-medium">Database</span>
                <span className="font-mono text-zinc-900 bg-zinc-50 px-2 py-1 rounded border border-zinc-100 text-xs">In-Memory (Zustand)</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b bg-zinc-50/50">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Data Management</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-zinc-500">
                Reset the application state to the canonical QA seed data. This will revert all manual changes made during the session.
              </p>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isConfirming 
                      ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200" 
                      : "bg-zinc-900 text-white hover:bg-zinc-800"
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${isConfirming ? "animate-spin" : ""}`} />
                  {isConfirming ? "Confirm Reset Now" : "Reset Demo Data"}
                </button>
                
                {isConfirming && (
                  <button
                    onClick={() => setIsConfirming(false)}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
              
              {isConfirming && (
                <p className="text-[11px] text-red-600 font-medium animate-pulse">
                  Warning: This will clear all local changes and reset the UI.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b bg-zinc-50/50">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Seed Data Presets</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-zinc-500 mb-6">
              Select a seed data preset to load into the application. This will overwrite all current data.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setSeedData('blank');
                  setFeatureConfig({
                    timeTracking: false,
                    budgeting: false,
                    tags: false,
                    subtasks: false,
                  });
                }}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  currentSeedType === 'blank' 
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" 
                    : "hover:border-blue-500 hover:bg-blue-50"
                }`}
              >
                <div className="font-bold text-sm text-zinc-900 mb-1">Blank Seed</div>
                <div className="text-xs text-zinc-500">Clean onboarding experience with a single project and no operational data.</div>
              </button>
              <button
                onClick={() => {
                  setSeedData('core');
                  setFeatureConfig({
                    timeTracking: false,
                    budgeting: false,
                    tags: false,
                    subtasks: false,
                  });
                }}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  currentSeedType === 'core' 
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" 
                    : "hover:border-blue-500 hover:bg-blue-50"
                }`}
              >
                <div className="font-bold text-sm text-zinc-900 mb-1">Core Seed (Default)</div>
                <div className="text-xs text-zinc-500">Credible, active portfolio with understandable project variations.</div>
              </button>
              <button
                onClick={() => {
                  setSeedData('advanced');
                  setFeatureConfig({
                    timeTracking: true,
                    budgeting: true,
                    tags: true,
                    subtasks: true,
                  });
                }}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  currentSeedType === 'advanced' 
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" 
                    : "hover:border-blue-500 hover:bg-blue-50"
                }`}
              >
                <div className="font-bold text-sm text-zinc-900 mb-1">Advanced Seed</div>
                <div className="text-xs text-zinc-500">Richer portfolio showcasing deeper hierarchies and operational tension.</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
