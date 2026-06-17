import type { MemoryModel } from '../types.js';
import { computeDomainHeatmap } from '../analysis/heatmap.js';

/** Escape labels for Mermaid node text. */
export function escapeMermaidLabel(text: string): string {
  return text
    .replace(/"/g, '#quot;')
    .replace(/[[\](){}]/g, '')
    .replace(/\n/g, ' ')
    .trim()
    .slice(0, 48);
}

export function wrapMermaid(body: string): string {
  return ['```mermaid', body.trim(), '```'].join('\n');
}

function domainGraphBody(memory: MemoryModel): string {
  const domains = memory.domains
    .filter((d) => !/^(test|tests|examples?|acceptance)$/i.test(d.name))
    .slice(0, 14);

  if (domains.length === 0) return 'flowchart LR\n  empty["No domains detected"]';

  const lines = ['flowchart LR'];
  const idMap = new Map<string, string>();

  domains.forEach((d, i) => {
    const id = `D${i}`;
    idMap.set(d.name, id);
    lines.push(`  ${id}["${escapeMermaidLabel(d.name)} (${d.nodes.length})"]`);
  });

  const seen = new Set<string>();
  for (const dep of memory.dependencies) {
    const fromDomain = memory.domains.find(
      (d) => dep.from.includes(d.name) || d.nodes.some((n) => dep.from.includes(String(n))),
    );
    const toDomain = memory.domains.find(
      (d) => dep.to.includes(d.name) || d.nodes.some((n) => dep.to.includes(String(n))),
    );
    if (!fromDomain || !toDomain || fromDomain.name === toDomain.name) continue;
    const key = `${fromDomain.name}->${toDomain.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const fromId = idMap.get(fromDomain.name);
    const toId = idMap.get(toDomain.name);
    if (fromId && toId) lines.push(`  ${fromId} --> ${toId}`);
    if (seen.size >= 24) break;
  }

  return lines.join('\n');
}

export function buildDomainGraphBody(memory: MemoryModel): string {
  return domainGraphBody(memory);
}

export function buildDomainGraphMermaid(memory: MemoryModel): string {
  return wrapMermaid(domainGraphBody(memory));
}

function flowGraphBody(memory: MemoryModel, flowIndex = 0): string {
  const flow = memory.flows[flowIndex];
  if (!flow) return 'flowchart LR\n  none["No flows detected"]';

  const lines = ['flowchart LR'];
  flow.steps.slice(0, 10).forEach((step, i) => {
    const id = `S${i}`;
    const kind = step.kind ? `${step.kind}: ` : '';
    lines.push(`  ${id}["${escapeMermaidLabel(kind + step.name)}"]`);
    if (i > 0) lines.push(`  S${i - 1} --> ${id}`);
  });
  return lines.join('\n');
}

export function buildFlowGraphBody(memory: MemoryModel, flowIndex = 0): string {
  return flowGraphBody(memory, flowIndex);
}

export function buildFlowGraphMermaid(memory: MemoryModel, flowIndex = 0): string {
  return wrapMermaid(flowGraphBody(memory, flowIndex));
}

function allFlowsOverviewBody(memory: MemoryModel): string {
  const flows = memory.flows.slice(0, 8);
  if (flows.length === 0) return 'flowchart TB\n  none["No flows detected"]';

  const lines = ['flowchart TB'];
  flows.forEach((f, i) => {
    lines.push(`  F${i}["${escapeMermaidLabel(f.name)}"]`);
    lines.push(`  F${i} --> E${i}["${escapeMermaidLabel(f.entryPoint)}"]`);
  });
  return lines.join('\n');
}

export function buildAllFlowsOverviewMermaid(memory: MemoryModel): string {
  return wrapMermaid(allFlowsOverviewBody(memory));
}

function criticalPathGraphBody(memory: MemoryModel): string {
  const paths = memory.criticalPaths.slice(0, 4);
  if (paths.length === 0) return 'flowchart TD\n  none["No critical paths flagged"]';

  const lines = ['flowchart TD'];
  paths.forEach((cp, pi) => {
    const risk = cp.risk === 'high' ? 'high' : cp.risk === 'medium' ? 'med' : 'low';
    lines.push(`  subgraph P${pi} ["${risk} ${escapeMermaidLabel(cp.name)}"]`);
    cp.nodes.slice(0, 6).forEach((n, i) => {
      const id = `P${pi}N${i}`;
      const label = typeof n === 'string' ? n.split('/').pop() ?? n : String(n);
      lines.push(`    ${id}["${escapeMermaidLabel(label)}"]`);
      if (i > 0) lines.push(`    P${pi}N${i - 1} --> ${id}`);
    });
    lines.push('  end');
  });
  return lines.join('\n');
}

export function buildCriticalPathGraphBody(memory: MemoryModel): string {
  return criticalPathGraphBody(memory);
}

export function buildCriticalPathGraphMermaid(memory: MemoryModel): string {
  return wrapMermaid(criticalPathGraphBody(memory));
}

function serviceDependencyGraphBody(memory: MemoryModel): string {
  const services = [...memory.services]
    .sort((a, b) => b.dependents.length - a.dependents.length)
    .slice(0, 12);

  if (services.length === 0) return 'flowchart TB\n  none["No services detected"]';

  const lines = ['flowchart TB'];
  const idMap = new Map<string, string>();

  services.forEach((s, i) => {
    const id = `SV${i}`;
    idMap.set(s.name, id);
    lines.push(`  ${id}["${escapeMermaidLabel(s.name)} (${s.dependents.length})"]`);
  });

  const seen = new Set<string>();
  for (const s of services) {
    const fromId = idMap.get(s.name);
    if (!fromId) continue;
    for (const dep of s.dependencies.slice(0, 4)) {
      const toId = idMap.get(dep);
      if (!toId) continue;
      const key = `${s.name}->${dep}`;
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(`  ${fromId} --> ${toId}`);
    }
  }
  return lines.join('\n');
}

export function buildServiceDependencyGraphBody(memory: MemoryModel): string {
  return serviceDependencyGraphBody(memory);
}

export function buildServiceDependencyGraphMermaid(memory: MemoryModel): string {
  return wrapMermaid(serviceDependencyGraphBody(memory));
}

function topDependenciesBody(memory: MemoryModel, limit = 15): string {
  const counts = new Map<string, number>();
  for (const d of memory.dependencies) {
    const key = `${d.from} → ${d.to}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  if (top.length === 0) return 'flowchart LR\n  none["No dependencies recorded"]';

  const lines = ['flowchart LR'];
  top.forEach(([pair, count], i) => {
    const [from, to] = pair.split(' → ');
    lines.push(`  A${i}["${escapeMermaidLabel(from ?? pair)}"] --> B${i}["${escapeMermaidLabel(to ?? '?')}"]`);
    lines.push(`  A${i} -. ${count}x .-> B${i}`);
  });
  return lines.join('\n');
}

export function buildTopDependenciesMermaid(memory: MemoryModel, limit = 15): string {
  return wrapMermaid(topDependenciesBody(memory, limit));
}

function architectureLayersBody(memory: MemoryModel): string {
  const layers = memory.architecture.layers;
  if (layers.length === 0) {
    return `flowchart TB\n  repo["${escapeMermaidLabel(memory.architecture.type)}"]`;
  }

  const lines = ['flowchart TB'];
  layers.forEach((layer, i) => {
    lines.push(`  L${i}["${escapeMermaidLabel(layer)}"]`);
    if (i > 0) lines.push(`  L${i - 1} --> L${i}`);
  });
  return lines.join('\n');
}

export function buildArchitectureLayersMermaid(memory: MemoryModel): string {
  return wrapMermaid(architectureLayersBody(memory));
}

function capabilitiesGraphBody(memory: MemoryModel): string {
  const caps = (memory.capabilities ?? []).slice(0, 8);
  if (caps.length === 0) return 'flowchart LR\n  none["No capabilities detected"]';

  const lines = ['flowchart LR'];
  caps.forEach((c, i) => {
    lines.push(`  C${i}["${escapeMermaidLabel(c.signature.name)}"]`);
    c.services.slice(0, 2).forEach((svc, j) => {
      const sid = `CS${i}_${j}`;
      lines.push(`  ${sid}["${escapeMermaidLabel(svc)}"]`);
      lines.push(`  C${i} --> ${sid}`);
    });
  });
  return lines.join('\n');
}

export function buildCapabilitiesGraphMermaid(memory: MemoryModel): string {
  return wrapMermaid(capabilitiesGraphBody(memory));
}

function journeyGraphBody(memory: MemoryModel, journeyIndex = 0): string {
  const journey = memory.journeys?.[journeyIndex];
  if (!journey) return 'flowchart LR\n  none["No user journeys detected"]';

  const lines = ['flowchart LR'];
  lines.push(`  start(["${escapeMermaidLabel(journey.signature.name)}"])`);
  lines.push(`  entry["${escapeMermaidLabel(journey.entryRoute ?? journey.entryPoint)}"]`);
  lines.push('  start --> entry');

  journey.systems.slice(0, 6).forEach((sys, i) => {
    const id = `J${i}`;
    lines.push(`  ${id}["${escapeMermaidLabel(sys)}"]`);
    if (i === 0) lines.push(`  entry --> ${id}`);
    else lines.push(`  J${i - 1} --> ${id}`);
  });
  return lines.join('\n');
}

export function buildJourneyGraphMermaid(memory: MemoryModel, journeyIndex = 0): string {
  return wrapMermaid(journeyGraphBody(memory, journeyIndex));
}

function riskHeatmapBody(memory: MemoryModel): string {
  const heatmap = [...computeDomainHeatmap(memory)].sort((a, b) => b.riskScore - a.riskScore).slice(0, 8);
  if (heatmap.length === 0) return 'flowchart LR\n  stable["All domains stable"]';

  const lines = ['flowchart LR'];
  heatmap.forEach((h, i) => {
    lines.push(`  R${i}["${escapeMermaidLabel(h.domain)} ${h.riskScore}"]`);
  });
  return lines.join('\n');
}

export function buildRiskHeatmapMermaid(memory: MemoryModel): string {
  return wrapMermaid(riskHeatmapBody(memory));
}

function smellsSeverityBody(memory: MemoryModel): string {
  const smells = memory.smells;
  if (smells.length === 0) {
    return 'pie showData title Architecture smells\n    "Clean" : 1';
  }

  const counts = { high: 0, medium: 0, low: 0 };
  for (const s of smells) {
    if (s.severity === 'high') counts.high++;
    else if (s.severity === 'medium') counts.medium++;
    else counts.low++;
  }

  const lines = ['pie showData title Architecture smells'];
  if (counts.high) lines.push(`    "High" : ${counts.high}`);
  if (counts.medium) lines.push(`    "Medium" : ${counts.medium}`);
  if (counts.low) lines.push(`    "Low" : ${counts.low}`);
  return lines.join('\n');
}

export function buildSmellsSeverityMermaid(memory: MemoryModel): string {
  return wrapMermaid(smellsSeverityBody(memory));
}

export function buildMemoryPipelineMermaid(): string {
  return wrapMermaid(`flowchart TB
  subgraph ingest [Ingest]
    SCAN[scanRepository] --> PARSE[parseFiles]
    PARSE --> GRAPH[buildGraph]
  end
  subgraph analyze [Analyze]
    GRAPH --> DOM[discoverDomains]
    GRAPH --> FLOW[discoverFlows]
    GRAPH --> CAP[discoverCapabilities]
    GRAPH --> SMELL[detectSmells]
  end
  subgraph output [Outputs]
    DOM --> MD[context md + graphs]
    FLOW --> MD
    CAP --> MD
    SMELL --> MD
    MD --> AGENTS[AGENTS.md + rules]
    MD --> MCP[MCP resources]
    MD --> UI[Dashboard + report]
  end`);
}

export function buildGraphIndexSections(memory: MemoryModel): Record<string, string> {
  return {
    overview: buildArchitectureLayersMermaid(memory),
    domains: buildDomainGraphMermaid(memory),
    flows: buildAllFlowsOverviewMermaid(memory),
    topFlow: buildFlowGraphMermaid(memory, 0),
    services: buildServiceDependencyGraphMermaid(memory),
    dependencies: buildTopDependenciesMermaid(memory),
    criticalPaths: buildCriticalPathGraphMermaid(memory),
    capabilities: buildCapabilitiesGraphMermaid(memory),
    journeys: buildJourneyGraphMermaid(memory, 0),
    risk: buildRiskHeatmapMermaid(memory),
    smells: buildSmellsSeverityMermaid(memory),
    pipeline: buildMemoryPipelineMermaid(),
  };
}
