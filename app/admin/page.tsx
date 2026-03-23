"use client";

import React, { Suspense } from "react";
import { Layout } from "../../src/components/Layout";
import { AdminView } from "../../src/components/AdminView";
import { useAdminStore } from "../../src/hooks/useAdminStore";

function AdminContent() {
  const { snapshot, isHydrated, remember, toggleRemember, resetToSeed, updateSnapshot } = useAdminStore();

  if (!snapshot) {
    return <div className="min-h-screen bg-stone-50" />;
  }

  return (
    <AdminView 
      snapshot={snapshot} 
      remember={remember}
      setRemember={toggleRemember}
      onReset={resetToSeed}
      isHydrated={isHydrated}
      updateSnapshot={updateSnapshot}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <Layout>
        <AdminContent />
      </Layout>
    </Suspense>
  );
}
