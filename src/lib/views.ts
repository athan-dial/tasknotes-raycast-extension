import type { Task } from "../types";

function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

const DONE_STATUSES = new Set(["done", "cancelled"]);
const INBOX_EXCLUDED_STATUSES = new Set([
  "done",
  "cancelled",
  "in-progress",
  "someday",
]);

export function isInboxTask(task: Task): boolean {
  if (task.archived) return false;
  if (INBOX_EXCLUDED_STATUSES.has(task.status)) return false;
  if ((task.projects ?? []).length > 0) return false;
  return !task.due || !task.scheduled;
}

export function isTodayTask(task: Task): boolean {
  if (task.archived) return false;
  if (DONE_STATUSES.has(task.status)) return false;
  return dateOnly(task.scheduled) === todayISO();
}
