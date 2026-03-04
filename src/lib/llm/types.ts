export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface LLMProvider {
  chatStream(
    messages: ChatMessage[],
    maxTokens: number
  ): AsyncGenerator<string, LLMUsage | void, unknown>;
}
