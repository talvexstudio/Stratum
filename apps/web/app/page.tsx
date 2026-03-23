'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Layers, 
  ArrowRight, 
  CheckCircle2,
  Lock,
  Box,
  Activity,
  FolderKanban,
  Layout,
  Target,
  Zap,
  LockIcon,
  Search,
  Copy
} from 'lucide-react';
import { useUIStore, SIMULATED_USERS, PersonaType } from '../src/store/uiStore';

const PERSONA_DESCRIPTIONS: Record<PersonaType, string> = {
  admin: "Full system access. Configure features, manage global settings, and oversee all projects.",
  manager: "Project owner. Manage budgets, assign tasks, and track health for specific project portfolios.",
  contributor: "Execution focused. Log time, update task status, and manage assigned work items.",
  observer: "Read-only access. Monitor progress and view reports without modifying data."
};

export default function LandingPage() {
  const router = useRouter();
  const { setSimulatedUser, setHasEnteredDemo, hasEnteredDemo } = useUIStore();
  const [showPersonas, setShowPersonas] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const overviewRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);
  const demoRef = useRef<HTMLElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasEnteredDemo) {
      router.push('/projects');
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasEnteredDemo, router]);

  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
    if (ref.current) {
      const offset = 72; // Stable header height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = ref.current.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleEnterDemo = (userId: string) => {
    setSimulatedUser(userId);
    setHasEnteredDemo(true);
    router.push('/projects');
  };

  const triggerDemoScroll = () => {
    if (!showPersonas) {
      setShowPersonas(true);
      // Small delay to allow section to mount/animate if needed, 
      // but since it's already in the DOM (just opacity 0 or similar), 
      // we can scroll. Actually AnimatePresence might remove it.
      setTimeout(() => scrollToSection(personaRef), 100);
    } else {
      scrollToSection(personaRef);
    }
  };

  if (hasEnteredDemo) {
    return null; // Prevent flash of landing page
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white scroll-smooth">
      {/* Sticky Header */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 border-b h-[72px] flex items-center ${
        isScrolled ? 'bg-white/90 backdrop-blur-md border-zinc-200 shadow-sm' : 'bg-white/50 border-transparent'
      }`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex items-center justify-between w-full">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-white font-bold text-lg">S</div>
            <span className="font-bold tracking-tighter text-xl">STRATUM</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection(overviewRef)} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Overview</button>
            <button onClick={() => scrollToSection(featuresRef)} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Features</button>
            <button onClick={() => scrollToSection(howItWorksRef)} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">How it works</button>
            <button onClick={() => triggerDemoScroll()} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Demo</button>
          </div>

          <button 
            onClick={triggerDemoScroll}
            className="rounded-full bg-zinc-900 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-zinc-800 active:scale-95"
          >
            Enter Demo
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header ref={overviewRef} className="relative overflow-hidden pt-40 pb-24 sm:pt-48 sm:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-center mb-8">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  <Activity size={12} className="text-emerald-500" />
                  Design Delivery Coordination
                </div>
              </div>
              <h1 className="text-6xl font-bold tracking-tight text-zinc-900 sm:text-7xl mb-6">
                STRATUM
              </h1>
              <p className="text-xl font-medium text-zinc-900 mb-4">
                Align structure, execution, and health in one unified workspace.
              </p>
              <p className="text-lg leading-8 text-zinc-600 mb-10">
                Stratum is a design delivery coordination system built for complex architectural and engineering projects. 
                It bridges the gap between high-level project structure and day-to-day execution.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={triggerDemoScroll}
                  className="w-full sm:w-auto group relative flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95"
                >
                  Enter Demo
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => scrollToSection(howItWorksRef)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-white border border-zinc-200 px-8 py-4 text-sm font-bold text-zinc-600 transition-all hover:bg-zinc-50 hover:border-zinc-300"
                >
                  See how it works
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Why Stratum / Problem Framing */}
      <section className="py-24 bg-zinc-50 border-y border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">The Challenge</h2>
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">
              Most delivery tools fragment hierarchy, execution, and health.
            </h3>
            <div className="space-y-6 text-lg text-zinc-600 leading-relaxed">
              <p>
                Teams often lose context when moving between high-level portfolio views and detailed work items. 
                Information becomes siloed, and project health signals are delayed or disconnected from the actual work.
              </p>
              <p className="font-medium text-zinc-900">
                Stratum keeps these aligned in one operational model. 
                By anchoring execution directly to the project hierarchy, we ensure that every task contributes to a clear, measurable outcome.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section ref={featuresRef} className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Capabilities</h2>
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900">Built for operational precision.</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { 
                title: "Structured Hierarchy", 
                desc: "Organize work by Area, Project, Stage, and Discipline with rigid structural integrity.",
                icon: <Layers size={20} />
              },
              { 
                title: "Execution Anchoring", 
                desc: "Tasks anchor to structural nodes but remain fluid for responsive team coordination.",
                icon: <Target size={20} />
              },
              { 
                title: "Health Signals", 
                desc: "Real-time indicators for schedule, budget, and resource alignment at every level.",
                icon: <Zap size={20} />
              },
              { 
                title: "Ownership & Permissions", 
                desc: "Granular control over who can edit, view, and manage specific parts of the project tree.",
                icon: <LockIcon size={20} />
              },
              { 
                title: "Explorer Navigation", 
                desc: "A familiar, powerful explorer interface for drilling down into complex project structures.",
                icon: <Search size={20} />
              },
              { 
                title: "Template Engine", 
                desc: "Standardize delivery by spinning up new projects from proven structural templates.",
                icon: <Copy size={20} />
              }
            ].map((feature) => (
              <div key={feature.title} className="p-8 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-900 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center mb-6 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-3">{feature.title}</h4>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flexible Implementation Section */}
      <section className="py-24 bg-zinc-50 border-y border-zinc-200 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-600 mb-4">Flexible Implementation</h2>
              <h3 className="text-3xl font-bold tracking-tight text-zinc-900 mb-6">
                Configure the system to match your practice.
              </h3>
              <p className="text-lg text-zinc-600 leading-relaxed">
                Enable only the capabilities your team needs. Stratum supports phased adoption, 
                allowing each practice to activate features according to its delivery model, 
                governance needs, and operational maturity.
              </p>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl overflow-hidden">
                <img 
                  src="/setting-features.png" 
                  alt="Feature Configuration" 
                  className="w-full h-auto rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src = "https://picsum.photos/seed/config/800/600";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={howItWorksRef} className="py-24 bg-white text-zinc-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Process</h2>
            <h3 className="text-3xl font-bold tracking-tight">Three steps to alignment.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Set up structure", desc: "Define your project hierarchy or use a template to standardize your delivery model." },
              { step: "02", title: "Manage execution", desc: "Assign owners, log time, and track task progress directly within the hierarchy." },
              { step: "03", title: "Monitor health", desc: "Get instant visibility into budget burn, schedule risks, and resource allocation." }
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-5xl font-bold text-zinc-200 mb-6">{item.step}</div>
                <h4 className="text-lg font-bold mb-3">{item.title}</h4>
                <p className="text-zinc-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Teaser Section */}
      <section className="py-24 sm:py-32 bg-zinc-50 border-y border-zinc-200 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Preview</h2>
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900">Operational visibility.</h3>
          </div>

          <div className="flex flex-col gap-16 max-w-5xl mx-auto">
            <div className="space-y-4">
              <div className="p-1 rounded-2xl bg-zinc-100 border border-zinc-200 shadow-sm overflow-hidden group">
                <div className="bg-white rounded-xl overflow-hidden border border-zinc-200 relative">
                  <img 
                    src="/portfolio-overview.png" 
                    alt="Portfolio Overview" 
                    className="w-full h-auto"
                    onError={(e) => {
                      e.currentTarget.src = "https://picsum.photos/seed/portfolio/1200/800";
                    }}
                  />
                </div>
              </div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-2">Portfolio overview</p>
            </div>
            
            <div className="space-y-4">
              <div className="p-1 rounded-2xl bg-zinc-100 border border-zinc-200 shadow-sm overflow-hidden">
                <div className="bg-white rounded-xl overflow-hidden border border-zinc-200 relative">
                  <img 
                    src="/workspace-drilldown.png" 
                    alt="Workspace Drilldown" 
                    className="w-full h-auto"
                    onError={(e) => {
                      e.currentTarget.src = "https://picsum.photos/seed/workspace/600/600";
                    }}
                  />
                </div>
              </div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-2">Workspace drilldown</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section ref={demoRef} className="py-24 sm:py-32 border-t border-zinc-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl mb-6">
              Ready to explore the model?
            </h2>
            <p className="text-lg text-zinc-600 mb-10">
              Enter the demo environment to experience Stratum firsthand. 
              Switch between personas to see how different roles interact with the system.
            </p>
            
            <div className="flex flex-col items-center gap-8">
              {!showPersonas ? (
                <button
                  onClick={triggerDemoScroll}
                  className="group relative flex items-center gap-2 rounded-full bg-zinc-900 px-12 py-5 text-sm font-bold text-white transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95"
                >
                  Enter Demo
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <div className="text-sm font-medium text-zinc-400 animate-pulse">
                  Select a persona below to begin
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Persona Selection */}
      <AnimatePresence>
        {showPersonas && (
          <div ref={personaRef}>
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="py-12 bg-zinc-50 border-y border-zinc-200"
            >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Choose your perspective</h2>
                <p className="mt-2 text-sm text-zinc-500">Experience Stratum through different organizational roles.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {['admin', 'manager', 'contributor', 'observer'].map((role) => {
                  const user = SIMULATED_USERS.find(u => u.role === role);
                  if (!user) return null;
                  
                  return (
                    <button
                      key={role}
                      onClick={() => handleEnterDemo(user.id)}
                      className="group flex flex-col text-left p-6 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-900 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        {role === 'admin' && <Shield size={20} />}
                        {role === 'manager' && <FolderKanban size={20} />}
                        {role === 'contributor' && <Users size={20} />}
                        {role === 'observer' && <BarChart3 size={20} />}
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-2">{role}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed flex-1">
                        {PERSONA_DESCRIPTIONS[role as PersonaType]}
                      </p>
                      <div className="mt-6 flex items-center text-[10px] font-bold text-zinc-400 group-hover:text-zinc-900 transition-colors uppercase tracking-tight">
                        Enter as {user.name}
                        <ArrowRight size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>

      {/* Demo Disclaimer */}
      <footer className="py-12 border-t border-zinc-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
              <Lock size={12} />
              Demo Environment
            </div>
            <p className="max-w-xl text-xs text-zinc-400 leading-relaxed">
              This is a simulated demonstration of the Stratum platform. 
              Real authentication, multi-tenant databases, and production security layers are scheduled for future roadmap phases. 
              All data is currently persisted locally in your browser session.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
