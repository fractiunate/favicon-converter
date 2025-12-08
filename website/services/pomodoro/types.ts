/**
 * Pomodoro Timer Types
 */

/** Timer session types */
export type SessionType = "pomodoro" | "shortBreak" | "longBreak";

/** Timer state */
export type TimerState = "idle" | "running" | "paused";

/** Timer settings */
export interface PomodoroSettings {
    /** Pomodoro duration in minutes */
    pomodoroDuration: number;
    /** Short break duration in minutes */
    shortBreakDuration: number;
    /** Long break duration in minutes */
    longBreakDuration: number;
    /** Number of pomodoros before long break */
    pomodorosBeforeLongBreak: number;
    /** Auto-start breaks */
    autoStartBreaks: boolean;
    /** Auto-start pomodoros */
    autoStartPomodoros: boolean;
    /** Play sound on session end */
    playSound: boolean;
}

/** Timer session data */
export interface TimerSession {
    /** Current session type */
    type: SessionType;
    /** Time remaining in seconds */
    timeRemaining: number;
    /** Total time for current session in seconds */
    totalTime: number;
    /** Current timer state */
    state: TimerState;
    /** Number of completed pomodoros in current cycle */
    completedPomodoros: number;
}

/** Workspace data structure for Pomodoro Timer */
export interface PomodoroWorkspaceData {
    settings: PomodoroSettings;
    /** Total pomodoros completed (lifetime) */
    totalPomodorosCompleted: number;
    /** Current session state (for persistence across page refresh) */
    session?: TimerSession;
    /** Whether the playbar should be visible */
    showPlaybar?: boolean;
    /** Timestamp when timer was last saved (for calculating elapsed time) */
    lastSavedAt?: number;
}

/** Session display info */
export interface SessionInfo {
    label: string;
    color: string;
    bgColor: string;
}
