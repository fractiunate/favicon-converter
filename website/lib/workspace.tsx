"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import type {
    Workspace,
    WorkspaceListItem,
    WorkspaceContextValue,
    WorkspaceExport,
    ToolData,
} from "@/services/workspace/types";
import {
    loadWorkspaceList,
    loadActiveWorkspaceId,
    saveActiveWorkspaceId,
    loadWorkspace,
    createWorkspace as createWorkspaceStorage,
    updateWorkspaceMetadata,
    deleteWorkspace as deleteWorkspaceStorage,
    updateToolData as updateToolDataStorage,
    clearToolData as clearToolDataStorage,
    saveWorkspaceData,
    saveWorkspaceList,
    generateWorkspaceId,
} from "@/services/workspace/storage";

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load workspaces from storage on mount
    useEffect(() => {
        const list = loadWorkspaceList();
        setWorkspaces(list);

        const activeId = loadActiveWorkspaceId();
        if (activeId) {
            const workspace = loadWorkspace(activeId, list);
            setActiveWorkspace(workspace);
        }

        setIsLoaded(true);
    }, []);

    // Create a new workspace and auto-select it
    const createWorkspace = useCallback((name: string): Workspace => {
        const result = createWorkspaceStorage(name, workspaces);

        if ("error" in result) {
            throw new Error(result.error);
        }

        setWorkspaces(result.newList);

        // Auto-select the newly created workspace
        setActiveWorkspace(result.workspace);
        saveActiveWorkspaceId(result.workspace.id);

        return result.workspace;
    }, [workspaces]);

    // Select/activate a workspace
    const selectWorkspace = useCallback((id: string | null) => {
        if (id === null) {
            setActiveWorkspace(null);
            saveActiveWorkspaceId(null);
            return;
        }

        const workspace = loadWorkspace(id, workspaces);
        if (workspace) {
            setActiveWorkspace(workspace);
            saveActiveWorkspaceId(id);
        }
    }, [workspaces]);

    // Rename a workspace
    const renameWorkspace = useCallback((id: string, newName: string) => {
        const newList = updateWorkspaceMetadata(id, { name: newName.trim() }, workspaces);
        setWorkspaces(newList);

        // Update active workspace if it's the one being renamed
        if (activeWorkspace?.id === id) {
            setActiveWorkspace((prev) =>
                prev ? { ...prev, name: newName.trim(), updatedAt: Date.now() } : null
            );
        }
    }, [workspaces, activeWorkspace?.id]);

    // Delete a workspace
    const deleteWorkspace = useCallback((id: string) => {
        const newList = deleteWorkspaceStorage(id, workspaces);
        setWorkspaces(newList);

        // Deactivate if the deleted workspace was active
        if (activeWorkspace?.id === id) {
            setActiveWorkspace(null);
            saveActiveWorkspaceId(null);
        }
    }, [workspaces, activeWorkspace?.id]);

    // Get tool data from active workspace
    const getToolData = useCallback(<T extends ToolData>(toolId: string): T | null => {
        if (!activeWorkspace) return null;
        return (activeWorkspace.data[toolId] as T) || null;
    }, [activeWorkspace]);

    // Set tool data in active workspace
    const setToolData = useCallback(<T extends ToolData>(toolId: string, data: T) => {
        if (!activeWorkspace) return;

        const newData = updateToolDataStorage(activeWorkspace.id, toolId, data, activeWorkspace.data);
        const now = Date.now();

        setActiveWorkspace((prev) =>
            prev ? { ...prev, data: newData, updatedAt: now } : null
        );

        // Update the workspace list metadata
        const newList = workspaces.map((w) =>
            w.id === activeWorkspace.id ? { ...w, updatedAt: now } : w
        );
        setWorkspaces(newList);
        saveWorkspaceList(newList);
    }, [activeWorkspace, workspaces]);

    // Update specific fields in tool data
    const updateToolData = useCallback(<T extends ToolData>(toolId: string, updates: Partial<T>) => {
        if (!activeWorkspace) return;

        const currentData = (activeWorkspace.data[toolId] || {}) as T;
        const mergedData = { ...currentData, ...updates };
        const newData = updateToolDataStorage(activeWorkspace.id, toolId, mergedData, activeWorkspace.data);
        const now = Date.now();

        setActiveWorkspace((prev) =>
            prev ? { ...prev, data: newData, updatedAt: now } : null
        );

        // Update the workspace list metadata
        const newList = workspaces.map((w) =>
            w.id === activeWorkspace.id ? { ...w, updatedAt: now } : w
        );
        setWorkspaces(newList);
        saveWorkspaceList(newList);
    }, [activeWorkspace, workspaces]);

    // Clear tool data from active workspace
    const clearToolData = useCallback((toolId: string) => {
        if (!activeWorkspace) return;

        const newData = clearToolDataStorage(activeWorkspace.id, toolId, activeWorkspace.data);
        const now = Date.now();

        setActiveWorkspace((prev) =>
            prev ? { ...prev, data: newData, updatedAt: now } : null
        );

        // Update the workspace list metadata
        const newList = workspaces.map((w) =>
            w.id === activeWorkspace.id ? { ...w, updatedAt: now } : w
        );
        setWorkspaces(newList);
        saveWorkspaceList(newList);
    }, [activeWorkspace, workspaces]);

    // Export workspace to JSON file
    const exportWorkspace = useCallback((id: string) => {
        const workspace = loadWorkspace(id, workspaces);
        if (!workspace) {
            throw new Error("Workspace not found");
        }

        const exportData: WorkspaceExport = {
            version: 1,
            exportedAt: Date.now(),
            workspace,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `workspace-${workspace.name.toLowerCase().replace(/\s+/g, "-")}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [workspaces]);

    // Import workspace from JSON file
    const importWorkspace = useCallback(async (file: File): Promise<Workspace> => {
        const text = await file.text();
        const data = JSON.parse(text) as WorkspaceExport;

        // Validate export format
        if (data.version !== 1 || !data.workspace) {
            throw new Error("Invalid workspace file format");
        }

        const imported = data.workspace;

        // Generate new ID and timestamps for imported workspace
        const now = Date.now();
        const newWorkspace: Workspace = {
            ...imported,
            id: generateWorkspaceId(),
            name: imported.name + " (imported)",
            createdAt: now,
            updatedAt: now,
        };

        // Add to list
        const newListItem: WorkspaceListItem = {
            id: newWorkspace.id,
            name: newWorkspace.name,
            createdAt: newWorkspace.createdAt,
            updatedAt: newWorkspace.updatedAt,
        };
        const newList = [...workspaces, newListItem];
        setWorkspaces(newList);
        saveWorkspaceList(newList);
        saveWorkspaceData(newWorkspace.id, newWorkspace.data);

        // Auto-select imported workspace
        setActiveWorkspace(newWorkspace);
        saveActiveWorkspaceId(newWorkspace.id);

        return newWorkspace;
    }, [workspaces]);

    const value: WorkspaceContextValue = {
        activeWorkspace,
        workspaces,
        isLoaded,
        createWorkspace,
        selectWorkspace,
        renameWorkspace,
        deleteWorkspace,
        getToolData,
        setToolData,
        updateToolData,
        clearToolData,
        exportWorkspace,
        importWorkspace,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
}

/**
 * Hook for tools to easily access their workspace data
 */
export function useToolWorkspace<T extends ToolData>(toolId: string) {
    const { activeWorkspace, getToolData, setToolData, updateToolData, clearToolData, isLoaded } = useWorkspace();

    const data = getToolData<T>(toolId);
    const isActive = activeWorkspace !== null;

    const save = useCallback((newData: T) => {
        setToolData(toolId, newData);
    }, [setToolData, toolId]);

    const update = useCallback((updates: Partial<T>) => {
        updateToolData(toolId, updates);
    }, [updateToolData, toolId]);

    const clear = useCallback(() => {
        clearToolData(toolId);
    }, [clearToolData, toolId]);

    return {
        /** Whether a workspace is active (data will be saved) */
        isActive,
        /** Whether the workspace context is loaded */
        isLoaded,
        /** Current tool data from workspace (null if no workspace or no data) */
        data,
        /** Active workspace name (null if none) */
        workspaceName: activeWorkspace?.name || null,
        /** Save complete tool data */
        save,
        /** Update partial tool data (merges with existing) */
        update,
        /** Clear tool data from workspace */
        clear,
    };
}
