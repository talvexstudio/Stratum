"use client";

import React, { Suspense } from "react";
import { Layout } from "../../src/components/Layout";
import { StratumView } from "../../src/components/StratumView";
import { useAdminStore } from "../../src/hooks/useAdminStore";
import { useActivePersona } from "../../src/hooks/useActivePersona";

function StratumContent() {
  const { snapshot, remember, toggleRemember, resetToSeed, isHydrated } = useAdminStore();
  const { activePersona, isMounted } = useActivePersona();

  if (!isMounted || !snapshot || !activePersona) {
    return <div className="min-h-screen bg-stone-50" />;
  }

  return (
    <StratumView 
      snapshot={snapshot} 
      activePersona={activePersona} 
      remember={remember}
      toggleRemember={toggleRemember}
      resetToSeed={resetToSeed}
      isHydrated={isHydrated}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <Layout>
        <StratumContent />
      </Layout>
    </Suspense>
  );
}
