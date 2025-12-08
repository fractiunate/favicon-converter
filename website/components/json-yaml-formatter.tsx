"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
    ArrowRightLeft,
    Copy,
    Check,
    Download,
    Trash2,
    Wand2,
    Minimize2,
    FileJson,
    FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { useToolWorkspace } from "@/lib/workspace";
import {
    type FormatType,
    type IndentSize,
    INDENT_OPTIONS,
    SAMPLE_JSON,
    SAMPLE_YAML,
    formatJson,
    formatYaml,
    jsonToYaml,
    yamlToJson,
    minifyJson,
    detectFormat,
} from "@/services/json-yaml";

/** Workspace data structure for JSON/YAML Formatter */
interface JsonYamlWorkspaceData {
    input: string;
    inputFormat: FormatType;
    indent: IndentSize;
    sortKeys: boolean;
    autoDetect: boolean;
}

export function JsonYamlFormatter() {
    const [inputFormat, setInputFormat] = useState<FormatType>("json");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [indent, setIndent] = useState<IndentSize>(2);
    const [sortKeys, setSortKeys] = useState(false);
    const [copied, setCopied] = useState(false);
    const [autoDetect, setAutoDetect] = useState(true);

    // Workspace integration
    const { isActive, isLoaded, data: workspaceData, workspaceId, save } = useToolWorkspace<JsonYamlWorkspaceData>("json-formatter");
    const previousWorkspaceId = useRef<string | null | undefined>(undefined);
    const isLoadingFromWorkspace = useRef(false);
    const saveRef = useRef(save);
    saveRef.current = save;

    // Load/reset data when workspace changes
    useEffect(() => {
        if (!isLoaded) return;

        // Skip if workspace hasn't actually changed
        if (previousWorkspaceId.current === workspaceId) return;
        previousWorkspaceId.current = workspaceId;
        isLoadingFromWorkspace.current = true;

        if (workspaceData) {
            // Load from workspace
            if (workspaceData.input !== undefined) setInput(workspaceData.input);
            if (workspaceData.inputFormat) setInputFormat(workspaceData.inputFormat);
            if (workspaceData.indent) setIndent(workspaceData.indent);
            if (workspaceData.sortKeys !== undefined) setSortKeys(workspaceData.sortKeys);
            if (workspaceData.autoDetect !== undefined) setAutoDetect(workspaceData.autoDetect);
        } else {
            // Reset to defaults (no workspace or empty workspace)
            setInput("");
            setInputFormat("json");
            setIndent(2);
            setSortKeys(false);
            setAutoDetect(true);
        }
        setOutput("");
        setError(null);

        // Allow saves after state updates settle
        requestAnimationFrame(() => {
            isLoadingFromWorkspace.current = false;
        });
    }, [isLoaded, workspaceId, workspaceData]);

    // Save to workspace when state changes
    useEffect(() => {
        if (!isActive || !isLoaded) return;
        // Don't save during initial load or workspace load
        if (previousWorkspaceId.current === undefined || isLoadingFromWorkspace.current) return;

        saveRef.current({
            input,
            inputFormat,
            indent,
            sortKeys,
            autoDetect,
        });
    }, [input, inputFormat, indent, sortKeys, autoDetect, isActive, isLoaded]);

    // Auto-detect format when input changes
    useEffect(() => {
        if (autoDetect && input.trim()) {
            const detected = detectFormat(input);
            if (detected && detected !== inputFormat) {
                setInputFormat(detected);
            }
        }
    }, [input, autoDetect, inputFormat]);

    const handleFormat = useCallback(() => {
        if (!input.trim()) {
            setError("Please enter some content to format");
            setOutput("");
            return;
        }

        const options = { indent, sortKeys };
        const result =
            inputFormat === "json"
                ? formatJson(input, options)
                : formatYaml(input, options);

        if (result.success && result.output) {
            setOutput(result.output);
            setError(null);
            toast.success(`${inputFormat.toUpperCase()} formatted successfully`);
        } else {
            setError(result.error || "Failed to format");
            setOutput("");
        }
    }, [input, inputFormat, indent, sortKeys]);

    const handleConvert = useCallback(() => {
        if (!input.trim()) {
            setError("Please enter some content to convert");
            setOutput("");
            return;
        }

        const options = { indent, sortKeys };
        const result =
            inputFormat === "json"
                ? jsonToYaml(input, options)
                : yamlToJson(input, options);

        if (result.success && result.output) {
            setOutput(result.output);
            setError(null);
            const targetFormat = inputFormat === "json" ? "YAML" : "JSON";
            toast.success(`Converted to ${targetFormat} successfully`);
        } else {
            setError(result.error || "Failed to convert");
            setOutput("");
        }
    }, [input, inputFormat, indent, sortKeys]);

    const handleMinify = useCallback(() => {
        if (!input.trim()) {
            setError("Please enter some content to minify");
            setOutput("");
            return;
        }

        if (inputFormat !== "json") {
            // Convert YAML to minified JSON
            const result = yamlToJson(input, { indent: 2, sortKeys: false });
            if (result.success && result.output) {
                const minified = minifyJson(result.output);
                if (minified.success && minified.output) {
                    setOutput(minified.output);
                    setError(null);
                    toast.success("Minified to JSON successfully");
                    return;
                }
            }
            setError(result.error || "Failed to minify");
            setOutput("");
            return;
        }

        const result = minifyJson(input);
        if (result.success && result.output) {
            setOutput(result.output);
            setError(null);
            toast.success("JSON minified successfully");
        } else {
            setError(result.error || "Failed to minify");
            setOutput("");
        }
    }, [input, inputFormat]);

    const handleCopy = useCallback(async () => {
        if (!output) return;

        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            toast.success("Copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy to clipboard");
        }
    }, [output]);

    const handleDownload = useCallback(() => {
        if (!output) return;

        // Determine output format based on content
        const outputFormat = detectFormat(output) || inputFormat;
        const extension = outputFormat === "json" ? "json" : "yaml";
        const mimeType =
            outputFormat === "json" ? "application/json" : "application/x-yaml";

        const blob = new Blob([output], { type: mimeType });
        saveAs(blob, `formatted.${extension}`);
        toast.success(`Downloaded as formatted.${extension}`);
    }, [output, inputFormat]);

    const handleClear = useCallback(() => {
        setInput("");
        setOutput("");
        setError(null);
    }, []);

    const loadSample = useCallback(
        (format: FormatType) => {
            setInputFormat(format);
            setInput(format === "json" ? SAMPLE_JSON : SAMPLE_YAML);
            setOutput("");
            setError(null);
            setAutoDetect(false);
        },
        []
    );

    const swapInputOutput = useCallback(() => {
        if (!output) return;
        setInput(output);
        setOutput("");
        setError(null);
        // Detect format of swapped content
        const detected = detectFormat(output);
        if (detected) {
            setInputFormat(detected);
        }
    }, [output]);

    return (
        <div className="space-y-6">
            {/* Options Bar */}
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <Label htmlFor="indent" className="text-sm whitespace-nowrap">
                        Indent:
                    </Label>
                    <Select
                        value={indent.toString()}
                        onValueChange={(v) => setIndent(parseInt(v) as IndentSize)}
                    >
                        <SelectTrigger id="indent" className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {INDENT_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value.toString()}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Switch
                        id="sortKeys"
                        checked={sortKeys}
                        onCheckedChange={setSortKeys}
                    />
                    <Label htmlFor="sortKeys" className="text-sm cursor-pointer">
                        Sort Keys
                    </Label>
                </div>

                <div className="flex items-center gap-2">
                    <Switch
                        id="autoDetect"
                        checked={autoDetect}
                        onCheckedChange={setAutoDetect}
                    />
                    <Label htmlFor="autoDetect" className="text-sm cursor-pointer">
                        Auto-detect Format
                    </Label>
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadSample("json")}
                    >
                        <FileJson className="h-4 w-4 mr-1" />
                        Sample JSON
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadSample("yaml")}
                    >
                        <FileCode className="h-4 w-4 mr-1" />
                        Sample YAML
                    </Button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Input Panel */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Tabs
                            value={inputFormat}
                            onValueChange={(v) => {
                                if (!autoDetect) {
                                    setInputFormat(v as FormatType);
                                }
                            }}
                        >
                            <TabsList>
                                <TabsTrigger
                                    value="json"
                                    disabled={autoDetect}
                                    className={autoDetect ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                    JSON
                                </TabsTrigger>
                                <TabsTrigger
                                    value="yaml"
                                    disabled={autoDetect}
                                    className={autoDetect ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                    YAML
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            disabled={!input}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Paste your ${inputFormat.toUpperCase()} here...`}
                        className="w-full h-96 p-4 font-mono text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                        spellCheck={false}
                    />
                </div>

                {/* Output Panel */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Output
                        </span>
                        <div className="flex items-center gap-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={swapInputOutput}
                                            disabled={!output}
                                        >
                                            <ArrowRightLeft className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Use output as input</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCopy}
                                            disabled={!output}
                                        >
                                            {copied ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{copied ? "Copied!" : "Copy to clipboard"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleDownload}
                                            disabled={!output}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Download file</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                    <div className="relative">
                        <textarea
                            value={output}
                            readOnly
                            placeholder="Formatted output will appear here..."
                            className="w-full h-96 p-4 font-mono text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none resize-none"
                            spellCheck={false}
                        />
                        {error && (
                            <div className="absolute inset-x-4 bottom-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                    onClick={handleFormat}
                    disabled={!input.trim()}
                    className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Format{" "}
                    {autoDetect && !input.trim() ? "..." : inputFormat.toUpperCase()}
                </Button>
                <Button onClick={handleConvert} variant="outline" disabled={!input.trim()}>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Convert to{" "}
                    {autoDetect && !input.trim()
                        ? "..."
                        : inputFormat === "json"
                            ? "YAML"
                            : "JSON"}
                </Button>
                <Button onClick={handleMinify} variant="outline" disabled={!input.trim()}>
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Minify
                </Button>
            </div>
        </div>
    );
}
