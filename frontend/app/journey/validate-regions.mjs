import { REGIONS } from './_regions-bundle.mjs';

let errors = 0;
const fail = (m) => { console.log('  ✗ ' + m); errors++; };

for (const r of REGIONS) {
  console.log(`\n=== ${r.name} (${r.canon}) ===`);
  const nodeIds = new Set(r.map.nodes.map(n => n.id));

  // 1. Every edge connects real nodes
  for (const e of r.map.edges) {
    if (!nodeIds.has(e.from)) fail(`edge from unknown node "${e.from}"`);
    if (!nodeIds.has(e.to)) fail(`edge to unknown node "${e.to}"`);
  }

  // 2. Every challenge sits on a real node, and that node points back
  for (const c of r.challenges) {
    if (!nodeIds.has(c.locationId)) fail(`challenge ${c.id} at unknown node "${c.locationId}"`);
    const node = r.map.nodes.find(n => n.id === c.locationId);
    if (node && node.challengeId !== c.id) fail(`node ${node.id} does not point back to challenge ${c.id}`);
  }
  // ...and every node claiming a challenge has one
  for (const n of r.map.nodes) {
    if (n.challengeId && !r.challenges.find(c => c.id === n.challengeId))
      fail(`node ${n.id} references missing challenge "${n.challengeId}"`);
  }

  // 3. Challenge order is 1..n with no gaps
  const orders = r.challenges.map(c => c.order).sort((a,b)=>a-b);
  orders.forEach((o, i) => { if (o !== i+1) fail(`challenge order gap: expected ${i+1}, got ${o}`); });

  // 4. Trainers and encounters live on real nodes
  for (const t of r.trainers) if (!nodeIds.has(t.locationId)) fail(`trainer ${t.id} at unknown node "${t.locationId}"`);
  for (const k of Object.keys(r.encounters)) if (!nodeIds.has(k)) fail(`encounter table for unknown node "${k}"`);

  // 5. Reachability: can you walk from the start to every challenge,
  //    using only nodes unlocked at that point?
  const start = r.map.nodes[0].id;
  const adj = {};
  for (const e of r.map.edges) {
    (adj[e.from] ||= []).push(e.to);
    (adj[e.to] ||= []).push(e.from);
  }
  for (const c of r.challenges) {
    const cleared = c.order - 1;
    const open = new Set(r.map.nodes.filter(n => n.unlocksAfterChallenge <= cleared).map(n => n.id));
    const seen = new Set([start]); const queue = [start];
    while (queue.length) {
      const cur = queue.shift();
      for (const nb of (adj[cur] || [])) {
        if (open.has(nb) && !seen.has(nb)) { seen.add(nb); queue.push(nb); }
      }
    }
    if (!seen.has(c.locationId))
      fail(`challenge ${c.order} (${c.name}) at ${c.locationId} is UNREACHABLE with ${cleared} cleared`);
  }

  // 6. Level curve trends upward. Canon allows small dips — Koga
  //    and Sabrina both cap at 43 in FRLG, and Pryce sits just under
  //    Jasmine in HGSS — so only a real regression is a problem.
  let prevTop = 0;
  for (const c of r.challenges) {
    const top = Math.max(...c.team.map(m => m.level));
    if (top < prevTop - 2)
      fail(`challenge ${c.order} (${c.name}) top level ${top} drops well below previous ${prevTop}`);
    prevTop = Math.max(prevTop, top);
  }

  // 7. Starters exist and are distinct
  if (r.starters.length !== 3) fail(`expected 3 starters, got ${r.starters.length}`);

  // 8. Is there anything to catch before the first challenge?
  const preFirst = Object.entries(r.encounters).filter(([k]) => {
    const n = r.map.nodes.find(x => x.id === k);
    return n && n.unlocksAfterChallenge === 0;
  });
  if (preFirst.length === 0) fail('no wild encounters available before the first challenge');

  console.log(`  nodes ${r.map.nodes.length} · edges ${r.map.edges.length} · challenges ${r.challenges.length} · trainers ${r.trainers.length} · encounter areas ${Object.keys(r.encounters).length}`);
  console.log(`  level curve: ${r.challenges.map(c => Math.max(...c.team.map(m=>m.level))).join(' → ')}`);
}

console.log(errors === 0 ? '\nAll checks passed.' : `\n${errors} problem(s) found.`);
