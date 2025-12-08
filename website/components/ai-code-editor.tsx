"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import dynamic from "next/dynamic";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import {
    Download,
    Copy,
    Check,
    Sun,
    Moon,
    WrapText,
    Map,
    Hash,
    File,
    FilePlus,
    FolderPlus,
    Folder,
    FolderOpen,
    Trash2,
    X,
    PanelLeftClose,
    PanelLeft,
    ChevronRight,
    ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useToolWorkspace } from "@/lib/workspace";
import {
    type EditorLanguage,
    type EditorSettings,
    type EditorFile,
    type EditorFolder,
    type CodeEditorWorkspaceData,
    type AIDocumentationLink,
    DEFAULT_SETTINGS,
    STORAGE_KEY,
    LANGUAGES,
    DEFAULT_FILE,
    FONT_SIZES,
    getLanguageFromFileName,
    DEFAULT_DOCUMENTATION_LINKS,
} from "@/services/code-editor";

// Dynamically import CodeiumEditor to avoid SSR issues
const CodeiumEditor = dynamic(
    () => import("@codeium/react-code-editor").then((mod) => mod.CodeiumEditor),
    {
        ssr: false,
        loading: () => (
            <div className="h-[500px] bg-zinc-900 flex items-center justify-center text-zinc-500">
                Loading editor...
            </div>
        ),
    }
);

// Import Document and Language for multi-file context
import { Document, Language } from "@codeium/react-code-editor";

// Map our EditorLanguage to Codeium's Language enum
function getCodeiumLanguage(lang: EditorLanguage): Language {
    const langMap: Record<EditorLanguage, Language> = {
        javascript: Language.JAVASCRIPT,
        typescript: Language.TYPESCRIPT,
        python: Language.PYTHON,
        html: Language.HTML,
        css: Language.CSS,
        json: Language.JSON,
        yaml: Language.YAML,
        markdown: Language.MARKDOWN,
        sql: Language.SQL,
        shell: Language.SHELL,
        go: Language.GO,
        rust: Language.RUST,
        java: Language.JAVA,
        csharp: Language.CSHARP,
        cpp: Language.CPP,
        php: Language.PHP,
        ruby: Language.RUBY,
    };
    return langMap[lang] || Language.JAVASCRIPT;
}

// Build file path from folder hierarchy
function getFilePath(file: EditorFile, folders: EditorFolder[]): string {
    const parts: string[] = [file.name];
    let currentParentId = file.parentId;

    while (currentParentId) {
        const folder = folders.find(f => f.id === currentParentId);
        if (folder) {
            parts.unshift(folder.name);
            currentParentId = folder.parentId;
        } else {
            break;
        }
    }

    return "/" + parts.join("/");
}

// Generate unique ID
function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

function ensureFolderPath(
    currentFolders: EditorFolder[],
    segments: string[],
    baseParentId: string | null
) {
    let parentId = baseParentId;
    let updatedFolders = currentFolders;

    for (const rawSegment of segments) {
        const segment = rawSegment.trim();
        if (!segment) continue;

        const existing = updatedFolders.find(
            (folder) => folder.parentId === parentId && folder.name === segment
        );
        if (existing) {
            parentId = existing.id;
            continue;
        }

        const newFolder: EditorFolder = {
            id: generateId(),
            name: segment,
            parentId,
            isOpen: true,
        };

        updatedFolders = [...updatedFolders, newFolder];
        parentId = newFolder.id;
    }

    return { folders: updatedFolders, parentId };
}

// FileTree component for recursive folder/file rendering
interface FileTreeProps {
    folders: EditorFolder[];
    files: EditorFile[];
    parentId: string | null;
    depth: number;
    activeFileId: string | null;
    selectedFolderId: string | null;
    settings: EditorSettings;
    openFile: (fileId: string) => void;
    deleteFile: (fileId: string) => void;
    deleteFolder: (folderId: string) => void;
    toggleFolder: (folderId: string) => void;
    selectFolder: (folderId: string) => void;
    isCreatingFile: boolean;
    isCreatingFolder: boolean;
    createInFolderId: string | null;
    setIsCreatingFile: (v: boolean) => void;
    setIsCreatingFolder: (v: boolean) => void;
    setCreateInFolderId: (v: string | null) => void;
    newItemName: string;
    setNewItemName: (v: string) => void;
    createFile: () => void;
    createFolder: () => void;
}

function FileTree({
    folders,
    files,
    parentId,
    depth,
    activeFileId,
    selectedFolderId,
    settings,
    openFile,
    deleteFile,
    deleteFolder,
    toggleFolder,
    selectFolder,
    isCreatingFile,
    isCreatingFolder,
    createInFolderId,
    setIsCreatingFile,
    setIsCreatingFolder,
    setCreateInFolderId,
    newItemName,
    setNewItemName,
    createFile,
    createFolder,
}: FileTreeProps) {
    const childFolders = folders.filter((f) => f.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name));
    const childFiles = files.filter((f) => f.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name));
    const paddingLeft = depth * 12 + 8;

    return (
        <>
            {/* Folders first */}
            {childFolders.map((folder) => (
                <div key={folder.id}>
                    {/* Folder row */}
                    <div
                        className={cn(
                            "group flex items-center gap-1 py-1 cursor-pointer",
                            selectedFolderId === folder.id
                                ? settings.theme === "vs-dark"
                                    ? "bg-zinc-800 text-zinc-100"
                                    : "bg-zinc-200 text-zinc-900"
                                : settings.theme === "vs-dark"
                                    ? "text-zinc-300 hover:bg-zinc-800/50"
                                    : "text-zinc-700 hover:bg-zinc-100"
                        )}
                        style={{ paddingLeft }}
                        onClick={() => selectFolder(folder.id)}
                        onDoubleClick={() => toggleFolder(folder.id)}
                    >
                        <button
                            className="flex-shrink-0 hover:bg-zinc-700/50 rounded p-0.5 -ml-0.5"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFolder(folder.id);
                            }}
                        >
                            {folder.isOpen ? (
                                <ChevronDown className="h-3 w-3" />
                            ) : (
                                <ChevronRight className="h-3 w-3" />
                            )}
                        </button>
                        {folder.isOpen ? (
                            <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500" />
                        ) : (
                            <Folder className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500" />
                        )}
                        <span className="text-xs truncate flex-1">{folder.name}</span>
                        <button
                            className={cn(
                                "h-4 w-4 p-0.5 rounded opacity-0 group-hover:opacity-100 mr-1",
                                settings.theme === "vs-dark"
                                    ? "hover:bg-zinc-700 text-zinc-500 hover:text-red-400"
                                    : "hover:bg-zinc-200 text-zinc-400 hover:text-red-500"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteFolder(folder.id);
                            }}
                            title="Delete Folder"
                        >
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>

                    {/* Folder children (when open) */}
                    {folder.isOpen && (
                        <>
                            {/* New item input inside folder */}
                            {(isCreatingFile || isCreatingFolder) && createInFolderId === folder.id && (
                                <div
                                    className="flex items-center gap-1 py-1 pr-2"
                                    style={{ paddingLeft: paddingLeft + 12 }}
                                >
                                    {isCreatingFolder ? (
                                        <Folder className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                                    ) : (
                                        <File className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                                    )}
                                    <Input
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                isCreatingFolder ? createFolder() : createFile();
                                            }
                                            if (e.key === "Escape") {
                                                setIsCreatingFile(false);
                                                setIsCreatingFolder(false);
                                                setNewItemName("");
                                                setCreateInFolderId(null);
                                            }
                                        }}
                                        placeholder={isCreatingFolder ? "folder" : "file.js"}
                                        className={cn(
                                            "h-5 text-xs px-1 flex-1",
                                            settings.theme === "vs-dark"
                                                ? "bg-zinc-800 border-zinc-600 text-zinc-200"
                                                : "bg-white border-zinc-300"
                                        )}
                                        autoFocus
                                    />
                                    <button
                                        className="text-zinc-400 hover:text-zinc-200"
                                        onClick={() => {
                                            setIsCreatingFile(false);
                                            setIsCreatingFolder(false);
                                            setNewItemName("");
                                            setCreateInFolderId(null);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            <FileTree
                                folders={folders}
                                files={files}
                                parentId={folder.id}
                                depth={depth + 1}
                                activeFileId={activeFileId}
                                selectedFolderId={selectedFolderId}
                                settings={settings}
                                openFile={openFile}
                                deleteFile={deleteFile}
                                deleteFolder={deleteFolder}
                                toggleFolder={toggleFolder}
                                selectFolder={selectFolder}
                                isCreatingFile={isCreatingFile}
                                isCreatingFolder={isCreatingFolder}
                                createInFolderId={createInFolderId}
                                setIsCreatingFile={setIsCreatingFile}
                                setIsCreatingFolder={setIsCreatingFolder}
                                setCreateInFolderId={setCreateInFolderId}
                                newItemName={newItemName}
                                setNewItemName={setNewItemName}
                                createFile={createFile}
                                createFolder={createFolder}
                            />
                        </>
                    )}
                </div>
            ))}

            {/* Files */}
            {childFiles.map((file) => (
                <div
                    key={file.id}
                    className={cn(
                        "group flex items-center gap-1.5 py-1 cursor-pointer",
                        activeFileId === file.id
                            ? settings.theme === "vs-dark"
                                ? "bg-zinc-800 text-zinc-100"
                                : "bg-zinc-200 text-zinc-900"
                            : settings.theme === "vs-dark"
                                ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                    )}
                    style={{ paddingLeft: paddingLeft + (depth === 0 ? 0 : 4) }}
                    onClick={() => openFile(file.id)}
                >
                    <File className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-xs truncate flex-1">{file.name}</span>
                    <button
                        className={cn(
                            "h-4 w-4 p-0.5 rounded opacity-0 group-hover:opacity-100 mr-1",
                            settings.theme === "vs-dark"
                                ? "hover:bg-zinc-700 text-zinc-500 hover:text-red-400"
                                : "hover:bg-zinc-200 text-zinc-400 hover:text-red-500"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteFile(file.id);
                        }}
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            ))}
        </>
    );
}

export function AICodeEditor() {
    const { isActive, isLoaded: workspaceLoaded, data: workspaceData, workspaceId, save: saveToWorkspace } = useToolWorkspace<CodeEditorWorkspaceData>("code-editor");

    // State
    const [files, setFiles] = useState<EditorFile[]>([DEFAULT_FILE]);
    const [folders, setFolders] = useState<EditorFolder[]>([]);
    const [activeFileId, setActiveFileId] = useState<string | null>(DEFAULT_FILE.id);
    const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [newItemName, setNewItemName] = useState("");
    const [isCreatingFile, setIsCreatingFile] = useState(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [createInFolderId, setCreateInFolderId] = useState<string | null>(null);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [openTabs, setOpenTabs] = useState<string[]>([DEFAULT_FILE.id]);
    const [docLinks, setDocLinks] = useState<AIDocumentationLink[]>(DEFAULT_DOCUMENTATION_LINKS);
    const [newDocName, setNewDocName] = useState("");
    const [newDocUrl, setNewDocUrl] = useState("");
    const [newDocSummary, setNewDocSummary] = useState("");

    // Get active file
    const activeFile = files.find((f) => f.id === activeFileId) || files[0];

    const documentationContextDocuments = docLinks.map((doc) =>
        new Document({
            absolutePath: doc.url,
            relativePath: doc.name,
            text: doc.summary ? `${doc.summary}\n\nLink: ${doc.url}` : `Link: ${doc.url}`,
            editorLanguage: "markdown",
            language: Language.MARKDOWN,
        })
    );

    const fileContextDocuments = files
        .filter((f) => f.id !== activeFile?.id)
        .map((file) => {
            const filePath = getFilePath(file, folders);
            return new Document({
                absolutePath: filePath,
                relativePath: file.name,
                text: file.content,
                editorLanguage: file.language,
                language: getCodeiumLanguage(file.language),
            });
        });

    const otherContextDocuments = [...fileContextDocuments, ...documentationContextDocuments].slice(0, 10);

    // Normalize files to ensure parentId is set (migration for old data)
    const normalizeFiles = (files: EditorFile[]): EditorFile[] => {
        return files.map((f) => ({
            ...f,
            parentId: f.parentId ?? null,
        }));
    };

    // Load from localStorage or workspace
    useEffect(() => {
        if (!workspaceLoaded) return;

        if (isActive && workspaceData) {
            const rawFiles = workspaceData.files?.length ? workspaceData.files : [DEFAULT_FILE];
            const loadedFiles = normalizeFiles(rawFiles);
            setFiles(loadedFiles);
            setFolders(workspaceData.folders || []);
            setActiveFileId(workspaceData.activeFileId || loadedFiles[0]?.id || null);
            setSettings(workspaceData.settings || DEFAULT_SETTINGS);
            setOpenTabs(workspaceData.activeFileId ? [workspaceData.activeFileId] : [loadedFiles[0]?.id]);
            setDocLinks(workspaceData.documentationLinks?.length ? workspaceData.documentationLinks : DEFAULT_DOCUMENTATION_LINKS);
        } else if (!isActive) {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const data = JSON.parse(stored) as CodeEditorWorkspaceData;
                    const rawFiles = data.files?.length ? data.files : [DEFAULT_FILE];
                    const loadedFiles = normalizeFiles(rawFiles);
                    setFiles(loadedFiles);
                    setFolders(data.folders || []);
                    setActiveFileId(data.activeFileId || loadedFiles[0]?.id || null);
                    setSettings(data.settings || DEFAULT_SETTINGS);
                    setOpenTabs(data.activeFileId ? [data.activeFileId] : [loadedFiles[0]?.id]);
                    setDocLinks(data.documentationLinks?.length ? data.documentationLinks : DEFAULT_DOCUMENTATION_LINKS);
                }
            } catch {
                // Invalid data, start fresh
            }
        }
        setIsLoaded(true);
    }, [workspaceLoaded, workspaceId]);

    // Save to localStorage and workspace, deferring workspace updates so they don't run during render
    const scheduleWorkspaceSave = useCallback((data: CodeEditorWorkspaceData) => {
        const runSave = () => saveToWorkspace(data);
        if (typeof queueMicrotask === "function") {
            queueMicrotask(runSave);
        } else {
            Promise.resolve().then(runSave);
        }
    }, [saveToWorkspace]);

    const saveData = useCallback(
        (
            newFiles: EditorFile[],
            newFolders: EditorFolder[],
            newActiveFileId: string | null,
            newSettings: EditorSettings,
            documentationLinksOverride?: AIDocumentationLink[]
        ) => {
            const docLinksToSave = documentationLinksOverride ?? docLinks;
            const data: CodeEditorWorkspaceData = {
                files: newFiles,
                folders: newFolders,
                activeFileId: newActiveFileId,
                settings: newSettings,
                documentationLinks: docLinksToSave,
            };

            if (isActive) {
                scheduleWorkspaceSave(data);
            }

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch {
                // Storage full
            }
        },
        [isActive, scheduleWorkspaceSave, docLinks]
    );

    // Handle code change
    const handleCodeChange = useCallback(
        (value: string | undefined) => {
            const newCode = value || "";
            setFiles((prevFiles) => {
                const newFiles = prevFiles.map((f) =>
                    f.id === activeFileId ? { ...f, content: newCode } : f
                );
                saveData(newFiles, folders, activeFileId, settings);
                return newFiles;
            });
        },
        [activeFileId, settings, folders, saveData]
    );

    // Handle settings change
    const updateSetting = useCallback(
        <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
            const newSettings = { ...settings, [key]: value };
            setSettings(newSettings);
            saveData(files, folders, activeFileId, newSettings);
        },
        [settings, files, folders, activeFileId, saveData]
    );

    // Create new file
    const createFile = useCallback(() => {
        const trimmedName = newItemName.trim();
        if (!trimmedName) {
            toast.error("Please enter a file name");
            return;
        }

        const pathSegments = trimmedName
            .split("/")
            .map((segment) => segment.trim())
            .filter(Boolean);

        if (pathSegments.length === 0) {
            toast.error("Please enter a valid file name");
            return;
        }

        const fileName = pathSegments.pop()!;
        const baseParentId = createInFolderId ?? null;
        const { folders: updatedFolders, parentId: targetParentId } = ensureFolderPath(
            folders,
            pathSegments,
            baseParentId
        );

        const finalParentId = targetParentId ?? baseParentId ?? null;
        const alreadyExists = files.some(
            (existing) => existing.parentId === finalParentId && existing.name === fileName
        );

        if (alreadyExists) {
            toast.error("A file with that name already exists here");
            return;
        }

        const language = getLanguageFromFileName(fileName);
        const newFile: EditorFile = {
            id: generateId(),
            name: fileName,
            content: "",
            language,
            parentId: finalParentId,
        };

        const newFiles = [...files, newFile];
        setFiles(newFiles);
        setFolders(updatedFolders);
        setActiveFileId(newFile.id);
        setOpenTabs((prev) => [...prev.filter((id) => id !== newFile.id), newFile.id]);
        setNewItemName("");
        setIsCreatingFile(false);
        setCreateInFolderId(null);
        saveData(newFiles, updatedFolders, newFile.id, settings);
        toast.success(`Created ${fileName}`);
    }, [newItemName, files, folders, settings, createInFolderId, saveData]);

    // Create new folder
    const createFolder = useCallback(() => {
        if (!newItemName.trim()) {
            toast.error("Please enter a folder name");
            return;
        }

        const folderName = newItemName.trim();
        const newFolder: EditorFolder = {
            id: generateId(),
            name: folderName,
            parentId: createInFolderId,
            isOpen: true,
        };

        const newFolders = [...folders, newFolder];
        setFolders(newFolders);
        setNewItemName("");
        setIsCreatingFolder(false);
        setCreateInFolderId(null);
        saveData(files, newFolders, activeFileId, settings);
        toast.success(`Created folder ${folderName}`);
    }, [newItemName, files, folders, settings, activeFileId, createInFolderId, saveData]);

    // Toggle folder open/closed
    const toggleFolder = useCallback((folderId: string) => {
        const newFolders = folders.map((f) =>
            f.id === folderId ? { ...f, isOpen: !f.isOpen } : f
        );
        setFolders(newFolders);
        saveData(files, newFolders, activeFileId, settings);
    }, [folders, files, activeFileId, settings, saveData]);

    // Delete file
    const deleteFile = useCallback(
        (fileId: string) => {
            const fileToDelete = files.find((f) => f.id === fileId);
            const newFiles = files.filter((f) => f.id !== fileId);
            const newOpenTabs = openTabs.filter((id) => id !== fileId);
            const newActiveFileId = activeFileId === fileId
                ? (newOpenTabs[0] || newFiles[0]?.id || null)
                : activeFileId;

            setFiles(newFiles);
            setOpenTabs(newOpenTabs.length ? newOpenTabs : newFiles[0]?.id ? [newFiles[0].id] : []);
            setActiveFileId(newActiveFileId);
            saveData(newFiles, folders, newActiveFileId, settings);
            toast.success(`Deleted ${fileToDelete?.name}`);
        },
        [files, folders, openTabs, activeFileId, settings, saveData]
    );

    // Delete folder (and all contents)
    const deleteFolder = useCallback(
        (folderId: string) => {
            // Get all descendant folder IDs recursively
            const getDescendantFolderIds = (parentId: string): string[] => {
                const childFolders = folders.filter((f) => f.parentId === parentId);
                return childFolders.flatMap((f) => [f.id, ...getDescendantFolderIds(f.id)]);
            };
            const folderIdsToDelete = [folderId, ...getDescendantFolderIds(folderId)];
            const shouldClearSelection = selectedFolderId !== null && folderIdsToDelete.includes(selectedFolderId);

            // Filter out folders and files that belong to deleted folders
            const newFolders = folders.filter((f) => !folderIdsToDelete.includes(f.id));
            const newFiles = files.filter((f) => !folderIdsToDelete.includes(f.parentId || ""));

            // Allow empty state
            const finalFiles = newFiles;

            // Update tabs and active file
            const deletedFileIds = files.filter((f) => folderIdsToDelete.includes(f.parentId || "")).map((f) => f.id);
            const newOpenTabs = openTabs.filter((id) => !deletedFileIds.includes(id));
            const newActiveFileId = deletedFileIds.includes(activeFileId || "")
                ? (newOpenTabs[0] || finalFiles[0]?.id || null)
                : activeFileId;

            const folderToDelete = folders.find((f) => f.id === folderId);
            setFolders(newFolders);
            setFiles(finalFiles);
            setOpenTabs(newOpenTabs.length ? newOpenTabs : finalFiles[0]?.id ? [finalFiles[0].id] : []);
            setActiveFileId(newActiveFileId);
            if (shouldClearSelection) {
                setSelectedFolderId(null);
            }
            saveData(finalFiles, newFolders, newActiveFileId, settings);
            toast.success(`Deleted folder ${folderToDelete?.name}`);
        },
        [files, folders, openTabs, activeFileId, settings, saveData, selectedFolderId]
    );

    // Open file
    const openFile = useCallback((fileId: string) => {
        setActiveFileId(fileId);
        setSelectedFolderId(null); // Deselect folder when opening a file
        if (!openTabs.includes(fileId)) {
            setOpenTabs((prev) => [...prev, fileId]);
        }
    }, [openTabs]);

    // Select folder
    const selectFolder = useCallback((folderId: string) => {
        setSelectedFolderId(folderId);
    }, []);

    // Close tab
    const closeTab = useCallback(
        (fileId: string, e: React.MouseEvent) => {
            e.stopPropagation();
            const newOpenTabs = openTabs.filter((id) => id !== fileId);
            if (newOpenTabs.length === 0) {
                // Keep at least one tab open
                return;
            }
            setOpenTabs(newOpenTabs);
            if (activeFileId === fileId) {
                setActiveFileId(newOpenTabs[newOpenTabs.length - 1]);
            }
        },
        [openTabs, activeFileId]
    );

    // Copy code to clipboard
    const copyCode = useCallback(async () => {
        if (!activeFile) return;
        try {
            await navigator.clipboard.writeText(activeFile.content);
            setCopied(true);
            toast.success("Code copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy code");
        }
    }, [activeFile]);

    // Download every file in the explorer as a ZIP
    const downloadAllFiles = useCallback(async () => {
        if (files.length === 0) {
            toast.error("No files to download");
            return;
        }

        const zip = new JSZip();
        files.forEach((file) => {
            const relativePath = getFilePath(file, folders).replace(/^\//, "") || file.name;
            zip.file(relativePath, file.content);
        });

        try {
            const blob = await zip.generateAsync({ type: "blob" });
            saveAs(blob, "code-editor-files.zip");
            toast.success("Code explorer downloaded as ZIP");
        } catch (error) {
            toast.error("Failed to generate ZIP file");
        }
    }, [files, folders]);

    const handleAddDocumentationLink = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const title = newDocName.trim();
            const url = newDocUrl.trim();
            const summary = newDocSummary.trim();

            if (!title || !url) {
                toast.error("Please provide both a title and URL");
                return;
            }

            try {
                new URL(url);
            } catch {
                toast.error("Please enter a valid URL");
                return;
            }

            const newLink: AIDocumentationLink = {
                id: generateId(),
                name: title,
                url,
                summary: summary || undefined,
            };

            const updatedLinks = [...docLinks, newLink];
            setDocLinks(updatedLinks);
            saveData(files, folders, activeFileId, settings, updatedLinks);
            setNewDocName("");
            setNewDocUrl("");
            setNewDocSummary("");
            toast.success("Documentation link added");
        },
        [docLinks, files, folders, activeFileId, settings, saveData, newDocName, newDocUrl, newDocSummary]
    );

    const handleRemoveDocumentationLink = useCallback(
        (id: string) => {
            const updatedLinks = docLinks.filter((link) => link.id !== id);
            setDocLinks(updatedLinks);
            saveData(files, folders, activeFileId, settings, updatedLinks);
            toast.success("Documentation link removed");
        },
        [docLinks, files, folders, activeFileId, settings, saveData]
    );

    if (!isLoaded) {
        return (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-900">
                <div className="h-[600px] flex items-center justify-center text-zinc-500">
                    Loading editor...
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden flex">
                {/* File Tree Sidebar */}
                {sidebarOpen && (
                    <div className={cn(
                        "w-52 flex-shrink-0 border-r flex flex-col",
                        settings.theme === "vs-dark"
                            ? "bg-zinc-900 border-zinc-700"
                            : "bg-zinc-50 border-zinc-200"
                    )}>
                        {/* Sidebar Header */}
                        <div className={cn(
                            "flex items-center justify-between px-2 py-1.5 border-b",
                            settings.theme === "vs-dark"
                                ? "border-zinc-700"
                                : "border-zinc-200"
                        )}>
                            <span className={cn(
                                "text-[11px] font-medium uppercase tracking-wide",
                                settings.theme === "vs-dark" ? "text-zinc-400" : "text-zinc-500"
                            )}>
                                Explorer
                            </span>
                            <div className="flex items-center gap-0.5">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "h-5 w-5 p-0",
                                                settings.theme === "vs-dark"
                                                    ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                                                    : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200"
                                            )}
                                            onClick={() => {
                                                setIsCreatingFile(true);
                                                setIsCreatingFolder(false);
                                                // Create inside selected folder, or at same level as active file
                                                setCreateInFolderId(selectedFolderId ?? activeFile?.parentId ?? null);
                                            }}
                                        >
                                            <FilePlus className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>New File</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "h-5 w-5 p-0",
                                                settings.theme === "vs-dark"
                                                    ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                                                    : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200"
                                            )}
                                            onClick={() => {
                                                setIsCreatingFolder(true);
                                                setIsCreatingFile(false);
                                                // Create inside selected folder, or at same level as active file
                                                setCreateInFolderId(selectedFolderId ?? activeFile?.parentId ?? null);
                                            }}
                                        >
                                            <FolderPlus className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>New Folder</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>

                        {/* New Item Input (root level) */}
                        {(isCreatingFile || isCreatingFolder) && createInFolderId === null && (
                            <div className={cn(
                                "px-2 py-1.5 border-b",
                                settings.theme === "vs-dark"
                                    ? "border-zinc-700"
                                    : "border-zinc-200"
                            )}>
                                <div className="flex items-center gap-1">
                                    {isCreatingFolder ? (
                                        <Folder className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                                    ) : (
                                        <File className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                                    )}
                                    <Input
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                isCreatingFolder ? createFolder() : createFile();
                                            }
                                            if (e.key === "Escape") {
                                                setIsCreatingFile(false);
                                                setIsCreatingFolder(false);
                                                setNewItemName("");
                                            }
                                        }}
                                        placeholder={isCreatingFolder ? "folder name" : "filename.js"}
                                        className={cn(
                                            "h-6 text-xs px-1.5 flex-1",
                                            settings.theme === "vs-dark"
                                                ? "bg-zinc-800 border-zinc-600 text-zinc-200"
                                                : "bg-white border-zinc-300"
                                        )}
                                        autoFocus
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-zinc-400"
                                        onClick={() => {
                                            setIsCreatingFile(false);
                                            setIsCreatingFolder(false);
                                            setNewItemName("");
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* File Tree */}
                        <div className="flex-1 overflow-y-auto py-1">
                            <FileTree
                                folders={folders}
                                files={files}
                                parentId={null}
                                depth={0}
                                activeFileId={activeFileId}
                                selectedFolderId={selectedFolderId}
                                settings={settings}
                                openFile={openFile}
                                deleteFile={deleteFile}
                                deleteFolder={deleteFolder}
                                toggleFolder={toggleFolder}
                                selectFolder={selectFolder}
                                isCreatingFile={isCreatingFile}
                                isCreatingFolder={isCreatingFolder}
                                createInFolderId={createInFolderId}
                                setIsCreatingFile={setIsCreatingFile}
                                setIsCreatingFolder={setIsCreatingFolder}
                                setCreateInFolderId={setCreateInFolderId}
                                newItemName={newItemName}
                                setNewItemName={setNewItemName}
                                createFile={createFile}
                                createFolder={createFolder}
                            />
                        </div>
                    </div>
                )}

                {/* Main Editor Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Tab Bar */}
                    <div className={cn(
                        "flex items-center border-b overflow-x-auto",
                        settings.theme === "vs-dark"
                            ? "bg-zinc-900 border-zinc-700"
                            : "bg-zinc-100 border-zinc-200"
                    )}>
                        {/* Sidebar toggle */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-8 w-8 p-0 rounded-none border-r",
                                        settings.theme === "vs-dark"
                                            ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-zinc-700"
                                            : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200 border-zinc-200"
                                    )}
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                >
                                    {sidebarOpen ? (
                                        <PanelLeftClose className="h-4 w-4" />
                                    ) : (
                                        <PanelLeft className="h-4 w-4" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}</TooltipContent>
                        </Tooltip>

                        {/* Tabs */}
                        <div className="flex-1 flex items-center overflow-x-auto">
                            {openTabs.map((tabId) => {
                                const file = files.find((f) => f.id === tabId);
                                if (!file) return null;
                                return (
                                    <div
                                        key={tabId}
                                        className={cn(
                                            "group flex items-center gap-1.5 px-3 py-1.5 border-r cursor-pointer min-w-0",
                                            activeFileId === tabId
                                                ? settings.theme === "vs-dark"
                                                    ? "bg-zinc-800 text-zinc-100 border-zinc-700"
                                                    : "bg-white text-zinc-900 border-zinc-200"
                                                : settings.theme === "vs-dark"
                                                    ? "text-zinc-400 hover:text-zinc-200 border-zinc-700"
                                                    : "text-zinc-500 hover:text-zinc-700 border-zinc-200"
                                        )}
                                        onClick={() => setActiveFileId(tabId)}
                                    >
                                        <span className="text-xs truncate">{file.name}</span>
                                        {openTabs.length > 1 && (
                                            <button
                                                className={cn(
                                                    "ml-1 opacity-0 group-hover:opacity-100 rounded",
                                                    settings.theme === "vs-dark"
                                                        ? "hover:bg-zinc-700"
                                                        : "hover:bg-zinc-200"
                                                )}
                                                onClick={(e) => closeTab(tabId, e)}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Toolbar */}
                    <div className={cn(
                        "flex items-center justify-between px-3 py-2 border-b",
                        settings.theme === "vs-dark"
                            ? "bg-zinc-900 border-zinc-700"
                            : "bg-zinc-100 border-zinc-300"
                    )}>
                        <div className="flex items-center gap-2">
                            {/* Language selector */}
                            <Select
                                value={activeFile?.language || "javascript"}
                                onValueChange={(v) => {
                                    if (!activeFile) return;
                                    const newFiles = files.map((f) =>
                                        f.id === activeFileId ? { ...f, language: v as EditorLanguage } : f
                                    );
                                    setFiles(newFiles);
                                    saveData(newFiles, folders, activeFileId, settings);
                                }}
                            >
                                <SelectTrigger className={cn(
                                    "w-32 h-7 text-xs border-0",
                                    settings.theme === "vs-dark"
                                        ? "bg-zinc-800 text-zinc-300"
                                        : "bg-white text-zinc-700"
                                )}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map((lang) => (
                                        <SelectItem key={lang.value} value={lang.value}>
                                            {lang.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className={cn(
                                "h-4 w-px",
                                settings.theme === "vs-dark" ? "bg-zinc-700" : "bg-zinc-300"
                            )} />

                            {/* Font Size */}
                            <Select
                                value={String(settings.fontSize)}
                                onValueChange={(v) => updateSetting("fontSize", parseInt(v))}
                            >
                                <SelectTrigger className={cn(
                                    "w-20 h-7 text-xs border-0",
                                    settings.theme === "vs-dark"
                                        ? "bg-zinc-800 text-zinc-300"
                                        : "bg-white text-zinc-700"
                                )}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONT_SIZES.map((size) => (
                                        <SelectItem key={size} value={String(size)}>
                                            {size}px
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className={cn(
                                "h-4 w-px",
                                settings.theme === "vs-dark" ? "bg-zinc-700" : "bg-zinc-300"
                            )} />

                            {/* Toggle buttons */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-7 w-7 p-0",
                                            settings.theme === "vs-dark"
                                                ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                                                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200",
                                            settings.wordWrap && (settings.theme === "vs-dark" ? "text-blue-400" : "text-blue-600")
                                        )}
                                        onClick={() => updateSetting("wordWrap", !settings.wordWrap)}
                                    >
                                        <WrapText className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Word Wrap</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-7 w-7 p-0",
                                            settings.theme === "vs-dark"
                                                ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                                                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200",
                                            settings.minimap && (settings.theme === "vs-dark" ? "text-blue-400" : "text-blue-600")
                                        )}
                                        onClick={() => updateSetting("minimap", !settings.minimap)}
                                    >
                                        <Map className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Minimap</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-7 w-7 p-0",
                                            settings.theme === "vs-dark"
                                                ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                                                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200",
                                            settings.lineNumbers && (settings.theme === "vs-dark" ? "text-blue-400" : "text-blue-600")
                                        )}
                                        onClick={() => updateSetting("lineNumbers", !settings.lineNumbers)}
                                    >
                                        <Hash className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Line Numbers</TooltipContent>
                            </Tooltip>

                            <div className={cn(
                                "h-4 w-px",
                                settings.theme === "vs-dark" ? "bg-zinc-700" : "bg-zinc-300"
                            )} />

                            {/* Theme toggle */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-7 w-7 p-0",
                                            settings.theme === "vs-dark"
                                                ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                                                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200"
                                        )}
                                        onClick={() =>
                                            updateSetting(
                                                "theme",
                                                settings.theme === "vs-dark" ? "light" : "vs-dark"
                                            )
                                        }
                                    >
                                        {settings.theme === "vs-dark" ? (
                                            <Sun className="h-3.5 w-3.5" />
                                        ) : (
                                            <Moon className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Toggle Theme</TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="flex items-center gap-1">
                            <Badge variant="secondary" className={cn(
                                "text-[10px] px-1.5 py-0 h-5",
                                settings.theme === "vs-dark"
                                    ? "bg-zinc-800 text-zinc-400"
                                    : "bg-zinc-200 text-zinc-600"
                            )}>
                                AI
                            </Badge>

                            <div className={cn(
                                "h-4 w-px mx-1",
                                settings.theme === "vs-dark" ? "bg-zinc-700" : "bg-zinc-300"
                            )} />

                            {/* Copy */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-7 w-7 p-0",
                                            settings.theme === "vs-dark"
                                                ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                                                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200"
                                        )}
                                        onClick={copyCode}
                                    >
                                        {copied ? (
                                            <Check className="h-3.5 w-3.5 text-green-500" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy Code</TooltipContent>
                            </Tooltip>

                            {/* Download */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-7 w-7 p-0",
                                            settings.theme === "vs-dark"
                                                ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                                                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200"
                                        )}
                                        onClick={downloadAllFiles}
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download all files</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="h-[600px] w-full">
                        {files.length === 0 || !activeFile ? (
                            <div className={cn(
                                "h-full flex flex-col items-center justify-center gap-4",
                                settings.theme === "vs-dark"
                                    ? "bg-zinc-900 text-zinc-400"
                                    : "bg-zinc-50 text-zinc-500"
                            )}>
                                <File className="h-16 w-16 opacity-20" />
                                <div className="text-center">
                                    <p className="text-lg font-medium mb-1">No files open</p>
                                    <p className="text-sm opacity-70">
                                        Create a new file to start coding
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "mt-2",
                                        settings.theme === "vs-dark"
                                            ? "border-zinc-700 hover:bg-zinc-800"
                                            : "border-zinc-300 hover:bg-zinc-100"
                                    )}
                                    onClick={() => {
                                        setIsCreatingFile(true);
                                        setIsCreatingFolder(false);
                                        setCreateInFolderId(null);
                                    }}
                                >
                                    <FilePlus className="h-4 w-4 mr-2" />
                                    New File
                                </Button>
                            </div>
                        ) : (
                            <CodeiumEditor
                                language={activeFile.language}
                                theme={settings.theme}
                                value={activeFile.content}
                                onChange={handleCodeChange}
                                width="100%"
                                height="100%"
                                options={{
                                    fontSize: settings.fontSize,
                                    wordWrap: settings.wordWrap ? "on" : "off",
                                    minimap: { enabled: settings.minimap },
                                    lineNumbers: settings.lineNumbers ? "on" : "off",
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    padding: { top: 12, bottom: 12 },
                                }}
                                otherDocuments={otherContextDocuments}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t border-transparent" aria-label="Additional documentation">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="rounded-2xl border border-zinc-200 bg-white/80 shadow-lg shadow-violet-500/10 dark:border-zinc-800 dark:bg-zinc-950/80">
                        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr]">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    Additional AI documentation
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Group trusted resources so AI suggestions can cite the right guidance. Links are included in the context documents sent to Codeium.
                                </p>
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                    {docLinks.length === 0 && (
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                            No documentation links yet.
                                        </span>
                                    )}
                                    {docLinks.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                        >
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="truncate"
                                                title={doc.summary || doc.url}
                                            >
                                                {doc.name}
                                            </a>
                                            <button
                                                type="button"
                                                className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                onClick={() => handleRemoveDocumentationLink(doc.id)}
                                                aria-label={`Remove ${doc.name}`}
                                            >
                                                <X className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <form className="grid gap-3" onSubmit={handleAddDocumentationLink}>
                                <div>
                                    <Label htmlFor="doc-title" className="mb-2">
                                        Title
                                    </Label>
                                    <Input
                                        id="doc-title"
                                        value={newDocName}
                                        onChange={(e) => setNewDocName(e.target.value)}
                                        placeholder="Component spec"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="doc-url" className="mb-2">
                                        URL
                                    </Label>
                                    <Input
                                        id="doc-url"
                                        value={newDocUrl}
                                        onChange={(e) => setNewDocUrl(e.target.value)}
                                        type="url"
                                        placeholder="https://example.com/docs"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="doc-summary" className="mb-2">
                                        Summary (optional)
                                    </Label>
                                    <textarea
                                        id="doc-summary"
                                        value={newDocSummary}
                                        onChange={(e) => setNewDocSummary(e.target.value)}
                                        rows={3}
                                        className="w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                                        placeholder="Describe how the AI should use this resource"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit">Add documentation link</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
