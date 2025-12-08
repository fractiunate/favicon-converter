"use client";

import { Sparkles, Timer } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import { Card, CardContent } from "@/components/ui/card";
import { useZenMode } from "@/lib/zen-mode";

export default function PomodoroTimerPage() {
    const { zenMode } = useZenMode();

    return (
        <PageLayout toolId="pomodoro-timer">
            {/* Main content */}
            <main className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 ${zenMode ? "py-6 sm:py-8" : "py-12 sm:py-16"}`}>
                {/* Hero section */}
                {!zenMode && (
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium mb-4">
                            <Timer className="h-4 w-4" />
                            Focus & Productivity
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
                            Pomodoro
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">
                                {" "}
                                Timer
                            </span>
                        </h1>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            Boost your productivity with the Pomodoro Technique. Focus for 25 minutes,
                            take a break, repeat.
                        </p>
                    </div>
                )}

                {/* Timer */}
                <PomodoroTimer />

                {/* Features section */}
                {!zenMode && (
                    <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <FeatureCard
                            title="Customizable Timers"
                            description="Adjust focus sessions, short breaks, and long breaks to your preference"
                        />
                        <FeatureCard
                            title="Auto-Start Options"
                            description="Automatically start breaks or focus sessions when the timer ends"
                        />
                        <FeatureCard
                            title="Floating Playbar"
                            description="Control your timer with a compact floating playbar while you work"
                        />
                    </div>
                )}
            </main>
        </PageLayout>
    );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
    return (
        <div className="text-center p-6 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{title}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>
    );
}
