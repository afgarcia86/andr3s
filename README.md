# andr3s.com

AI-powered portfolio website — **ChatGPT, but it only knows about Andres.**

Recruiters and hiring managers chat with an AI agent that can explain your background, projects, skills, and more — all grounded in a curated knowledge base you control.

## Features

- **Chat-first UX** — ChatGPT-style interface with streaming responses
- **Knowledge-grounded agent** — answers only from your curated files, never invents facts
- **BFF architecture** — browser never touches the LLM provider; API key stays server-side
- **Anti-abuse guardrails** — rate limiting (per-IP + per-session), prompt injection detection, spam blocking
- **Pluggable LLM** — uses OpenAI-compatible API; works with OpenAI, vLLM, Ollama, or any compatible provider
- **Admin logging** — hashed-IP request logs with an authenticated admin endpoint
- **Dark mode** — auto-detects system preference, toggleable
- **Secure by default** — HttpOnly cookies, security headers, no sensitive data in client bundle

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/andr3s.com.git
cd andr3s.com
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description | Default |
|---|---|---|
| `LLM_PROVIDER` | Provider name (currently all use OpenAI-compatible API) | `openai` |
| `LLM_API_KEY` | Your API key | — |
| `LLM_BASE_URL` | API base URL (change for vLLM, Ollama, etc.) | `https://api.openai.com/v1` |
| `LLM_MODEL` | Model name | `gpt-4o-mini` |
| `RATE_LIMIT_PER_MINUTE` | Max requests per IP per minute | `10` |
| `DAILY_LIMIT_PER_SESSION` | Max requests per session per day | `100` |
| `MAX_INPUT_CHARS` | Max characters per user message | `2000` |
| `MAX_OUTPUT_TOKENS` | Max tokens in LLM response | `1024` |
| `ADMIN_TOKEN` | Bearer token for the admin logs endpoint | — |

### 3. Edit knowledge base

All files live in `/knowledge`:

| File | Purpose |
|---|---|
| `resume.md` | General resume (experience, education, skills) |
| `projects.md` | Key projects with details |
| `about.md` | Personal bio, interests, working style |
| `highlights.md` | Top achievements, strongest skills |
| `timeline.md` | Career timeline / trajectory |

Just edit the Markdown. The agent reads these files at startup and uses them as its sole source of truth.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Build & start (production)

```bash
npm run build
npm start
```

## Adding / Editing Knowledge Files

1. Edit or add `.md` files in the `/knowledge` directory
2. Restart the server (`npm run build && npm start` or restart `npm run dev`)
3. The agent automatically picks up all `.md` files in that folder

## Resume PDF

Place your downloadable resume at `public/resume.pdf`. The header links to it.

## Admin: Viewing Logs

Request logs are written to `logs/requests.jsonl` (git-ignored). Each line contains:
- Timestamp, hashed IP, session ID
- Token counts, HTTP status
- Whether the request was blocked (and why)

You can also query the admin endpoint:

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/api/admin/logs?limit=50
```

## Deployment on Hostinger (VPS / Node.js Hosting)

### Option A: Hostinger VPS

1. SSH into your VPS
2. Install Node.js 18+ (via nvm or apt)
3. Clone the repo and `npm install && npm run build`
4. Set environment variables (e.g., in `.env` or via your process manager)
5. Run with a process manager:
   ```bash
   npx pm2 start npm --name andr3s -- start
   npx pm2 save
   ```
6. Set up Nginx as reverse proxy to `localhost:3000`
7. Point your domain DNS to the VPS IP
8. Add SSL with Let's Encrypt / Certbot

### Option B: Hostinger Node.js Hosting (shared)

1. Upload the project files via File Manager or Git
2. Set the Node.js version to 18+ in the hosting panel
3. Set environment variables in the hosting panel
4. Set startup command: `npm run build && npm start`
5. Point your domain to the hosting

### Nginx reverse proxy example

```nginx
server {
    listen 80;
    server_name andr3s.com www.andr3s.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Using a Different LLM Provider

Since the backend uses the OpenAI chat-completions API spec, any compatible provider works:

**vLLM:**
```env
LLM_BASE_URL=http://your-vllm-host:8000/v1
LLM_MODEL=your-model-name
LLM_API_KEY=not-needed
```

**Ollama:**
```env
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3
LLM_API_KEY=not-needed
```

## Project Structure

```
├── knowledge/           # Markdown knowledge base (edit these!)
│   ├── about.md
│   ├── highlights.md
│   ├── projects.md
│   ├── resume.md
│   └── timeline.md
├── public/              # Static assets (logo, resume PDF)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts        # Chat endpoint (streaming)
│   │   │   └── admin/logs/route.ts  # Admin log viewer
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── Header.tsx
│   │   ├── Logo.tsx
│   │   ├── SuggestedPrompts.tsx
│   │   └── ThemeToggle.tsx
│   ├── hooks/
│   │   └── useChat.ts
│   └── lib/
│       ├── abuseDetection.ts
│       ├── config.ts
│       ├── knowledge.ts
│       ├── llm/
│       │   ├── openai.ts
│       │   ├── provider.ts
│       │   └── types.ts
│       ├── logger.ts
│       ├── rateLimit.ts
│       └── systemPrompt.ts
├── .env.example
├── LICENSE
├── package.json
└── README.md
```

## License

MIT
