/**
 * Workspace Types
 *
 * A Workspace is a logical save unit that holds all data of a current session.
 * Tools can store their state in the active workspace for persistence.
 */

/**
 * Tool-specific data stored in a workspace.
 * Each tool can store arbitrary serializable data.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolData = Record<string, any>;

/**
 * Map of tool IDs to their stored data
 */
export type WorkspaceToolData = Record<string, ToolData>;

/**
 * Workspace metadata
 */
export interface WorkspaceMetadata {
    /** Unique workspace identifier */
    id: string;
    /** User-defined workspace name */
    name: string;
    /** Creation timestamp */
    createdAt: number;
    /** Last modified timestamp */
    updatedAt: number;
}

/**
 * Complete workspace with metadata and tool data
 */
export interface Workspace extends WorkspaceMetadata {
    /** Tool data stored in this workspace */
    data: WorkspaceToolData;
}

/**
 * Workspace list item for display (without full data)
 */
export type WorkspaceListItem = WorkspaceMetadata;

/**
 * Context value for workspace operations
 */
export interface WorkspaceContextValue {
    /** Currently active workspace (null = no workspace, data not saved) */
    activeWorkspace: Workspace | null;
    /** List of all workspace metadata */
    workspaces: WorkspaceListItem[];
    /** Whether the context is loaded from storage */
    isLoaded: boolean;
    /** Create a new workspace */
    createWorkspace: (name: string) => Workspace;
    /** Select/activate a workspace by ID (null to deactivate) */
    selectWorkspace: (id: string | null) => void;
    /** Rename a workspace */
    renameWorkspace: (id: string, newName: string) => void;
    /** Delete a workspace */
    deleteWorkspace: (id: string) => void;
    /** Get tool data from active workspace */
    getToolData: <T extends ToolData>(toolId: string) => T | null;
    /** Set tool data in active workspace */
    setToolData: <T extends ToolData>(toolId: string, data: T) => void;
    /** Update specific fields in tool data */
    updateToolData: <T extends ToolData>(toolId: string, updates: Partial<T>) => void;
    /** Clear tool data from active workspace */
    clearToolData: (toolId: string) => void;
    /** Export a workspace to JSON file */
    exportWorkspace: (id: string) => void;
    /** Import a workspace from JSON file */
    importWorkspace: (file: File) => Promise<Workspace>;
}

/**
 * Export format for workspace files
 */
export interface WorkspaceExport {
    version: 1;
    exportedAt: number;
    workspace: Workspace;
}
