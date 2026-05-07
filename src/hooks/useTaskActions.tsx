import {
  Action,
  ActionPanel,
  Icon,
  Toast,
  open,
  showToast,
} from "@raycast/api";
import { ReactElement } from "react";
import { toggleTaskStatus } from "../api/client";
import { Task } from "../types";

export interface UseTaskActionsResult {
  panel: (task: Task) => ReactElement;
}

export interface UseTaskActionsInput {
  onMutate: () => Promise<void> | void;
}

function openInObsidian(task: Task) {
  const encodedPath = encodeURIComponent(task.path);
  open(`obsidian://open?file=${encodedPath}`);
}

export function useTaskActions(
  input: UseTaskActionsInput,
): UseTaskActionsResult {
  return {
    panel: (task) => (
      <ActionPanel>
        <Action
          title="Open in Obsidian"
          icon={Icon.Link}
          onAction={() => openInObsidian(task)}
        />
        <Action
          title="Complete Task"
          icon={Icon.Checkmark}
          shortcut={{ modifiers: ["cmd"], key: "enter" }}
          onAction={async () => {
            await showToast({
              style: Toast.Style.Animated,
              title: "Marking complete...",
            });
            try {
              await toggleTaskStatus(task.id);
              await showToast({
                style: Toast.Style.Success,
                title: "Task completed",
                message: task.title,
              });
              await input.onMutate();
            } catch (error) {
              const message =
                error && typeof error === "object" && "message" in error
                  ? String((error as { message: unknown }).message)
                  : "Failed to complete task";
              await showToast({
                style: Toast.Style.Failure,
                title: "Error",
                message,
              });
            }
          }}
        />
        <Action
          title="Refresh"
          icon={Icon.ArrowClockwise}
          shortcut={{ modifiers: ["cmd"], key: "r" }}
          onAction={async () => {
            await input.onMutate();
          }}
        />
      </ActionPanel>
    ),
  };
}
