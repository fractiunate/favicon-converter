/**
 * Pomodoro Timer Constants
 */

import type { PomodoroSettings, SessionType, SessionInfo } from "./types";

/** Default timer settings */
export const DEFAULT_SETTINGS: PomodoroSettings = {
    pomodoroDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    pomodorosBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    playSound: true,
};

/** Minimum values for settings */
export const MIN_POMODORO_DURATION = 1;
export const MIN_BREAK_DURATION = 1;
export const MIN_POMODOROS_BEFORE_LONG_BREAK = 2;

/** Maximum values for settings */
export const MAX_POMODORO_DURATION = 120;
export const MAX_BREAK_DURATION = 60;
export const MAX_POMODOROS_BEFORE_LONG_BREAK = 10;

/** Preset configurations */
export const PRESETS: Record<string, PomodoroSettings> = {
    classic: {
        pomodoroDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        pomodorosBeforeLongBreak: 4,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        playSound: true,
    },
    short: {
        pomodoroDuration: 15,
        shortBreakDuration: 3,
        longBreakDuration: 10,
        pomodorosBeforeLongBreak: 4,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        playSound: true,
    },
    long: {
        pomodoroDuration: 50,
        shortBreakDuration: 10,
        longBreakDuration: 30,
        pomodorosBeforeLongBreak: 4,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        playSound: true,
    },
};

/** Session type display info */
export const SESSION_INFO: Record<SessionType, SessionInfo> = {
    pomodoro: {
        label: "Focus Time",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-500",
    },
    shortBreak: {
        label: "Short Break",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-500",
    },
    longBreak: {
        label: "Long Break",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500",
    },
};

/** Duration presets in minutes */
export const DURATION_PRESETS = {
    pomodoro: [15, 20, 25, 30, 45, 50, 60],
    shortBreak: [3, 5, 10, 15],
    longBreak: [10, 15, 20, 30],
};
