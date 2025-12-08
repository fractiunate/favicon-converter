/**
 * AI Code Editor Constants
 */

import type {
    AIDocumentationLink,
    EditorSettings,
    EditorLanguage,
    EditorFile,
} from "./types";

export const DEFAULT_SETTINGS: EditorSettings = {
    language: "javascript",
    theme: "vs-dark",
    fontSize: 14,
    wordWrap: true,
    minimap: false,
    lineNumbers: true,
};

export const STORAGE_KEY = "code-editor-data";

export const LANGUAGES: { value: EditorLanguage; label: string }[] = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
    { value: "yaml", label: "YAML" },
    { value: "markdown", label: "Markdown" },
    { value: "sql", label: "SQL" },
    { value: "shell", label: "Shell/Bash" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "java", label: "Java" },
    { value: "csharp", label: "C#" },
    { value: "cpp", label: "C++" },
    { value: "php", label: "PHP" },
    { value: "ruby", label: "Ruby" },
];

export const DEFAULT_CODE = `// Welcome to the AI Code Editor!
// Start typing and enjoy AI-powered autocomplete.

function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("World"));
`;

export const DEFAULT_FILE: EditorFile = {
    id: "default",
    name: "index.js",
    content: DEFAULT_CODE,
    language: "javascript",
    parentId: null,
};

export const FONT_SIZES = [12, 14, 16, 18, 20, 24];

/**
 * Get language from file extension
 */
export function getLanguageFromFileName(fileName: string): EditorLanguage {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const extMap: Record<string, EditorLanguage> = {
        js: "javascript",
        jsx: "javascript",
        ts: "typescript",
        tsx: "typescript",
        py: "python",
        html: "html",
        htm: "html",
        css: "css",
        json: "json",
        yaml: "yaml",
        yml: "yaml",
        md: "markdown",
        sql: "sql",
        sh: "shell",
        bash: "shell",
        go: "go",
        rs: "rust",
        java: "java",
        cs: "csharp",
        cpp: "cpp",
        cc: "cpp",
        c: "cpp",
        h: "cpp",
        php: "php",
        rb: "ruby",
    };
    return extMap[ext] || "javascript";
}

/**
 * Get file extension from language
 */
export function getExtensionFromLanguage(language: EditorLanguage): string {
    const langMap: Record<EditorLanguage, string> = {
        javascript: "js",
        typescript: "ts",
        python: "py",
        html: "html",
        css: "css",
        json: "json",
        yaml: "yaml",
        markdown: "md",
        sql: "sql",
        shell: "sh",
        go: "go",
        rust: "rs",
        java: "java",
        csharp: "cs",
        cpp: "cpp",
        php: "php",
        ruby: "rb",
    };
    return langMap[language];
}

export const DEFAULT_DOCUMENTATION_LINKS: AIDocumentationLink[] = [
    {
        id: "codeium-docs",
        name: "Codeium Docs",
        url: "https://codeium.com/docs",
        summary: "Official Codeium documentation for understanding AI capabilities and configuration.",
    },
    {
        id: "typescript-handbook",
        name: "TypeScript Handbook",
        url: "https://www.typescriptlang.org/docs/handbook/intro.html",
        summary: "TypeScript language reference and best practices that can guide AI generated code.",
    },
];
