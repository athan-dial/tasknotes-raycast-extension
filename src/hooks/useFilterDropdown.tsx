import { Task } from "../types";
import { List } from "@raycast/api";
import { ReactElement } from "react";

export interface UseFilterDropdownResult {
  apply: (tasks: Task[]) => Task[];
  dropdown: ReactElement;
}

export function useFilterDropdown(): UseFilterDropdownResult {
  return {
    apply: (tasks) => tasks,
    dropdown: (
      <List.Dropdown tooltip="Filter" storeValue>
        <List.Dropdown.Item title="All" value="all" />
      </List.Dropdown>
    ),
  };
}
