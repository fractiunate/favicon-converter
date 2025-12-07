"use client";

import { Sparkles } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { JsonYamlFormatter } from "@/components/json-yaml-formatter";
import { Card, CardContent } from "@/components/ui/card";
import { useZenMode } from "@/lib/zen-mode";

export default function JsonFormatterPage() {
    const { zenMode } = useZenMode();

    return (
        <PageLayout toolId="json-formatter">
            {/* Main content */}
            <main className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${zenMode ? "py-6 sm:py-8" : "py-12 sm:py-16"}`}>
                {/* Hero section */}
                {!zenMode && (
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-4">
                            <Sparkles className="h-4 w-4" />
                            Free & Fast
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
                            JSON
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-600">
                                {" "}
                                &amp; YAML{" "}
                            </span>
                            Formatter
                        </h1>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            Format, validate, and convert between JSON and YAML. Beautify your
                            data with customizable indentation and sorting options.
                        </p>
                    </div>
                )}

                {/* Formatter */}
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl">
                    <CardContent className="p-6 sm:p-8">
                        <JsonYamlFormatter />
                    </CardContent>
                </Card>

                {/* Features Section */}
                {!zenMode && (
                    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                                <span className="text-xl">🔄</span>
                            </div>
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                                Bidirectional Conversion
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Convert seamlessly between JSON and YAML formats with a single
                                click.
                            </p>
                        </div>

                        <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                                <span className="text-xl">✨</span>
                            </div>
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                                Auto-detect Format
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Automatically detects whether your input is JSON or YAML for
                                instant formatting.
                            </p>
                        </div>

                        <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                                <span className="text-xl">🔐</span>
                            </div>
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                                100% Client-side
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                All processing happens in your browser. Your data never leaves
                                your device.
                            </p>
                        </div>

                        <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                                <span className="text-xl">📋</span>
                            </div>
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                                Sort Keys
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Alphabetically sort object keys for consistent, predictable
                                output.
                            </p>
                        </div>

                        <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                                <span className="text-xl">📦</span>
                            </div>
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                                Minify JSON
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Compress JSON by removing whitespace for smaller file sizes.
                            </p>
                        </div>

                        <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                                <span className="text-xl">⬇️</span>
                            </div>
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                                Download Output
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Download your formatted or converted data as a file instantly.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </PageLayout>
    );
}
