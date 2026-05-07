import { useCallback } from "react";
import { useLocalStorage } from "@raycast/utils";
import { SORT_LABELS, SORT_ORDER, sortTasks } from "../lib/sort";
import type { Task } from "../types";

export type SortMode = "due" | "priority" | "created" | "modified" | "title";

export type UseSortModeResult = {
  mode: SortMode;
  cycle: () => void;
  label: string;
  sort: (tasks: Task[]) => Task[];
};

export function useSortMode(): UseSortModeResult {
  const { value, setValue, isLoading } = useLocalStorage<SortMode>(
    "tnr.sort.mode",
    "due",
  );

  const mode: SortMode = isLoading ? "due" : (value ?? "due");

  const cycle = useCallback(() => {
    const current = value ?? "due";
    const idx = SORT_ORDER.indexOf(current);
    const next = SORT_ORDER[(idx + 1) % SORT_ORDER.length] ?? "due";
    void setValue(next);
  }, [setValue, value]);

  const sort = useCallback((tasks: Task[]) => sortTasks(tasks, mode), [mode]);

  return {
    mode,
    cycle,
    label: SORT_LABELS[mode],
    sort,
  };
}
