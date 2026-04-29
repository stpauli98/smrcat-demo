export interface ChatSource {
  source: string;
  score: number;
  chunkIndex: number;
  preview: string;
}

export type ToolCallStatus = "running" | "done" | "error";

export interface ChatToolCall {
  id: string;
  name: string;
  status: ToolCallStatus;
  input?: unknown;
  result?: unknown;
  durationMs?: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  toolCalls?: ChatToolCall[];
  error?: string;
  pending?: boolean;
}
