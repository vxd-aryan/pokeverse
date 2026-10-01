"use client";

import Link from 'next/link';

// ============================================================
// JOURNEY SHELL
// ============================================================
// The chrome every Journey page sits in, and the one place the
// visual language is defined. Pages used to each carry their own
// copy of these styles, which meant a colour change had to be
// made five times; now they import `journeyStyles` instead.
// ============================================================

/**
 * Shared styles, injected via <GlobalStyle css={journeyStyles} />.
 */
export const journeyStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  /* One easing curve and one set of durations everywhere, so
     nothing in the Journey feels out of step with anything else. */
  :root {
    --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
    --ease-pop: cubic-bezier(0.34, 1.4, 0.64, 1);
    --t-fast: 140ms;
    --t-base: 260ms;
    --t-slow: 520ms;
    --t-travel: 900ms;
  }

  .jr-pixel { font-family: 'Press Start 2P', monospace; line-height: 1.7; }
  .jr-pixelated { image-rendering: pixelated; }

  .jr-root {
    background: #0b1120;
    background-image:
      linear-gradient(0deg, rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 16px 16px;
    color: #e2e8f0;
    font-family: ui-monospace, monospace;
  }

  .jr-panel {
    background: #0f172a;
    border: 3px solid #334155;
    box-shadow: inset -2px -2px 0 rgba(0,0,0,0.5), inset 2px 2px 0 rgba(255,255,255,0.05);
  }

  .jr-inset { background: #020617; border: 2px solid #1e293b; }

  .jr-type {
    font-size: 7px; text-transform: uppercase; letter-spacing: 0.08em;
    padding: 1px 4px; border: 1px solid #334155; color: #94a3b8;
  }

  .jr-tag {
    font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em;
    padding: 5px 8px; border: 1px solid #334155; color: #94a3b8; background: #0f172a;
  }
  .jr-tag-go { color: #facc15; border-color: #a16207; background: rgba(250,204,21,0.1); }
  .jr-tag-done { color: #4ade80; border-color: #15803d; background: rgba(34,197,94,0.1); }

  .jr-fill { transition: width var(--t-slow) var(--ease); }

  .jr-fade { animation: jrFade var(--t-base) var(--ease) both; }
  .jr-stagger { animation: jrFade var(--t-base) var(--ease) both; }
  @keyframes jrFade {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: none; }
  }

  .jr-btn {
    display: inline-block; padding: 12px 26px;
    font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em;
    border-bottom-width: 4px; border-bottom-style: solid;
    transition: filter var(--t-fast) var(--ease), transform var(--t-fast) var(--ease);
  }
  .jr-btn:hover:not(:disabled) { filter: brightness(1.1); }
  .jr-btn:active:not(:disabled) { transform: translateY(3px); border-bottom-width: 1px; }
  .jr-btn:disabled {
    background: #475569; color: #94a3b8; border-bottom-color: #1e293b; cursor: not-allowed;
  }
  .jr-btn-yellow { background: #facc15; color: #1c1917; border-bottom-color: #a16207; }
  .jr-btn-green  { background: #22c55e; color: #052e16; border-bottom-color: #15803d; }
  .jr-btn-red    { background: #ef4444; color: #ffffff; border-bottom-color: #991b1b; }
  .jr-btn-grey   { background: #475569; color: #ffffff; border-bottom-color: #1e293b; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

/**
 * Injects a stylesheet.
 *
 * Deliberately NOT styled-jsx (`<style jsx global>`): every style
 * block in the Journey is global, so scoping buys nothing, and
 * styled-jsx's JSX typings aren't always present depending on the
 * Next version and tsconfig — which fails the build with
 * "Property 'jsx' does not exist on type ...". A plain <style>
 * tag works everywhere and needs no types.
 */
export function GlobalStyle({ css }: { css: string }) {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

export function JourneyShell({
  children,
  wide,
}: {
  children: React.ReactNode;
  /** Maps and area views need more room than a status card. */
  wide?: boolean;
}) {
  return (
    <div className="jr-root min-h-screen p-3 md:p-6">
      <div className={wide ? 'max-w-6xl mx-auto' : 'max-w-2xl mx-auto'}>{children}</div>
      <GlobalStyle css={journeyStyles} />
    </div>
  );
}

/**
 * The visible stand-in for every state a page can't render in.
 * Nothing in the Journey returns null any more — a problem always
 * says what it is.
 */
export function StatusCard({
  title,
  body,
  action,
  secondary,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <div className="jr-panel p-6 text-center jr-fade">
      <p className="jr-pixel text-[11px] text-yellow-300 mb-3">{title}</p>
      <p className="text-[11px] text-slate-400 mb-5 leading-relaxed">{body}</p>
      <div className="flex gap-2 justify-center flex-wrap">
        {action && <Link href={action.href} className="jr-btn jr-btn-yellow">{action.label}</Link>}
        <Link href={secondary?.href ?? '/journey'} className="jr-btn jr-btn-grey">
          {secondary?.label ?? 'All Regions'}
        </Link>
      </div>
    </div>
  );
}
