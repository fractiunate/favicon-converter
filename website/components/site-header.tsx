"use client";

import Link from "next/link";
import {
    Coffee,
    Github,
    ChevronDown,
    Image,
    QrCode,
    Braces,
    FileArchive,
    Palette,
    KeyRound,
    Wrench,
    ShieldCheck,
    Network,
    Focus,
    Timer,
    LucideIcon,
} from "lucide-react";
import { WorkspaceSelector } from "@/components/workspace-selector";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { tools, Tool } from "@/lib/tools";
import { useZenMode } from "@/lib/zen-mode";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";

// Map icon names to Lucide components
const iconMap: Record<Tool["icon"], LucideIcon> = {
    Image,
    QrCode,
    Braces,
    FileArchive,
    Palette,
    KeyRound,
    Wrench,
    ShieldCheck,
    Network,
    Timer,
};

interface SiteHeaderProps {
    currentToolId?: string;
}

export function SiteHeader({ currentToolId }: SiteHeaderProps) {
    const currentTool = tools.find((t) => t.id === currentToolId);
    const { zenMode, toggleZenMode } = useZenMode();

    return (
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                                {currentTool ? (
                                    (() => {
                                        const IconComponent = iconMap[currentTool.icon];
                                        return <IconComponent className="h-4 w-4 text-white" />;
                                    })()
                                ) : (
                                    <Wrench className="h-4 w-4 text-white" />
                                )}
                            </div>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                Free {currentTool?.name || "Client Tools"}
                            </span>
                            <ChevronDown className="h-4 w-4 text-zinc-500 transition-transform group-data-[state=open]:rotate-180" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        sideOffset={8}
                        className="w-[350px] md:w-[450px] p-2 z-[100]"
                    >
                        <div className="grid gap-1 md:grid-cols-2">
                            {tools.map((tool) => (
                                <ToolMenuItem
                                    key={tool.id}
                                    tool={tool}
                                    isActive={tool.id === currentToolId}
                                />
                            ))}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center gap-1">
                    {FEATURE_FLAGS.WORKSPACES_ENABLED && <WorkspaceSelector />}

                    {FEATURE_FLAGS.ZEN_MODE_ENABLED && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={toggleZenMode}
                                        className={cn(
                                            "p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                                            zenMode && "bg-violet-100 dark:bg-violet-900/30"
                                        )}
                                    >
                                        <Focus
                                            className={cn(
                                                "h-5 w-5 transition-colors",
                                                zenMode
                                                    ? "text-violet-600 dark:text-violet-400"
                                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                            )}
                                        />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{zenMode ? "Exit Zen Mode" : "Zen Mode"}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <a
                                    href="https://buymeacoffee.com/fractiunate"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                                >
                                    <Coffee className="h-5 w-5 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                                </a>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Buy me a coffee</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <a
                                    href="https://github.com/fractiunate/client-tools"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <Github className="h-5 w-5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" />
                                </a>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>github/fractiunate/client-tools</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </header>
    );
}

interface ToolMenuItemProps {
    tool: Tool;
    isActive: boolean;
}

function ToolMenuItem({ tool, isActive }: ToolMenuItemProps) {
    const IconComponent = iconMap[tool.icon];

    const content = (
        <div
            className={cn(
                "flex items-start gap-3 rounded-lg p-3 w-full",
                isActive && "bg-violet-50 dark:bg-violet-900/20"
            )}
        >
            <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <IconComponent className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                        {tool.name}
                    </span>
                    {!tool.available && (
                        <span className="text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded font-medium">
                            Soon
                        </span>
                    )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                    {tool.description}
                </p>
            </div>
        </div>
    );

    if (!tool.available) {
        return (
            <DropdownMenuItem disabled className="p-0 opacity-50 cursor-not-allowed focus:bg-transparent">
                {content}
            </DropdownMenuItem>
        );
    }

    return (
        <DropdownMenuItem asChild className="p-0 cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 rounded-lg">
            <Link href={tool.href}>{content}</Link>
        </DropdownMenuItem>
    );
}
