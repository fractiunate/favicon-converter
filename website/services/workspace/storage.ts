/**
 * Workspace Storage Service
 *
 * Handles persistence of workspaces to localStorage
 */

import type { Workspace, WorkspaceListItem, WorkspaceToolData, ToolData } from "./types";
import {
    WORKSPACE_STORAGE_PREFIX,
    WORKSPACE_LIST_KEY,
    ACTIVE_WORKSPACE_KEY,
    MAX_WORKSPACES,
    MAX_WORKSPACE_NAME_LENGTH,
    MIN_WORKSPACE_NAME_LENGTH,
} from "./constants";

/**
 * Generate a unique workspace ID
 */
export function generateWorkspaceId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get the storage key for a workspace's data
 */
function getWorkspaceDataKey(id: string): string {
    return `${WORKSPACE_STORAGE_PREFIX}:data:${id}`;
}

/**
 * Validate workspace name
 */
export function validateWorkspaceName(
    name: string,
    existingNames: string[] = [],
    excludeId?: string
): { valid: boolean; error?: string } {
    const trimmed = name.trim();

    if (trimmed.length < MIN_WORKSPACE_NAME_LENGTH) {
        return { valid: false, error: "Workspace name cannot be empty" };
    }

    if (trimmed.length > MAX_WORKSPACE_NAME_LENGTH) {
        return { valid: false, error: `Workspace name cannot exceed ${MAX_WORKSPACE_NAME_LENGTH} characters` };
    }

    // Check for duplicate names (case-insensitive)
    const lowerName = trimmed.toLowerCase();
    const isDuplicate = existingNames.some((existing) => existing.toLowerCase() === lowerName);
    if (isDuplicate) {
        return { valid: false, error: "A workspace with this name already exists" };
    }

    return { valid: true };
}

/**
 * Check if we can create more workspaces
 */
export function canCreateWorkspace(currentCount: number): { allowed: boolean; error?: string } {
    if (currentCount >= MAX_WORKSPACES) {
        return { allowed: false, error: `Maximum of ${MAX_WORKSPACES} workspaces allowed` };
    }
    return { allowed: true };
}

/**
 * Load workspace list metadata from storage
 */
export function loadWorkspaceList(): WorkspaceListItem[] {
    if (typeof window === "undefined") return [];

    try {
        const stored = localStorage.getItem(WORKSPACE_LIST_KEY);
        if (!stored) return [];
        return JSON.parse(stored) as WorkspaceListItem[];
    } catch {
        console.error("Failed to load workspace list");
        return [];
    }
}

/**
 * Save workspace list metadata to storage
 */
export function saveWorkspaceList(list: WorkspaceListItem[]): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(WORKSPACE_LIST_KEY, JSON.stringify(list));
    } catch (error) {
        console.error("Failed to save workspace list:", error);
    }
}

/**
 * Load active workspace ID from storage
 */
export function loadActiveWorkspaceId(): string | null {
    if (typeof window === "undefined") return null;

    try {
        return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    } catch {
        return null;
    }
}

/**
 * Save active workspace ID to storage
 */
export function saveActiveWorkspaceId(id: string | null): void {
    if (typeof window === "undefined") return;

    try {
        if (id === null) {
            localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
        } else {
            localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
        }
    } catch (error) {
        console.error("Failed to save active workspace ID:", error);
    }
}

/**
 * Load workspace data from storage
 */
export function loadWorkspaceData(id: string): WorkspaceToolData | null {
    if (typeof window === "undefined") return null;

    try {
        const stored = localStorage.getItem(getWorkspaceDataKey(id));
        if (!stored) return {};
        return JSON.parse(stored) as WorkspaceToolData;
    } catch {
        console.error(`Failed to load workspace data for ${id}`);
        return null;
    }
}

/**
 * Save workspace data to storage
 */
export function saveWorkspaceData(id: string, data: WorkspaceToolData): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(getWorkspaceDataKey(id), JSON.stringify(data));
    } catch (error) {
        console.error(`Failed to save workspace data for ${id}:`, error);
    }
}

/**
 * Delete workspace data from storage
 */
export function deleteWorkspaceData(id: string): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.removeItem(getWorkspaceDataKey(id));
    } catch (error) {
        console.error(`Failed to delete workspace data for ${id}:`, error);
    }
}

/**
 * Load a complete workspace (metadata + data)
 */
export function loadWorkspace(id: string, list: WorkspaceListItem[]): Workspace | null {
    const metadata = list.find((w) => w.id === id);
    if (!metadata) return null;

    const data = loadWorkspaceData(id);
    if (data === null) return null;

    return {
        ...metadata,
        data,
    };
}

/**
 * Create a new workspace
 */
export function createWorkspace(name: string, list: WorkspaceListItem[]): { workspace: Workspace; newList: WorkspaceListItem[] } | { error: string } {
    const validation = validateWorkspaceName(name);
    if (!validation.valid) {
        return { error: validation.error! };
    }

    const canCreate = canCreateWorkspace(list.length);
    if (!canCreate.allowed) {
        return { error: canCreate.error! };
    }

    const now = Date.now();
    const workspace: Workspace = {
        id: generateWorkspaceId(),
        name: name.trim(),
        createdAt: now,
        updatedAt: now,
        data: {},
    };

    const newList: WorkspaceListItem[] = [
        ...list,
        {
            id: workspace.id,
            name: workspace.name,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt,
        },
    ];

    // Save to storage
    saveWorkspaceList(newList);
    saveWorkspaceData(workspace.id, workspace.data);

    return { workspace, newList };
}

/**
 * Update workspace metadata
 */
export function updateWorkspaceMetadata(
    id: string,
    updates: Partial<Pick<WorkspaceListItem, "name">>,
    list: WorkspaceListItem[]
): WorkspaceListItem[] {
    const newList = list.map((w) => {
        if (w.id === id) {
            return {
                ...w,
                ...updates,
                updatedAt: Date.now(),
            };
        }
        return w;
    });

    saveWorkspaceList(newList);
    return newList;
}

/**
 * Delete a workspace
 */
export function deleteWorkspace(id: string, list: WorkspaceListItem[]): WorkspaceListItem[] {
    const newList = list.filter((w) => w.id !== id);
    saveWorkspaceList(newList);
    deleteWorkspaceData(id);
    return newList;
}

/**
 * Update tool data in a workspace
 */
export function updateToolData<T extends ToolData>(
    workspaceId: string,
    toolId: string,
    data: T,
    currentData: WorkspaceToolData
): WorkspaceToolData {
    const newData = {
        ...currentData,
        [toolId]: data,
    };
    saveWorkspaceData(workspaceId, newData);
    return newData;
}

/**
 * Clear tool data from a workspace
 */
export function clearToolData(
    workspaceId: string,
    toolId: string,
    currentData: WorkspaceToolData
): WorkspaceToolData {
    const { [toolId]: _, ...rest } = currentData;
    saveWorkspaceData(workspaceId, rest);
    return rest;
}
