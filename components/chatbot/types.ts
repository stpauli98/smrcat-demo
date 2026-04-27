export interface ChatSource {
  source: string;
  score: number;
  chunkIndex: number;
  preview: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  error?: string;
  pending?: boolean;
}
