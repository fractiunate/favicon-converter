import { describe, it, expect } from "vitest";
import {
    minutesToSeconds,
    secondsToMinutes,
    formatTime,
    formatTimeHuman,
    getSessionDuration,
    calculateProgress,
    getNextSessionType,
    clampValue,
} from "./utils";
import { DEFAULT_SETTINGS } from "./constants";

describe("Pomodoro Utils", () => {
    describe("minutesToSeconds", () => {
        it("should convert minutes to seconds", () => {
            expect(minutesToSeconds(1)).toBe(60);
            expect(minutesToSeconds(25)).toBe(1500);
            expect(minutesToSeconds(0)).toBe(0);
        });
    });

    describe("secondsToMinutes", () => {
        it("should convert seconds to minutes (floored)", () => {
            expect(secondsToMinutes(60)).toBe(1);
            expect(secondsToMinutes(90)).toBe(1);
            expect(secondsToMinutes(120)).toBe(2);
            expect(secondsToMinutes(0)).toBe(0);
        });
    });

    describe("formatTime", () => {
        it("should format seconds as MM:SS", () => {
            expect(formatTime(0)).toBe("00:00");
            expect(formatTime(59)).toBe("00:59");
            expect(formatTime(60)).toBe("01:00");
            expect(formatTime(90)).toBe("01:30");
            expect(formatTime(1500)).toBe("25:00");
            expect(formatTime(3661)).toBe("61:01");
        });

        it("should pad single digits with zeros", () => {
            expect(formatTime(5)).toBe("00:05");
            expect(formatTime(65)).toBe("01:05");
        });
    });

    describe("formatTimeHuman", () => {
        it("should format time as human readable", () => {
            expect(formatTimeHuman(30)).toBe("30s");
            expect(formatTimeHuman(60)).toBe("1m");
            expect(formatTimeHuman(90)).toBe("1m 30s");
            expect(formatTimeHuman(1500)).toBe("25m");
        });
    });

    describe("getSessionDuration", () => {
        it("should return correct duration for each session type", () => {
            expect(getSessionDuration("pomodoro", DEFAULT_SETTINGS)).toBe(25 * 60);
            expect(getSessionDuration("shortBreak", DEFAULT_SETTINGS)).toBe(5 * 60);
            expect(getSessionDuration("longBreak", DEFAULT_SETTINGS)).toBe(15 * 60);
        });

        it("should use custom settings", () => {
            const customSettings = {
                ...DEFAULT_SETTINGS,
                pomodoroDuration: 30,
                shortBreakDuration: 10,
                longBreakDuration: 20,
            };
            expect(getSessionDuration("pomodoro", customSettings)).toBe(30 * 60);
            expect(getSessionDuration("shortBreak", customSettings)).toBe(10 * 60);
            expect(getSessionDuration("longBreak", customSettings)).toBe(20 * 60);
        });
    });

    describe("calculateProgress", () => {
        it("should calculate correct progress percentage", () => {
            expect(calculateProgress(1500, 1500)).toBe(0);
            expect(calculateProgress(750, 1500)).toBe(50);
            expect(calculateProgress(0, 1500)).toBe(100);
        });

        it("should handle zero total time", () => {
            expect(calculateProgress(0, 0)).toBe(0);
        });
    });

    describe("getNextSessionType", () => {
        it("should return shortBreak after pomodoro (not at long break threshold)", () => {
            expect(getNextSessionType("pomodoro", 0, 4)).toBe("shortBreak");
            expect(getNextSessionType("pomodoro", 1, 4)).toBe("shortBreak");
            expect(getNextSessionType("pomodoro", 2, 4)).toBe("shortBreak");
        });

        it("should return longBreak after pomodoro at threshold", () => {
            expect(getNextSessionType("pomodoro", 3, 4)).toBe("longBreak");
            expect(getNextSessionType("pomodoro", 7, 4)).toBe("longBreak");
        });

        it("should return pomodoro after any break", () => {
            expect(getNextSessionType("shortBreak", 1, 4)).toBe("pomodoro");
            expect(getNextSessionType("longBreak", 4, 4)).toBe("pomodoro");
        });
    });

    describe("clampValue", () => {
        it("should clamp values within range", () => {
            expect(clampValue(5, 1, 10)).toBe(5);
            expect(clampValue(0, 1, 10)).toBe(1);
            expect(clampValue(15, 1, 10)).toBe(10);
        });

        it("should handle edge cases", () => {
            expect(clampValue(1, 1, 10)).toBe(1);
            expect(clampValue(10, 1, 10)).toBe(10);
        });
    });
});
