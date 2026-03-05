# andr3s.com

An AI-powered portfolio website — **ChatGPT, but it only knows about Andres.**

Recruiters and hiring managers can chat with an AI agent that explains my background, projects, and experience — all grounded in a curated knowledge base.

This project was also an experiment.

I wanted to see how far modern AI coding tools could go if I let them take the lead.

**~90% of this repository was written by Claude Code.**

My role was mostly:
- defining the architecture
- reviewing and steering the generated code
- integrating it with systems I'm already comfortable with (like LiveKit agents)

The result surprised me — both in speed and quality.

I'm intentionally leaving this repo **public** as a demonstration of what modern AI-assisted development looks like in practice.

---

# Architecture

The site is essentially a **chat interface backed by an AI agent** that answers questions about me.

## Frontend
- React / Next.js
- ChatGPT-style streaming UI
- Markdown-rendered responses

## Backend
- Lightweight PHP API layer
- Handles requests from the frontend
- Communicates with the LLM
- Protects API keys from the browser

I chose **PHP intentionally** because the site is deployed on a **very cheap Hostinger shared hosting plan**, which limits what runtimes can run server-side.

The goal was to prove you can still build something modern even within those constraints.

# Knowledge Base

The AI does not know anything about me unless it's written in the repo.

All knowledge lives in: `knowledgebase/`

These Markdown files are embedded into a **vector database** that the agent queries before answering questions.

This ensures responses are **grounded in real content** instead of relying on model memory or hallucination.

Updating the AI's knowledge is as simple as editing Markdown.

---

# LiveKit Integration

The chat agent runs through **LiveKit agents**, which provide:

- real-time streaming responses
- event-driven AI workflows
- a clean abstraction around LLM execution

This is the part of the stack I'm personally most familiar with, so integrating it with the AI-generated codebase was straightforward.

---

# Deployment

This site is intentionally hosted on a **very cheap Hostinger plan**.

Because of those constraints:

- backend logic runs in **PHP**
- the frontend is a **built React app**
- deployment uses **GitHub Actions + SSH + rsync**

Every push to `main` automatically:

1. builds the React app
2. uploads the build to the server
3. syncs the PHP backend

You can see the deployment pipeline here: `.github/workflows/`

---

# Why this repo is public

Two reasons:

## Demonstrate modern AI-assisted development

Tools like Claude Code dramatically change how quickly small projects can be built.

This repo is a real-world example where:

- AI wrote the majority of the code
- I provided architecture, direction, and review
- the end result is production-ready

## Show how simple a personal AI agent can be

You don't need a massive stack to build something like this.

The entire project runs on:

- Markdown files
- a vector database
- an OpenAI-compatible LLM
- a cheap shared hosting plan

---

# Running locally

Front end:
```bash
npm install
cp .env.example .env
npm run dev
```

Back end:
```bash
php -S localhost:8080 router.p
```
