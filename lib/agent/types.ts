import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import type { ChatScope } from "@/lib/rag";

export type AgentTool = Tool;

export interface ToolCallRecord {
  id: string;
  name: string;
  input: unknown;
  result: unknown;
  durationMs: number;
  error?: string;
}

export interface AgentResult {
  finalText: string;
  toolCalls: ToolCallRecord[];
  iterations: number;
  inputTokens: number;
  outputTokens: number;
}

export interface SourceEvent {
  source: string;
  score: number;
  chunkIndex: number;
  preview: string;
}

export type SseEvent =
  | { type: "sources"; sources: SourceEvent[] }
  | { type: "tool_call_start"; id: string; name: string; input: unknown }
  | {
      type: "tool_call_end";
      id: string;
      name: string;
      result: unknown;
      durationMs: number;
    }
  | { type: "tool_call_error"; id: string; name: string; error: string }
  | { type: "delta"; content: string }
  | { type: "done" }
  | { type: "error"; message: string };

export type { ChatScope };
