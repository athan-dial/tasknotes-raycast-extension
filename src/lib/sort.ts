import type { SortMode } from "../hooks/useSortMode";
import type { Task } from "../types";

export const SORT_ORDER: SortMode[] = [
  "due",
  "priority",
  "created",
  "modified",
  "title",
];

export const SORT_LABELS: Record<SortMode, string> = {
  due: "Due",
  priority: "Priority",
  created: "Created",
  modified: "Modified",
  title: "Title",
};

const PRIORITY_WEIGHT: Record<string, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
  "": 0,
};

function weightPriority(priority: unknown): number {
  const key = String(priority ?? "")
    .trim()
    .toLowerCase();
  return PRIORITY_WEIGHT[key] ?? 0;
}

function compareIsoAsc(a: string, b: string): number {
  return a.localeCompare(b);
}

function compareIsoDesc(a: string, b: string): number {
  return b.localeCompare(a);
}

export const comparators: Record<SortMode, (a: Task, b: Task) => number> = {
  due: (a, b) => {
    const ad = a.due;
    const bd = b.due;
    if (!ad && !bd) return 0;
    if (!ad) return 1;
    if (!bd) return -1;
    return compareIsoAsc(ad, bd);
  },
  priority: (a, b) => {
    const aw = weightPriority(a.priority);
    const bw = weightPriority(b.priority);
    return bw - aw;
  },
  created: (a, b) => compareIsoDesc(a.dateCreated, b.dateCreated),
  modified: (a, b) => compareIsoDesc(a.dateModified, b.dateModified),
  title: (a, b) => a.title.localeCompare(b.title),
};

export function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  return [...tasks].sort(comparators[mode]);
}
