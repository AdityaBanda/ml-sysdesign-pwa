import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  caseSchema,
  frameworkSchema,
  topicSchema,
  type CaseData,
  type FrameworkData,
  type TopicData,
} from "./schemas";

export function parseFramework(rootDir: string): FrameworkData {
  const file = path.join(rootDir, "framework.md");
  const raw = fs.readFileSync(file, "utf8");
  const { data } = matter(raw);
  return frameworkSchema.parse(data);
}

export function parseTopics(rootDir: string): TopicData[] {
  const topicsDir = path.join(rootDir, "topics");
  if (!fs.existsSync(topicsDir)) return [];
  const files = fs.readdirSync(topicsDir).filter((f) => f.endsWith(".md"));
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(topicsDir, f), "utf8");
    const { data } = matter(raw);
    try {
      return topicSchema.parse(data);
    } catch (e) {
      throw new Error(`Failed to parse topic ${f}: ${(e as Error).message}`);
    }
  });
}

export function parseCases(rootDir: string): CaseData[] {
  const casesDir = path.join(rootDir, "cases");
  if (!fs.existsSync(casesDir)) return [];
  const files = fs.readdirSync(casesDir).filter((f) => f.endsWith(".md"));
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(casesDir, f), "utf8");
    const { data } = matter(raw);
    try {
      return caseSchema.parse(data);
    } catch (e) {
      throw new Error(`Failed to parse case ${f}: ${(e as Error).message}`);
    }
  });
}
