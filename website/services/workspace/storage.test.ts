import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    generateWorkspaceId,
    validateWorkspaceName,
    canCreateWorkspace,
} from "./storage";
import {
    MAX_WORKSPACES,
    MAX_WORKSPACE_NAME_LENGTH,
    MIN_WORKSPACE_NAME_LENGTH,
} from "./constants";

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(global, "localStorage", { value: localStorageMock });

describe("Workspace Storage", () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    describe("generateWorkspaceId", () => {
        it("should generate unique IDs", () => {
            const id1 = generateWorkspaceId();
            const id2 = generateWorkspaceId();
            expect(id1).not.toBe(id2);
        });

        it("should start with ws_ prefix", () => {
            const id = generateWorkspaceId();
            expect(id.startsWith("ws_")).toBe(true);
        });

        it("should contain timestamp component", () => {
            const before = Date.now();
            const id = generateWorkspaceId();
            const after = Date.now();

            // Extract timestamp from id (ws_<timestamp>_<random>)
            const parts = id.split("_");
            const timestamp = parseInt(parts[1], 10);

            expect(timestamp).toBeGreaterThanOrEqual(before);
            expect(timestamp).toBeLessThanOrEqual(after);
        });
    });

    describe("validateWorkspaceName", () => {
        it("should accept valid names", () => {
            expect(validateWorkspaceName("My Workspace")).toEqual({ valid: true });
            expect(validateWorkspaceName("Development")).toEqual({ valid: true });
            expect(validateWorkspaceName("a")).toEqual({ valid: true });
        });

        it("should reject empty names", () => {
            const result = validateWorkspaceName("");
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it("should reject whitespace-only names", () => {
            const result = validateWorkspaceName("   ");
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it("should reject names exceeding max length", () => {
            const longName = "a".repeat(MAX_WORKSPACE_NAME_LENGTH + 1);
            const result = validateWorkspaceName(longName);
            expect(result.valid).toBe(false);
            expect(result.error).toContain(`${MAX_WORKSPACE_NAME_LENGTH}`);
        });

        it("should accept names at max length", () => {
            const maxName = "a".repeat(MAX_WORKSPACE_NAME_LENGTH);
            const result = validateWorkspaceName(maxName);
            expect(result.valid).toBe(true);
        });

        it("should trim names before validation", () => {
            const result = validateWorkspaceName("  Valid Name  ");
            expect(result.valid).toBe(true);
        });

        it("should reject duplicate names (case-insensitive)", () => {
            const existingNames = ["Development", "Production"];

            expect(validateWorkspaceName("Development", existingNames).valid).toBe(false);
            expect(validateWorkspaceName("DEVELOPMENT", existingNames).valid).toBe(false);
            expect(validateWorkspaceName("development", existingNames).valid).toBe(false);
            expect(validateWorkspaceName("Staging", existingNames).valid).toBe(true);
        });

        it("should accept name when existingNames is empty", () => {
            expect(validateWorkspaceName("Development", []).valid).toBe(true);
        });
    });

    describe("canCreateWorkspace", () => {
        it("should allow creation when under limit", () => {
            expect(canCreateWorkspace(0)).toEqual({ allowed: true });
            expect(canCreateWorkspace(5)).toEqual({ allowed: true });
            expect(canCreateWorkspace(MAX_WORKSPACES - 1)).toEqual({ allowed: true });
        });

        it("should reject creation at limit", () => {
            const result = canCreateWorkspace(MAX_WORKSPACES);
            expect(result.allowed).toBe(false);
            expect(result.error).toContain(`${MAX_WORKSPACES}`);
        });

        it("should reject creation over limit", () => {
            const result = canCreateWorkspace(MAX_WORKSPACES + 1);
            expect(result.allowed).toBe(false);
        });
    });
});

describe("Workspace Constants", () => {
    it("should have reasonable MAX_WORKSPACES value", () => {
        expect(MAX_WORKSPACES).toBeGreaterThan(0);
        expect(MAX_WORKSPACES).toBeLessThanOrEqual(100);
    });

    it("should have reasonable name length limits", () => {
        expect(MIN_WORKSPACE_NAME_LENGTH).toBeGreaterThan(0);
        expect(MAX_WORKSPACE_NAME_LENGTH).toBeGreaterThan(MIN_WORKSPACE_NAME_LENGTH);
        expect(MAX_WORKSPACE_NAME_LENGTH).toBeLessThanOrEqual(200);
    });
});
