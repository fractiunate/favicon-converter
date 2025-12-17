import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Todo List",
    description:
        "A simple and effective todo list to manage your tasks. Add, organize, and track tasks with priorities. 100% client-side.",
    openGraph: {
        title: "Todo List | Client-Side Tools",
        description:
            "Manage your tasks with a simple todo list. Add priorities, filter tasks, and track your progress. 100% client-side.",
        url: "https://fractiunate.me/client-tools/todo-list",
    },
    twitter: {
        title: "Todo List | Client-Side Tools",
        description:
            "Manage your tasks with a simple todo list. Add priorities, filter tasks, and track your progress.",
    },
};

export default function TodoListLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
