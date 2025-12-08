"use client";

import { SiteHeader } from "@/components/site-header";
import { usePomodoroContextSafe } from "@/lib/pomodoro-context";
import { useZenMode } from "@/lib/zen-mode";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
    children: React.ReactNode;
    toolId?: string;
}

export function PageLayout({ children, toolId }: PageLayoutProps) {
    const pomodoro = usePomodoroContextSafe();
    const { zenMode } = useZenMode();
    const showPlaybar = pomodoro?.showPlaybar ?? false;

    return (
        <div className={cn(
            "min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black",
            showPlaybar && "pb-16"
        )}>
            <SiteHeader currentToolId={toolId} />
            {children}
            {/* Footer - hidden in zen mode */}
            {!zenMode && (
                <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-16">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-zinc-500 dark:text-zinc-400 py-8">
                        <p>
                            Built with ❤️ by{" "}
                            <a
                                href="https://fractiunate.me"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-900 dark:text-zinc-100 hover:underline"
                            >
                                Fractiunate
                            </a>
                        </p>
                        <p className="mt-1">
                            100% client-side • Your files never leave your browser
                        </p>
                    </div>
                </footer>
            )}
        </div>
    );
}
