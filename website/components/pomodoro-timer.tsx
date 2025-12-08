"use client";

import {
    Play,
    Pause,
    SkipForward,
    RotateCcw,
    Settings,
    Volume2,
    VolumeX,
    Timer,
    Coffee,
    Battery,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { usePomodoroContextSafe } from "@/lib/pomodoro-context";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";

import {
    type SessionType,
    SESSION_INFO,
    MIN_POMODORO_DURATION,
    MAX_POMODORO_DURATION,
    MIN_BREAK_DURATION,
    MAX_BREAK_DURATION,
    MIN_POMODOROS_BEFORE_LONG_BREAK,
    MAX_POMODOROS_BEFORE_LONG_BREAK,
    formatTime,
    clampValue,
} from "@/services/pomodoro";

export function PomodoroTimer() {
    const pomodoro = usePomodoroContextSafe();

    // Show message if feature is disabled
    if (!FEATURE_FLAGS.POMODORO_ENABLED || !pomodoro) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-12">
                        <Timer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Pomodoro Timer</h3>
                        <p className="text-muted-foreground">
                            This feature is currently disabled.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const {
        settings,
        updateSetting,
        applyPreset,
        session,
        totalPomodorosCompleted,
        sessionInfo,
        progress,
        isRunning,
        isPaused,
        isIdle,
        startTimer,
        pauseTimer,
        resetTimer,
        skipSession,
        selectSessionType,
        showPlaybar,
        togglePlaybar,
    } = pomodoro;

    // Get session icon
    const SessionIcon = session.type === "pomodoro" ? Timer : session.type === "shortBreak" ? Coffee : Battery;

    return (
        <div className={cn("space-y-6", showPlaybar && "pb-20")}>
            {/* Main Timer Display */}
            <Card>
                <CardContent className="pt-6">
                    {/* Session Type Selector */}
                    <div className="flex justify-center gap-2 mb-6">
                        {(["pomodoro", "shortBreak", "longBreak"] as SessionType[]).map((type) => (
                            <Button
                                key={type}
                                variant={session.type === type ? "default" : "outline"}
                                size="sm"
                                onClick={() => selectSessionType(type)}
                                disabled={isRunning}
                                className={cn(
                                    session.type === type && type === "pomodoro" && "bg-red-500 hover:bg-red-600",
                                    session.type === type && type === "shortBreak" && "bg-green-500 hover:bg-green-600",
                                    session.type === type && type === "longBreak" && "bg-blue-500 hover:bg-blue-600"
                                )}
                            >
                                {SESSION_INFO[type].label}
                            </Button>
                        ))}
                    </div>

                    {/* Timer Display */}
                    <div className="text-center mb-6">
                        <div className={cn("text-8xl font-mono font-bold tracking-tight", sessionInfo.color)}>
                            {formatTime(session.timeRemaining)}
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-2">
                            <SessionIcon className={cn("h-5 w-5", sessionInfo.color)} />
                            <span className={cn("text-lg font-medium", sessionInfo.color)}>
                                {sessionInfo.label}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <Progress
                            value={progress}
                            className={cn(
                                "h-2",
                                session.type === "pomodoro" && "[&>div]:bg-red-500",
                                session.type === "shortBreak" && "[&>div]:bg-green-500",
                                session.type === "longBreak" && "[&>div]:bg-blue-500"
                            )}
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-3">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={resetTimer}
                                        disabled={isIdle && session.timeRemaining === session.totalTime}
                                    >
                                        <RotateCcw className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reset</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <Button
                            size="lg"
                            onClick={isRunning ? pauseTimer : startTimer}
                            className={cn(
                                "w-32",
                                session.type === "pomodoro" && "bg-red-500 hover:bg-red-600",
                                session.type === "shortBreak" && "bg-green-500 hover:bg-green-600",
                                session.type === "longBreak" && "bg-blue-500 hover:bg-blue-600"
                            )}
                        >
                            {isRunning ? (
                                <>
                                    <Pause className="h-5 w-5 mr-2" />
                                    Pause
                                </>
                            ) : (
                                <>
                                    <Play className="h-5 w-5 mr-2" />
                                    {isPaused ? "Resume" : "Start"}
                                </>
                            )}
                        </Button>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={skipSession}>
                                        <SkipForward className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Skip to next</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* Stats */}
                    <div className="mt-6 flex justify-center gap-4">
                        <Badge variant="secondary" className="text-sm">
                            Session: {session.completedPomodoros} / {settings.pomodorosBeforeLongBreak}
                        </Badge>
                        <Badge variant="outline" className="text-sm">
                            Total: {totalPomodorosCompleted} 🍅
                        </Badge>
                    </div>

                    {/* Playbar Toggle */}
                    <div className="mt-6 flex items-center justify-center gap-2">
                        <Label htmlFor="playbar-toggle" className="text-sm text-muted-foreground">
                            Show floating playbar
                        </Label>
                        <Switch
                            id="playbar-toggle"
                            checked={showPlaybar}
                            onCheckedChange={togglePlaybar}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Timer Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Presets */}
                    <div>
                        <Label className="text-sm font-medium">Quick Presets</Label>
                        <div className="flex gap-2 mt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyPreset("short")}
                            >
                                Short (15/3/10)
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyPreset("classic")}
                            >
                                Classic (25/5/15)
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyPreset("long")}
                            >
                                Long (50/10/30)
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Duration Settings */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="pomodoro-duration">Pomodoro (min)</Label>
                            <Input
                                id="pomodoro-duration"
                                type="number"
                                min={MIN_POMODORO_DURATION}
                                max={MAX_POMODORO_DURATION}
                                value={settings.pomodoroDuration}
                                onChange={(e) =>
                                    updateSetting(
                                        "pomodoroDuration",
                                        clampValue(
                                            parseInt(e.target.value) || MIN_POMODORO_DURATION,
                                            MIN_POMODORO_DURATION,
                                            MAX_POMODORO_DURATION
                                        )
                                    )
                                }
                                disabled={isRunning}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="short-break-duration">Short Break (min)</Label>
                            <Input
                                id="short-break-duration"
                                type="number"
                                min={MIN_BREAK_DURATION}
                                max={MAX_BREAK_DURATION}
                                value={settings.shortBreakDuration}
                                onChange={(e) =>
                                    updateSetting(
                                        "shortBreakDuration",
                                        clampValue(
                                            parseInt(e.target.value) || MIN_BREAK_DURATION,
                                            MIN_BREAK_DURATION,
                                            MAX_BREAK_DURATION
                                        )
                                    )
                                }
                                disabled={isRunning}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="long-break-duration">Long Break (min)</Label>
                            <Input
                                id="long-break-duration"
                                type="number"
                                min={MIN_BREAK_DURATION}
                                max={MAX_BREAK_DURATION}
                                value={settings.longBreakDuration}
                                onChange={(e) =>
                                    updateSetting(
                                        "longBreakDuration",
                                        clampValue(
                                            parseInt(e.target.value) || MIN_BREAK_DURATION,
                                            MIN_BREAK_DURATION,
                                            MAX_BREAK_DURATION
                                        )
                                    )
                                }
                                disabled={isRunning}
                            />
                        </div>
                    </div>

                    {/* Pomodoros before long break */}
                    <div className="space-y-2">
                        <Label htmlFor="pomodoros-before-long-break">
                            Pomodoros before long break
                        </Label>
                        <Select
                            value={settings.pomodorosBeforeLongBreak.toString()}
                            onValueChange={(value) =>
                                updateSetting("pomodorosBeforeLongBreak", parseInt(value))
                            }
                            disabled={isRunning}
                        >
                            <SelectTrigger id="pomodoros-before-long-break" className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from(
                                    { length: MAX_POMODOROS_BEFORE_LONG_BREAK - MIN_POMODOROS_BEFORE_LONG_BREAK + 1 },
                                    (_, i) => i + MIN_POMODOROS_BEFORE_LONG_BREAK
                                ).map((n) => (
                                    <SelectItem key={n} value={n.toString()}>
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    {/* Toggles */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="auto-start-breaks" className="flex-1">
                                Auto-start breaks
                            </Label>
                            <Switch
                                id="auto-start-breaks"
                                checked={settings.autoStartBreaks}
                                onCheckedChange={(checked) =>
                                    updateSetting("autoStartBreaks", checked)
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="auto-start-pomodoros" className="flex-1">
                                Auto-start pomodoros
                            </Label>
                            <Switch
                                id="auto-start-pomodoros"
                                checked={settings.autoStartPomodoros}
                                onCheckedChange={(checked) =>
                                    updateSetting("autoStartPomodoros", checked)
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="play-sound" className="flex-1 flex items-center gap-2">
                                {settings.playSound ? (
                                    <Volume2 className="h-4 w-4" />
                                ) : (
                                    <VolumeX className="h-4 w-4" />
                                )}
                                Play sound on completion
                            </Label>
                            <Switch
                                id="play-sound"
                                checked={settings.playSound}
                                onCheckedChange={(checked) =>
                                    updateSetting("playSound", checked)
                                }
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
