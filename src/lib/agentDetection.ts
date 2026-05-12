import type { AgentType } from '../types';

export interface DetectionContext {
  message: string;
  projectPath?: string;
  recentFiles?: string[];
  hasPlanFile?: boolean;
}

/**
 * Detect the appropriate agent type based on message content and context
 */
export function detectAgentType(ctx: DetectionContext): AgentType {
  const msg = ctx.message.toLowerCase();

  // Planner detection - high priority
  if (
    msg.includes('plan') ||
    msg.includes('roadmap') ||
    msg.includes('architecture') ||
    msg.includes('design system') ||
    msg.includes('break down') ||
    msg.includes('outline') ||
    msg.includes('strategy') ||
    msg.includes('approach')
  ) {
    return 'planner';
  }

  // Orchestrator detection - if plan.md exists or multi-step task
  if (
    ctx.hasPlanFile ||
    msg.includes('orchestrate') ||
    msg.includes('coordinate') ||
    msg.includes('execute plan') ||
    msg.includes('implement plan') ||
    msg.includes('follow plan') ||
    msg.includes('next step') ||
    msg.includes('continue') ||
    // Prioritize build/create/setup keywords for orchestrator
    msg.includes('build') ||
    msg.includes('create') ||
    msg.includes('setup') ||
    msg.includes('integrate') ||
    msg.includes('implement') ||
    msg.includes('develop')
  ) {
    return 'orchestrator';
  }

  // Coder detection - code-related keywords (excluding orchestrator keywords)
  if (
    msg.includes('code') ||
    msg.includes('function') ||
    msg.includes('component') ||
    msg.includes('fix') ||
    msg.includes('bug') ||
    msg.includes('refactor') ||
    msg.includes('optimize') ||
    msg.includes('add feature') ||
    msg.includes('write') ||
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

  // Researcher detection - research/documentation keywords
  if (
    msg.includes('research') ||
    msg.includes('find') ||
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
    msg.includes('analyze') ||
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
