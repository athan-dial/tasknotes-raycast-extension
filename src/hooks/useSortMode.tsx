import { Task } from "../types";

export type SortMode = "due" | "priority" | "created" | "modified" | "title";

export interface UseSortModeResult {
  mode: SortMode;
  cycle: () => void;
  label: string;
  sort: (tasks: Task[]) => Task[];
}

export function useSortMode(): UseSortModeResult {
  return {
    mode: "due",
    cycle: () => {},
    label: "Due",
    sort: (tasks) => tasks,
  };
}
