/**
 * Todo List Constants
 */

import type { TodoFilter, TodoPriority } from "./types";

export const DEFAULT_FILTER: TodoFilter = {
    status: "all",
    priority: "all",
};

export const PRIORITY_CONFIG: Record<TodoPriority, { label: string; color: string; bgColor: string }> = {
    high: {
        label: "High",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900/30",
    },
    medium: {
        label: "Medium",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    low: {
        label: "Low",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
    },
};

export const STORAGE_KEY = "todo-list-data";

export const MAX_TODO_LENGTH = 500;
export const MAX_TODOS = 100;
