export const config = {
  llm: {
    provider: process.env.LLM_PROVIDER || "openai",
    apiKey: process.env.LLM_API_KEY || "",
    baseUrl: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || "1024", 10),
  },
  rateLimit: {
    perMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || "10", 10),
    dailyPerSession: parseInt(process.env.DAILY_LIMIT_PER_SESSION || "100", 10),
  },
  input: {
    maxChars: parseInt(process.env.MAX_INPUT_CHARS || "2000", 10),
    maxMessages: 20,
  },
  admin: {
    token: process.env.ADMIN_TOKEN || "",
  },
  livekit: {
    url: process.env.LIVEKIT_URL || "",
    apiKey: process.env.LIVEKIT_API_KEY || "",
    apiSecret: process.env.LIVEKIT_API_SECRET || "",
  },
} as const;
