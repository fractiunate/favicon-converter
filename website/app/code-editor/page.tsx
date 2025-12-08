"use client";

import { Code, Sparkles } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { AICodeEditor } from "@/components/ai-code-editor";
import { Card, CardContent } from "@/components/ui/card";
import { useZenMode } from "@/lib/zen-mode";

export default function CodeEditorPage() {
    const { zenMode } = useZenMode();

    return (
        <PageLayout toolId="code-editor">
            {/* Main content */}
            <main className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${zenMode ? "py-6 sm:py-8" : "py-12 sm:py-16"}`}>
                {/* Hero section */}
                {!zenMode && (
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-4">
                            <Code className="h-4 w-4" />
                            AI-Powered Development
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
                            AI Code
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600">
                                {" "}
                                Editor
                            </span>
                        </h1>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            Write code faster with unlimited AI-powered autocomplete.
                            Powered by Codeium, completely free.
                        </p>
                    </div>
                )}

                {/* Main Component */}
                <AICodeEditor />

                {/* Features section */}
                {!zenMode && (
                    <div className="mt-16">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                                Features
                            </h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                                        🤖 AI Autocomplete
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Intelligent code suggestions powered by Codeium. No account required.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                                        🌐 17+ Languages
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        JavaScript, TypeScript, Python, Go, Rust, and many more.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                                        🎨 Customizable
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Dark/light theme, font size, word wrap, minimap, and more.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                                        💾 Auto-Save
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Your code persists in your browser. Never lose your work.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                                        📥 Download
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Export your code as a file with the correct extension.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                                        🔒 Private
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        100% client-side. Your code stays in your browser.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </main>
        </PageLayout>
    );
}
