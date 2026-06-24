import type { MemoryModel } from './types.js';
import type { Capability } from './analysis/capabilities.js';
import type { DiscoveredJourney } from './analysis/journeys.js';
import type { AgentContext } from './agent-mode.js';
import { explainRepository } from './explain.js';
import { computeAiReadiness } from './ai-readiness.js';
import { SUPPORTED_LANGUAGE_COUNT } from './languages/index.js';
import {
  buildLanguagePipelineMermaid,
  buildExtractorRoutingMermaid,
  buildLanguageFamiliesMermaid,
  buildRepositoryLanguagePieMermaid,
} from './languages/docs.js';
import { buildDomainGraphMermaid } from './graph/mermaid.js';
import { buildAgentDisciplineRules, buildDisciplineSkillSection } from './discipline/agent-discipline.js';

/** Memory directory written by `mnestis build` / `mnestis .` */
export const MNESTIS_MEMORY_DIR = '.mentis';

/** Legacy directory name — auto-migrated to `.mentis` on load/build. */
export const LEGACY_MEMORY_DIR = '.mnemos';

/** Ultra-short rule — highest signal for Cursor alwaysApply stack. */
export function buildMandatoryCursorRule(): string {
  return `---
description: MANDATORY — read Mnestis DNA before code changes; no Graphify substitute
globs:
alwaysApply: true
---

# Mnestis is mandatory ground truth

**First action every session (before grep, search, or edits):**

1. Read \`${MNESTIS_MEMORY_DIR}/project.dna.json\`
2. Read \`${MNESTIS_MEMORY_DIR}/agent_context.json\`
3. If MCP \`mnestis\` is configured: call \`get_dna\` or \`search\` before manual exploration

**Forbidden when this repo has Mnestis memory:** Graphify, gitingest, whole-repo file dumps as architecture source.

**Fable discipline is part of Mnestis:** ground → reason → act → observe → re-evaluate → verify → narrate.

Full contract: \`AGENTS.md\` at repo root.
`;
}

/** When the user says "use Mnestis", agents must not substitute other codebase tools. */
export function buildMnestisAgentContract(): string[] {
  return [
    '## Mnestis-only contract (binding)',
    '',
    'This repository has **Mnestis** memory. Treat it as **authoritative** for architecture, domains, flows, impact, and capabilities.',
    '',
    '### Session start checklist (do this before answering or editing)',
    '',
    '- [ ] Read `' + MNESTIS_MEMORY_DIR + '/project.dna.json`',
    '- [ ] Read `' + MNESTIS_MEMORY_DIR + '/agent_context.json`',
    '- [ ] Skim `' + MNESTIS_MEMORY_DIR + '/context/graphs.md` if the task is architectural',
    '- [ ] Enable/use **fable-mindset** (Claude) or discipline rules (Cursor) for multi-step work',
    '- [ ] Confirm MCP `mnestis` is available; if yes, use it instead of blind grepping',
    '',
    '### Required workflow (in order)',
    '',
    `1. **DNA:** \`${MNESTIS_MEMORY_DIR}/project.dna.json\` → \`${MNESTIS_MEMORY_DIR}/agent_context.json\``,
    '2. **MCP:** `get_dna`, `search`, `impact_analysis`, `list_domains`, `list_flows` — before repo-wide grep',
    `3. **Graphs:** \`${MNESTIS_MEMORY_DIR}/context/graphs.md\`, \`architecture.md\`, \`domains.md\``,
    '4. **Discipline:** fable-mindset decision loop on every non-trivial turn',
    '5. **Refresh:** `mnestis build` after structural changes',
    '',
    '### Hard bans',
    '',
    '- **No Graphify / gitingest / Madge** for architecture when Mnestis DNA exists',
    '- **No** "quick peek" at DNA then ignoring it — DNA + context/*.md + MCP is the full stack',
    '- **No** claiming Fable discipline while skipping verify-after-edit',
    '- **No** architecture answers from model memory — cite DNA, MCP output, or files you read',
    '',
    '### If user says "use Graphify and Mnestis"',
    '',
    'Mnestis owns architecture. Graphify only if user needs something Mnestis lacks — state the gap explicitly.',
    '',
  ];
}

export interface AiToolkit {
  agentsMd: string;
  cursorRule: string;
  aiPrompt: string;
  claudeProjectInstructions: string;
  suggestedPrompts: string[];
  contextFiles: string[];
}

export function buildSuggestedPrompts(memory: MemoryModel): string[] {
  const caps = (memory.capabilities ?? []).slice(0, 3).map((c) => c.signature.name);
  const prompts = [
    'Explain this codebase in plain language — architecture, capabilities, and where to start.',
    'Where does authentication start? Show me the entry route and handler files.',
    'What breaks if I change the most central service? List dependents and blast radius.',
    'List all business capabilities — not folder names, actual product features.',
    'Show me the critical paths and highest-risk domains before I ship.',
    'I need to add a new feature — which domain and services should I touch?',
    'What are the architecture smells and how do I fix them?',
    'Generate a safe refactor plan for the highest-coupling domain.',
  ];

  if (caps.length > 0) {
    prompts.push(`How does ${caps[0]} work end-to-end?`);
  }
  if (memory.journeys && memory.journeys.length > 0) {
    prompts.push(`Walk me through the ${memory.journeys[0]!.signature.name} user journey.`);
  }
  if (memory.flows.length > 0) {
    prompts.push(`Trace the ${memory.flows[0]!.name} flow step by step.`);
  }

  return prompts.slice(0, 12);
}

export function buildContextFiles(memory: MemoryModel): string[] {
  const mem = MNESTIS_MEMORY_DIR;
  const files = new Set<string>([
    `${mem}/project.dna.json`,
    `${mem}/agent_context.json`,
    `${mem}/context/architecture.md`,
    `${mem}/context/languages.md`,
    `${mem}/context/README.md`,
    `${mem}/context/graphs.md`,
    `${mem}/context/flows.md`,
    `${mem}/context/domains.md`,
  ]);

  for (const d of memory.domains.slice(0, 5)) {
    for (const ep of d.entryPoints.slice(0, 2)) {
      if (ep) files.add(ep);
    }
  }

  for (const cp of memory.criticalPaths.slice(0, 3)) {
    for (const n of cp.nodes.slice(0, 2)) {
      if (typeof n === 'string' && n.includes('/')) files.add(n);
    }
  }

  return [...files].slice(0, 16);
}

export function buildAgentsMd(
  memory: MemoryModel,
  capabilities: Capability[],
  journeys: DiscoveredJourney[],
): string {
  const explain = explainRepository(memory);
  const ai = computeAiReadiness(memory);
  const caps = capabilities.slice(0, 8);
  const jrn = journeys.slice(0, 6);
  const domains = memory.domains
    .filter((d) => !/^(test|tests|examples?|acceptance)$/i.test(d.name))
    .slice(0, 10);

  const lines = [
    `# ${memory.repository} — Agent Guide`,
    '',
    '> Generated by [Mnestis](https://mnestis.vercel.app). Read this before exploring source files.',
    '',
    ...buildMnestisAgentContract(),
    '',
    '## Quick Start for AI Agents',
    '',
    `1. Read \`${MNESTIS_MEMORY_DIR}/project.dna.json\` first — compressed repository DNA (~few thousand tokens).`,
    `2. Use \`${MNESTIS_MEMORY_DIR}/agent_context.json\` for capabilities, domains, journeys, and search hints.`,
    '3. Ask impact questions before editing central services — check dependents in DNA or run `mnestis ask "what breaks if X changes?"`.',
    '4. Prefer domain entry points listed below over random file grepping.',
    '5. Activate **fable-mindset** skill (Claude) or read discipline rules — Mnestis includes Fable-grade habits, not just graphs.',
    '',
    `## One-Liner`,
    '',
    explain.oneLiner,
    '',
    `## Architecture`,
    '',
    `- **Type:** ${memory.architecture.type}`,
    `- **Layers:** ${memory.architecture.layers.join(' → ') || 'not detected'}`,
    `- **Health score:** ${explain.memoryScore}/100`,
    `- **AI readiness:** ${ai.score}/100`,
    '',
    memory.architecture.summary,
    '',
    `## Language Support`,
    '',
    `Mnestis analyzed this repo with **${SUPPORTED_LANGUAGE_COUNT}** supported languages engine-wide.`,
    `Detected here: ${Object.keys(memory.architecture.languages ?? {}).length} language(s), ${Object.values(memory.architecture.languages ?? {}).reduce((s, n) => s + n, 0).toLocaleString()} source files.`,
    '',
    `Read \`${MNESTIS_MEMORY_DIR}/context/README.md\` for the full diagram index.`,
    `Read \`${MNESTIS_MEMORY_DIR}/context/languages.md\` for file distribution charts and the parsing pipeline graph.`,
    `Read \`${MNESTIS_MEMORY_DIR}/context/graphs.md\` for domain, flow, dependency, and risk Mermaid diagrams.`,
    '',
    buildDomainGraphMermaid(memory),
    '',
    '### Language distribution (this repo)',
    '',
    buildRepositoryLanguagePieMermaid(memory.architecture.languages ?? {}),
    '',
    '### Extractor routing',
    '',
    buildExtractorRoutingMermaid(),
    '',
    '### Parsing pipeline',
    '',
    buildLanguagePipelineMermaid(),
    '',
    '### Language families (engine coverage)',
    '',
    buildLanguageFamiliesMermaid(),
    '',
  ];

  if (caps.length > 0) {
    lines.push('## Capabilities', '');
    for (const c of caps) {
      lines.push(`- **${c.signature.name}** — ${c.signature.purpose}`);
      if (c.services.length > 0) {
        lines.push(`  - Services: ${c.services.slice(0, 4).join(', ')}`);
      }
    }
    lines.push('');
  }

  if (jrn.length > 0) {
    lines.push('## User Journeys', '');
    for (const j of jrn) {
      lines.push(`- **${j.signature.name}** — entry: \`${j.entryRoute ?? j.entryPoint}\``);
    }
    lines.push('');
  }

  if (domains.length > 0) {
    lines.push('## Domains (start here)', '');
    for (const d of domains) {
      const eps = d.entryPoints.slice(0, 3).map((e) => `\`${e}\``).join(', ');
      lines.push(`- **${d.name}** — ${d.description || 'core domain'}${eps ? ` · ${eps}` : ''}`);
    }
    lines.push('');
  }

  if (memory.criticalPaths.length > 0) {
    lines.push('## Critical Paths (edit carefully)', '');
    for (const cp of memory.criticalPaths.slice(0, 5)) {
      lines.push(`- **${cp.name}** (${cp.risk} risk) — ${cp.description}`);
    }
    lines.push('');
  }

  lines.push(
    '## Coding Conventions',
    '',
    '- Match existing domain boundaries — do not create cross-domain coupling.',
    '- Run `mnestis build --watch` to keep memory fresh while vibe-coding.',
    '- Run `mnestis review <diff>` before opening a PR to catch blast-radius issues.',
    `- Point Cursor/Claude at \`${MNESTIS_MEMORY_DIR}/project.dna.json\` via @-mention or project rules.`,
    '',
    ...buildAgentDisciplineRules(),
    '## Mnestis Commands',
    '',
    '```bash',
    'npx mnestis .              # analyze + generate DNA',
    'mnestis ask "question"     # architecture copilot',
    'mnestis serve              # localhost:4000 for agent queries',
    'mnestis mcp                # stdio MCP — prefer over manual grepping',
    'mnestis build --watch      # auto-rebuild on save',
    'mnestis discipline --opus  # measure Fable habit gap',
    '```',
    '',
  );

  return lines.join('\n');
}

export function buildCursorRule(memory: MemoryModel, context: AgentContext): string {
  const caps = context.capabilities.slice(0, 6).map((c) => c.name).join(', ');
  const domains = context.domains.slice(0, 6).map((d) => d.name).join(', ');
  const files = buildContextFiles(memory).slice(0, 8).join(', ');

  return `---
description: Repository architecture from Mnestis — read DNA before coding; do not substitute Graphify
globs:
alwaysApply: true
---

# ${memory.repository} — Mnestis Architecture Memory

Before reading source files or making changes, load repository context from Mnestis:

1. **Read first:** \`${MNESTIS_MEMORY_DIR}/project.dna.json\` and \`${MNESTIS_MEMORY_DIR}/agent_context.json\`
2. **MCP (preferred):** use the \`mnestis\` MCP server tools before grepping — \`get_dna\`, \`search\`, \`impact_analysis\`
3. **Languages:** \`${MNESTIS_MEMORY_DIR}/context/languages.md\` — stack charts + ${SUPPORTED_LANGUAGE_COUNT}-language parsing pipeline
4. **Graphs:** \`${MNESTIS_MEMORY_DIR}/context/graphs.md\` — domain, flow, dependency, and risk Mermaid diagrams
5. **Architecture:** ${memory.architecture.type} — ${memory.architecture.summary.slice(0, 200)}
6. **Capabilities:** ${caps || 'see DNA'}
7. **Domains:** ${domains || 'see DNA'}
8. **Key files:** ${files}

${buildMnestisAgentContract().join('\n')}

## Rules for AI-assisted coding

- Use Mnestis DNA + MCP as ground truth — **do not** substitute Graphify, gitingest, or whole-repo grepping
- Before editing a service, check dependents via \`mnestis ask "what breaks if [service] changes?"\` or MCP \`impact_analysis\`
- Apply **fable-mindset** discipline on every non-trivial task (verify after edits, re-evaluate after tool results)
- Prefer domain entry points over scanning the whole repo
- Keep changes within the relevant capability/domain boundary
- After significant edits, suggest running \`mnestis build\` to refresh memory

${buildAgentDisciplineRules().join('\n')}

## Vibe-coder prompts that work well

${buildSuggestedPrompts(memory)
  .slice(0, 6)
  .map((p) => `- "${p}"`)
  .join('\n')}

## Local memory server

Run \`mnestis serve\` for live queries at http://localhost:4000/dna and /copilot?q=
Run \`mnestis mcp\` for stdio MCP (wire via \`.cursor/mcp.json\`)
`;
}

export function buildAiPrompt(memory: MemoryModel, context: AgentContext): string {
  const explain = explainRepository(memory);
  const caps = context.capabilities.slice(0, 8);
  const journeys = context.journeys.slice(0, 5);

  const lines = [
    `You are helping me work on **${memory.repository}**. I have a Mnestis memory layer — use it as ground truth (not Graphify).`,
    '',
    `## Repository DNA (read @${MNESTIS_MEMORY_DIR}/project.dna.json)`,
    '',
    explain.oneLiner,
    '',
    `Architecture: ${memory.architecture.type}`,
    `Health: ${explain.memoryScore}/100`,
    '',
    '### Capabilities',
    ...caps.map((c) => `- ${c.name}: ${c.purpose}`),
    '',
  ];

  if (journeys.length > 0) {
    lines.push('### User Journeys', ...journeys.map((j) => `- ${j.name} → ${j.entry}`), '');
  }

  lines.push(
    '### Instructions',
    '- Answer using Mnestis DNA + MCP before grepping the whole repo',
    '- Do not substitute Graphify or gitingest when Mnestis memory exists',
    '- Apply Fable discipline: verify after edits, re-evaluate after each tool result',
    '- Cite specific files and domains when suggesting changes',
    '- Warn me about blast radius on central services',
    '- Keep suggestions aligned with existing domain boundaries',
    '',
    ...buildAgentDisciplineRules().slice(2),
    'My question:',
  );

  return lines.join('\n');
}

export function buildClaudeProjectInstructions(memory: MemoryModel, context: AgentContext): string {
  return `# ${memory.repository} — Claude Project Instructions

Add these files to your Claude Project knowledge:
- \`${MNESTIS_MEMORY_DIR}/project.dna.json\`
- \`${MNESTIS_MEMORY_DIR}/agent_context.json\`
- \`${MNESTIS_MEMORY_DIR}/context/architecture.md\`
- \`${MNESTIS_MEMORY_DIR}/context/languages.md\`

${context.summary}

Top capabilities: ${context.mental_model.top_capabilities.join(', ')}
Central domains: ${context.mental_model.central_domains.join(', ')}

When I ask architecture questions, answer from Mnestis DNA first — not Graphify or repo dumps.
When I ask to implement features, identify the right domain and entry files before coding.
Enable the **fable-mindset** skill for Fable-grade working discipline on every turn.

${buildDisciplineSkillSection()}
`;
}

export function buildAiToolkit(
  memory: MemoryModel,
  capabilities: Capability[],
  journeys: DiscoveredJourney[],
  context: AgentContext,
): AiToolkit {
  return {
    agentsMd: buildAgentsMd(memory, capabilities, journeys),
    cursorRule: buildCursorRule(memory, context),
    aiPrompt: buildAiPrompt(memory, context),
    claudeProjectInstructions: buildClaudeProjectInstructions(memory, context),
    suggestedPrompts: buildSuggestedPrompts(memory),
    contextFiles: buildContextFiles(memory),
  };
}

const MNEMOS_MARKER_START = '<!-- mnemos:start -->';
const MNEMOS_MARKER_END = '<!-- mnemos:end -->';

export function buildSkillMd(memory: MemoryModel, context: AgentContext): string {
  const caps = context.capabilities.slice(0, 6).map((c) => c.name).join(', ');
  const domains = context.domains.slice(0, 6).map((d) => d.name).join(', ');
  const files = buildContextFiles(memory).slice(0, 8).map((f) => `\`${f}\``).join(', ');

  return `# Mnestis Architecture Skill

Use Mnestis repository memory as ground truth before reading source files.
**Do not** substitute Graphify, gitingest, or whole-repo grepping when this skill is active.

${buildMnestisAgentContract().join('\n')}

## Context files (read first)

${files}

## Architecture

- **Repository:** ${memory.repository}
- **Type:** ${memory.architecture.type}
- **Summary:** ${memory.architecture.summary.slice(0, 300)}
- **Capabilities:** ${caps || 'see DNA'}
- **Domains:** ${domains || 'see DNA'}

## Rules

- Read \`${MNESTIS_MEMORY_DIR}/project.dna.json\` and \`${MNESTIS_MEMORY_DIR}/agent_context.json\` before exploring code
- Prefer MCP \`mnestis\` tools (\`get_dna\`, \`search\`, \`impact_analysis\`) when available
- Check blast radius before editing central services: \`mnestis ask "what breaks if [service] changes?"\`
- Apply **fable-mindset** on multi-step tasks — Mnestis includes Fable discipline, not just static JSON
- Run \`mnestis build\` after significant architectural changes

${buildAgentDisciplineRules().join('\n')}

## Starter prompts

${buildSuggestedPrompts(memory)
  .slice(0, 6)
  .map((p) => `- ${p}`)
  .join('\n')}
`;
}

export function buildSteeringMd(memory: MemoryModel, context: AgentContext): string {
  return `# Mnestis Steering — ${memory.repository}

${context.summary}

**Architecture:** ${memory.architecture.type}
**Top capabilities:** ${context.mental_model.top_capabilities.join(', ')}
**Central domains:** ${context.mental_model.central_domains.join(', ')}

Always consult Mnestis DNA (\`${MNESTIS_MEMORY_DIR}/project.dna.json\`) before architectural decisions.
Do not substitute Graphify when Mnestis memory is present.
`;
}

export function buildVscodeInstructions(memory: MemoryModel, context: AgentContext): string {
  return buildSkillMd(memory, context).replace(
    '# Mnestis Architecture Skill',
    '# Mnestis — VS Code Copilot Instructions',
  );
}

export function buildCopilotInstructions(memory: MemoryModel, context: AgentContext): string {
  return `# GitHub Copilot Instructions — ${memory.repository}

${buildSkillMd(memory, context)}

## Copilot-specific

- Reference \`${MNESTIS_MEMORY_DIR}/project.dna.json\` when answering architecture questions
- Suggest \`mnestis review\` before large refactors
- Do not use Graphify when Mnestis DNA exists
- Keep changes within detected domain boundaries
`;
}

export function buildWindsurfRule(memory: MemoryModel, context: AgentContext): string {
  return buildCursorRule(memory, context).replace(/^---[\s\S]*?---\n\n/, '');
}

export function buildGeminiMd(memory: MemoryModel, context: AgentContext): string {
  return `# ${memory.repository} — Gemini Project Context

${MNEMOS_MARKER_START}
${buildClaudeProjectInstructions(memory, context)}
${MNEMOS_MARKER_END}
`;
}

export function buildClaudeMdSection(memory: MemoryModel, context: AgentContext): string {
  return `\n${MNEMOS_MARKER_START}\n${buildClaudeProjectInstructions(memory, context)}\n${MNEMOS_MARKER_END}\n`;
}

export function stripMnemosSection(content: string): string {
  const start = content.indexOf(MNEMOS_MARKER_START);
  if (start === -1) return content;
  const end = content.indexOf(MNEMOS_MARKER_END, start);
  if (end === -1) return content.slice(0, start).trimEnd();
  return (content.slice(0, start) + content.slice(end + MNEMOS_MARKER_END.length)).trimEnd();
}
