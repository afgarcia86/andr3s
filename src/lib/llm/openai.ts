import OpenAI from "openai";
import { config } from "../config";
import type { ChatMessage, LLMProvider, LLMUsage } from "./types";

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.llm.apiKey,
      baseURL: config.llm.baseUrl,
    });
  }

  async *chatStream(
    messages: ChatMessage[],
    maxTokens: number
  ): AsyncGenerator<string, LLMUsage | void, unknown> {
    const stream = await this.client.chat.completions.create({
      model: config.llm.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    });

    let usage: LLMUsage | undefined;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }

      if (chunk.usage) {
        usage = {
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
        };
      }
    }

    return usage;
  }
}
