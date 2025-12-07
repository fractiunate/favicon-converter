"use client";

import { Sparkles } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { CIDRCalculator } from "@/components/cidr-calculator";
import { useZenMode } from "@/lib/zen-mode";

export default function CIDRCalculatorPage() {
    const { zenMode } = useZenMode();

    return (
        <PageLayout toolId="cidr-calculator">
            {/* Main content */}
            <main className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ${zenMode ? "py-6 sm:py-8" : "py-12 sm:py-16"}`}>
                {/* Hero section */}
                {!zenMode && (
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-4">
                            <Sparkles className="h-4 w-4" />
                            Free & Fast
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
                            CIDR
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-600">
                                {" "}
                                Calculator
                            </span>
                        </h1>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            Calculate subnet details, detect overlapping ranges, and find available
                            IP blocks. Plan your network with ease.
                        </p>
                    </div>
                )}

                {/* Calculator */}
                <CIDRCalculator />

                {/* Features section */}
                {!zenMode && (
                    <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <FeatureCard
                            title="Overlap Detection"
                            description="Automatically detect when CIDR ranges overlap and get clear warnings"
                        />
                        <FeatureCard
                            title="Smart Suggestions"
                            description="Get suggestions for non-overlapping ranges in private IP space"
                        />
                        <FeatureCard
                            title="Full Details"
                            description="See network address, broadcast, subnet mask, usable hosts, and more"
                        />
                    </div>
                )}
            </main>
        </PageLayout>
    );
}

function FeatureCard({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900/50">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {title}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>
    );
}
