
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Persona } from '../personas';

export function useAdminGate(activePersona: Persona | null, isMounted: boolean) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isMounted || !activePersona) return;

    if (pathname.startsWith('/admin')) {
      if (activePersona.roleId !== 'admin') {
        const params = new URLSearchParams();
        params.set('as', activePersona.id);
        router.replace(`/stratum?${params.toString()}`);
      }
    }
  }, [isMounted, activePersona, pathname, router]);

  const isUnauthorized = pathname.startsWith('/admin') && activePersona?.roleId !== 'admin';

  return { isUnauthorized };
}
