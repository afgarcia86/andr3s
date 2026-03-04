import fs from "fs";
import path from "path";
import crypto from "crypto";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "requests.jsonl");

export interface LogEntry {
  timestamp: string;
  ipHash: string;
  sessionId: string;
  promptTokens?: number;
  completionTokens?: number;
  status: number;
  blocked?: boolean;
  blockReason?: string;
  userMessageLength: number;
}

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

export function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 12);
}

export function logRequest(entry: LogEntry): void {
  try {
    ensureLogDir();
    const line = JSON.stringify(entry) + "\n";
    fs.appendFileSync(LOG_FILE, line, "utf-8");
  } catch {
    // Logging should never crash the app
    console.error("Failed to write log entry");
  }
}

export function readLogs(limit = 100, offset = 0): LogEntry[] {
  try {
    ensureLogDir();
    if (!fs.existsSync(LOG_FILE)) return [];

    const lines = fs
      .readFileSync(LOG_FILE, "utf-8")
      .trim()
      .split("\n")
      .filter(Boolean);

    // Return most recent first
    return lines
      .reverse()
      .slice(offset, offset + limit)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}
