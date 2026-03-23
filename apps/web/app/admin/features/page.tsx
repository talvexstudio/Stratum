'use client';

import React from 'react';
import { FeatureConfigPanel } from '../../../src/components/FeatureConfigPanel';

export default function AdminFeaturesPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-white custom-scrollbar">
      <FeatureConfigPanel />
    </main>
  );
}
