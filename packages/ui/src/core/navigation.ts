import type { LucideIcon } from 'lucide-react'
import {
  Sparkles,
  Map,
  Layers,
  HeartPulse,
  Share2,
  Bot,
  FileJson,
  Wrench,
  ShieldCheck,
  LayoutDashboard,
  Network,
  GitBranch,
  FolderTree,
  History,
  MessageSquare,
} from 'lucide-react'
import type { FocusMode } from '@/dashboard'

export interface NavSection {
  id: string
  label: string
  desc?: string
  icon: LucideIcon
}

export const MODE_SECTIONS: Record<FocusMode, NavSection[]> = {
  vibe: [
    { id: 'story', label: 'Story', desc: 'Product narrative', icon: Sparkles },
    { id: 'journeys', label: 'Journeys', desc: 'User flows', icon: Map },
    { id: 'capabilities', label: 'Capabilities', desc: 'What it does', icon: Layers },
    { id: 'health', label: 'Health', desc: 'Scores', icon: HeartPulse },
    { id: 'share', label: 'Share', desc: 'Export', icon: Share2 },
  ],
  ai: [
    { id: 'home', label: 'AI Context', desc: 'Agent setup', icon: Bot },
    { id: 'json', label: 'JSON Pack', desc: 'Full payload', icon: FileJson },
    { id: 'repairs', label: 'Repairs', desc: 'Fix prompts', icon: Wrench },
    { id: 'verify', label: 'Verify', desc: 'Checklist', icon: ShieldCheck },
  ],
  coder: [
    { id: 'overview', label: 'Overview', desc: 'Pulse & health', icon: LayoutDashboard },
    { id: 'architecture', label: 'Architecture', desc: 'Systems & graph', icon: Network },
    { id: 'flows', label: 'Flows', desc: 'Execution paths', icon: GitBranch },
    { id: 'code', label: 'Code Map', desc: 'Files & stack', icon: FolderTree },
    { id: 'history', label: 'History', desc: 'Build trends', icon: History },
    { id: 'ai', label: 'Copilot', desc: 'Ask Mnemos', icon: MessageSquare },
  ],
}

export const ARCH_SUBSECTIONS = [
  { id: 'systems', label: 'Systems' },
  { id: 'domains', label: 'Domains' },
  { id: 'graph', label: 'Graph' },
  { id: 'logic', label: 'Capabilities' },
  { id: 'canvas', label: 'Canvas' },
  { id: 'smells', label: 'Smells' },
] as const

export type ArchSubView = (typeof ARCH_SUBSECTIONS)[number]['id']

export const CODE_SUBSECTIONS = [
  { id: 'map', label: 'File tree' },
  { id: 'stack', label: 'Tech stack' },
] as const

export type CodeSubView = (typeof CODE_SUBSECTIONS)[number]['id']

export const HISTORY_SUBSECTIONS = [
  { id: 'builds', label: 'Builds' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'heatmap', label: 'Hotspots' },
] as const

export type HistorySubView = (typeof HISTORY_SUBSECTIONS)[number]['id']

export const AI_SUBSECTIONS = [
  { id: 'copilot', label: 'Copilot' },
  { id: 'docs', label: 'Context docs' },
] as const

export type AISubView = (typeof AI_SUBSECTIONS)[number]['id']
