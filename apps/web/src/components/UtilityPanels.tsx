'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Info, 
  HelpCircle, 
  Shield, 
  Activity, 
  Box, 
  FolderKanban, 
  Users, 
  BarChart3, 
  Settings,
  CheckCircle2,
  Clock,
  DollarSign,
  Tag,
  Layers
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AboutContent = () => (
  <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2 flex items-center gap-2">
        <Activity size={14} className="text-emerald-500" />
        What is Stratum?
      </h3>
      <p>
        Stratum is a design delivery coordination system built specifically for complex architectural and engineering projects. 
        It solves the "coordination gap" by providing a rigid structural hierarchy that aligns with professional service contracts, 
        while allowing a fluid execution layer for day-to-day item management.
      </p>
    </section>

    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Intended Audience</h3>
      <p>
        Built for Project Directors, Design Managers, and Technical Leads who need to maintain structural integrity 
        across thousands of moving parts without losing the agility of modern item tracking.
      </p>
    </section>

    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Execution Model</h3>
      <ul className="space-y-2">
        <li className="flex gap-2">
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
          <span><strong>Structural Nodes:</strong> Fixed hierarchy (Area &gt; Project &gt; Stage &gt; Discipline).</span>
        </li>
        <li className="flex gap-2">
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
          <span><strong>Anchored Items:</strong> Execution items that float within structural containers.</span>
        </li>
        <li className="flex gap-2">
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
          <span><strong>Real-time Rollups:</strong> Automated health, budget, and progress analytics.</span>
        </li>
      </ul>
    </section>

    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">What's in the Demo?</h3>
      <ul className="space-y-1 text-[11px]">
        <li className="flex items-center gap-2"><CheckCircle2 size={10} className="text-emerald-500" /> Hardened v1.2 Contract Alignment</li>
        <li className="flex items-center gap-2"><CheckCircle2 size={10} className="text-emerald-500" /> 3-Pane Workspace Hierarchy</li>
        <li className="flex items-center gap-2"><CheckCircle2 size={10} className="text-emerald-500" /> Admin Feature Configuration</li>
        <li className="flex items-center gap-2"><CheckCircle2 size={10} className="text-emerald-500" /> Package-authored Budgets</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Future Roadmap</h3>
      <ul className="space-y-1 text-[11px]">
        <li className="flex items-center gap-2 text-zinc-400"><Clock size={10} /> Multi-tenant Production Auth</li>
        <li className="flex items-center gap-2 text-zinc-400"><Clock size={10} /> Real-time Multi-user Sync</li>
        <li className="flex items-center gap-2 text-zinc-400"><Clock size={10} /> Advanced Resource Leveling</li>
        <li className="flex items-center gap-2 text-zinc-400"><Clock size={10} /> External API Integrations</li>
      </ul>
    </section>

    <section className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-2">
        <Shield size={12} />
        Demo Disclaimer
      </h3>
      <p className="text-[11px] text-zinc-500 italic">
        This demo uses simulated personas and local browser persistence. 
        Production features like real-time multi-user collaboration, cloud storage, and enterprise auth are reserved for future phases.
      </p>
    </section>
  </div>
);

const HelpContent = ({ pathname }: { pathname: string }) => {
  if (pathname.startsWith('/workspace')) {
    return (
      <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Workspace Layout</h3>
          <p>The workspace is divided into three primary panes: Hierarchy Tree (Left), Item List (Center), and Details Panel (Right).</p>
        </section>
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Filtering</h3>
          <p>Use <strong>Local Filter</strong> to search within the current view, or <strong>Project-wide</strong> to find items across the entire project structure.</p>
        </section>
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Health Indicators</h3>
          <p>Nodes show color-coded status based on item completion, budget consumption, and schedule alignment.</p>
        </section>
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Role-based Editing</h3>
          <p>Your ability to edit fields like budgets or assignees depends on your active persona (Admin, Manager, Contributor).</p>
        </section>
      </div>
    );
  }

  if (pathname.startsWith('/projects')) {
    return (
      <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Portfolio View</h3>
          <p>The Projects page provides a high-level overview of all active project portfolios.</p>
        </section>
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Portfolio Summary</h3>
          <p>The top bar summarizes total budget, active items, and overall portfolio health across all visible projects.</p>
        </section>
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Ownership</h3>
          <p>Managers can only see and manage projects they own, while Admins have full visibility.</p>
        </section>
      </div>
    );
  }

  if (pathname.startsWith('/admin/features')) {
    return (
      <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Feature Gating</h3>
          <p>Enable or disable core system modules globally. Disabling a feature hides its associated UI and blocks its logic.</p>
        </section>
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Data Preservation</h3>
          <p>Disabling a feature (like Time Tracking) does not delete data; it simply makes it unavailable until re-enabled.</p>
        </section>
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Baseline Defaults</h3>
          <p>Use the "Restore Baseline" button to return the system to its standard v1.2 configuration.</p>
        </section>
      </div>
    );
  }

  if (pathname.startsWith('/diagnostics')) {
    return (
      <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">System Diagnostics</h3>
          <p>Monitor the health of the demo environment, including local storage persistence and persona state.</p>
        </section>
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Verification</h3>
          <p>Use this screen to verify that role gating and feature configuration are behaving as expected in the current session.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">General Help</h3>
        <p>Navigate through the sidebar to access different parts of the Stratum system.</p>
      </section>
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2">Persona Switching</h3>
        <p>Use the selector in the top bar to switch between different demo personas and see how the UI adapts.</p>
      </section>
    </div>
  );
};

export const UtilityPanels = () => {
  const pathname = usePathname();
  const { activeUtilityPanel, setActiveUtilityPanel } = useUIStore();

  const isOpen = activeUtilityPanel !== null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveUtilityPanel(null)}
            className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 border-l border-zinc-200 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                {activeUtilityPanel === 'about' ? (
                  <Info size={16} className="text-zinc-400" />
                ) : (
                  <HelpCircle size={16} className="text-zinc-400" />
                )}
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-900">
                  {activeUtilityPanel === 'about' ? 'About Stratum' : 'Contextual Help'}
                </h2>
              </div>
              <button
                onClick={() => setActiveUtilityPanel(null)}
                className="p-1 rounded-md hover:bg-zinc-100 text-zinc-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {activeUtilityPanel === 'about' ? (
                <AboutContent />
              ) : (
                <HelpContent pathname={pathname} />
              )}
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">
                Stratum v1.2.0-alpha
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
