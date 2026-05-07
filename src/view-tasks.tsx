import { List } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { Task } from "./types";
import { fetchTasks } from "./api/client";
import { getCachedTasks } from "./cache";
import { useFilterDropdown } from "./hooks/useFilterDropdown";
import { useSortMode } from "./hooks/useSortMode";
import { useTaskActions } from "./hooks/useTaskActions";

export default function ViewTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const sort = useSortMode();
  const filter = useFilterDropdown();

  const revalidate = useCallback(async () => {
    setIsLoading(true);
    try {
      const tasksResult = await fetchTasks({ completed: false });
      setTasks(tasksResult);
    } catch {
      const cached = await getCachedTasks();
      if (cached) {
        const openTasks = cached.filter((t) => t.status !== "done");
        setTasks(openTasks);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const actions = useTaskActions({ onMutate: revalidate });

  useEffect(() => {
    void revalidate();
  }, [revalidate]);

  const searchedTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchText.toLowerCase()),
  );
  const visible = sort.sort(filter.apply(searchedTasks));

  function getAccessories(task: Task): List.Item.Accessory[] {
    const accessories: List.Item.Accessory[] = [];

    if (task.tags && task.tags.length > 0) {
      for (const tagName of task.tags.slice(0, 3)) {
        accessories.push({ tag: { value: tagName } });
      }
    }

    if (task.priority && task.priority !== "none") {
      accessories.push({ text: task.priority });
    }

    if (task.due) {
      accessories.push({ text: task.due });
    }

    return accessories;
  }

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder={`Search tasks... (sort: ${sort.label})`}
      navigationTitle="View Tasks"
      searchBarAccessory={filter.dropdown}
    >
      {visible.length === 0 && !isLoading ? (
        <List.EmptyView
          title="No tasks found"
          description="All caught up! No open tasks."
        />
      ) : (
        visible.map((task) => (
          <List.Item
            key={task.id}
            title={task.title}
            subtitle={task.projects?.[0]?.replace(/^\[\[|\]\]$/g, "")}
            accessories={getAccessories(task)}
            actions={actions.panel(task)}
          />
        ))
      )}
    </List>
  );
}
