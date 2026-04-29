import Anthropic from "@anthropic-ai/sdk";
import type {
  Message,
  MessageParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import { CHAT_MODEL, TEMPERATURE } from "@/lib/rag";
import { TOOLS } from "./tool-definitions";
import { TOOL_HANDLERS } from "./tools";
import type { AgentResult, ToolCallRecord, SseEvent } from "./types";

const MAX_ITERATIONS = 6;

export interface RunAgentOptions {
  anthropic: Anthropic;
  systemPrompt: string;
  history: MessageParam[];
  emit: (event: SseEvent) => void;
  allowedTools?: string[];
}

export async function runAgent({
  anthropic,
  systemPrompt,
  history,
  emit,
  allowedTools,
}: RunAgentOptions): Promise<AgentResult> {
  const toolCalls: ToolCallRecord[] = [];
  let inputTokens = 0;
  let outputTokens = 0;
  let finalText = "";

  const tools = allowedTools
    ? TOOLS.filter((t) => allowedTools.includes(t.name))
    : TOOLS;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response: Message = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1500,
      temperature: TEMPERATURE,
      system: systemPrompt,
      tools,
      messages: history,
    });

    inputTokens += response.usage.input_tokens;
    outputTokens += response.usage.output_tokens;

    history.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      const textBlocks = response.content.filter(
        (b): b is { type: "text"; text: string; citations: null } =>
          b.type === "text",
      );
      finalText = textBlocks.map((b) => b.text).join("\n");
      if (finalText) emit({ type: "delta", content: finalText });
      return {
        finalText,
        toolCalls,
        iterations: i + 1,
        inputTokens,
        outputTokens,
      };
    }

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is ToolUseBlock => b.type === "tool_use",
      );

      const results = await Promise.all(
        toolUseBlocks.map(async (block) => {
          const start = Date.now();
          emit({
            type: "tool_call_start",
            id: block.id,
            name: block.name,
            input: block.input,
          });

          const handler = TOOL_HANDLERS[block.name];
          let result: unknown;
          let errorMsg: string | undefined;
          try {
            result = handler
              ? await handler(block.input as Record<string, unknown>)
              : { uspjeh: false, greska: `Nepoznat alat: ${block.name}` };
          } catch (err) {
            errorMsg = err instanceof Error ? err.message : String(err);
            result = { uspjeh: false, greska: errorMsg };
          }
          const durationMs = Date.now() - start;

          if (errorMsg) {
            emit({
              type: "tool_call_error",
              id: block.id,
              name: block.name,
              error: errorMsg,
            });
          } else {
            emit({
              type: "tool_call_end",
              id: block.id,
              name: block.name,
              result,
              durationMs,
            });
          }

          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input,
            result,
            durationMs,
            error: errorMsg,
          });

          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: JSON.stringify(result),
          };
        }),
      );

      history.push({ role: "user", content: results });
      continue;
    }

    // Drugi stop razlozi
    finalText = `[Agent stop: ${response.stop_reason}]`;
    emit({ type: "delta", content: finalText });
    return {
      finalText,
      toolCalls,
      iterations: i + 1,
      inputTokens,
      outputTokens,
    };
  }

  finalText = "[Agent: dostignut limit od 6 koraka.]";
  emit({ type: "delta", content: finalText });
  return {
    finalText,
    toolCalls,
    iterations: MAX_ITERATIONS,
    inputTokens,
    outputTokens,
  };
}
