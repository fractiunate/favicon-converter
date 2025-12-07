/**
 * Workspace Storage Constants
 */

/** localStorage key prefix for workspaces */
export const WORKSPACE_STORAGE_PREFIX = "workspace";

/** localStorage key for workspace list metadata */
export const WORKSPACE_LIST_KEY = `${WORKSPACE_STORAGE_PREFIX}:list`;

/** localStorage key for active workspace ID */
export const ACTIVE_WORKSPACE_KEY = `${WORKSPACE_STORAGE_PREFIX}:active`;

/** Maximum number of workspaces allowed */
export const MAX_WORKSPACES = 10;

/** Maximum workspace name length */
export const MAX_WORKSPACE_NAME_LENGTH = 50;

/** Minimum workspace name length */
export const MIN_WORKSPACE_NAME_LENGTH = 1;

/** Default workspace names */
export const DEFAULT_WORKSPACE_NAMES = [
    "Development",
    "Production",
    "Testing",
    "Personal",
    "Work",
] as const;
