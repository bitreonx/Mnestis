import type { MemoryModel } from '../types.js';
import type { MnemosGraph } from '../graph/graph.js';
import { detectSmells } from './smells.js';
import { analyzeGitHotspots } from './git-intel.js';
import { computeMemoryScore } from '../report.js';
import { computeAiReadiness } from '../ai-readiness.js';
import { computeDomainHeatmap } from './heatmap.js';

export interface CritiqueFinding {
  id: number;
  category: 'architecture' | 'security' | 'maintainability' | 'git-churn' | 'ai-readiness' | 'critical-path';
  severity: 'critical' | 'high' | 'medium' | 'low';
  threat: string;
  evidence: string;
}

export interface CritiqueRemediation {
  forId: number;
  fix: string;
  command?: string;
}

export interface CritiqueReport {
  repository: string;
  healthScore: number;
  devilFindings: CritiqueFinding[];
  angelRemediations: CritiqueRemediation[];
}

function severityFromSmell(s: 'high' | 'medium' | 'low'): CritiqueFinding['severity'] {
  if (s === 'high') return 'high';
  if (s === 'medium') return 'medium';
  return 'low';
}

export async function buildCritiqueReport(
  root: string,
  memory: MemoryModel,
  graph?: MnemosGraph | null,
): Promise<CritiqueReport> {
  const findings: CritiqueFinding[] = [];
  let id = 1;

  const score = computeMemoryScore(memory);
  const aiReady = computeAiReadiness(memory);

  if (score.overall < 60) {
    findings.push({
      id: id++,
      category: 'maintainability',
      severity: score.overall < 45 ? 'critical' : 'high',
      threat: `Repository health is weak (${score.overall}/100) — changes are likely to cause regressions.`,
      evidence: `Architecture clarity ${score.architectureClarity}, coupling ${score.coupling}, documentation ${score.documentationQuality}`,
    });
  }

  for (const cp of memory.criticalPaths.filter((p) => p.risk === 'high').slice(0, 5)) {
    findings.push({
      id: id++,
      category: 'critical-path',
      severity: 'high',
      threat: `High-risk critical path: ${cp.name}`,
      evidence: cp.description,
    });
  }

  const smells = graph ? detectSmells(graph) : memory.smells;
  for (const smell of smells.slice(0, 8)) {
    findings.push({
      id: id++,
      category: 'architecture',
      severity: severityFromSmell(smell.severity),
      threat: smell.description,
      evidence: smell.recommendation,
    });
  }

  const heatmap = computeDomainHeatmap(memory).sort((a, b) => b.riskScore - a.riskScore);
  for (const h of heatmap.filter((d) => d.riskScore >= 60).slice(0, 4)) {
    findings.push({
      id: id++,
      category: 'maintainability',
      severity: h.riskScore >= 80 ? 'high' : 'medium',
      threat: `Domain "${h.domain}" is a change-risk hotspot (${h.riskScore}/100)`,
      evidence: h.problems.length ? h.problems.join('; ') : 'Elevated coupling or complexity',
    });
  }

  const git = await analyzeGitHotspots(root, memory, { limit: 10 });
  if (git.available) {
    for (const h of git.hotspots.filter((x) => x.risk === 'high').slice(0, 5)) {
      findings.push({
        id: id++,
        category: 'git-churn',
        severity: 'medium',
        threat: `File "${h.file}" has heavy recent churn (${h.commits} commits)`,
        evidence: h.domain ? `Mapped to domain: ${h.domain}` : 'Unstable edit surface — tests may lag',
      });
    }
  }

  for (const rec of aiReady.recommendations.slice(0, 3)) {
    findings.push({
      id: id++,
      category: 'ai-readiness',
      severity: 'low',
      threat: 'Agent-assisted edits may miss context',
      evidence: rec,
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: 1,
      category: 'maintainability',
      severity: 'low',
      threat: 'No automatic high-severity findings — run manual Devil review on new features.',
      evidence: 'Automated scan found no critical smells, paths, or churn hotspots.',
    });
  }

  const remediations: CritiqueRemediation[] = findings.map((f) => ({
    forId: f.id,
    fix: defaultAngelFix(f),
    command: defaultAngelCommand(f),
  }));

  return {
    repository: memory.repository,
    healthScore: score.overall,
    devilFindings: findings,
    angelRemediations: remediations,
  };
}

function defaultAngelFix(f: CritiqueFinding): string {
  switch (f.category) {
    case 'architecture':
      return 'Address smell: extract boundaries, break cycles, or add tests on affected nodes before expanding.';
    case 'critical-path':
      return 'Add characterization tests; run `mnestis impact <node>` before edits; require review for this path.';
    case 'git-churn':
      return 'Stabilize with tests and smaller PRs; consider `mnestis hotspots` before the next refactor.';
    case 'security':
      return 'Audit auth/data paths; run `mnestis audit`; never commit secrets.';
    case 'ai-readiness':
      return 'Run `mnestis setup --platform cursor` and `mnestis build` so agents read DNA instead of grepping.';
    default:
      return 'Improve health incrementally: tests on hot paths, docs on domains, `mnestis review` before merge.';
  }
}

function defaultAngelCommand(f: CritiqueFinding): string | undefined {
  switch (f.category) {
    case 'architecture':
      return 'mnestis ask "what breaks if we refactor this module?"';
    case 'critical-path':
      return 'mnestis impact <central-node>';
    case 'git-churn':
      return 'mnestis hotspots';
    case 'ai-readiness':
      return 'mnestis setup --platform all --force';
    case 'maintainability':
      return 'mnestis score';
    default:
      return undefined;
  }
}

export function formatCritiqueReport(report: CritiqueReport): string {
  const lines: string[] = [
    `# Devil / Angel Critique — ${report.repository}`,
    '',
    `Health score: **${report.healthScore}/100**`,
    '',
    '## Devil — threats found',
    '',
  ];

  for (const f of report.devilFindings) {
    lines.push(
      `### ${f.id}. [${f.severity.toUpperCase()}] ${f.category}`,
      '',
      `**Threat:** ${f.threat}`,
      '',
      `**Evidence:** ${f.evidence}`,
      '',
    );
  }

  lines.push('## Angel — fixes', '');

  for (const r of report.angelRemediations) {
    const cmd = r.command ? `\n\`${r.command}\`` : '';
    lines.push(`- **#${r.forId}:** ${r.fix}${cmd}`, '');
  }

  lines.push(
    '---',
    '',
    '_Paste this into your agent session or use `mnestis brainstorm "<topic>"` for feature-level review._',
    '',
  );

  return lines.join('\n');
}

/** Structured UI implementation brief from user description. */
export function buildUiBrief(description: string, repository?: string): string {
  const repo = repository ?? 'this project';
  return `# UI implementation brief

> Generated by Mnestis — **implement the user spec**, do not redesign.

**Repository:** ${repo}

## User specification (source of truth)

${description.trim()}

---

## Agent checklist (complete before claiming done)

- [ ] Restated layout, hierarchy, copy, colors, spacing — matches user spec above
- [ ] Read existing UI patterns in repo (components, tokens, routes)
- [ ] If a reference **image** was provided: compared each section against the image
- [ ] No generic AI aesthetic drift (gradients, purple-dark themes, etc.) unless spec asks
- [ ] Responsive behavior defined or inherited from repo — not invented silently
- [ ] Accessibility: focus order, labels, contrast — per repo standards
- [ ] Visual verification run (dev server / screenshot / storybook if available)

## Devil quick scan (UI)

| Risk | Check |
|------|-------|
| Spec drift | Every major block maps to a user requirement |
| Broken mobile | Test narrow viewport if spec mentions mobile |
| State gaps | Loading, empty, error states defined or inherited |
| Copy | User's exact wording preserved unless they asked to edit |

## Angel — if something is ambiguous

Ask **one** focused question, then proceed with the most conservative interpretation of the spec.

---
`
}
