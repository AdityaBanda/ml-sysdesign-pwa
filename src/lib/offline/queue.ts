"use client";

import { openDB, type DBSchema } from "idb";

interface PendingProgress {
  id?: number;
  kind: "lesson" | "case-stage";
  payload: unknown;
  createdAt: number;
}

interface MlSdDb extends DBSchema {
  pending: {
    key: number;
    value: PendingProgress;
    indexes: { "by-createdAt": number };
  };
}

const DB_NAME = "ml-sysdesign";
const STORE = "pending";

function isClient() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

async function db() {
  return openDB<MlSdDb>(DB_NAME, 1, {
    upgrade(db) {
      const s = db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      s.createIndex("by-createdAt", "createdAt");
    },
  });
}

export async function enqueue(item: Omit<PendingProgress, "id" | "createdAt">) {
  if (!isClient()) return;
  const d = await db();
  await d.add(STORE, { ...item, createdAt: Date.now() });
}

export async function drainAll<T>(handler: (p: PendingProgress) => Promise<T>): Promise<number> {
  if (!isClient()) return 0;
  const d = await db();
  const items = await d.getAll(STORE);
  let drained = 0;
  for (const it of items) {
    try {
      await handler(it);
      if (typeof it.id === "number") {
        await d.delete(STORE, it.id);
      }
      drained++;
    } catch {
      // leave in queue
    }
  }
  return drained;
}
