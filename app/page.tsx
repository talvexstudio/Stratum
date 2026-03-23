"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { Layout } from "../src/components/Layout";
import { useActivePersona } from "../src/hooks/useActivePersona";
import { getLinkWithPersona } from "../src/lib/navigation";
import { Layers, Shield, ArrowRight } from "lucide-react";

function HomeContent() {
  const { activePersona, isAdmin } = useActivePersona();
  
  const link = (path: string) => getLinkWithPersona(path, activePersona);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12 py-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight text-stone-900">Talvex Stratum</h1>
        <p className="text-xl text-stone-500 max-w-2xl mx-auto">
          A schema-driven project hierarchy and execution platform. 
          Manage complex project structures with precision and isolation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Link 
          href={link('/stratum')}
          className="group p-8 bg-white border border-stone-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-stone-900 transition-all"
        >
          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-900 mb-6 group-hover:bg-stone-900 group-hover:text-white transition-colors">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Stratum View</h2>
          <p className="text-stone-500 mb-6">
            Explore and manage project hierarchies, stages, disciplines, and tasks.
          </p>
          <div className="flex items-center text-sm font-bold text-stone-900 gap-2">
            Enter Stratum <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {isAdmin && (
          <Link 
            href={link('/admin')}
            className="group p-8 bg-white border border-stone-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-stone-900 transition-all"
          >
            <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-900 mb-6 group-hover:bg-stone-900 group-hover:text-white transition-colors">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Admin Console</h2>
            <p className="text-stone-500 mb-6">
              Configure database schemas, manage records, and system-wide settings.
            </p>
            <div className="flex items-center text-sm font-bold text-stone-900 gap-2">
              Open Console <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        )}

        {!isAdmin && (
          <div className="p-8 bg-stone-100/50 border border-stone-200 rounded-3xl flex flex-col items-center justify-center text-center opacity-60">
            <div className="w-12 h-12 bg-stone-200 rounded-2xl flex items-center justify-center text-stone-400 mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-stone-400 mb-2">Admin Console</h2>
            <p className="text-stone-400 text-sm">
              Restricted to Administrator persona.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <Layout>
        <HomeContent />
      </Layout>
    </Suspense>
  );
}
