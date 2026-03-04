import type { LLMProvider } from "./types";
import { OpenAIProvider } from "./openai";

let instance: LLMProvider | null = null;

/**
 * Returns the LLM provider singleton.
 * Currently uses OpenAI-compatible API for all providers
 * (works with OpenAI, vLLM, Ollama, etc.).
 * Swap implementation here to add new providers.
 */
export function getLLMProvider(): LLMProvider {
  if (!instance) {
    instance = new OpenAIProvider();
  }
  return instance;
}
