import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI Code Editor",
    description:
        "A powerful code editor with unlimited AI-powered autocomplete. Write code faster with intelligent suggestions. 100% client-side.",
    openGraph: {
        title: "AI Code Editor | Client-Side Tools",
        description:
            "Write code faster with AI-powered autocomplete. Supports JavaScript, TypeScript, Python, and more. 100% client-side.",
        url: "https://fractiunate.me/client-tools/code-editor",
    },
    twitter: {
        title: "AI Code Editor | Client-Side Tools",
        description:
            "Write code faster with AI-powered autocomplete. Supports JavaScript, TypeScript, Python, and more.",
    },
};

export default function CodeEditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
