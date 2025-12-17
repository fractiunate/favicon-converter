"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    ReactNode,
} from "react";
import { saveAs } from "file-saver";
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
import { MAX_WORKSPACES } from "@/services/workspace/constants";

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Use refs to store latest values for stable functions
    const workspacesRef = useRef<WorkspaceListItem[]>([]);
    const activeWorkspaceRef = useRef<Workspace | null>(null);

    // Keep refs in sync
    workspacesRef.current = workspaces;
    activeWorkspaceRef.current = activeWorkspace;

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
        const currentActiveWorkspace = activeWorkspaceRef.current;
        if (!currentActiveWorkspace) return null;
        return (currentActiveWorkspace.data[toolId] as T) || null;
    }, []); // Remove dependencies to make function stable

    // Set tool data in active workspace
    const setToolData = useCallback(<T extends ToolData>(toolId: string, data: T) => {
        const currentActiveWorkspace = activeWorkspaceRef.current;
        const currentWorkspaces = workspacesRef.current;

        if (!currentActiveWorkspace) return;

        const newData = updateToolDataStorage(currentActiveWorkspace.id, toolId, data, currentActiveWorkspace.data);
        const now = Date.now();

        setActiveWorkspace((prev) =>
            prev ? { ...prev, data: newData, updatedAt: now } : null
        );

        // Update the workspace list metadata
        const newList = currentWorkspaces.map((w) =>
            w.id === currentActiveWorkspace.id ? { ...w, updatedAt: now } : w
        );
        setWorkspaces(newList);
        saveWorkspaceList(newList);
    }, []); // Remove dependencies to make function stable

    // Update specific fields in tool data
    const updateToolData = useCallback(<T extends ToolData>(toolId: string, updates: Partial<T>) => {
        const currentActiveWorkspace = activeWorkspaceRef.current;
        const currentWorkspaces = workspacesRef.current;

        if (!currentActiveWorkspace) return;

        const currentData = (currentActiveWorkspace.data[toolId] || {}) as T;
        const mergedData = { ...currentData, ...updates };
        const newData = updateToolDataStorage(currentActiveWorkspace.id, toolId, mergedData, currentActiveWorkspace.data);
        const now = Date.now();

        setActiveWorkspace((prev) =>
            prev ? { ...prev, data: newData, updatedAt: now } : null
        );

        // Update the workspace list metadata
        const newList = currentWorkspaces.map((w) =>
            w.id === currentActiveWorkspace.id ? { ...w, updatedAt: now } : w
        );
        setWorkspaces(newList);
        saveWorkspaceList(newList);
    }, []); // Remove dependencies to make function stable

    // Clear tool data from active workspace
    const clearToolData = useCallback((toolId: string) => {
        const currentActiveWorkspace = activeWorkspaceRef.current;
        const currentWorkspaces = workspacesRef.current;

        if (!currentActiveWorkspace) return;

        const newData = clearToolDataStorage(currentActiveWorkspace.id, toolId, currentActiveWorkspace.data);
        const now = Date.now();

        setActiveWorkspace((prev) =>
            prev ? { ...prev, data: newData, updatedAt: now } : null
        );

        // Update the workspace list metadata
        const newList = currentWorkspaces.map((w) =>
            w.id === currentActiveWorkspace.id ? { ...w, updatedAt: now } : w
        );
        setWorkspaces(newList);
        saveWorkspaceList(newList);
    }, []); // Remove dependencies to make function stable

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
        const filename = `workspace-${workspace.name.toLowerCase().replace(/\s+/g, "-")}.json`;
        saveAs(blob, filename);
    }, [workspaces]);

    // Import workspace from JSON file
    const importWorkspace = useCallback(async (file: File): Promise<Workspace> => {
        // Check if we can create more workspaces
        if (workspaces.length >= MAX_WORKSPACES) {
            throw new Error(`Maximum of ${MAX_WORKSPACES} workspaces allowed`);
        }

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
 * Safe version of useWorkspace that returns null if not within a provider
 * Use this when the component might render outside of WorkspaceProvider
 */
export function useWorkspaceSafe() {
    const context = useContext(WorkspaceContext);
    return context ?? null;
}

/**
 * Hook for tools to easily access their workspace data
 */
export function useToolWorkspace<T extends ToolData>(toolId: string) {
    const context = useContext(WorkspaceContext);

    // Return null-safe defaults if not within provider
    const isWithinProvider = context !== undefined;

    const activeWorkspace = context?.activeWorkspace ?? null;
    const getToolData = context?.getToolData ?? (() => null);
    const setToolData = context?.setToolData ?? (() => { });
    const updateToolData = context?.updateToolData ?? (() => { });
    const clearToolData = context?.clearToolData ?? (() => { });
    const isLoaded = context?.isLoaded ?? true;

    const data = isWithinProvider ? getToolData<T>(toolId) : null;
    const isActive = activeWorkspace !== null;
    const workspaceId = activeWorkspace?.id || null;

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
        /** Active workspace ID (null if none) - use to detect workspace changes */
        workspaceId,
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

/**
 * Hook that handles automatic workspace data synchronization.
 * Simplifies the common pattern of loading/saving tool state to workspace.
 * 
 * @param toolId - Unique identifier for the tool
 * @param currentState - Current state to save
 * @param onLoad - Callback to load state from workspace data
 * @param onReset - Callback to reset state to defaults
 */
export function useWorkspaceSync<T extends ToolData>(
    toolId: string,
    currentState: T,
    onLoad: (data: T) => void,
    onReset: () => void,
) {
    const { isActive, isLoaded, data: workspaceData, workspaceId, save } = useToolWorkspace<T>(toolId);
    const previousWorkspaceId = useRef<string | null | undefined>(undefined);
    const isLoadingFromWorkspace = useRef(false);
    const saveRef = useRef(save);
    saveRef.current = save;

    // Load/reset data when workspace changes
    useEffect(() => {
        if (!isLoaded) return;

        // Skip if workspace hasn't actually changed
        if (previousWorkspaceId.current === workspaceId) return;
        previousWorkspaceId.current = workspaceId;
        isLoadingFromWorkspace.current = true;

        if (workspaceData) {
            onLoad(workspaceData);
        } else {
            onReset();
        }

        // Allow saves after state updates settle
        requestAnimationFrame(() => {
            isLoadingFromWorkspace.current = false;
        });
    }, [isLoaded, workspaceId, workspaceData, onLoad, onReset]);

    // Save to workspace when state changes
    useEffect(() => {
        if (!isActive || !isLoaded) return;
        // Don't save during initial load or workspace load
        if (previousWorkspaceId.current === undefined || isLoadingFromWorkspace.current) return;

        saveRef.current(currentState);
    }, [currentState, isActive, isLoaded]);

    return { isActive, isLoaded, workspaceId };
}
