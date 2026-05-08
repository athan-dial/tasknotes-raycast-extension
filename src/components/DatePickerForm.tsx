import {
  Action,
  ActionPanel,
  Form,
  Toast,
  popToRoot,
  showToast,
  getPreferenceValues,
} from "@raycast/api";
import { useState } from "react";
import type { Preferences, Task } from "../types";
import { DATE_PRESETS, parseNaturalDate } from "../lib/dateParser";

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
  patch: Partial<
    Pick<
      Task,
      "due" | "scheduled" | "tags" | "priority" | "archived" | "status"
    >
  >,
): Promise<Task> {
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

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      message || `Failed to update task: HTTP ${response.status}`,
    );
  }

  const data = (await response.json()) as unknown;
  const task =
    (data as { data?: { task?: Task }; task?: Task }).data?.task ??
    (data as { task?: Task }).task ??
    (data as Task);
  return task;
}

export function DatePickerForm(props: {
  task: Task;
  field: "due" | "scheduled";
  onDone: () => void;
}) {
  const { task, field, onDone } = props;
  const [input, setInput] = useState("");
  const [preset, setPreset] = useState("");

  const title = field === "due" ? "Set Due Date" : "Set Scheduled Date";

  async function submit() {
    try {
      const value = preset ? preset : input;
      if (value.trim().toLowerCase() === "clear") {
        await showToast({
          style: Toast.Style.Animated,
          title: "Clearing date...",
        });
        await updateTask(task.id, { [field]: null } as {
          [k in typeof field]: null;
        });
        await showToast({ style: Toast.Style.Success, title: "Date cleared" });
        await popToRoot();
        onDone();
        return;
      }

      const resolved = parseNaturalDate(value);
      if (!resolved) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Could not parse date",
          message: "Try: today, tomorrow, fri, +1w, 2026-06-01",
        });
        return;
      }

      await showToast({ style: Toast.Style.Animated, title: "Saving date..." });
      await updateTask(task.id, { [field]: resolved } as {
        [k in typeof field]: string;
      });
      await showToast({
        style: Toast.Style.Success,
        title: "Date saved",
        message: resolved,
      });
      await popToRoot();
      onDone();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await showToast({ style: Toast.Style.Failure, title: "Error", message });
    }
  }

  async function clearDate() {
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Clearing date...",
      });
      await updateTask(task.id, { [field]: null } as {
        [k in typeof field]: null;
      });
      await showToast({ style: Toast.Style.Success, title: "Date cleared" });
      await popToRoot();
      onDone();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await showToast({ style: Toast.Style.Failure, title: "Error", message });
    }
  }

  return (
    <Form
      navigationTitle={title}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save"
            onSubmit={submit}
            shortcut={{ modifiers: ["cmd"], key: "enter" }}
          />
          <Action title="Clear Date" onAction={clearDate} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="input"
        title="Date"
        placeholder="today, tomorrow, fri, +1w, 2026-06-01"
        value={input}
        onChange={setInput}
      />
      <Form.Dropdown
        id="preset"
        title="Presets"
        value={preset}
        onChange={setPreset}
      >
        <Form.Dropdown.Item value="" title="(none)" />
        {DATE_PRESETS.map((p) => (
          <Form.Dropdown.Item key={p.value} value={p.value} title={p.label} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
