import crypto from "crypto";

/** Patterns that suggest prompt-injection or secrets-extraction attempts */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts)/i,
  /show\s+(me\s+)?(your|the)\s+(system\s+)?prompt/i,
  /print\s+(your\s+)?(env|environment)\s*(vars|variables)?/i,
  /reveal\s+(your\s+)?(instructions|prompt|secrets|api\s*key)/i,
  /what\s+(are|is)\s+your\s+(system\s+)?(instructions|prompt)/i,
  /act\s+as\s+if\s+you\s+(are|were)/i,
  /pretend\s+(you\s+)?(are|were)\s+(?!andres)/i,
  /you\s+are\s+now\s+(?!andres)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /bypass\s+(your\s+)?(restrictions|filters|rules)/i,
  /process\.env/i,
  /\bAPI[_\s]?KEY\b/i,
  /\bSECRET\b.*\bKEY\b/i,
];

/** Store recent message hashes per session to detect spam */
const recentHashes = new Map<string, string[]>();
const MAX_RECENT = 5;

export interface AbuseCheckResult {
  blocked: boolean;
  reason?: string;
}

export function checkAbuse(
  sessionId: string,
  message: string
): AbuseCheckResult {
  // Check prompt injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      return {
        blocked: true,
        reason:
          "I'm here to answer questions about Andres' experience and skills. Let me help with that instead!",
      };
    }
  }

  // Check for repeated identical messages (spam)
  const hash = crypto
    .createHash("sha256")
    .update(message.trim().toLowerCase())
    .digest("hex")
    .slice(0, 16);

  const recent = recentHashes.get(sessionId) || [];
  const duplicateCount = recent.filter((h) => h === hash).length;

  if (duplicateCount >= 2) {
    return {
      blocked: true,
      reason:
        "Looks like you've already asked that! Try a different question about Andres.",
    };
  }

  // Update recent hashes
  recent.push(hash);
  if (recent.length > MAX_RECENT) recent.shift();
  recentHashes.set(sessionId, recent);

  return { blocked: false };
}

/** Clean up old sessions periodically */
setInterval(
  () => {
    // Simple cleanup: clear all if map gets too large
    if (recentHashes.size > 10_000) {
      recentHashes.clear();
    }
  },
  10 * 60_000
);
