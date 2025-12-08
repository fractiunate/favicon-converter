"use client";

import Link from "next/link";
import { Play, Pause, SkipForward, RotateCcw, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePomodoroContextSafe } from "@/lib/pomodoro-context";
import { formatTime } from "@/services/pomodoro";

export function GlobalPomodoroPlaybar() {
    const pomodoro = usePomodoroContextSafe();

    // Don't render anything if context is not available
    if (!pomodoro) {
        return null;
    }

    const {
        session,
        sessionInfo,
        progress,
        isRunning,
        isPaused,
        startTimer,
        pauseTimer,
        skipSession,
        resetTimer,
        showPlaybar,
        setShowPlaybar,
    } = pomodoro;

    // Show mini toggle when playbar is hidden but timer has been used
    // (running, paused, or has any progress/completed pomodoros)
    const hasTimerActivity = isRunning || isPaused ||
        session.completedPomodoros > 0 ||
        session.timeRemaining !== session.totalTime;

    if (!showPlaybar) {
        // Show mini toggle button only if timer has activity
        if (!hasTimerActivity) {
            return null;
        }

        return (
            <div className="fixed bottom-4 right-4 z-50">
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "h-10 gap-2 shadow-lg border-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
                                    session.type === "pomodoro" && "border-red-500/50 hover:border-red-500",
                                    session.type === "shortBreak" && "border-green-500/50 hover:border-green-500",
                                    session.type === "longBreak" && "border-blue-500/50 hover:border-blue-500"
                                )}
                                onClick={() => setShowPlaybar(true)}
                            >
                                <div className={cn(
                                    "w-2 h-2 rounded-full shrink-0",
                                    sessionInfo.bgColor,
                                    isRunning && "animate-pulse"
                                )} />
                                <span className={cn("font-mono text-sm font-bold tabular-nums", sessionInfo.color)}>
                                    {formatTime(session.timeRemaining)}
                                </span>
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Show playbar</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            {/* Progress bar at top of footer */}
            <div className="absolute top-0 left-0 right-0 h-1">
                <div
                    className={cn(
                        "h-full transition-all duration-1000 ease-linear",
                        session.type === "pomodoro" && "bg-red-500",
                        session.type === "shortBreak" && "bg-green-500",
                        session.type === "longBreak" && "bg-blue-500"
                    )}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="container max-w-screen-xl mx-auto px-4">
                <div className="flex items-center justify-between h-14 gap-4">
                    {/* Left: Session Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            sessionInfo.bgColor,
                            isRunning && "animate-pulse"
                        )} />
                        <span className="text-sm font-medium truncate hidden sm:inline">
                            {sessionInfo.label}
                        </span>
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/pomodoro-timer">
                                        <Badge variant="secondary" className="text-xs hidden md:flex cursor-pointer hover:bg-secondary/80 transition-colors">
                                            {session.completedPomodoros} 🍅
                                        </Badge>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="top">Go to Pomodoro Timer</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* Center: Controls */}
                    <div className="flex items-center gap-2">
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={resetTimer}
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Reset</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-10 w-10 rounded-full",
                                session.type === "pomodoro" && "hover:bg-red-500/10",
                                session.type === "shortBreak" && "hover:bg-green-500/10",
                                session.type === "longBreak" && "hover:bg-blue-500/10"
                            )}
                            onClick={isRunning ? pauseTimer : startTimer}
                        >
                            {isRunning ? (
                                <Pause className={cn("h-5 w-5", sessionInfo.color)} />
                            ) : (
                                <Play className={cn("h-5 w-5", sessionInfo.color)} />
                            )}
                        </Button>

                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={skipSession}
                                    >
                                        <SkipForward className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Skip</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* Right: Time & Close */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
                        <div className={cn(
                            "font-mono text-lg font-bold tabular-nums",
                            sessionInfo.color
                        )}>
                            {formatTime(session.timeRemaining)}
                        </div>

                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowPlaybar(false)}
                                    >
                                        <span className="text-lg leading-none">×</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Hide playbar</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </div>
        </div>
    );
}
