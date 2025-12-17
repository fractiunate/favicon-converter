/**
 * AI Code Editor Types
 */

export type EditorLanguage =
    | "javascript"
    | "typescript"
    | "python"
    | "html"
    | "css"
    | "json"
    | "yaml"
    | "markdown"
    | "sql"
    | "shell"
    | "go"
    | "rust"
    | "java"
    | "csharp"
    | "cpp"
    | "php"
    | "ruby";

export type EditorTheme = "vs-dark" | "light";

export interface EditorSettings {
    language: EditorLanguage;
    theme: EditorTheme;
    fontSize: number;
    wordWrap: boolean;
    minimap: boolean;
    lineNumbers: boolean;
}

export interface EditorFile {
    id: string;
    name: string;
    content: string;
    language: EditorLanguage;
    parentId: string | null; // null = root level
}

export interface EditorFolder {
    id: string;
    name: string;
    parentId: string | null; // null = root level
    isOpen: boolean;
}

export interface AIDocumentationLink {
    id: string;
    name: string;
    url: string;
    summary?: string;
}

export interface CodeEditorWorkspaceData {
    files: EditorFile[];
    folders: EditorFolder[];
    activeFileId: string | null;
    settings: EditorSettings;
    documentationLinks?: AIDocumentationLink[];
}
