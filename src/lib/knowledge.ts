import fs from "fs";
import path from "path";

interface KnowledgeFile {
  name: string;
  content: string;
}

let cache: KnowledgeFile[] | null = null;

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");

export function loadKnowledge(): KnowledgeFile[] {
  if (cache) return cache;

  const files = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith(".md"));

  cache = files.map((name) => ({
    name,
    content: fs.readFileSync(path.join(KNOWLEDGE_DIR, name), "utf-8"),
  }));

  return cache;
}

export function getKnowledgeContext(): string {
  const files = loadKnowledge();
  return files
    .map((f) => `--- FILE: ${f.name} ---\n${f.content}`)
    .join("\n\n");
}

export function getKnowledgeFileNames(): string[] {
  return loadKnowledge().map((f) => f.name);
}

/** Clear cache — useful if knowledge files are updated at runtime */
export function clearKnowledgeCache(): void {
  cache = null;
}
