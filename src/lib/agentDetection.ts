import type { AgentType } from '../types';

export interface DetectionContext {
  message: string;
  projectPath?: string;
  recentFiles?: string[];
  hasPlanFile?: boolean;
}

/**
 * Detect the appropriate agent type based on message content and context
 * 
 * Agent hierarchy:
 * - orchestrator: Multi-step coordinator (can spawn planner/coder/researcher)
 * - planner: Strategic planning only (no sub-agents)
 * - coder: Code implementation only (no sub-agents)
 * - researcher: Information gathering only (no sub-agents)
 * - chat: General conversation (no sub-agents)
 */
export function detectAgentType(ctx: DetectionContext): AgentType {
  const msg = ctx.message.toLowerCase();

  // Planner detection - strategic planning (no execution)
  if (
    (msg.includes('plan') && !msg.includes('execute') && !msg.includes('implement')) ||
    msg.includes('roadmap') ||
    msg.includes('architecture') && !msg.includes('build') ||
    msg.includes('design system') ||
    msg.includes('break down') ||
    msg.includes('outline') ||
    msg.includes('strategy') && !msg.includes('implement') ||
    msg.includes('approach') && !msg.includes('implement')
  ) {
    return 'planner';
  }

  // Orchestrator detection - multi-step coordination (can spawn sub-agents)
  if (
    ctx.hasPlanFile || // If plan.md exists, orchestrator executes it
    msg.includes('build') ||
    msg.includes('create') && !msg.includes('plan') || // "create app" not "create plan"
    msg.includes('setup') ||
    msg.includes('integrate') ||
    msg.includes('develop') ||
    msg.includes('full stack') ||
    msg.includes('end to end') ||
    msg.includes('complete system') ||
    msg.includes('orchestrate') ||
    msg.includes('coordinate') ||
    msg.includes('execute plan') ||
    msg.includes('implement plan') ||
    msg.includes('follow plan')
  ) {
    return 'orchestrator';
  }

  // Coder detection - single-step code tasks (no sub-agents)
  if (
    msg.includes('fix') ||
    msg.includes('bug') ||
    msg.includes('refactor') ||
    msg.includes('optimize') ||
    msg.includes('code') ||
    msg.includes('function') ||
    msg.includes('component') ||
    msg.includes('add feature') ||
    msg.includes('implement') && msg.length < 100 || // Short implement = coder
    msg.includes('write') && !msg.includes('plan') ||
    msg.includes('update') ||
    msg.includes('modify') ||
    msg.includes('change') ||
    msg.includes('test') ||
    msg.includes('debug') ||
    msg.includes('error') ||
    msg.includes('issue') ||
    msg.includes('problem') ||
    // File extensions
    /\.(ts|tsx|js|jsx|py|java|cpp|c|go|rs|rb|php|css|html|json|yaml|yml|toml|md)/.test(msg) ||
    // Code patterns
    /import |export |function |const |let |var |class |interface |type /.test(msg)
  ) {
    return 'coder';
  }

  // Researcher detection - information gathering (no sub-agents)
  if (
    msg.includes('research') ||
    msg.includes('find') && !msg.includes('fix') ||
    msg.includes('search') ||
    msg.includes('look up') ||
    msg.includes('documentation') ||
    msg.includes('docs') ||
    msg.includes('how to') ||
    msg.includes('what is') ||
    msg.includes('explain') ||
    msg.includes('learn') ||
    msg.includes('understand') ||
    msg.includes('compare') ||
    msg.includes('analyze') && !msg.includes('code') ||
    msg.includes('investigate') ||
    msg.includes('explore') ||
    msg.includes('best practice') ||
    msg.includes('example') ||
    msg.includes('tutorial')
  ) {
    return 'researcher';
  }

  // Default to chat for general conversation
  return 'chat';
}

/**
 * Check if plan.md exists in project
 * This should be called from the component with proper Tauri API
 */
export function shouldCheckPlanFile(projectPath?: string): boolean {
  return !!projectPath;
}
