"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    type ReactNode,
} from "react";
import { toast } from "sonner";
import {
    type SessionType,
    type PomodoroSettings,
    type TimerSession,
    type PomodoroWorkspaceData,
    DEFAULT_SETTINGS,
    SESSION_INFO,
    PRESETS,
    formatTime,
    getSessionDuration,
    calculateProgress,
    getNextSessionType,
} from "@/services/pomodoro";
import { useToolWorkspace } from "@/lib/workspace";

// Notification sound (simple beep using Web Audio API)
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
        // Audio not supported
    }
}

interface PomodoroContextValue {
    // Settings
    settings: PomodoroSettings;
    updateSetting: <K extends keyof PomodoroSettings>(key: K, value: PomodoroSettings[K]) => void;
    applyPreset: (presetName: string) => void;

    // Session state
    session: TimerSession;
    totalPomodorosCompleted: number;
    sessionInfo: { label: string; color: string; bgColor: string };
    progress: number;
    isRunning: boolean;
    isPaused: boolean;
    isIdle: boolean;

    // Controls
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    skipSession: () => void;
    selectSessionType: (type: SessionType) => void;

    // Playbar visibility
    showPlaybar: boolean;
    setShowPlaybar: (show: boolean) => void;
    togglePlaybar: () => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function usePomodoroContext() {
    const context = useContext(PomodoroContext);
    if (!context) {
        throw new Error("usePomodoroContext must be used within a PomodoroProvider");
    }
    return context;
}

// Safe hook that doesn't throw - returns null if not in context
export function usePomodoroContextSafe() {
    return useContext(PomodoroContext);
}

interface PomodoroProviderProps {
    children: ReactNode;
}

export function PomodoroProvider({ children }: PomodoroProviderProps) {
    // Settings state
    const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
    const [totalPomodorosCompleted, setTotalPomodorosCompleted] = useState(0);

    // Timer session state
    const [session, setSession] = useState<TimerSession>(() => ({
        type: "pomodoro",
        timeRemaining: getSessionDuration("pomodoro", DEFAULT_SETTINGS),
        totalTime: getSessionDuration("pomodoro", DEFAULT_SETTINGS),
        state: "idle",
        completedPomodoros: 0,
    }));

    // Session counter to force timer effect to re-run when session changes
    // This is needed because when auto-start is enabled, state goes from "running" to "running"
    // and React won't detect a change
    const [sessionCounter, setSessionCounter] = useState(0);

    // UI state
    const [showPlaybar, setShowPlaybar] = useState(false);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isCompletingSession = useRef(false);

    // Workspace integration
    const { isActive, isLoaded, data: workspaceData, workspaceId, save } = useToolWorkspace<PomodoroWorkspaceData>("pomodoro-timer");
    const previousWorkspaceId = useRef<string | null | undefined>(undefined);
    const isLoadingFromWorkspace = useRef(false);
    const saveRef = useRef(save);
    saveRef.current = save;

    // Load/reset data when workspace changes
    useEffect(() => {
        if (!isLoaded) return;

        if (previousWorkspaceId.current === workspaceId) return;
        previousWorkspaceId.current = workspaceId;
        isLoadingFromWorkspace.current = true;

        if (workspaceData) {
            if (workspaceData.settings) setSettings(workspaceData.settings);
            if (workspaceData.totalPomodorosCompleted !== undefined) {
                setTotalPomodorosCompleted(workspaceData.totalPomodorosCompleted);
            }
            if (workspaceData.showPlaybar !== undefined) {
                setShowPlaybar(workspaceData.showPlaybar);
            }

            // Restore session state if available
            if (workspaceData.session && workspaceData.lastSavedAt) {
                const savedSession = workspaceData.session;
                const elapsedSeconds = Math.floor((Date.now() - workspaceData.lastSavedAt) / 1000);

                // Only restore if it was running and calculate new time
                if (savedSession.state === "running") {
                    const newTimeRemaining = Math.max(0, savedSession.timeRemaining - elapsedSeconds);

                    if (newTimeRemaining > 0) {
                        // Timer still has time left, restore it as running
                        setSession({
                            ...savedSession,
                            timeRemaining: newTimeRemaining,
                            state: "running",
                        });
                    } else {
                        // Timer would have completed, move to next session
                        const restoredSettings = workspaceData.settings || DEFAULT_SETTINGS;
                        const nextType = getNextSessionType(
                            savedSession.type,
                            savedSession.completedPomodoros,
                            restoredSettings.pomodorosBeforeLongBreak
                        );
                        const nextDuration = getSessionDuration(nextType, restoredSettings);

                        // Calculate new completed pomodoros, reset after long break
                        let newCompletedPomodoros: number;
                        if (savedSession.type === "longBreak") {
                            newCompletedPomodoros = 0; // Reset cycle after long break
                        } else if (savedSession.type === "pomodoro") {
                            newCompletedPomodoros = savedSession.completedPomodoros + 1;
                        } else {
                            newCompletedPomodoros = savedSession.completedPomodoros;
                        }

                        // Determine if we should auto-start based on settings
                        const isNextBreak = nextType === "shortBreak" || nextType === "longBreak";
                        const shouldAutoStart = isNextBreak
                            ? restoredSettings.autoStartBreaks
                            : restoredSettings.autoStartPomodoros;

                        setSession({
                            type: nextType,
                            timeRemaining: nextDuration,
                            totalTime: nextDuration,
                            state: shouldAutoStart ? "running" : "paused",
                            completedPomodoros: newCompletedPomodoros,
                        });

                        // Update total if a pomodoro was completed
                        if (savedSession.type === "pomodoro") {
                            setTotalPomodorosCompleted((prev) => prev + 1);
                        }

                        toast.info("Timer completed while away. Ready for next session!");
                    }
                } else if (savedSession.state === "paused") {
                    // Restore paused state as-is
                    setSession(savedSession);
                } else {
                    // Idle state - restore with saved completedPomodoros if available
                    setSession({
                        ...savedSession,
                        timeRemaining: getSessionDuration(savedSession.type, workspaceData?.settings || DEFAULT_SETTINGS),
                        totalTime: getSessionDuration(savedSession.type, workspaceData?.settings || DEFAULT_SETTINGS),
                        state: "idle",
                    });
                }
            } else {
                // No session data, reset timer
                setSession({
                    type: "pomodoro",
                    timeRemaining: getSessionDuration("pomodoro", workspaceData?.settings || DEFAULT_SETTINGS),
                    totalTime: getSessionDuration("pomodoro", workspaceData?.settings || DEFAULT_SETTINGS),
                    state: "idle",
                    completedPomodoros: 0,
                });
            }
        } else {
            setSettings(DEFAULT_SETTINGS);
            setTotalPomodorosCompleted(0);
            setShowPlaybar(false);
            setSession({
                type: "pomodoro",
                timeRemaining: getSessionDuration("pomodoro", DEFAULT_SETTINGS),
                totalTime: getSessionDuration("pomodoro", DEFAULT_SETTINGS),
                state: "idle",
                completedPomodoros: 0,
            });
        }

        requestAnimationFrame(() => {
            isLoadingFromWorkspace.current = false;
        });
    }, [isLoaded, workspaceId, workspaceData]);

    // Save to workspace when state changes
    useEffect(() => {
        if (!isActive || !isLoaded) return;
        if (previousWorkspaceId.current === undefined || isLoadingFromWorkspace.current) return;

        saveRef.current({
            settings,
            totalPomodorosCompleted,
            session,
            showPlaybar,
            lastSavedAt: Date.now(),
        });
    }, [settings, totalPomodorosCompleted, session, showPlaybar, isActive, isLoaded]);

    // Handle session completion
    const handleSessionComplete = useCallback((currentSession: TimerSession) => {
        if (settings.playSound) {
            playNotificationSound();
        }

        const wasPomodoro = currentSession.type === "pomodoro";
        const wasLongBreak = currentSession.type === "longBreak";

        // Calculate new completed pomodoros count
        // Reset to 0 after completing a long break (cycle complete)
        let newCompletedPomodoros: number;
        if (wasLongBreak) {
            newCompletedPomodoros = 0; // Reset cycle after long break
        } else if (wasPomodoro) {
            newCompletedPomodoros = currentSession.completedPomodoros + 1;
        } else {
            newCompletedPomodoros = currentSession.completedPomodoros;
        }

        if (wasPomodoro) {
            setTotalPomodorosCompleted((prev) => prev + 1);
            toast.success("Pomodoro completed! Time for a break.");
        } else if (wasLongBreak) {
            toast.success("Long break complete! Starting a new cycle.");
        } else {
            toast.success("Break's over! Ready to focus?");
        }

        const nextType = getNextSessionType(
            currentSession.type,
            currentSession.completedPomodoros,
            settings.pomodorosBeforeLongBreak
        );

        const nextDuration = getSessionDuration(nextType, settings);

        // Determine if we should auto-start based on settings
        const isNextBreak = nextType === "shortBreak" || nextType === "longBreak";
        const shouldAutoStart = isNextBreak
            ? settings.autoStartBreaks
            : settings.autoStartPomodoros;

        setSession({
            type: nextType,
            timeRemaining: nextDuration,
            totalTime: nextDuration,
            state: shouldAutoStart ? "running" : "paused",
            completedPomodoros: newCompletedPomodoros,
        });

        // Increment session counter to force timer effect to re-run
        // This is critical for auto-start when state stays "running"
        setSessionCounter((prev) => prev + 1);
    }, [settings]);

    // Timer logic
    useEffect(() => {
        if (session.state === "running") {
            timerRef.current = setInterval(() => {
                setSession((prev) => {
                    if (prev.timeRemaining <= 1) {
                        // Prevent double completion
                        if (isCompletingSession.current) {
                            return prev;
                        }
                        isCompletingSession.current = true;

                        // IMPORTANT: Clear interval immediately to prevent it from
                        // ticking again and decrementing the NEW session's time
                        if (timerRef.current) {
                            clearInterval(timerRef.current);
                            timerRef.current = null;
                        }

                        // Session complete - handle in next tick to avoid state conflicts
                        setTimeout(() => {
                            handleSessionComplete(prev);
                            // Reset the flag after completion is handled
                            setTimeout(() => {
                                isCompletingSession.current = false;
                            }, 100);
                        }, 0);

                        // Return with timer at 0
                        return { ...prev, timeRemaining: 0 };
                    }
                    return { ...prev, timeRemaining: prev.timeRemaining - 1 };
                });
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
        // sessionCounter ensures this effect re-runs when a new session starts with auto-start
        // (when state stays "running" but we need a new interval)
    }, [session.state, sessionCounter, handleSessionComplete]);

    // Update document title when timer is running
    useEffect(() => {
        if (session.state === "running" || session.state === "paused") {
            const sessionLabel = SESSION_INFO[session.type].label;
            document.title = `${formatTime(session.timeRemaining)} - ${sessionLabel}`;
        } else {
            document.title = "Client-Side Tools | Fractiunate";
        }

        return () => {
            document.title = "Client-Side Tools | Fractiunate";
        };
    }, [session.timeRemaining, session.state, session.type]);

    // Control functions
    const startTimer = useCallback(() => {
        setSession((prev) => ({ ...prev, state: "running" }));
        setShowPlaybar(true);
    }, []);

    const pauseTimer = useCallback(() => {
        setSession((prev) => ({ ...prev, state: "paused" }));
    }, []);

    const resetTimer = useCallback(() => {
        const duration = getSessionDuration(session.type, settings);
        setSession((prev) => ({
            ...prev,
            timeRemaining: duration,
            totalTime: duration,
            state: "idle",
        }));
    }, [session.type, settings]);

    const skipSession = useCallback(() => {
        const nextType = getNextSessionType(
            session.type,
            session.completedPomodoros,
            settings.pomodorosBeforeLongBreak
        );
        const nextDuration = getSessionDuration(nextType, settings);

        // Calculate new completed pomodoros count
        // Reset to 0 after skipping a long break (cycle complete)
        let newCompletedPomodoros: number;
        if (session.type === "longBreak") {
            newCompletedPomodoros = 0; // Reset cycle after long break
        } else if (session.type === "pomodoro") {
            newCompletedPomodoros = session.completedPomodoros + 1;
        } else {
            newCompletedPomodoros = session.completedPomodoros;
        }

        setSession({
            type: nextType,
            timeRemaining: nextDuration,
            totalTime: nextDuration,
            state: "idle",
            completedPomodoros: newCompletedPomodoros,
        });

        if (session.type === "pomodoro") {
            setTotalPomodorosCompleted((prev) => prev + 1);
        }
    }, [session, settings]);

    const selectSessionType = useCallback((type: SessionType) => {
        const duration = getSessionDuration(type, settings);
        setSession({
            type,
            timeRemaining: duration,
            totalTime: duration,
            state: "idle",
            completedPomodoros: session.completedPomodoros,
        });
    }, [settings, session.completedPomodoros]);

    const updateSetting = useCallback(<K extends keyof PomodoroSettings>(
        key: K,
        value: PomodoroSettings[K]
    ) => {
        setSettings((prev) => {
            const newSettings = { ...prev, [key]: value };

            // Update timer if currently idle and the duration changed
            if (session.state === "idle") {
                const newDuration = getSessionDuration(session.type, newSettings);
                setSession((s) => ({
                    ...s,
                    timeRemaining: newDuration,
                    totalTime: newDuration,
                }));
            }

            return newSettings;
        });
    }, [session.state, session.type]);

    const applyPreset = useCallback((presetName: string) => {
        const preset = PRESETS[presetName];
        if (preset) {
            setSettings(preset);
            if (session.state === "idle") {
                const newDuration = getSessionDuration(session.type, preset);
                setSession((s) => ({
                    ...s,
                    timeRemaining: newDuration,
                    totalTime: newDuration,
                }));
            }
            toast.success(`Applied "${presetName}" preset`);
        }
    }, [session.state, session.type]);

    const togglePlaybar = useCallback(() => {
        setShowPlaybar((prev) => !prev);
    }, []);

    // Computed values
    const progress = useMemo(
        () => calculateProgress(session.timeRemaining, session.totalTime),
        [session.timeRemaining, session.totalTime]
    );

    const sessionInfo = SESSION_INFO[session.type];
    const isRunning = session.state === "running";
    const isPaused = session.state === "paused";
    const isIdle = session.state === "idle";

    const value: PomodoroContextValue = {
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
        setShowPlaybar,
        togglePlaybar,
    };

    return (
        <PomodoroContext.Provider value={value}>
            {children}
        </PomodoroContext.Provider>
    );
}
