"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Play,
    Pause,
    SkipForward,
    RotateCcw,
    ChevronUp,
    ChevronDown,
    ListTodo,
    Timer,
    Circle,
    CheckCircle2,
    Plus,
} from "lucide-react";

const WIDGET_VISIBLE_KEY = "global-status-widget-visible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePomodoroContextSafe } from "@/lib/pomodoro-context";
import { formatTime } from "@/services/pomodoro";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { type TodoItem, type TodoWorkspaceData, type TodoPriority, STORAGE_KEY as TODO_STORAGE_KEY, PRIORITY_CONFIG, createTodoItem, MAX_TODO_LENGTH } from "@/services/todo";
import { useToolWorkspace } from "@/lib/workspace";

const WIDGET_EXPANDED_KEY = "global-status-widget-expanded";

export function GlobalStatusWidget() {
    const router = useRouter();
    const pomodoro = usePomodoroContextSafe();
    const todoWorkspace = useToolWorkspace<TodoWorkspaceData>("todo-list");

    // Widget state - expanded/minimized and visible/hidden
    const [isExpanded, setIsExpanded] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    // Todo state for display
    const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
    const [newTodoText, setNewTodoText] = useState("");

    // Load widget expanded and visibility preferences
    useEffect(() => {
        const expanded = localStorage.getItem(WIDGET_EXPANDED_KEY);
        if (expanded === "true") {
            setIsExpanded(true);
        }
        // Default to visible (true) if not set
        const visible = localStorage.getItem(WIDGET_VISIBLE_KEY);
        setIsVisible(visible !== "false");
        setIsLoaded(true);
    }, []);

    // Listen for visibility toggle from header
    useEffect(() => {
        const handleVisibilityToggle = (e: CustomEvent<{ visible: boolean }>) => {
            setIsVisible(e.detail.visible);
        };

        window.addEventListener("widget-visibility-toggle", handleVisibilityToggle as EventListener);
        return () => window.removeEventListener("widget-visibility-toggle", handleVisibilityToggle as EventListener);
    }, []);

    // Save expanded state
    const toggleExpanded = (expanded: boolean) => {
        setIsExpanded(expanded);
        if (expanded) {
            localStorage.setItem(WIDGET_EXPANDED_KEY, "true");
        } else {
            localStorage.removeItem(WIDGET_EXPANDED_KEY);
        }
    };

    // Load todo items
    useEffect(() => {
        if (!todoWorkspace.isLoaded) return;

        if (todoWorkspace.isActive && todoWorkspace.data) {
            setTodoItems(todoWorkspace.data.items || []);
        } else {
            try {
                const stored = localStorage.getItem(TODO_STORAGE_KEY);
                if (stored) {
                    const data = JSON.parse(stored) as TodoWorkspaceData;
                    setTodoItems(data.items || []);
                }
            } catch {
                setTodoItems([]);
            }
        }
    }, [todoWorkspace.isLoaded, todoWorkspace.isActive, todoWorkspace.data, todoWorkspace.workspaceId]);

    // Listen for storage changes to sync with todo page
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === TODO_STORAGE_KEY && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue) as TodoWorkspaceData;
                    setTodoItems(data.items || []);
                } catch {
                    // Ignore parse errors
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Listen for todo updates from todo page (same-page sync)
    useEffect(() => {
        const handleTodoUpdated = (e: CustomEvent<{ items: TodoItem[] }>) => {
            setTodoItems(e.detail.items);
        };

        window.addEventListener("todo-updated", handleTodoUpdated as EventListener);
        return () => window.removeEventListener("todo-updated", handleTodoUpdated as EventListener);
    }, []);

    // Toggle todo completion
    const toggleTodoComplete = useCallback((todoId: string) => {
        const updatedItems = todoItems.map(item =>
            item.id === todoId
                ? { ...item, completed: !item.completed, completedAt: !item.completed ? Date.now() : undefined }
                : item
        );
        setTodoItems(updatedItems);

        // Save to workspace or localStorage, preserving existing filter
        if (todoWorkspace.isActive) {
            const existingFilter = todoWorkspace.data?.filter || { status: "all", priority: "all" };
            todoWorkspace.save({ items: updatedItems, filter: existingFilter });
        } else {
            try {
                const stored = localStorage.getItem(TODO_STORAGE_KEY);
                const data = stored ? JSON.parse(stored) as TodoWorkspaceData : { items: [], filter: { status: "all", priority: "all" } };
                data.items = updatedItems;
                localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(data));
            } catch {
                // Ignore save errors
            }
        }

        // Dispatch custom event for same-page sync
        window.dispatchEvent(new CustomEvent("todo-updated", { detail: { items: updatedItems } }));
    }, [todoItems, todoWorkspace]);

    // Add a new todo
    const addTodo = useCallback(() => {
        const text = newTodoText.trim();
        if (!text) return;

        const newItem = createTodoItem(text, "medium");
        const updatedItems = [...todoItems, newItem];
        setTodoItems(updatedItems);
        setNewTodoText("");

        // Save to workspace or localStorage, preserving existing filter
        if (todoWorkspace.isActive) {
            const existingFilter = todoWorkspace.data?.filter || { status: "all", priority: "all" };
            todoWorkspace.save({ items: updatedItems, filter: existingFilter });
        } else {
            try {
                const stored = localStorage.getItem(TODO_STORAGE_KEY);
                const data = stored ? JSON.parse(stored) as TodoWorkspaceData : { items: [], filter: { status: "all", priority: "all" } };
                data.items = updatedItems;
                localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(data));
            } catch {
                // Ignore save errors
            }
        }

        // Dispatch custom event for same-page sync
        window.dispatchEvent(new CustomEvent("todo-updated", { detail: { items: updatedItems } }));
    }, [newTodoText, todoItems, todoWorkspace]);

    // Calculate what to show
    const pomodoroEnabled = FEATURE_FLAGS.POMODORO_ENABLED && pomodoro;
    const todoEnabled = FEATURE_FLAGS.TODO_LIST_ENABLED;

    const hasPomodoroActivity = pomodoroEnabled && (
        pomodoro.isRunning ||
        pomodoro.isPaused ||
        pomodoro.session.completedPomodoros > 0 ||
        pomodoro.session.timeRemaining !== pomodoro.session.totalTime
    );

    const activeTodoCount = todoItems.filter(t => !t.completed).length;
    const hasTodoActivity = todoEnabled && activeTodoCount > 0;
    const showTodoSection = todoEnabled; // Always show todo section if enabled

    // Don't render if nothing to show or not loaded or hidden
    if (!isLoaded) return null;
    if (!isVisible) return null;

    const hasAnyActivity = hasPomodoroActivity || hasTodoActivity || showTodoSection;

    // If no activity, don't show anything
    if (!hasAnyActivity) return null;

    // Minimized view - compact horizontal bar
    if (!isExpanded) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <div className="flex items-center gap-1 p-1 rounded-lg shadow-lg border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                    {/* Todo Mini Widget - First */}
                    {showTodoSection && (
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1.5 px-2 text-violet-600 dark:text-violet-400"
                                        onClick={() => toggleExpanded(true)}
                                    >
                                        <ListTodo className="h-3.5 w-3.5" />
                                        {activeTodoCount > 0 && (
                                            <span className="text-xs font-medium">{activeTodoCount}</span>
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    {activeTodoCount > 0
                                        ? `${activeTodoCount} active todo${activeTodoCount !== 1 ? "s" : ""}`
                                        : "Add a todo"
                                    }
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Pomodoro Mini Widget - At end */}
                    {hasPomodoroActivity && pomodoro && (
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/pomodoro-timer">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "h-8 gap-1.5 px-2",
                                                pomodoro.session.type === "pomodoro" && "text-red-600 dark:text-red-400",
                                                pomodoro.session.type === "shortBreak" && "text-green-600 dark:text-green-400",
                                                pomodoro.session.type === "longBreak" && "text-blue-600 dark:text-blue-400"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-2 h-2 rounded-full shrink-0",
                                                pomodoro.sessionInfo.bgColor,
                                                pomodoro.isRunning && "animate-pulse"
                                            )} />
                                            <span className="font-mono text-xs font-bold tabular-nums">
                                                {formatTime(pomodoro.session.timeRemaining)}
                                            </span>
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    {pomodoro.sessionInfo.label} - Click to open
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Expand Button */}
                    {(hasPomodoroActivity || showTodoSection) && (
                        <>
                            <div className="w-px h-5 bg-border mx-0.5" />
                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => toggleExpanded(true)}
                                        >
                                            <ChevronUp className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Expand controls</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Expanded view - shows todo preview and pomodoro controls
    const activeTodos = todoItems.filter(t => !t.completed).slice(0, 10);
    const pomodoroData = pomodoroEnabled && pomodoro ? {
        session: pomodoro.session,
        sessionInfo: pomodoro.sessionInfo,
        isRunning: pomodoro.isRunning,
        startTimer: pomodoro.startTimer,
        pauseTimer: pomodoro.pauseTimer,
        skipSession: pomodoro.skipSession,
        resetTimer: pomodoro.resetTimer,
    } : null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="rounded-lg shadow-lg border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-3 w-[300px]">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Quick View</span>
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => toggleExpanded(false)}
                                >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Minimize</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Todo Section - First */}
                {showTodoSection && (
                    <div className="mb-3 overflow-hidden">
                        <Link href="/todo-list" className="flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400 mb-2 hover:underline">
                            <ListTodo className="h-4 w-4 shrink-0" />
                            {activeTodoCount > 0 ? `Active Todos (${activeTodoCount})` : "Todo List"}
                        </Link>

                        {/* Add todo input */}
                        <div className="flex items-center gap-1.5 mb-2">
                            <Input
                                placeholder="Add a task..."
                                value={newTodoText}
                                onChange={(e) => setNewTodoText(e.target.value.slice(0, MAX_TODO_LENGTH))}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        addTodo();
                                    }
                                }}
                                className="h-7 text-xs"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={addTodo}
                                disabled={!newTodoText.trim()}
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        {/* Todo list */}
                        {activeTodoCount > 0 && (
                            <div className="space-y-1.5">
                                {activeTodos.map((todo) => (
                                    <div
                                        key={todo.id}
                                        className="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-muted/50 overflow-hidden group cursor-pointer"
                                        onClick={() => toggleTodoComplete(todo.id)}
                                    >
                                        <button
                                            className="shrink-0 text-muted-foreground group-hover:text-green-500 transition-colors"
                                            title="Mark as complete"
                                        >
                                            <Circle className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="truncate text-foreground/80 min-w-0 flex-1 group-hover:line-through group-hover:text-muted-foreground transition-all">
                                            {todo.text}
                                        </span>
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full shrink-0",
                                            todo.priority === "high" && "bg-red-500",
                                            todo.priority === "medium" && "bg-amber-500",
                                            todo.priority === "low" && "bg-green-500"
                                        )} />
                                    </div>
                                ))}
                                {activeTodoCount > 10 && (
                                    <Link href="/todo-list" className="block text-xs text-muted-foreground hover:text-foreground text-center py-1">
                                        +{activeTodoCount - 10} more...
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Pomodoro Section - At end */}
                {hasPomodoroActivity && pomodoroData && (
                    <div className={cn(hasTodoActivity && "pt-3 border-t")}>
                        <div className="flex items-center gap-2 mb-2">
                            <Timer className={cn("h-4 w-4", pomodoroData.sessionInfo.color)} />
                            <span className="text-sm font-medium">{pomodoroData.sessionInfo.label}</span>
                            <Badge variant="secondary" className="text-xs ml-auto">
                                {pomodoroData.session.completedPomodoros} 🍅
                            </Badge>
                        </div>

                        {/* Timer Display */}
                        <div className={cn(
                            "text-center font-mono text-2xl font-bold tabular-nums mb-2",
                            pomodoroData.sessionInfo.color
                        )}>
                            {formatTime(pomodoroData.session.timeRemaining)}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-2">
                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={pomodoroData.resetTimer}
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Reset</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <Button
                                size="icon"
                                className={cn(
                                    "h-10 w-10 rounded-full",
                                    pomodoroData.session.type === "pomodoro" && "bg-red-500 hover:bg-red-600",
                                    pomodoroData.session.type === "shortBreak" && "bg-green-500 hover:bg-green-600",
                                    pomodoroData.session.type === "longBreak" && "bg-blue-500 hover:bg-blue-600"
                                )}
                                onClick={pomodoroData.isRunning ? pomodoroData.pauseTimer : pomodoroData.startTimer}
                            >
                                {pomodoroData.isRunning ? (
                                    <Pause className="h-4 w-4 text-white" />
                                ) : (
                                    <Play className="h-4 w-4 text-white" />
                                )}
                            </Button>

                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={pomodoroData.skipSession}
                                        >
                                            <SkipForward className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Skip</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
