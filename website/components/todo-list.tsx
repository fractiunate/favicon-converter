"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Plus,
    Trash2,
    Check,
    Circle,
    ListTodo,
    Filter,
    MoreVertical,
    Flag,
    Clock,
    Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToolWorkspace } from "@/lib/workspace";
import {
    type TodoItem,
    type TodoPriority,
    type TodoFilter,
    type TodoWorkspaceData,
    DEFAULT_FILTER,
    PRIORITY_CONFIG,
    STORAGE_KEY,
    MAX_TODO_LENGTH,
    MAX_TODOS,
    createTodoItem,
    filterTodos,
    sortTodos,
    calculateStats,
    formatRelativeTime,
} from "@/services/todo";

export function TodoList() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isActive, isLoaded: workspaceLoaded, data: workspaceData, workspaceId, save: saveToWorkspace } = useToolWorkspace<TodoWorkspaceData>("todo-list");

    // State
    const [items, setItems] = useState<TodoItem[]>([]);
    const [filter, setFilter] = useState<TodoFilter>(DEFAULT_FILTER);
    const [newTodoText, setNewTodoText] = useState("");
    const [newTodoPriority, setNewTodoPriority] = useState<TodoPriority>("medium");
    const [isLoaded, setIsLoaded] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");

    // Load from localStorage or workspace (re-run when workspace changes)
    useEffect(() => {
        if (!workspaceLoaded) return;

        if (isActive && workspaceData) {
            // Load from workspace if available
            setItems(workspaceData.items || []);
            setFilter(workspaceData.filter || DEFAULT_FILTER);
        } else if (!isActive) {
            // Fallback to localStorage when no workspace is active
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const data = JSON.parse(stored) as TodoWorkspaceData;
                    setItems(data.items || []);
                    setFilter(data.filter || DEFAULT_FILTER);
                } else {
                    // No data, start fresh
                    setItems([]);
                    setFilter(DEFAULT_FILTER);
                }
            } catch {
                // Invalid data, start fresh
                setItems([]);
                setFilter(DEFAULT_FILTER);
            }
        } else {
            // Workspace is active but no data yet - start fresh for this workspace
            setItems([]);
            setFilter(DEFAULT_FILTER);
        }
        setIsLoaded(true);
    }, [workspaceLoaded, workspaceId]); // Use workspaceId to detect workspace switches

    // Listen for todo updates from widget (same-page sync)
    useEffect(() => {
        const handleTodoUpdated = (e: CustomEvent<{ items: TodoItem[] }>) => {
            // Only update if the event wasn't triggered by us
            setItems(e.detail.items);
        };

        window.addEventListener("todo-updated", handleTodoUpdated as EventListener);
        return () => window.removeEventListener("todo-updated", handleTodoUpdated as EventListener);
    }, []);

    // Handle edit query param from widget
    useEffect(() => {
        const editId = searchParams.get("edit");
        if (editId && isLoaded) {
            const todo = items.find(item => item.id === editId);
            if (todo) {
                setEditingId(editId);
                setEditText(todo.text);
                // Clear the query param
                router.replace("/todo-list", { scroll: false });
            }
        }
    }, [searchParams, isLoaded, items, router]);

    // Save to localStorage and workspace
    const saveData = useCallback(
        (newItems: TodoItem[], newFilter: TodoFilter) => {
            const data: TodoWorkspaceData = { items: newItems, filter: newFilter };

            // Save to workspace if active, otherwise localStorage
            if (isActive) {
                saveToWorkspace(data);
            } else {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                } catch {
                    // Storage full or unavailable
                }
            }

            // Dispatch custom event for same-page sync (widget)
            window.dispatchEvent(new CustomEvent("todo-updated", { detail: { items: newItems } }));
        },
        [isActive, saveToWorkspace]
    );

    // Add a new todo
    const addTodo = useCallback(() => {
        const text = newTodoText.trim();
        if (!text || items.length >= MAX_TODOS) return;

        const newItem = createTodoItem(text, newTodoPriority);
        const newItems = [newItem, ...items];

        setItems(newItems);
        setNewTodoText("");
        saveData(newItems, filter);
    }, [newTodoText, newTodoPriority, items, filter, saveData]);

    // Toggle todo completion
    const toggleTodo = useCallback(
        (id: string) => {
            const newItems = items.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        completed: !item.completed,
                        completedAt: !item.completed ? Date.now() : undefined,
                    }
                    : item
            );
            setItems(newItems);
            saveData(newItems, filter);
        },
        [items, filter, saveData]
    );

    // Delete a todo
    const deleteTodo = useCallback(
        (id: string) => {
            const newItems = items.filter((item) => item.id !== id);
            setItems(newItems);
            saveData(newItems, filter);
        },
        [items, filter, saveData]
    );

    // Update todo priority
    const updatePriority = useCallback(
        (id: string, priority: TodoPriority) => {
            const newItems = items.map((item) =>
                item.id === id ? { ...item, priority } : item
            );
            setItems(newItems);
            saveData(newItems, filter);
        },
        [items, filter, saveData]
    );

    // Clear completed todos
    const clearCompleted = useCallback(() => {
        const newItems = items.filter((item) => !item.completed);
        setItems(newItems);
        saveData(newItems, filter);
    }, [items, filter, saveData]);

    // Update todo text
    const updateTodoText = useCallback(
        (id: string, newText: string) => {
            const trimmedText = newText.trim();
            if (!trimmedText) return;

            const newItems = items.map((item) =>
                item.id === id ? { ...item, text: trimmedText } : item
            );
            setItems(newItems);
            saveData(newItems, filter);
            setEditingId(null);
            setEditText("");
        },
        [items, filter, saveData]
    );

    // Start editing a todo
    const startEditing = useCallback((id: string) => {
        const todo = items.find(item => item.id === id);
        if (todo) {
            setEditingId(id);
            setEditText(todo.text);
        }
    }, [items]);

    // Cancel editing
    const cancelEditing = useCallback(() => {
        setEditingId(null);
        setEditText("");
    }, []);

    // Update filter
    const updateFilter = useCallback(
        (newFilter: Partial<TodoFilter>) => {
            const updatedFilter = { ...filter, ...newFilter };
            setFilter(updatedFilter);
            saveData(items, updatedFilter);
        },
        [filter, items, saveData]
    );

    // Handle keyboard submit
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            addTodo();
        }
    };

    // Computed values
    const stats = calculateStats(items);
    const filteredItems = sortTodos(filterTodos(items, filter));

    if (!isLoaded) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-zinc-500">
                    Loading...
                </CardContent>
            </Card>
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Add Todo Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Add Task
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input
                                placeholder="What needs to be done?"
                                value={newTodoText}
                                onChange={(e) =>
                                    setNewTodoText(e.target.value.slice(0, MAX_TODO_LENGTH))
                                }
                                onKeyDown={handleKeyDown}
                                className="flex-1"
                            />
                            <Select
                                value={newTodoPriority}
                                onValueChange={(v) => setNewTodoPriority(v as TodoPriority)}
                            >
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="high">
                                        <span className="flex items-center gap-2">
                                            <Flag className="h-3 w-3 text-red-500" />
                                            High
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="medium">
                                        <span className="flex items-center gap-2">
                                            <Flag className="h-3 w-3 text-yellow-500" />
                                            Medium
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="low">
                                        <span className="flex items-center gap-2">
                                            <Flag className="h-3 w-3 text-green-500" />
                                            Low
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={addTodo}
                                disabled={!newTodoText.trim() || items.length >= MAX_TODOS}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {items.length >= MAX_TODOS && (
                            <p className="text-xs text-red-500 mt-2">
                                Maximum of {MAX_TODOS} todos reached. Delete some to add more.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Todo List Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <ListTodo className="h-5 w-5" />
                                Tasks
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={filter.status}
                                    onValueChange={(v) =>
                                        updateFilter({ status: v as TodoFilter["status"] })
                                    }
                                >
                                    <SelectTrigger className="w-28 h-8 text-xs">
                                        <Filter className="h-3 w-3 mr-1" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Done</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={filter.priority}
                                    onValueChange={(v) =>
                                        updateFilter({ priority: v as TodoFilter["priority"] })
                                    }
                                >
                                    <SelectTrigger className="w-28 h-8 text-xs">
                                        <Flag className="h-3 w-3 mr-1" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                                {stats.completed > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearCompleted}
                                        className="text-xs h-8"
                                    >
                                        Clear Done
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredItems.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500">
                                {items.length === 0 ? (
                                    <div className="space-y-2">
                                        <ListTodo className="h-12 w-12 mx-auto opacity-30" />
                                        <p>No tasks yet</p>
                                        <p className="text-xs">Add a task above to get started</p>
                                    </div>
                                ) : (
                                    <p>No tasks match the current filter</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredItems.map((item) => (
                                    <TodoItemRow
                                        key={item.id}
                                        item={item}
                                        isEditing={editingId === item.id}
                                        editText={editText}
                                        onToggle={() => toggleTodo(item.id)}
                                        onDelete={() => deleteTodo(item.id)}
                                        onPriorityChange={(p) => updatePriority(item.id, p)}
                                        onStartEdit={() => startEditing(item.id)}
                                        onEditChange={setEditText}
                                        onEditSave={() => updateTodoText(item.id, editText)}
                                        onEditCancel={cancelEditing}
                                    />
                                ))}
                            </div>
                        )}
                        {/* Stats Footer */}
                        {items.length > 0 && (
                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center gap-4 text-xs text-zinc-500">
                                    <span><strong className="text-zinc-900 dark:text-zinc-100">{stats.active}</strong> active</span>
                                    <span><strong className="text-green-600 dark:text-green-400">{stats.completed}</strong> done</span>
                                    <span><strong className="text-zinc-600 dark:text-zinc-400">{stats.total}</strong> total</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Progress value={stats.completionRate} className="w-16 h-1.5" />
                                    <span className="text-xs text-zinc-500">{stats.completionRate}%</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
}

interface TodoItemRowProps {
    item: TodoItem;
    isEditing: boolean;
    editText: string;
    onToggle: () => void;
    onDelete: () => void;
    onPriorityChange: (priority: TodoPriority) => void;
    onStartEdit: () => void;
    onEditChange: (text: string) => void;
    onEditSave: () => void;
    onEditCancel: () => void;
}

function TodoItemRow({
    item,
    isEditing,
    editText,
    onToggle,
    onDelete,
    onPriorityChange,
    onStartEdit,
    onEditChange,
    onEditSave,
    onEditCancel,
}: TodoItemRowProps) {
    const priorityConfig = PRIORITY_CONFIG[item.priority];
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onEditSave();
        } else if (e.key === "Escape") {
            e.preventDefault();
            onEditCancel();
        }
    };

    return (
        <div
            className={cn(
                "group flex items-center gap-3 p-3 rounded-lg border transition-all",
                item.completed
                    ? "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                    : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            )}
        >
            {/* Checkbox */}
            <button
                onClick={onToggle}
                className={cn(
                    "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    item.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-zinc-300 dark:border-zinc-600 hover:border-green-500 dark:hover:border-green-500"
                )}
            >
                {item.completed && <Check className="h-3 w-3" />}
            </button>

            {/* Text */}
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <Input
                        ref={inputRef}
                        value={editText}
                        onChange={(e) => onEditChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={onEditSave}
                        className="h-7 text-sm"
                        maxLength={MAX_TODO_LENGTH}
                    />
                ) : (
                    <p
                        onClick={!item.completed ? onStartEdit : undefined}
                        className={cn(
                            "text-sm transition-colors",
                            item.completed
                                ? "text-zinc-400 dark:text-zinc-500 line-through"
                                : "text-zinc-900 dark:text-zinc-100 cursor-text hover:text-zinc-600 dark:hover:text-zinc-300"
                        )}
                    >
                        {item.text}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                    <Badge
                        variant="secondary"
                        className={cn("text-xs px-1.5 py-0", priorityConfig.bgColor, priorityConfig.color)}
                    >
                        {priorityConfig.label}
                    </Badge>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(item.createdAt)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            Created {new Date(item.createdAt).toLocaleString()}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isEditing && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={onStartEdit}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onStartEdit}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onPriorityChange("high")}>
                            <Flag className="h-4 w-4 mr-2 text-red-500" />
                            High Priority
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPriorityChange("medium")}>
                            <Flag className="h-4 w-4 mr-2 text-yellow-500" />
                            Medium Priority
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPriorityChange("low")}>
                            <Flag className="h-4 w-4 mr-2 text-green-500" />
                            Low Priority
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={onDelete}
                            className="text-red-600 dark:text-red-400"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
