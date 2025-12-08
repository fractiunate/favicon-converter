/**
 * Pomodoro Timer Utilities
 */

import type { SessionType, PomodoroSettings } from "./types";

/**
 * Convert minutes to seconds
 */
export function minutesToSeconds(minutes: number): number {
    return minutes * 60;
}

/**
 * Convert seconds to minutes
 */
export function secondsToMinutes(seconds: number): number {
    return Math.floor(seconds / 60);
}

/**
 * Format time as MM:SS
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format time as human readable string
 */
export function formatTimeHuman(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0) {
        return `${secs}s`;
    }
    if (secs === 0) {
        return `${mins}m`;
    }
    return `${mins}m ${secs}s`;
}

/**
 * Get duration for a session type from settings
 */
export function getSessionDuration(type: SessionType, settings: PomodoroSettings): number {
    switch (type) {
        case "pomodoro":
            return minutesToSeconds(settings.pomodoroDuration);
        case "shortBreak":
            return minutesToSeconds(settings.shortBreakDuration);
        case "longBreak":
            return minutesToSeconds(settings.longBreakDuration);
    }
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(timeRemaining: number, totalTime: number): number {
    if (totalTime === 0) return 0;
    return ((totalTime - timeRemaining) / totalTime) * 100;
}

/**
 * Determine next session type
 */
export function getNextSessionType(
    currentType: SessionType,
    completedPomodoros: number,
    pomodorosBeforeLongBreak: number
): SessionType {
    if (currentType === "pomodoro") {
        // After a pomodoro, check if we should take a long break
        if ((completedPomodoros + 1) % pomodorosBeforeLongBreak === 0) {
            return "longBreak";
        }
        return "shortBreak";
    }
    // After any break, return to pomodoro
    return "pomodoro";
}

/**
 * Validate settings value is within bounds
 */
export function clampValue(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
