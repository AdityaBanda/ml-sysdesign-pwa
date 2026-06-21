import path from "node:path";
import { parseCases, parseFramework, parseTopics } from "./parse";
import type { CaseData, FrameworkData, TopicData } from "./schemas";

const ROOT = path.resolve(process.cwd(), "content");

/**
 * Load all content from the local filesystem. Use this in server components
 * during development; in production we read from Supabase.
 */
export function loadAllContent(): {
  framework: FrameworkData;
  topics: TopicData[];
  cases: CaseData[];
} {
  return {
    framework: parseFramework(ROOT),
    topics: parseTopics(ROOT).sort((a, b) => a.order - b.order),
    cases: parseCases(ROOT),
  };
}

export function loadCase(slug: string): CaseData | null {
  return parseCases(ROOT).find((c) => c.slug === slug) ?? null;
}

export function loadTopic(slug: string): TopicData | null {
  return parseTopics(ROOT).find((t) => t.slug === slug) ?? null;
}
