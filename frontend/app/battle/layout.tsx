export default function BattleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/30">
      {children}
    </div>
  );
}