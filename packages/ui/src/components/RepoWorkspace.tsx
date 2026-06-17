import { useEffect, useState, type CSSProperties } from 'react';
import type { GraphData, HealthScore, HeatmapEntry, MemoryModel } from '../types';
import type { BuildHistoryEntry, RepoSnapshot } from '../lib/workspace';
import { fetchBuildHistory, fetchRepoMemory, triggerBuild } from '../lib/workspace';
import { formatScoreLabel } from '@/lib/format-score';
import { Overview } from './Overview';
import { DomainsView, FlowsView } from './DomainsView';
import { GraphView } from './GraphView';
import { SmellsView } from './SmellsView';
import { HeatmapView } from './HeatmapView';
import { ArchitectureCanvas } from './ArchitectureCanvas';
import { CapabilitiesView } from './CapabilitiesView';
import { JourneyMapView } from './JourneyMapView';
import { SystemAnalyzer } from './SystemAnalyzer';
import { RepositoryExplorer } from './RepositoryExplorer';
import { WorkspaceCopilot } from './WorkspaceCopilot';
import { TechStackView } from './TechStackView';
import { QuickInsights } from './QuickInsights';
import { BuildHistoryView } from './BuildHistoryView';
import { TimelineView } from './TimelineView';
import { FOCUS_MODE_META, type FocusMode } from '../dashboard';
import { fetchAiPack } from '../lib/ai-pack-client';
import { copyText } from '../lib/clipboard';
import { ScoreExplainer, healthScoreToDimensions } from '../cockpits/shared/ScoreExplainer';

export type RepoSection = 'overview' | 'architecture' | 'flows' | 'code' | 'history' | 'ai';

export type ArchSubView = 'systems' | 'domains' | 'graph' | 'logic' | 'canvas' | 'smells';
export type CodeSubView = 'map' | 'stack';
export type HistorySubView = 'builds' | 'timeline' | 'risk';
export type AISubView = 'copilot' | 'docs' | 'json';

const SECTIONS: { id: RepoSection; label: string; desc: string }[] = [
  { id: 'overview', label: 'Overview', desc: 'Health, stats, quick start' },
  { id: 'architecture', label: 'Architecture', desc: 'Systems, domains, graph' },
  { id: 'flows', label: 'Flows', desc: 'Execution paths & journeys' },
  { id: 'code', label: 'Code Map', desc: 'Files & tech stack' },
  { id: 'history', label: 'History', desc: 'Builds, timeline, hotspots' },
  { id: 'ai', label: 'AI Context', desc: 'Copilot & agent docs' },
];

interface RepoWorkspaceProps {
  repo: RepoSnapshot;
  section: RepoSection;
  onSectionChange: (s: RepoSection) => void;
  onRefresh: () => void;
  pendingQuestion?: string | null;
  onPendingQuestionHandled?: () => void;
  focusMode: FocusMode;
}

interface ActionableIssue {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  summary: string;
  recommendation: string;
}

function scoreTone(score: number): 'great' | 'good' | 'warn' | 'bad' {
  if (score >= 80) return 'great';
  if (score >= 60) return 'good';
  if (score >= 40) return 'warn';
  return 'bad';
}

function scoreNarrative(score: number): string {
  if (score >= 80) return 'Strong and ready for fast onboarding.';
  if (score >= 60) return 'Usable, with a few blind spots to clean up.';
  if (score >= 40) return 'Understandable, but risky in day-to-day work.';
  return 'Needs attention before humans or AI can move safely.';
}

function buildScoreRows(healthScore: HealthScore) {
  return [
    {
      label: 'Discoverability',
      value: healthScore.discoverability,
      explainer: 'How quickly a human or AI can find the right files, domains, and entry points.',
    },
    {
      label: 'Architecture clarity',
      value: healthScore.architectureClarity,
      explainer: 'How understandable the structure is after penalties from detected smells and design ambiguity.',
    },
    {
      label: 'Coupling',
      value: healthScore.coupling,
      explainer: 'How much the code pulls across services and modules instead of staying contained.',
    },
    {
      label: 'Documentation',
      value: healthScore.documentationQuality,
      explainer: 'How well domains and system shape are described in generated context and structure.',
    },
    {
      label: 'Dependency complexity',
      value: healthScore.dependencyComplexity,
      explainer: 'How much cross-domain and dependency sprawl increases change risk.',
    },
  ];
}

function buildIssues(memory: MemoryModel, heatmap: HeatmapEntry[]): ActionableIssue[] {
  const smellIssues = memory.smells.slice(0, 4).map<ActionableIssue>((smell) => ({
    id: `smell-${smell.id}`,
    title: smell.type.replace(/[_-]/g, ' '),
    severity: smell.severity,
    summary: smell.description,
    recommendation: smell.recommendation,
  }));

  const heatmapIssues = heatmap
    .filter((entry) => entry.problems.length > 0 || entry.risk !== 'low')
    .slice(0, 4)
    .map<ActionableIssue>((entry) => ({
      id: `heat-${entry.domainId}`,
      title: `${entry.domain} risk hotspot`,
      severity: entry.risk,
      summary:
        entry.problems[0] ??
        `${entry.domain} has elevated coupling (${entry.coupling}) and ${entry.circularDependencies} circular dependencies.`,
      recommendation: `Review ${entry.domain} first. Circular dependencies: ${entry.circularDependencies}. High smells: ${entry.highSmells}. Dead modules: ${entry.deadModules}.`,
    }));

  return [...heatmapIssues, ...smellIssues].slice(0, 6);
}

export function RepoWorkspace({
  repo,
  section,
  onSectionChange,
  onRefresh,
  pendingQuestion,
  onPendingQuestionHandled,
  focusMode,
}: RepoWorkspaceProps) {
  const [archView, setArchView] = useState<ArchSubView>('systems');
  const [codeView, setCodeView] = useState<CodeSubView>('map');
  const [historyView, setHistoryView] = useState<HistorySubView>('builds');
  const [aiView, setAiView] = useState<AISubView>('copilot');
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [memory, setMemory] = useState<MemoryModel | null>(null);
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
  const [history, setHistory] = useState<BuildHistoryEntry[]>([]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [dna, setDna] = useState<Record<string, unknown> | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [insightTarget, setInsightTarget] = useState<string | null>(null);
  const [contextDoc, setContextDoc] = useState('architecture.md');
  const [contextContent, setContextContent] = useState('');
  const [copilotSeed, setCopilotSeed] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [agentPackJson, setAgentPackJson] = useState<string>('{}');
  const [fixPrompt, setFixPrompt] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const [data, hist] = await Promise.all([fetchRepoMemory(repo.id), fetchBuildHistory(repo.id)]);
      setMemory(data.memory);
      setGraph(data.graph);
      setHealthScore(data.healthScore);
      setHeatmap(data.heatmap);
      setSuggestedPrompts(data.suggestedPrompts);
      setDna(data.dna);
      setHistory(hist);
    } catch {
      setMemory(null);
      setGraph(null);
      setHealthScore(null);
      setHeatmap([]);
      setSuggestedPrompts([]);
      setDna(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!memory) return;
    fetchAiPack(repo.id, { section: 'all', mode: focusMode })
      .then((json) => {
        setAgentPackJson(json);
        try {
          const pack = JSON.parse(json) as { prompts?: { fix?: string } };
          setFixPrompt(pack.prompts?.fix ?? '');
        } catch {
          setFixPrompt('');
        }
      })
      .catch(() => {
        setAgentPackJson('{}');
        setFixPrompt('');
      });
  }, [repo.id, focusMode, memory?.builtAt]);

  useEffect(() => {
    load();
  }, [repo.id]);

  useEffect(() => {
    const handler = (e: Event) => {
      const target = (e as CustomEvent<string>).detail;
      if (target) setInsightTarget(target);
    };
    window.addEventListener('mnemos:quick-insight', handler);
    return () => window.removeEventListener('mnemos:quick-insight', handler);
  }, []);

  useEffect(() => {
    if (section === 'ai' && aiView === 'docs') {
      const base = repo.id === 'local' ? '/.mnemos/context' : `/.mnemos/${repo.id}/context`;
      fetch(`${base}/${contextDoc}`)
        .then((r) => (r.ok ? r.text() : 'Document not found'))
        .then(setContextContent)
        .catch(() => setContextContent('Failed to load document'));
    }
  }, [section, aiView, contextDoc, repo.id]);

  useEffect(() => {
    if (pendingQuestion) {
      setCopilotSeed(pendingQuestion);
      onSectionChange('ai');
      setAiView('copilot');
      onPendingQuestionHandled?.();
    }
  }, [pendingQuestion]);

  useEffect(() => {
    setCopyFeedback(null);
  }, [repo.id, section]);

  const handleBuild = async () => {
    setBuilding(true);
    await triggerBuild(repo.id);
    setTimeout(async () => {
      await load();
      onRefresh();
      setBuilding(false);
    }, 3000);
  };

  if (loading || !memory) {
    return (
      <div className="repo-workspace repo-workspace--loading">
        <div className="dash-loader" />
        <p>Loading {repo.name} intelligence…</p>
        <small>Reading memory model, graph, and agent context</small>
      </div>
    );
  }

  const contextDocs = [
    'architecture.md',
    'domains.md',
    'flows.md',
    'apis.md',
    'services.md',
    'critical_paths.md',
    'smells.md',
  ];

  const highlightNodes = selectedDomain
    ? memory.domains.find((d) => d.id === selectedDomain)?.nodes
    : undefined;
  const scoreRows = healthScore ? buildScoreRows(healthScore) : [];
  const issues = buildIssues(memory, heatmap);
  const repoStory =
    focusMode === 'vibe'
      ? memory.capabilities?.slice(0, 3).map((capability) => capability.signature.name).join(' • ') ||
        'Open the main journeys to see how the product behaves.'
      : focusMode === 'ai'
        ? 'Use the JSON pack and context docs to answer questions or generate a repair plan without opening every panel.'
        : 'Use overview, architecture, and history together before changing code so you know the system shape and risk.';
  const strongestPoint = scoreRows.reduce<(typeof scoreRows)[number] | null>(
    (best, row) => (best == null || row.value > best.value ? row : best),
    null,
  );
  const weakestPoint = scoreRows.reduce<(typeof scoreRows)[number] | null>(
    (worst, row) => (worst == null || row.value < worst.value ? row : worst),
    null,
  );

  const handleCopy = async (label: string, text: string) => {
    try {
      await copyText(text);
      setCopyFeedback(label);
      window.setTimeout(() => setCopyFeedback((current) => (current === label ? null : current)), 1500);
    } catch {
      setCopyFeedback(null);
    }
  };

  return (
    <div className="repo-workspace repo-workspace--cockpit">
      <header className="repo-workspace-header" style={{ '--repo-accent': repo.accent } as CSSProperties}>
        <div className="repo-workspace-meta">
          <div className="repo-workspace-identity">
            <p className="repo-workspace-label">{repo.label}</p>
            <h1>{repo.name}</h1>
            <p className="repo-workspace-desc">{memory.architecture.summary || repo.description}</p>
            <div className="repo-focus-row">
              <span className="repo-focus-badge">{FOCUS_MODE_META[focusMode].label} mode</span>
              <span className="repo-focus-copy">{FOCUS_MODE_META[focusMode].dashboardLens}</span>
            </div>
          </div>
          <div className="repo-workspace-actions">
            <span className="repo-meta-chip">{memory.architecture.type}</span>
            <span className={`status-pill status-pill--${repo.status}`}>Health {repo.health ?? healthScore?.overall ?? 0}</span>
            <span className="badge badge--lime">{formatScoreLabel('AI readiness', repo.aiReadiness ?? null)}</span>
            <button type="button" className="repo-build-btn repo-build-btn--inline" onClick={handleBuild} disabled={building}>
              {building ? 'Building…' : 'Run Mnemos'}
            </button>
          </div>
        </div>

        <nav className="repo-section-nav" aria-label="Workspace sections">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`repo-section-btn ${section === s.id ? 'repo-section-btn--active' : ''}`}
              onClick={() => onSectionChange(s.id)}
            >
              <strong>{s.label}</strong>
              <span>{s.desc}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="repo-workspace-body">
        {section === 'overview' && (
          <div className="repo-tab-panel repo-tab-panel--overview">
            <section className="repo-story-grid">
              <article className="repo-story-card repo-story-card--hero">
                <small>What this repository does</small>
                <h2>{memory.architecture.name || repo.name}</h2>
                <p>{memory.architecture.summary || repo.description}</p>
                <div className="repo-story-pills">
                  <span>{memory.domains.length} domains</span>
                  <span>{memory.flows.length} flows</span>
                  <span>{memory.services.length} services</span>
                  <span>{memory.apis.length} APIs</span>
                </div>
              </article>

              <article className="repo-story-card">
                <small>Use the right output</small>
                <h3>Dashboard vs report vs JSON</h3>
                <div className="repo-mini-list">
                  <div>
                    <strong>Dashboard</strong>
                    <span>Interactive exploration, comparison, score reading, and architecture navigation.</span>
                  </div>
                  <div>
                    <strong>`report/index.html`</strong>
                    <span>Shareable human report for async review, product demos, and stakeholder communication.</span>
                  </div>
                  <div>
                    <strong>AI JSON</strong>
                    <span>Copy the generated agent pack when Claude, Cursor, Trae, or another model should work from structured context.</span>
                  </div>
                </div>
              </article>

              <article className="repo-story-card">
                <small>Mode guidance</small>
                <h3>{FOCUS_MODE_META[focusMode].title}</h3>
                <p>{repoStory}</p>
                <div className="repo-mini-list">
                  <div>
                    <strong>Start here</strong>
                    <span>
                      {focusMode === 'vibe'
                        ? 'Overview and flows'
                        : focusMode === 'ai'
                          ? 'AI Context and JSON pack'
                          : 'Overview and architecture'}
                    </span>
                  </div>
                  <div>
                    <strong>Then go to</strong>
                    <span>
                      {focusMode === 'vibe'
                        ? 'Report and journeys'
                        : focusMode === 'ai'
                          ? 'Context docs and impact prompts'
                          : 'History and code map'}
                    </span>
                  </div>
                </div>
              </article>
            </section>

            {healthScore && (
              <section className="repo-score-section">
                <ScoreExplainer
                  overall={healthScore.overall}
                  narrative={scoreNarrative(healthScore.overall)}
                  healthDimensions={healthScoreToDimensions(healthScore)}
                  strongest={strongestPoint ? { name: strongestPoint.label, value: strongestPoint.value } : null}
                  weakest={weakestPoint ? { name: weakestPoint.label, value: weakestPoint.value } : null}
                />
              </section>
            )}

            <section className="repo-issues-section">
              <div className="repo-section-headline">
                <div>
                  <small>Issues and bugs</small>
                  <h3>Copy-ready repair context</h3>
                  <p>Detected problems are already packaged so you can hand them to an AI or use them as an engineering checklist.</p>
                </div>
                <div className="repo-copy-actions">
                  <button type="button" className="repo-copy-btn" onClick={() => handleCopy('json', agentPackJson)}>
                    {copyFeedback === 'json' ? 'Copied JSON' : 'Copy JSON pack'}
                  </button>
                  <button type="button" className="repo-copy-btn" onClick={() => handleCopy('prompt', fixPrompt)}>
                    {copyFeedback === 'prompt' ? 'Copied prompt' : 'Copy fix prompt'}
                  </button>
                </div>
              </div>

              <div className="repo-issue-grid">
                {issues.length > 0 ? (
                  issues.map((issue) => (
                    <article key={issue.id} className={`repo-issue-card repo-issue-card--${issue.severity}`}>
                      <div className="repo-issue-head">
                        <strong>{issue.title}</strong>
                        <span>{issue.severity}</span>
                      </div>
                      <p>{issue.summary}</p>
                      <small>{issue.recommendation}</small>
                      <button
                        type="button"
                        className="repo-copy-link"
                        onClick={() =>
                          handleCopy(
                            issue.id,
                            JSON.stringify(
                              {
                                repository: repo.name,
                                issue,
                                score: healthScore,
                              },
                              null,
                              2,
                            ),
                          )
                        }
                      >
                        {copyFeedback === issue.id ? 'Copied issue' : 'Copy issue JSON'}
                      </button>
                    </article>
                  ))
                ) : (
                  <article className="repo-empty-state">
                    <strong>No major issues detected</strong>
                    <p>Mnemos did not surface strong smell or heatmap problems for this repository snapshot.</p>
                  </article>
                )}
              </div>
            </section>

            <section className="repo-next-grid">
              <button type="button" className="repo-next-card" onClick={() => onSectionChange('architecture')}>
                <strong>Open architecture</strong>
                <span>Systems, domains, graph, smells, and dependency shape.</span>
              </button>
              <button type="button" className="repo-next-card" onClick={() => onSectionChange('flows')}>
                <strong>Open flows</strong>
                <span>Execution paths, journeys, and system movement from entry to outcome.</span>
              </button>
              <button
                type="button"
                className="repo-next-card"
                onClick={() => {
                  onSectionChange('ai');
                  setAiView('json');
                }}
              >
                <strong>Open AI Context</strong>
                <span>JSON pack, docs, and copyable prompts for agents.</span>
              </button>
            </section>

            <Overview memory={memory} healthScore={healthScore} />
          </div>
        )}

        {section === 'architecture' && (
          <div className="repo-sub-layout">
            <aside className="repo-sub-nav">
              {(
                [
                  ['systems', 'Systems'],
                  ['domains', 'Domains'],
                  ['graph', 'Dependency Graph'],
                  ['logic', 'Capabilities'],
                  ['canvas', 'Canvas'],
                  ['smells', 'Smells'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={archView === id ? 'active' : ''}
                  onClick={() => setArchView(id)}
                >
                  {label}
                </button>
              ))}
            </aside>
            <div className="repo-sub-content">
              {archView === 'systems' && (
                <SystemAnalyzer memory={memory} onQuickInsight={setInsightTarget} />
              )}
              {archView === 'domains' && (
                <DomainsView domains={memory.domains} selectedId={selectedDomain} />
              )}
              {archView === 'graph' && (
                <div className="repo-graph-panel">
                  <GraphView graph={graph} highlightNodes={highlightNodes} />
                </div>
              )}
              {archView === 'logic' && <CapabilitiesView memory={memory} />}
              {archView === 'canvas' && (
                <div className="h-full">
                  <ArchitectureCanvas memory={memory} />
                </div>
              )}
              {archView === 'smells' && <SmellsView smells={memory.smells} />}
            </div>
          </div>
        )}

        {section === 'flows' && (
          <div className="repo-sub-layout">
            <FlowsView flows={memory.flows} />
            <JourneyMapView journeys={memory.journeys ?? []} flows={memory.flows} />
          </div>
        )}

        {section === 'code' && (
          <div className="repo-sub-layout">
            <aside className="repo-sub-nav">
              <button type="button" className={codeView === 'map' ? 'active' : ''} onClick={() => setCodeView('map')}>
                File Map
              </button>
              <button type="button" className={codeView === 'stack' ? 'active' : ''} onClick={() => setCodeView('stack')}>
                Tech Stack
              </button>
            </aside>
            <div className="repo-sub-content">
              {codeView === 'map' ? (
                <RepositoryExplorer memory={memory} onSelectRepo={() => {}} onQuickInsight={setInsightTarget} />
              ) : (
                <TechStackView memory={memory} />
              )}
            </div>
          </div>
        )}

        {section === 'history' && (
          <div className="repo-sub-layout">
            <aside className="repo-sub-nav">
              <button type="button" className={historyView === 'builds' ? 'active' : ''} onClick={() => setHistoryView('builds')}>
                Build History
              </button>
              <button type="button" className={historyView === 'timeline' ? 'active' : ''} onClick={() => setHistoryView('timeline')}>
                Activity
              </button>
              <button type="button" className={historyView === 'risk' ? 'active' : ''} onClick={() => setHistoryView('risk')}>
                Risk Heatmap
              </button>
            </aside>
            <div className="repo-sub-content">
              {historyView === 'builds' && <BuildHistoryView history={history} memory={memory} />}
              {historyView === 'timeline' && <TimelineView memory={memory} />}
              {historyView === 'risk' && <HeatmapView heatmap={heatmap} />}
            </div>
          </div>
        )}

        {section === 'ai' && (
          <div className="repo-sub-layout repo-sub-layout--ai">
            <aside className="repo-sub-nav">
              <button type="button" className={aiView === 'copilot' ? 'active' : ''} onClick={() => setAiView('copilot')}>
                Copilot
              </button>
              <button type="button" className={aiView === 'docs' ? 'active' : ''} onClick={() => setAiView('docs')}>
                Context Docs
              </button>
              <button type="button" className={aiView === 'json' ? 'active' : ''} onClick={() => setAiView('json')}>
                JSON Pack
              </button>
            </aside>
            <div className="repo-sub-content">
              {aiView === 'copilot' ? (
                <WorkspaceCopilot
                  repoId={repo.id}
                  repoName={repo.name}
                  suggestedPrompts={suggestedPrompts}
                  seedQuestion={copilotSeed}
                  onSeedHandled={() => setCopilotSeed(null)}
                />
              ) : aiView === 'docs' ? (
                <div className="context-docs-view">
                  <aside className="context-docs-nav">
                    {contextDocs.map((doc) => (
                      <button
                        key={doc}
                        type="button"
                        className={contextDoc === doc ? 'active' : ''}
                        onClick={() => setContextDoc(doc)}
                      >
                        {doc.replace('.md', '')}
                      </button>
                    ))}
                  </aside>
                  <pre className="context-docs-content">{contextContent}</pre>
                </div>
              ) : (
                <div className="ai-json-view">
                  <div className="repo-section-headline">
                    <div>
                      <small>Agent-first export</small>
                      <h3>AI does not need the dashboard open</h3>
                      <p>Copy this structured pack into Claude, Cursor, Trae, or any other model so it can reason from Mnemos outputs directly.</p>
                    </div>
                    <div className="repo-copy-actions">
                      <button type="button" className="repo-copy-btn" onClick={() => handleCopy('json', agentPackJson)}>
                        {copyFeedback === 'json' ? 'Copied JSON' : 'Copy JSON pack'}
                      </button>
                      <button type="button" className="repo-copy-btn" onClick={() => handleCopy('prompt', fixPrompt)}>
                        {copyFeedback === 'prompt' ? 'Copied prompt' : 'Copy fix prompt'}
                      </button>
                    </div>
                  </div>

                  <div className="ai-json-summary">
                    <article>
                      <strong>What is included</strong>
                      <span>Repo metadata, architecture summary, score, issues, heatmap, prompts, build history, and DNA.</span>
                    </article>
                    <article>
                      <strong>Best for</strong>
                      <span>Bug fixing, onboarding an AI, impact analysis, code review prompts, and repair planning.</span>
                    </article>
                    <article>
                      <strong>Human output</strong>
                      <span>Use `report/index.html` for a narrative view and this JSON pack for direct agent execution.</span>
                    </article>
                  </div>

                  <pre className="context-docs-content ai-json-pre">{agentPackJson}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {insightTarget && (
        <QuickInsights memory={memory} target={insightTarget} onClose={() => setInsightTarget(null)} />
      )}
    </div>
  );
}

export function sectionFromNav(view: string): RepoSection {
  const map: Record<string, RepoSection> = {
    home: 'overview',
    overview: 'overview',
    architecture: 'architecture',
    systems: 'architecture',
    flows: 'flows',
    code: 'code',
    history: 'history',
    ai: 'ai',
  };
  return map[view] ?? 'overview';
}
