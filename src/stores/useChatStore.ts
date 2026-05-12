import { create } from 'zustand';
import { Message, AgentType } from '@/types';

interface ChatState {
  messages: Message[];
  streamingText: string;
  isStreaming: boolean;
  activeAgent: AgentType | null;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  appendStreamToken: (token: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  clearStreaming: () => void;
  setActiveAgent: (agent: AgentType | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  streamingText: '',
  isStreaming: false,
  activeAgent: null,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  appendStreamToken: (token) => set((state) => ({ streamingText: state.streamingText + token })),
  setStreaming: (isStreaming) => set({ isStreaming }),
  clearStreaming: () => set({ streamingText: '', isStreaming: false, activeAgent: null }),
  setActiveAgent: (agent) => set({ activeAgent: agent }),
}));
