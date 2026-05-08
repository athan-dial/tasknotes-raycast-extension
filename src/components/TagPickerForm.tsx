import {
  Action,
  ActionPanel,
  Form,
  Toast,
  popToRoot,
  showToast,
  getPreferenceValues,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import type { Preferences, Task } from "../types";
import { fetchFilterOptions } from "../api/client";

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
  patch: Partial<Pick<Task, "tags">>,
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

export function TagPickerForm(props: { task: Task; onDone: () => void }) {
  const { task, onDone } = props;
  const { data: filterOptions } = usePromise(fetchFilterOptions);

  async function submit(values: { tags?: string[] }) {
    try {
      const tags = values.tags ?? [];
      await showToast({ style: Toast.Style.Animated, title: "Saving tags..." });
      await updateTask(task.id, { tags });
      await showToast({ style: Toast.Style.Success, title: "Tags saved" });
      await popToRoot();
      onDone();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await showToast({ style: Toast.Style.Failure, title: "Error", message });
    }
  }

  return (
    <Form
      navigationTitle="Edit Tags"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save"
            onSubmit={submit}
            shortcut={{ modifiers: ["cmd"], key: "enter" }}
          />
        </ActionPanel>
      }
    >
      <Form.TagPicker id="tags" title="Tags" defaultValue={task.tags}>
        {(filterOptions?.tags ?? []).map((t) => (
          <Form.TagPicker.Item key={t} value={t} title={t} />
        ))}
      </Form.TagPicker>
    </Form>
  );
}
