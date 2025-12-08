"use client";

import { ListTodo, Sparkles } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { TodoList } from "@/components/todo-list";
import { Card, CardContent } from "@/components/ui/card";
import { useZenMode } from "@/lib/zen-mode";

export default function TodoListPage() {
    const { zenMode } = useZenMode();

    return (
        <PageLayout toolId="todo-list">
            {/* Main content */}
            <main className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 ${zenMode ? "py-6 sm:py-8" : "py-12 sm:py-16"}`}>
                {/* Hero section */}
                {!zenMode && (
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
                            <ListTodo className="h-4 w-4" />
                            Task Management
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
                            Todo
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-600">
                                {" "}
                                List
                            </span>
                        </h1>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            Keep track of your tasks with priorities and filters. Simple, fast,
                            and completely client-side.
                        </p>
                    </div>
                )}

                {/* Main Component */}
                <TodoList />

                {/* Features section */}
                {!zenMode && (
                    <div className="mt-16">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="h-5 w-5 text-blue-500" />
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                                Features
                            </h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                                        📝 Quick Add
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Add tasks instantly with Enter key. Set priorities for better organization.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                                        🎯 Priorities
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        High, medium, and low priorities. Tasks auto-sort by importance.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                                        🔍 Filters
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Filter by status and priority. Focus on what matters most.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                                        📊 Progress
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Track completion rate with visual stats. See your productivity.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                                        💾 Auto-Save
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Tasks persist in your browser. Never lose your progress.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                                        🔒 Private
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        100% client-side. Your tasks never leave your device.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </main>
        </PageLayout>
    );
}
