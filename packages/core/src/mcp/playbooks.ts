/** Problem playbooks — shortcuts and templates agents reuse across sessions. */

export interface PlaybookStep {
  action: string;
  tool?: string;
  hint?: string;
}

export interface Playbook {
  id: string;
  title: string;
  keywords: string[];
  summary: string;
  steps: PlaybookStep[];
  mcpTools: string[];
  contextFiles: string[];
  template: string;
}

export const PLAYBOOKS: Playbook[] = [
  {
    id: 'auth-bug',
    title: 'Authentication / login bug',
    keywords: ['auth', 'login', 'session', 'jwt', 'oauth', 'redirect', '401', '403'],
    summary: 'Trace auth flow from entry point to token validation before editing middleware.',
    steps: [
      { action: 'Read DNA and agent context', hint: '.mentis/project.dna.json' },
      { action: 'Find auth domain entry points', tool: 'list_domains' },
      { action: 'Trace login flow', tool: 'query_graph', hint: 'question: "login authentication flow"' },
      { action: 'Blast radius before edit', tool: 'impact_analysis' },
      { action: 'Search related memories', tool: 'memory_query' },
    ],
    mcpTools: ['get_dna', 'list_domains', 'query_graph', 'impact_analysis', 'memory_query'],
    contextFiles: ['context/flows.md', 'context/domains.md'],
    template: `## Auth bug playbook

**Symptom:** {symptom}
**Expected:** {expected}
**Actual:** {actual}

1. MCP \`query_graph\`: "how does {feature} authenticate?"
2. MCP \`impact_analysis\` on touched service
3. Read \`.mentis/context/flows.md\` for login journey
4. Fix → run project's auth/test suite → \`memory_remember\` with root cause`,
  },
  {
    id: 'test-failure',
    title: 'Test failure / CI red',
    keywords: ['test', 'fail', 'ci', 'vitest', 'jest', 'spec', 'assert', 'timeout'],
    summary: 'Compress failure output, map failing test to domain, check impact before fix.',
    steps: [
      { action: 'Compress command output', hint: 'mnestis wrap -- <test cmd>' },
      { action: 'Locate test file in graph', tool: 'search' },
      { action: 'Impact of code under test', tool: 'impact_analysis' },
      { action: 'Check git hotspots', tool: 'git_hotspots' },
    ],
    mcpTools: ['search', 'impact_analysis', 'git_hotspots', 'compile_focus'],
    contextFiles: ['context/critical_paths.md'],
    template: `## Test failure playbook

**Failing:** {testName}
**Error:** {errorSnippet}

1. \`mnestis wrap -- npm test\` — compressed output
2. MCP \`search\`: "{testName}"
3. MCP \`compile_focus\`: "fix {testName} failure"
4. Verify with real test command → \`memory_remember\` tags: ["test", "fix"]`,
  },
  {
    id: 'refactor-service',
    title: 'Refactor a service safely',
    keywords: ['refactor', 'extract', 'rename', 'move', 'split', 'cleanup'],
    summary: 'DNA diff + impact + shortest path before any structural change.',
    steps: [
      { action: 'Structural diff since last build', tool: 'dna_diff' },
      { action: 'Blast radius', tool: 'impact_analysis' },
      { action: 'Dependency path', tool: 'shortest_path' },
      { action: 'Task-scoped context pack', tool: 'compile_focus' },
    ],
    mcpTools: ['dna_diff', 'impact_analysis', 'shortest_path', 'compile_focus', 'review_diff'],
    contextFiles: ['context/architecture.md', 'context/graphs.md'],
    template: `## Refactor playbook — {target}

1. MCP \`impact_analysis\` node: "{target}"
2. MCP \`get_neighbors\` direction: both
3. MCP \`compile_focus\` task: "refactor {target}"
4. After edit: \`mnestis build\` → MCP \`dna_diff\``,
  },
  {
    id: 'new-feature',
    title: 'Add a new feature',
    keywords: ['feature', 'add', 'implement', 'new', 'endpoint', 'api', 'ui'],
    summary: 'Onboard + domain map + focus pack — never start from blank repo scan.',
    steps: [
      { action: 'Onboarding guide', tool: 'onboard' },
      { action: 'List capabilities', tool: 'list_capabilities' },
      { action: 'Domain for feature', tool: 'list_domains' },
      { action: 'Minimal context for task', tool: 'compile_focus' },
    ],
    mcpTools: ['onboard', 'list_capabilities', 'list_domains', 'compile_focus', 'memory_remember'],
    contextFiles: ['agent_context.json', 'context/architecture.md'],
    template: `## New feature playbook — {feature}

1. MCP \`onboard\` + \`list_capabilities\`
2. MCP \`compile_focus\` task: "implement {feature}" tokenBudget: 8000
3. Implement in smallest vertical slice
4. \`mnestis build\` → \`memory_remember\` decision + API surface`,
  },
  {
    id: 'performance',
    title: 'Performance / latency issue',
    keywords: ['slow', 'perf', 'latency', 'timeout', 'memory', 'cpu', 'bundle'],
    summary: 'Hotspots + critical paths + flow tracing.',
    steps: [
      { action: 'Git churn hotspots', tool: 'git_hotspots' },
      { action: 'Critical paths context', hint: '.mentis/context/critical_paths.md' },
      { action: 'Flow trace', tool: 'query_graph' },
      { action: 'Health smells', tool: 'get_health' },
    ],
    mcpTools: ['git_hotspots', 'query_graph', 'get_health', 'compile_focus'],
    contextFiles: ['context/critical_paths.md', 'context/flows.md'],
    template: `## Performance playbook

**Symptom:** {symptom} in {area}

1. MCP \`git_hotspots\` — recent churn
2. MCP \`query_graph\`: "execution path for {area}"
3. Profile/measure before optimizing
4. \`memory_remember\` baseline + fix metrics`,
  },
  {
    id: 'security-review',
    title: 'Security / secrets / audit',
    keywords: ['security', 'secret', 'vuln', 'audit', 'xss', 'injection', 'authz'],
    summary: 'Trust manifest + health + diff review for sensitive changes.',
    steps: [
      { action: 'Trust manifest', tool: 'trust_manifest' },
      { action: 'Health + smells', tool: 'get_health' },
      { action: 'Review diff', tool: 'review_diff' },
    ],
    mcpTools: ['trust_manifest', 'get_health', 'review_diff', 'impact_analysis'],
    contextFiles: ['security-audit.json'],
    template: `## Security review playbook

1. MCP \`trust_manifest\` — known limits
2. Read \`.mentis/security-audit.json\` if present
3. MCP \`review_diff\` on PR diff
4. Never commit secrets — \`memory_remember\` audit notes locally only`,
  },
];

export function listPlaybooks(): Pick<Playbook, 'id' | 'title' | 'keywords' | 'summary'>[] {
  return PLAYBOOKS.map(({ id, title, keywords, summary }) => ({ id, title, keywords, summary }));
}

export function getPlaybook(idOrQuery: string): Playbook | undefined {
  const q = idOrQuery.toLowerCase().trim();
  const byId = PLAYBOOKS.find((p) => p.id === q);
  if (byId) return byId;

  const scored = PLAYBOOKS.map((p) => {
    let score = 0;
    if (p.title.toLowerCase().includes(q)) score += 10;
    if (p.id.includes(q)) score += 8;
    for (const kw of p.keywords) {
      if (q.includes(kw) || kw.includes(q)) score += 3;
    }
    return { p, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);

  return scored[0]?.p;
}

export function formatPlaybookMarkdown(p: Playbook): string {
  const steps = p.steps.map((s, i) => {
    const tool = s.tool ? ` → \`${s.tool}\`` : '';
    const hint = s.hint ? ` (${s.hint})` : '';
    return `${i + 1}. ${s.action}${tool}${hint}`;
  }).join('\n');

  return [
    `# ${p.title}`,
    '',
    p.summary,
    '',
    '## Steps',
    steps,
    '',
    '## MCP tools',
    p.mcpTools.map((t) => `- \`${t}\``).join('\n'),
    '',
    '## Context files',
    p.contextFiles.map((f) => `- \`.mentis/${f}\``).join('\n'),
    '',
    '## Template',
    '```markdown',
    p.template,
    '```',
  ].join('\n');
}
