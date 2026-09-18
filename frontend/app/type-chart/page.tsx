"use client";

import TypeChart from '@/components/TypeChart';

export default function TypeChartPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-widest">Type Chart</h1>
        <p className="text-slate-400 mt-2">
          Look up any type's strengths and weaknesses, or browse the full 18×18 matchup grid.
        </p>
      </div>
      <TypeChart defaultMode="lookup" />
    </div>
  );
}