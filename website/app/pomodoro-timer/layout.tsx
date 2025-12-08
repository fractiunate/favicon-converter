import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pomodoro Timer",
    description:
        "A productivity timer using the Pomodoro Technique. Customizable focus sessions, short breaks, and long breaks with audio notifications.",
    openGraph: {
        title: "Pomodoro Timer | Client-Side Tools",
        description:
            "Boost your productivity with the Pomodoro Technique. Customizable timers for focus sessions and breaks. 100% client-side.",
        url: "https://fractiunate.me/client-tools/pomodoro-timer",
    },
    twitter: {
        title: "Pomodoro Timer | Client-Side Tools",
        description:
            "Boost your productivity with the Pomodoro Technique. Customizable timers for focus sessions and breaks.",
    },
};

export default function PomodoroTimerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
