
"use client";

import { useState, useEffect, useCallback } from 'react';
import { adminStore } from '../store/adminStore';
import { AdminSnapshot } from '../types';

export function useAdminStore() {
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(adminStore.getSnapshot());
  const [isHydrated, setIsHydrated] = useState(adminStore.getIsHydrated());
  const [remember, setRemember] = useState(adminStore.getRemember());

  useEffect(() => {
    const unsubscribe = adminStore.subscribe(() => {
      setSnapshot(adminStore.getSnapshot());
      setIsHydrated(adminStore.getIsHydrated());
      setRemember(adminStore.getRemember());
    });

    // Initial hydration if not already done
    if (!adminStore.getIsHydrated()) {
      adminStore.hydrate(new Date().toISOString());
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const updateSnapshot = useCallback((updater: (prev: AdminSnapshot) => AdminSnapshot) => {
    const current = adminStore.getSnapshot();
    if (current) {
      const next = updater(current);
      adminStore.setSnapshot(next);
    }
  }, []);

  const resetToSeed = useCallback((mode: 'seed' | 'all') => {
    const todayIso = new Date().toISOString();
    if (mode === 'seed') {
      adminStore.resetToSeed(todayIso);
    } else {
      // For 'all', we might want to clear non-system records but keep schema
      // For now, resetToSeed is fine as a demo
      adminStore.resetToSeed(todayIso);
    }
  }, []);

  const toggleRemember = useCallback((val: boolean) => {
    adminStore.setRemember(val);
  }, []);

  return {
    snapshot,
    isHydrated,
    remember,
    updateSnapshot,
    resetToSeed,
    toggleRemember
  };
}
