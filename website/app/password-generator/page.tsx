"use client";

import { Key } from "lucide-react";
import { PasswordGenerator } from '@/components/password-generator';
import { PageLayout } from '@/components/page-layout';
import { useZenMode } from "@/lib/zen-mode";

export default function PasswordGeneratorPage() {
    const { zenMode } = useZenMode();

    return (
        <PageLayout toolId="password-generator">
            {/* Main content */}
            <main className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ${zenMode ? "py-6 sm:py-8" : "py-12 sm:py-16"}`}>
                {/* Hero Section - Hidden in zen mode */}
                {!zenMode && (
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 mb-6">
                            <Key className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                            Password Generator
                        </h1>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            Generate secure random passwords with customizable options including length, character types, and exclusions
                        </p>

                        {/* Quick stats */}
                        <div className="flex items-center justify-center gap-8 mt-8">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                                    128
                                </div>
                                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Max Length
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                                    4
                                </div>
                                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Character Types
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                                    ∞
                                </div>
                                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Entropy
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Password Generator Component */}
                <PasswordGenerator />
            </main>
        </PageLayout>
    );
}