export interface Project {
  id: string;
  name: string;
  path?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {

  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  agentType?: AgentType; // Auto-detected agent type
}

export interface Provider {
  id: string;
  name: string;
  providerType: string; // e.g., 'openai', 'anthropic', 'ollama'
  baseUrl: string;
  apiKey?: string;
  model: string;
  isDefault: boolean;
  isBuiltin: boolean;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderModelConfig {
  id: string;
  providerId: string;
  modelId: string;
  enabled: boolean;
  maxTokens: number;
  temperature: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentRun {
  id: string;
  sessionId: string;
  agentType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: string;
  output?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  parentAgentRunId?: string | null;
  projectPath?: string | null;
}

export type AgentType =
  | 'chat'
  | 'orchestrator'
  | 'planner'
  | 'coder'
  | 'researcher';

export const SELECTABLE_AGENTS: AgentType[] = ['chat', 'orchestrator', 'planner', 'coder', 'researcher'];

export const AGENT_LABELS: Record<AgentType, string> = {
  chat: 'Chat',
  orchestrator: 'Orchestrator',
  planner: 'Planner',
  coder: 'Coder',
  researcher: 'Researcher',
};

// Legacy agent type mapping for backward compatibility
export const LEGACY_AGENT_MAPPING: Record<string, AgentType> = {
  'coder_fe': 'coder',
  'coder_be': 'coder',
  'security': 'coder',
  'tester': 'coder',
  'reviewer': 'coder',
  'ui_designer': 'coder',
  'ux_researcher': 'researcher',
  'librarian': 'researcher',
};

export interface AgentConfig {
  id: string;
  agentType: AgentType;
  providerId: string | null;
  modelId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ToolCall {
  id: string;
  agentRunId: string;
  toolName: 'read_file' | 'write_file' | 'list_dir' | 'search_files' | 'run_command' | 'web_search';
  input: string;
  output: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface AgentRunWithTools extends AgentRun {
  toolCalls: ToolCall[];
  streamingText: string;
  thinkingBlocks: string[];
  parentAgentRunId: string | null;
  projectPath: string | null;
}

export interface PermissionRequest {
  type: 'sensitive_file' | 'outside_sandbox';
  path: string;
  agentType: AgentType;
  agentRunId: string;
}

// Orchestrator-specific types
export interface OrchestratorPhase {
  phase: string;
  description: string;
  timestamp: string;
}

export interface OrchestratorDelegation {
  targetAgent: string;
  task: string;
  reason: string;
  subAgentRunId: string;
  timestamp: string;
}

export interface OrchestratorAggregate {
  resultsCount: number;
  synthesisStatus: string;
  timestamp: string;
}

export interface OrchestratorDecision {
  decision: string;
  reasoning: string;
  timestamp: string;
}
