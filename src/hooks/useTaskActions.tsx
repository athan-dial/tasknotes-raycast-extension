import {
  Action,
  ActionPanel,
  Toast,
  showToast,
  getPreferenceValues,
  Keyboard,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import type { ReactElement } from "react";
import type { Preferences, PriorityOption, Task } from "../types";
import { fetchFilterOptions, toggleTaskStatus } from "../api/client";
import { DatePickerForm } from "../components/DatePickerForm";
import { TagPickerForm } from "../components/TagPickerForm";

function getBaseUrl(): string {
  const prefs = getPreferenceValues<Preferences>();
  return `http://127.0.0.1:${prefs.apiPort}`;
}

function getAuthHeaders(): HeadersInit {
  const prefs = getPreferenceValues<Preferences>();
  return prefs.apiToken ? { Authorization: `Bearer ${prefs.apiToken}` } : {};
}

async function updateTask(
  id: string,
  patch: Partial<Pick<Task, "due" | "scheduled" | "tags" | "priority">>,
): Promise<void> {
  const response = await fetch(
    `${getBaseUrl()}/api/tasks/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(patch),
    },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok || (data && data.success === false)) {
    throw new Error(
      data?.error || `Failed to update task: HTTP ${response.status}`,
    );
  }
}

async function toggleArchive(id: string): Promise<void> {
  const response = await fetch(
    `${getBaseUrl()}/api/tasks/${encodeURIComponent(id)}/toggle-archive`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok || (data && data.success === false)) {
    throw new Error(
      data?.error || `Failed to toggle archive: HTTP ${response.status}`,
    );
  }
}

function getObsidianOpenUrl(task: Task): string {
  const { vaultName } = getPreferenceValues<Preferences>();
  const file = encodeURIComponent(task.path);
  if (vaultName && vaultName.trim()) {
    return `obsidian://open?vault=${encodeURIComponent(vaultName.trim())}&file=${file}`;
  }
  return `obsidian://open?file=${file}`;
}

function byWeightAsc(a: PriorityOption, b: PriorityOption): number {
  return a.weight - b.weight;
}

export function useTaskActions(props: {
  onMutate: () => Promise<void> | void;
  sort?: { label: string; cycle: () => void };
}): { panel: (task: Task) => ReactElement } {
  const { onMutate, sort } = props;
  const { data: filterOptions } = usePromise(fetchFilterOptions);

  function panel(task: Task): ReactElement {
    const obsidianUrl = getObsidianOpenUrl(task);
    const prioritiesSorted = (filterOptions?.priorities ?? [])
      .slice()
      .sort(byWeightAsc);
    const shortcutByPriorityId = new Map<string, Keyboard.Shortcut>();

    // First four by weight ascending get Cmd+1..4.
    const firstFour = prioritiesSorted.slice(0, 4);
    const keys = ["1", "2", "3", "4"] as const;
    for (let i = 0; i < firstFour.length; i++) {
      shortcutByPriorityId.set(firstFour[i].id, {
        modifiers: ["cmd"],
        key: keys[i],
      });
    }

    return (
      <ActionPanel>
        <Action
          title="Complete Task"
          onAction={async () => {
            try {
              await toggleTaskStatus(task.id);
              await onMutate();
            } catch (error) {
              const message =
                error instanceof Error ? error.message : String(error);
              await showToast({
                style: Toast.Style.Failure,
                title: "Failed to toggle status",
                message,
              });
            }
          }}
        />

        <Action.Open
          title="Open in Obsidian"
          target={obsidianUrl}
          shortcut={{ modifiers: ["cmd"], key: "o" }}
        />

        {sort ? (
          <Action
            title={`Cycle Sort (now: ${sort.label})`}
            shortcut={{ modifiers: ["cmd"], key: "s" }}
            onAction={() => sort.cycle()}
          />
        ) : null}

        <Action
          title="Refresh"
          shortcut={{ modifiers: ["cmd"], key: "r" }}
          onAction={async () => {
            try {
              await onMutate();
            } catch (error) {
              const message =
                error instanceof Error ? error.message : String(error);
              await showToast({
                style: Toast.Style.Failure,
                title: "Failed to refresh",
                message,
              });
            }
          }}
        />

        <ActionPanel.Section title="Edit">
          <Action.Push
            title="Set Due Date"
            shortcut={{ modifiers: ["cmd"], key: "d" }}
            target={
              <DatePickerForm
                task={task}
                field="due"
                onDone={() => void onMutate()}
              />
            }
          />
          <Action.Push
            title="Set Scheduled Date"
            shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
            target={
              <DatePickerForm
                task={task}
                field="scheduled"
                onDone={() => void onMutate()}
              />
            }
          />
          <Action.Push
            title="Edit Tags"
            shortcut={{ modifiers: ["cmd"], key: "t" }}
            target={
              <TagPickerForm task={task} onDone={() => void onMutate()} />
            }
          />
          <Action
            title="Toggle Archive"
            shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
            onAction={async () => {
              try {
                await toggleArchive(task.id);
                await onMutate();
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : String(error);
                await showToast({
                  style: Toast.Style.Failure,
                  title: "Failed to toggle archive",
                  message,
                });
              }
            }}
          />
        </ActionPanel.Section>

        {filterOptions ? (
          <ActionPanel.Section title="Priority">
            {prioritiesSorted.map((opt) => (
              <Action
                key={opt.id}
                title={opt.label}
                shortcut={shortcutByPriorityId.get(opt.id)}
                onAction={async () => {
                  try {
                    await updateTask(task.id, { priority: opt.value });
                    await onMutate();
                  } catch (error) {
                    const message =
                      error instanceof Error ? error.message : String(error);
                    await showToast({
                      style: Toast.Style.Failure,
                      title: "Failed to set priority",
                      message,
                    });
                  }
                }}
              />
            ))}
          </ActionPanel.Section>
        ) : null}
      </ActionPanel>
    );
  }

  return { panel };
}
