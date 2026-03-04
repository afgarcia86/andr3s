import { config } from "@/lib/config";
import { checkRateLimit } from "@/lib/rateLimit";
import { checkAbuse } from "@/lib/abuseDetection";
import { hashIP, logRequest } from "@/lib/logger";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { getLLMProvider } from "@/lib/llm/provider";
import type { ChatMessage } from "@/lib/llm/types";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function getSessionId(request: Request): { sessionId: string; isNew: boolean } {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/session_id=([a-f0-9-]{36})/);
  if (match) return { sessionId: match[1], isNew: false };

  return { sessionId: crypto.randomUUID(), isNew: true };
}

function makeSessionCookie(sessionId: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `session_id=${sessionId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${secure}`;
}

function errorResponse(
  status: number,
  message: string,
  headers?: Record<string, string>
) {
  return Response.json(
    { error: true, message },
    { status, headers: headers || {} }
  );
}

interface ClientMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  const { sessionId, isNew } = getSessionId(request);
  const ipHash = hashIP(getClientIP(request));

  // --- Parse & validate input ---
  let body: { messages?: ClientMessage[] };
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Invalid JSON body.");
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return errorResponse(400, "Messages array is required.");
  }

  // Limit conversation length
  const trimmed = messages.slice(-config.input.maxMessages);
  const lastMessage = trimmed[trimmed.length - 1];

  if (!lastMessage || lastMessage.role !== "user") {
    return errorResponse(400, "Last message must be from the user.");
  }

  if (lastMessage.content.length > config.input.maxChars) {
    return errorResponse(
      400,
      `Message too long. Please keep it under ${config.input.maxChars} characters.`
    );
  }

  // --- Rate limiting ---
  const rateResult = checkRateLimit(ipHash, sessionId);
  if (!rateResult.allowed) {
    logRequest({
      timestamp: new Date().toISOString(),
      ipHash,
      sessionId,
      status: 429,
      blocked: true,
      blockReason: "rate_limit",
      userMessageLength: lastMessage.content.length,
    });

    const headers: Record<string, string> = {};
    if (rateResult.retryAfterSeconds) {
      headers["Retry-After"] = String(rateResult.retryAfterSeconds);
    }
    return errorResponse(429, rateResult.reason!, headers);
  }

  // --- Abuse detection ---
  const abuseResult = checkAbuse(sessionId, lastMessage.content);
  if (abuseResult.blocked) {
    logRequest({
      timestamp: new Date().toISOString(),
      ipHash,
      sessionId,
      status: 403,
      blocked: true,
      blockReason: "abuse",
      userMessageLength: lastMessage.content.length,
    });
    return errorResponse(403, abuseResult.reason!);
  }

  // --- Build LLM messages ---
  const { prompt: systemPrompt } = buildSystemPrompt();
  const llmMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...trimmed.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  // --- Stream response ---
  const provider = getLLMProvider();
  const encoder = new TextEncoder();

  let promptTokens = 0;
  let completionTokens = 0;
  let responseContent = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const gen = provider.chatStream(
          llmMessages,
          config.llm.maxOutputTokens
        );

        let result = await gen.next();
        while (!result.done) {
          const chunk = result.value as string;
          responseContent += chunk;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
          );
          result = await gen.next();
        }

        // Generator return value contains usage info
        const usage = result.value;
        if (usage && typeof usage === "object" && "promptTokens" in usage) {
          promptTokens = usage.promptTokens;
          completionTokens = usage.completionTokens;
        }

        // Extract source files from response (agent includes [Sources: ...])
        const sourcesMatch = responseContent.match(
          /\[Sources?:\s*([^\]]+)\]/i
        );
        const sources = sourcesMatch
          ? sourcesMatch[1].split(",").map((s) => s.trim())
          : [];

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, sources })}\n\n`
          )
        );
        controller.close();

        // Log successful request
        logRequest({
          timestamp: new Date().toISOString(),
          ipHash,
          sessionId,
          promptTokens,
          completionTokens,
          status: 200,
          userMessageLength: lastMessage.content.length,
        });
      } catch (err) {
        console.error("LLM stream error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Something went wrong. Please try again." })}\n\n`
          )
        );
        controller.close();

        logRequest({
          timestamp: new Date().toISOString(),
          ipHash,
          sessionId,
          status: 500,
          userMessageLength: lastMessage.content.length,
        });
      }
    },
  });

  const responseHeaders: Record<string, string> = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Content-Type-Options": "nosniff",
  };

  if (isNew) {
    responseHeaders["Set-Cookie"] = makeSessionCookie(sessionId);
  }

  return new Response(stream, { headers: responseHeaders });
}
