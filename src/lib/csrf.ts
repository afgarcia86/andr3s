let cachedToken: string | null = null;
let cachedAt = 0;

const MAX_AGE_MS = 25 * 60 * 1000; // refresh after 25 min (server allows 30)

export async function getCsrfToken(): Promise<string> {
  if (cachedToken && Date.now() - cachedAt < MAX_AGE_MS) {
    return cachedToken;
  }

  const res = await fetch("/api/csrf-token");
  if (!res.ok) throw new Error("Failed to fetch CSRF token");

  const data = await res.json();
  cachedToken = data.token;
  cachedAt = Date.now();
  return cachedToken!;
}
