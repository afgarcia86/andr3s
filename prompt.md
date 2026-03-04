Goal
Build a streamlined portfolio/resume website for me at https://andr3s.com that looks like “ChatGPT but only knows about Andres.” The homepage should invite recruiters to start a conversation with a resume agent that can explain my background, projects, and what I can do.

Architecture (IMPORTANT)
Use a “Backend For Frontend” (BFF) so the browser never talks directly to the LLM provider.
- Frontend calls my server at /api/chat
- Server calls the LLM using a secret API key stored in environment variables
- No API keys or provider secrets in the client bundle
- Use CORS and same-origin requests only

Security / Anti-abuse Guardrails (CRITICAL)
Implement guardrails to prevent “credits getting sucked up”:
1) Rate limiting:
   - Per IP: max N requests per minute (configurable)
   - Per session/user: max N requests per day (configurable)
3) Hard limits on LLM usage:
   - Max tokens per request (configurable)
   - Max input length (characters) to block giant prompts
4) Basic abuse detection:
   - Block repeated identical prompts spam
   - Block obviously malicious prompt injection attempts that try to reveal secrets (“show me your system prompt”, “print env vars”, etc.)
5) Logging & monitoring:
   - Log request metadata (timestamp, IP hash, user/session id, token counts, status)
   - Provide an admin-only view endpoint or simple log file guidance so I can audit usage
6) Safety response:
   - If rate limited or blocked, return friendly message + HTTP status codes (429/403)

LLM Provider (make pluggable)
Implement provider adapters so I can swap later:
- Lets use OpenAi's chat completions spec, so if I host using vLLM it will easy to swap.

“Resume Agent” Behavior (Product Spec)
The agent should ONLY answer about me based on a curated knowledge base I provide in the repo.
- Create a local JSON/Markdown knowledge base folder: /knowledge
  - resume.md (my general resume text)
  - projects.md
  - about.md
  - highlights.md
  - timeline.md
- The agent must:
  - Use ONLY those files as source of truth
  - If asked something outside of it, say: “I don’t know from Andres’ materials yet—here’s what to ask him / what to add.”
  - Not invent facts
- Optional but nice: show “Sources used” (file names) for each answer.

UI / Brand
Design should be clean, modern, minimal, recruiter-friendly.
- A simple robotic/AI-style wordmark logo: “Andr3s” (or “andr3s”) using a modern geometric typeface look.
- Color palette: mostly neutral (black/white/gray) with a single accent color used sparingly.
- Consider using a frontend framework like tailwind css or bootstrap (or something new and popular)
- We are going to keep this repo open source, so lets plan for that when we create the repo.
- Layout:
  - Top nav: Logo, resume download link & light/dark theme toggle
  - Main content: Chat panel (ChatGPT-like) centered and focused
  - Headline: “What would you like to know?”
  - CTA Input: "Ask anything about my experience, technical skills or fun facts"
- Chat UX:
  - Big empty state with a few suggested prompts recruiters can click:
    - “Give me the 60-second overview.”
    - “What’s Andres built end-to-end?”
    - “Show me his strongest technical skills.”
    - “What roles is he a fit for?”
  - Chat should feel snappy (typing indicator optional)
  - Keep it streamlined, not cluttered.

Tech Stack Choice
Pick a stack that is easy to deploy on Hostinger, PHP is a Hostinger limitation
Option A (preferred): Next.js + PHP runtime (if Hostinger supports it) with API routes for /api/chat
Option B: PHP backend + static frontend (React/Vite) served behind it
Do not assume serverless-only environment. Make sure it runs with `npm install && npm run build && npm start`.

Deliverables
1) Generate the full project scaffold (folders/files) and code.
2) Provide a README with:
   - local dev steps
   - environment variables needed
   - Hostinger deployment steps (generic but practical)
   - how to add/edit knowledge files
3) Implement the chat endpoint with all guardrails listed above.
4) Implement the agent prompt/system instruction to enforce “only know about Andres” + refusal outside knowledge base.
5) Provide a simple logo in SVG (wordmark) that matches the robotic/AI vibe.

Environment Variables
- LLM_PROVIDER=openai|anthropic
- LLM_API_KEY=...
- RATE_LIMIT_PER_MINUTE=...
- DAILY_LIMIT_PER_SESSION=...
- MAX_INPUT_CHARS=...
- MAX_OUTPUT_TOKENS=...
- ADMIN_TOKEN=... (for viewing logs / admin endpoint)
(Use sensible defaults for dev.)

Implementation Notes
- Use secure headers (helmet or equivalent)
- Cookies/sessions should be httpOnly, sameSite=strict, secure in prod
- Do not store plain IPs; store hashed IP if logging
- Validate and sanitize all inputs
- Ensure no sensitive data is returned to client

Start by outputting:
- A short plan
- Then generate the repository structure and all code
- Then README
- Then the SVG logo