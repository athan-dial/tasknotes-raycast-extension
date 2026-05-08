import { List } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { fetchFilterOptions } from "../api/client";
import type { Task } from "../types";
import { isInboxTask, isTodayTask } from "../lib/views";

export interface UseFilterDropdownResult {
  dropdown: ReactElement;
  apply: (tasks: Task[]) => Task[];
}

type FilterSelection =
  | "all"
  | `view:${string}`
  | `status:${string}`
  | `priority:${string}`
  | `project:${string}`
  | `tag:${string}`;

function parseSelection(selection: string): { kind: string; value: string } {
  if (selection === "all") return { kind: "all", value: "" };
  const idx = selection.indexOf(":");
  if (idx === -1) return { kind: "all", value: "" };
  return { kind: selection.slice(0, idx), value: selection.slice(idx + 1) };
}

export function useFilterDropdown(): UseFilterDropdownResult {
  const [selected, setSelected] = useState<FilterSelection>("all");

  const {
    data: filterOptions,
    isLoading,
    error,
  } = usePromise(fetchFilterOptions, []);

  const dropdown = useMemo(() => {
    const showLoading = isLoading && !filterOptions;
    const showError = !!error && !filterOptions;

    return (
      <List.Dropdown
        tooltip="Filter"
        storeValue
        value={selected}
        onChange={(next) => setSelected(next as FilterSelection)}
      >
        <List.Dropdown.Section title="All">
          <List.Dropdown.Item title="All" value="all" />
        </List.Dropdown.Section>

        <List.Dropdown.Section title="Views">
          <List.Dropdown.Item title="Inbox" value="view:inbox" />
          <List.Dropdown.Item title="Today" value="view:today" />
        </List.Dropdown.Section>

        <List.Dropdown.Section title="Status">
          {showLoading ? (
            <List.Dropdown.Item title="Loading…" value="all" />
          ) : showError ? (
            <List.Dropdown.Item title="Failed to load" value="all" />
          ) : (
            (filterOptions?.statuses ?? [])
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((s) => (
                <List.Dropdown.Item
                  key={s.id}
                  title={s.label}
                  value={`status:${s.value}`}
                />
              ))
          )}
        </List.Dropdown.Section>

        <List.Dropdown.Section title="Priority">
          {showLoading ? (
            <List.Dropdown.Item title="Loading…" value="all" />
          ) : showError ? (
            <List.Dropdown.Item title="Failed to load" value="all" />
          ) : (
            (filterOptions?.priorities ?? []).map((p) => (
              <List.Dropdown.Item
                key={p.id}
                title={p.label}
                value={`priority:${p.id}`}
              />
            ))
          )}
        </List.Dropdown.Section>

        <List.Dropdown.Section title="Project">
          {showLoading ? (
            <List.Dropdown.Item title="Loading…" value="all" />
          ) : showError ? (
            <List.Dropdown.Item title="Failed to load" value="all" />
          ) : (
            (filterOptions?.projects ?? []).map((p) => (
              <List.Dropdown.Item key={p} title={p} value={`project:${p}`} />
            ))
          )}
        </List.Dropdown.Section>

        <List.Dropdown.Section title="Tag">
          {showLoading ? (
            <List.Dropdown.Item title="Loading…" value="all" />
          ) : showError ? (
            <List.Dropdown.Item title="Failed to load" value="all" />
          ) : (
            (filterOptions?.tags ?? []).map((t) => (
              <List.Dropdown.Item key={t} title={t} value={`tag:${t}`} />
            ))
          )}
        </List.Dropdown.Section>
      </List.Dropdown>
    );
  }, [error, filterOptions, isLoading, selected]);

  const apply = useMemo(() => {
    return (tasks: Task[]) => {
      const { kind, value } = parseSelection(selected);

      if (kind === "all") return tasks;
      if (kind === "view") {
        if (value === "inbox") return tasks.filter(isInboxTask);
        if (value === "today") return tasks.filter(isTodayTask);
        return tasks;
      }
      if (kind === "status") return tasks.filter((t) => t.status === value);
      if (kind === "priority") return tasks.filter((t) => t.priority === value);
      if (kind === "project")
        return tasks.filter((t) => (t.projects ?? []).includes(value));
      if (kind === "tag")
        return tasks.filter((t) => (t.tags ?? []).includes(value));

      return tasks;
    };
  }, [selected]);

  return { dropdown, apply };
}
