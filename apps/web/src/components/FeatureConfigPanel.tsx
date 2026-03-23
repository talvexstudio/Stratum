'use client';

import React from 'react';
import { useUIStore } from '../store/uiStore';
import { 
  Clock, 
  DollarSign, 
  Layout, 
  Tag, 
  Layers,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';

export const FeatureConfigPanel = () => {
  const { featureConfig, setFeatureConfig, activePersona } = useUIStore();

  if (activePersona !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="text-zinc-400" size={32} />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Access Restricted</h2>
        <p className="text-zinc-500 max-w-md">
          Only users with the Admin persona can modify organization-level feature configurations.
        </p>
      </div>
    );
  }

  const toggleFeature = (key: keyof typeof featureConfig) => {
    setFeatureConfig({
      ...featureConfig,
      [key]: !featureConfig[key]
    });
  };

  const features = [
    {
      id: 'timeTracking',
      name: 'Time Tracking',
      description: 'Enable time logging, spent propagation, and effort analysis.',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'budgeting',
      name: 'Budgeting',
      description: 'Enable package-level budget authoring and financial rollups.',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      id: 'dashboardModules',
      name: 'Dashboard Modules',
      description: 'Enable advanced analytics modules and progress rollups.',
      icon: Layout,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'tags',
      name: 'Tags',
      description: 'Enable task categorization using custom metadata tags.',
      icon: Tag,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      id: 'subtasks',
      name: 'Subtasks',
      description: 'Enable hierarchical item decomposition (Items can have Sub-items).',
      icon: Layers,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Feature Configuration</h1>
        <p className="text-zinc-500 mt-1">
          Control which modules are active across the entire organization.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex gap-3">
        <AlertCircle className="text-amber-600 shrink-0" size={20} />
        <div>
          <div className="text-sm font-bold text-amber-900">Administrative Control</div>
          <div className="text-xs text-amber-800 mt-0.5">
            Disabling a feature hides its UI elements and blocks related actions. 
            Existing data is preserved but will not be accessible until the feature is re-enabled.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {features.map((feature) => {
          const isEnabled = featureConfig[feature.id as keyof typeof featureConfig];
          const Icon = feature.icon;

          return (
            <div 
              key={feature.id}
              className={clsx(
                "flex items-center justify-between p-5 rounded-xl border transition-all",
                isEnabled 
                  ? "bg-white border-zinc-200 shadow-sm" 
                  : "bg-zinc-50 border-zinc-200 opacity-75"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={clsx("p-3 rounded-lg", feature.bgColor, feature.color)}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900">{feature.name}</h3>
                  <p className="text-sm text-zinc-500 mt-0.5 max-w-md">
                    {feature.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleFeature(feature.id as keyof typeof featureConfig)}
                className={clsx(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  isEnabled ? "bg-zinc-900" : "bg-zinc-200"
                )}
              >
                <span
                  className={clsx(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    isEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-12 pt-8 border-t border-zinc-100 flex justify-between items-center">
        <div className="text-xs text-zinc-400 font-mono">
          PERSISTENCE: LOCAL_STORAGE (SIMULATED)
        </div>
        <button 
          onClick={() => {
            // Reset to baseline
            setFeatureConfig({
              timeTracking: true,
              budgeting: true,
              dashboardModules: true,
              tags: true,
              subtasks: true
            });
          }}
          className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          RESTORE BASELINE DEFAULTS
        </button>
      </div>
    </div>
  );
};
