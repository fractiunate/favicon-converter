/**
 * Todo List Types
 */

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
    completedAt?: number;
    priority: TodoPriority;
}

export type TodoPriority = "low" | "medium" | "high";

export interface TodoFilter {
    status: "all" | "active" | "completed";
    priority: TodoPriority | "all";
}

export interface TodoStats {
    total: number;
    completed: number;
    active: number;
    completionRate: number;
}

export interface TodoWorkspaceData {
    items: TodoItem[];
    filter: TodoFilter;
}
