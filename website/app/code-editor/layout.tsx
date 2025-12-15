import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI Code Editor",
    description:
        "A powerful code editor with unlimited AI-powered autocomplete via Codeium. Write code faster with intelligent suggestions. Code is sent to Codeium for AI completions.",
    openGraph: {
        title: "AI Code Editor | Developer Tools",
        description:
            "Write code faster with AI-powered autocomplete via Codeium. Supports JavaScript, TypeScript, Python, and more.",
        url: "https://fractiunate.me/tools/code-editor",
    },
    twitter: {
        title: "AI Code Editor | Developer Tools",
        description:
            "Write code faster with AI-powered autocomplete via Codeium. Supports JavaScript, TypeScript, Python, and more.",
    },
};

export default function CodeEditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
