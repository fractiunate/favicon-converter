"use client";

import { useState, useCallback, useRef } from "react";
import {
    FolderOpen,
    Plus,
    Trash2,
    Pencil,
    Check,
    X,
    ChevronDown,
    FolderX,
    Download,
    Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useWorkspaceSafe } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import {
    MAX_WORKSPACES,
    MAX_WORKSPACE_NAME_LENGTH,
    validateWorkspaceName,
} from "@/services/workspace";

export function WorkspaceSelector() {
    const workspace = useWorkspaceSafe();

    // Don't render anything if workspace context is not available
    if (!workspace) {
        return null;
    }

    return <WorkspaceSelectorInner workspace={workspace} />;
}

function WorkspaceSelectorInner({ workspace }: { workspace: NonNullable<ReturnType<typeof useWorkspaceSafe>> }) {
    const {
        activeWorkspace,
        workspaces,
        isLoaded,
        createWorkspace,
        selectWorkspace,
        renameWorkspace,
        deleteWorkspace,
        exportWorkspace,
        importWorkspace,
    } = workspace;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [editingWorkspace, setEditingWorkspace] = useState<{ id: string; name: string } | null>(null);
    const [deletingWorkspace, setDeletingWorkspace] = useState<{ id: string; name: string } | null>(null);
    const [nameError, setNameError] = useState<string | null>(null);

    // Get existing workspace names for duplicate validation
    const existingNames = workspaces.map((ws) => ws.name);

    // Create workspace handler
    const handleCreate = useCallback(() => {
        const validation = validateWorkspaceName(newWorkspaceName, existingNames);
        if (!validation.valid) {
            setNameError(validation.error || "Invalid name");
            return;
        }

        try {
            const workspace = createWorkspace(newWorkspaceName);
            // createWorkspace auto-selects the new workspace
            toast.success(`Created workspace "${workspace.name}"`);
            setIsCreateDialogOpen(false);
            setNewWorkspaceName("");
            setNameError(null);
        } catch (error) {
            setNameError(error instanceof Error ? error.message : "Failed to create workspace");
        }
    }, [newWorkspaceName, createWorkspace, existingNames]);

    // Rename workspace handler
    const handleRename = useCallback(() => {
        if (!editingWorkspace) return;

        // Exclude current workspace name from duplicate check
        const otherNames = workspaces
            .filter((ws) => ws.id !== editingWorkspace.id)
            .map((ws) => ws.name);
        const validation = validateWorkspaceName(editingWorkspace.name, otherNames);
        if (!validation.valid) {
            setNameError(validation.error || "Invalid name");
            return;
        }

        renameWorkspace(editingWorkspace.id, editingWorkspace.name);
        toast.success("Workspace renamed");
        setIsRenameDialogOpen(false);
        setEditingWorkspace(null);
        setNameError(null);
    }, [editingWorkspace, renameWorkspace, workspaces]);

    // Delete workspace handler
    const handleDelete = useCallback(() => {
        if (!deletingWorkspace) return;

        deleteWorkspace(deletingWorkspace.id);
        toast.success(`Deleted workspace "${deletingWorkspace.name}"`);
        setIsDeleteDialogOpen(false);
        setDeletingWorkspace(null);
    }, [deletingWorkspace, deleteWorkspace]);

    // Open rename dialog
    const openRenameDialog = useCallback((id: string, name: string) => {
        setEditingWorkspace({ id, name });
        setNameError(null);
        setIsRenameDialogOpen(true);
    }, []);

    // Open delete dialog
    const openDeleteDialog = useCallback((id: string, name: string) => {
        setDeletingWorkspace({ id, name });
        setIsDeleteDialogOpen(true);
    }, []);

    // Export workspace handler
    const handleExport = useCallback((id: string, name: string) => {
        try {
            exportWorkspace(id);
            toast.success(`Exported workspace "${name}"`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to export workspace");
        }
    }, [exportWorkspace]);

    // Import workspace handler
    const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const workspace = await importWorkspace(file);
            toast.success(`Imported workspace "${workspace.name}"`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to import workspace");
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [importWorkspace]);

    if (!isLoaded) {
        return (
            <Button variant="ghost" size="sm" disabled className="gap-2">
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Loading...</span>
            </Button>
        );
    }

    const canCreate = workspaces.length < MAX_WORKSPACES;

    return (
        <>
            <DropdownMenu>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "gap-2",
                                        activeWorkspace && "text-violet-600 dark:text-violet-400"
                                    )}
                                >
                                    {activeWorkspace ? (
                                        <FolderOpen className="h-4 w-4" />
                                    ) : (
                                        <FolderX className="h-4 w-4 opacity-50" />
                                    )}
                                    <span className="hidden sm:inline max-w-[120px] truncate">
                                        {activeWorkspace?.name || "No Workspace"}
                                    </span>
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            {activeWorkspace
                                ? `Workspace: ${activeWorkspace.name}`
                                : "No workspace selected - data not saved"}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <DropdownMenuContent align="end" className="w-64">
                    {/* No workspace option */}
                    <DropdownMenuItem
                        onClick={() => selectWorkspace(null)}
                        className={cn(
                            "gap-2 cursor-pointer",
                            !activeWorkspace && "bg-zinc-100 dark:bg-zinc-800"
                        )}
                    >
                        <FolderX className="h-4 w-4 opacity-50" />
                        <span className="flex-1">No Workspace</span>
                        {!activeWorkspace && <Check className="h-4 w-4 text-violet-600" />}
                    </DropdownMenuItem>

                    {workspaces.length > 0 && <DropdownMenuSeparator />}

                    {/* Workspace list */}
                    {workspaces.map((ws) => (
                        <DropdownMenuItem
                            key={ws.id}
                            className={cn(
                                "gap-2 cursor-pointer group",
                                activeWorkspace?.id === ws.id && "bg-zinc-100 dark:bg-zinc-800"
                            )}
                            onClick={() => selectWorkspace(ws.id)}
                        >
                            <FolderOpen className="h-4 w-4" />
                            <span className="flex-1 truncate">{ws.name}</span>
                            {activeWorkspace?.id === ws.id && (
                                <Check className="h-4 w-4 text-violet-600" />
                            )}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleExport(ws.id, ws.name);
                                    }}
                                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                                    title="Export"
                                >
                                    <Download className="h-3 w-3" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openRenameDialog(ws.id, ws.name);
                                    }}
                                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                                    title="Rename"
                                >
                                    <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteDialog(ws.id, ws.name);
                                    }}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
                                    title="Delete"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator />

                    {/* Create new workspace */}
                    <DropdownMenuItem
                        onClick={() => {
                            setNewWorkspaceName("");
                            setNameError(null);
                            setIsCreateDialogOpen(true);
                        }}
                        disabled={!canCreate}
                        className="gap-2 cursor-pointer text-violet-600 dark:text-violet-400"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Create Workspace</span>
                    </DropdownMenuItem>

                    {/* Import workspace */}
                    <DropdownMenuItem
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!canCreate}
                        className="gap-2 cursor-pointer"
                    >
                        <Upload className="h-4 w-4" />
                        <span>Import Workspace</span>
                    </DropdownMenuItem>

                    {!canCreate && (
                        <p className="px-2 py-1.5 text-xs text-zinc-500">
                            Maximum {MAX_WORKSPACES} workspaces
                        </p>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden file input for import */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
            />

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Workspace</DialogTitle>
                        <DialogDescription>
                            Create a new workspace to save your tool data. Data is stored locally in your browser.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Input
                                placeholder="Workspace name"
                                value={newWorkspaceName}
                                onChange={(e) => {
                                    setNewWorkspaceName(e.target.value);
                                    setNameError(null);
                                }}
                                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                maxLength={MAX_WORKSPACE_NAME_LENGTH}
                            />
                            {nameError && (
                                <p className="text-sm text-red-500">{nameError}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Workspace</DialogTitle>
                        <DialogDescription>
                            Enter a new name for this workspace.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Input
                                placeholder="Workspace name"
                                value={editingWorkspace?.name || ""}
                                onChange={(e) => {
                                    setEditingWorkspace((prev) =>
                                        prev ? { ...prev, name: e.target.value } : null
                                    );
                                    setNameError(null);
                                }}
                                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                                maxLength={MAX_WORKSPACE_NAME_LENGTH}
                            />
                            {nameError && (
                                <p className="text-sm text-red-500">{nameError}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRename}>Rename</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Workspace</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{deletingWorkspace?.name}&quot;? This will permanently delete all saved tool data in this workspace.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
