
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { TEMPORARY_PERSONAS, Persona } from '../personas';

const SESSION_STORAGE_KEY = "talvex-active-persona";

export function useActivePersona() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const queryId = searchParams.get('as');
    const storedId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    
    let resolved: Persona | undefined;

    if (queryId) {
      resolved = TEMPORARY_PERSONAS.find(p => p.id === queryId);
    }

    if (!resolved && storedId) {
      resolved = TEMPORARY_PERSONAS.find(p => p.id === storedId);
    }

    if (!resolved) {
      resolved = TEMPORARY_PERSONAS[0];
    }

    setActivePersona(resolved);

    // Sync sessionStorage
    if (resolved.id !== storedId) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, resolved.id);
    }

    // Sync URL query
    if (resolved.id !== queryId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('as', resolved.id);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [isMounted, searchParams, pathname, router]);

  const switchPersona = (id: string) => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    const params = new URLSearchParams(searchParams.toString());
    params.set('as', id);
    router.push(`${pathname}?${params.toString()}`);
  };

  return {
    activePersona,
    isMounted,
    switchPersona,
    isAdmin: activePersona?.roleId === 'admin'
  };
}
