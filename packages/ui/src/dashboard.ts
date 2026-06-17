export type FocusMode = 'vibe' | 'ai' | 'coder';

export const FOCUS_MODE_META: Record<
  FocusMode,
  {
    label: string;
    shortLabel: string;
    title: string;
    description: string;
    dashboardLens: string;
  }
> = {
  vibe: {
    label: 'Vibecoder',
    shortLabel: 'Vibe',
    title: 'Understand product and value fast',
    description: 'Focus on what the app does, the main journeys, and which parts feel healthy or risky.',
    dashboardLens: 'Shows business capabilities, journeys, and the clearest next actions first.',
  },
  ai: {
    label: 'AI',
    shortLabel: 'AI',
    title: 'Give agents structured context immediately',
    description: 'Focus on JSON, repair packs, prompts, impact context, and artifacts an agent can use without guessing.',
    dashboardLens: 'Highlights DNA, issue exports, context docs, and copy-ready payloads.',
  },
  coder: {
    label: 'Coder',
    shortLabel: 'Coder',
    title: 'Navigate architecture like a real developer',
    description: 'Focus on domains, flows, dependencies, smells, history, and the fastest path to editing safely.',
    dashboardLens: 'Prioritizes architecture, code map, history, and build intelligence.',
  },
};
