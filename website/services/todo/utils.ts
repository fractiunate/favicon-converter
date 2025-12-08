/**
 * Todo List Utilities
 */

import type { TodoItem, TodoFilter, TodoStats, TodoPriority } from "./types";

/**
 * Generate a unique ID for a todo item
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new todo item
 */
export function createTodoItem(text: string, priority: TodoPriority = "medium"): TodoItem {
    return {
        id: generateId(),
        text: text.trim(),
        completed: false,
        createdAt: Date.now(),
        priority,
    };
}

/**
 * Filter todos based on filter settings
 */
export function filterTodos(items: TodoItem[], filter: TodoFilter): TodoItem[] {
    return items.filter((item) => {
        // Filter by status
        if (filter.status === "active" && item.completed) return false;
        if (filter.status === "completed" && !item.completed) return false;

        // Filter by priority
        if (filter.priority !== "all" && item.priority !== filter.priority) return false;

        return true;
    });
}

/**
 * Sort todos: incomplete first, then by priority, then by creation date
 */
export function sortTodos(items: TodoItem[]): TodoItem[] {
    const priorityOrder: Record<TodoPriority, number> = { high: 0, medium: 1, low: 2 };

    return [...items].sort((a, b) => {
        // Completed items go to the bottom
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        // Sort by priority (high first)
        if (a.priority !== b.priority) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }

        // Sort by creation date (newest first for active, oldest first for completed)
        return a.completed ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
    });
}

/**
 * Calculate todo statistics
 */
export function calculateStats(items: TodoItem[]): TodoStats {
    const total = items.length;
    const completed = items.filter((item) => item.completed).length;
    const active = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, active, completionRate };
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "just now";
}
