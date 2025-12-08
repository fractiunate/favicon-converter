"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
    Plus,
    Trash2,
    AlertTriangle,
    Lightbulb,
    Copy,
    Check,
    Network,
    Info,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useToolWorkspace } from "@/lib/workspace";
import {
    type CIDRRange,
    type SuggestedRange,
    validateUniversalCIDR,
    validateCIDRAlignment,
    calculateUniversalCIDRRange,
    findAllOverlaps,
    suggestRanges,
    normalizeUniversalCIDR,
    normalizeUniversalCIDRInput,
    isIPv6,
} from "@/services/cidr";

/** Workspace data structure for CIDR Calculator */
interface CIDRWorkspaceData {
    ranges: CIDRRange[];
    expandedRanges: string[];
}

/**
 * Format large host counts for display
 */
function formatHostCount(count: string): string {
    if (count.length <= 12) {
        const num = Number(count);
        if (!isNaN(num)) {
            return num.toLocaleString();
        }
    }

    const len = count.length;
    const firstDigits = count.slice(0, 3);
    const decimal = `${firstDigits[0]}.${firstDigits.slice(1)}`;
    const exponent = len - 1;

    const superscriptMap: Record<string, string> = {
        "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
        "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    };
    const superscript = exponent.toString().split("").map((d) => superscriptMap[d]).join("");

    return `${decimal}×10${superscript}`;
}

/**
 * Truncate long IPv6 addresses for display with tooltip
 */
function TruncatedAddress({ value, maxLength = 20 }: { value: string; maxLength?: number }) {
    const needsTruncation = value.length > maxLength;
    const displayValue = needsTruncation
        ? `${value.slice(0, maxLength - 3)}...`
        : value;

    if (!needsTruncation) {
        return <span className="font-mono text-sm">{value}</span>;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="font-mono text-sm cursor-help border-b border-dotted border-zinc-400">
                        {displayValue}
                    </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                    <code className="text-xs break-all">{value}</code>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export function CIDRCalculator() {
    const [cidrInput, setCidrInput] = useState("");
    const [ranges, setRanges] = useState<CIDRRange[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [expandedRanges, setExpandedRanges] = useState<Set<string>>(new Set());

    // Workspace integration
    const { isActive, isLoaded, data: workspaceData, workspaceId, save } = useToolWorkspace<CIDRWorkspaceData>("cidr-calculator");
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
            setRanges(workspaceData.ranges || []);
            setExpandedRanges(new Set(workspaceData.expandedRanges || []));
        } else {
            // Reset to defaults (no workspace or empty workspace)
            setRanges([]);
            setExpandedRanges(new Set());
        }

        // Allow saves after state updates settle
        requestAnimationFrame(() => {
            isLoadingFromWorkspace.current = false;
        });
    }, [isLoaded, workspaceId, workspaceData]);

    // Save to workspace when data changes (only if workspace is active)
    useEffect(() => {
        if (!isActive || !isLoaded) return;
        // Don't save during initial load or workspace load
        if (previousWorkspaceId.current === undefined || isLoadingFromWorkspace.current) return;

        saveRef.current({
            ranges,
            expandedRanges: Array.from(expandedRanges),
        });
    }, [ranges, expandedRanges, isActive, isLoaded]);

    const overlaps = useMemo(() => findAllOverlaps(ranges), [ranges]);
    const suggestions = useMemo(() => suggestRanges(ranges, true), [ranges]);

    const overlappingRangeIds = useMemo(() => {
        const ids = new Set<string>();
        for (const overlap of overlaps) {
            ids.add(overlap.range1Id);
            ids.add(overlap.range2Id);
        }
        return ids;
    }, [overlaps]);

    const handleAddRange = useCallback(() => {
        setError(null);

        if (!cidrInput.trim()) {
            setError("Please enter a CIDR range");
            return;
        }

        const normalizedInput = normalizeUniversalCIDRInput(cidrInput);
        const validation = validateUniversalCIDR(normalizedInput);
        if (!validation.valid) {
            setError(validation.error || "Invalid CIDR format");
            return;
        }

        const ipPart = normalizedInput.split("/")[0];
        if (!isIPv6(ipPart)) {
            const alignmentCheck = validateCIDRAlignment(normalizedInput);
            if (!alignmentCheck.valid) {
                setError(alignmentCheck.error || "CIDR not aligned");
                return;
            }
        }

        const normalized = normalizeUniversalCIDR(normalizedInput);
        const isDuplicate = ranges.some((r) => r.cidr === normalized);
        if (isDuplicate) {
            setError("This CIDR range is already added");
            return;
        }

        const newRange = calculateUniversalCIDRRange(normalizedInput);
        setRanges((prev) => [...prev, newRange]);
        setExpandedRanges((prev) => new Set([...prev, newRange.id]));
        setCidrInput("");
        toast.success(`Added ${newRange.cidr}`);
    }, [cidrInput, ranges]);

    const handleRemoveRange = useCallback((id: string) => {
        setRanges((prev) => prev.filter((r) => r.id !== id));
        setExpandedRanges((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const handleAddSuggestion = useCallback((suggestion: SuggestedRange) => {
        const newRange = calculateUniversalCIDRRange(suggestion.cidr);
        setRanges((prev) => [...prev, newRange]);
        setExpandedRanges((prev) => new Set([...prev, newRange.id]));
        toast.success(`Added ${suggestion.cidr}`);
    }, []);

    const handleCopy = useCallback(async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            toast.success("Copied to clipboard");
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                handleAddRange();
            }
        },
        [handleAddRange]
    );

    const toggleExpanded = useCallback((id: string) => {
        setExpandedRanges((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        setExpandedRanges(new Set(ranges.map((r) => r.id)));
    }, [ranges]);

    const collapseAll = useCallback(() => {
        setExpandedRanges(new Set());
    }, []);

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 space-y-2">
                            <div className="relative">
                                <Network className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                <Input
                                    placeholder="Enter CIDR (e.g., 192.168.1.0/24 or 2001:db8::/32)"
                                    value={cidrInput}
                                    onChange={(e) => {
                                        setCidrInput(e.target.value);
                                        setError(null);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    className={cn(
                                        "pl-10 font-mono",
                                        error && "border-red-500 focus-visible:ring-red-500"
                                    )}
                                />
                            </div>
                            {error ? (
                                <p className="text-sm text-red-500 flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                    {error}
                                </p>
                            ) : (
                                <p className="text-xs text-zinc-500">
                                    IPv4: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">10.0.0.0/8</code>
                                    {" • "}
                                    IPv6: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">2001:db8::/32</code>
                                    {" • "}
                                    Single IP auto-converts to /32 or /128
                                </p>
                            )}
                        </div>
                        <Button onClick={handleAddRange} className="sm:self-start">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Range
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Overlaps Warning */}
            {overlaps.length > 0 && (
                <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            <span className="font-medium text-amber-700 dark:text-amber-300">
                                {overlaps.length} Overlap{overlaps.length > 1 ? "s" : ""} Detected
                            </span>
                        </div>
                        <div className="space-y-2">
                            {overlaps.map((overlap, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-wrap items-center gap-2 text-sm bg-white/50 dark:bg-zinc-900/50 rounded-lg px-3 py-2"
                                >
                                    <code className="font-mono text-amber-800 dark:text-amber-300 break-all">
                                        {overlap.range1Cidr}
                                    </code>
                                    <Badge variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900/50 border-amber-300 flex-shrink-0">
                                        {overlap.overlapType === "contains" && "contains"}
                                        {overlap.overlapType === "contained" && "contained by"}
                                        {overlap.overlapType === "partial" && "overlaps"}
                                    </Badge>
                                    <code className="font-mono text-amber-800 dark:text-amber-300 break-all">
                                        {overlap.range2Cidr}
                                    </code>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Ranges List */}
            {ranges.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            Ranges
                            <Badge variant="secondary" className="ml-2">
                                {ranges.length}
                            </Badge>
                        </h3>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={expandAll}>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Expand All
                            </Button>
                            <Button variant="ghost" size="sm" onClick={collapseAll}>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Collapse All
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-3">
                        {ranges.map((range) => (
                            <RangeCard
                                key={range.id}
                                range={range}
                                hasOverlap={overlappingRangeIds.has(range.id)}
                                isExpanded={expandedRanges.has(range.id)}
                                copiedId={copiedId}
                                onToggleExpand={() => toggleExpanded(range.id)}
                                onRemove={handleRemoveRange}
                                onCopy={handleCopy}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Suggestions */}
            {ranges.length > 0 && suggestions.length > 0 && (
                <Card className="border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-medium text-emerald-700 dark:text-emerald-300">
                                Suggested Available Ranges
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAddSuggestion(suggestion)}
                                    className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
                                >
                                    <code className="font-mono text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                        {suggestion.cidr}
                                    </code>
                                    <span className="text-xs text-zinc-500">
                                        {suggestion.usableHosts.toLocaleString()} hosts
                                    </span>
                                    <Plus className="h-3.5 w-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {ranges.length === 0 && (
                <div className="text-center py-16 text-zinc-500">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                        <Network className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="font-medium">No CIDR ranges added</p>
                    <p className="text-sm mt-1">Enter a range above to calculate subnet details</p>
                    <p className="text-xs mt-2 text-zinc-400">Supports both IPv4 and IPv6</p>
                </div>
            )}
        </div>
    );
}

interface RangeCardProps {
    range: CIDRRange;
    hasOverlap: boolean;
    isExpanded: boolean;
    copiedId: string | null;
    onToggleExpand: () => void;
    onRemove: (id: string) => void;
    onCopy: (text: string, id: string) => void;
}

function RangeCard({
    range,
    hasOverlap,
    isExpanded,
    copiedId,
    onToggleExpand,
    onRemove,
    onCopy,
}: RangeCardProps) {
    const isIPv6Range = range.ipVersion === 6;

    return (
        <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
            <Card
                className={cn(
                    "transition-all overflow-hidden gap-0",
                    hasOverlap && "ring-2 ring-amber-500/50 border-amber-500/50"
                )}
            >
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors py-3 pb-0">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <code className="font-mono text-base font-semibold truncate">
                                    {range.cidr}
                                </code>
                                <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-xs",
                                            isIPv6Range
                                                ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                                                : "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                                        )}
                                    >
                                        IPv{range.ipVersion}
                                    </Badge>
                                    {range.isPrivate && (
                                        <Badge variant="secondary" className="text-xs">
                                            Private
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                        {isIPv6Range ? range.ipClass : `Class ${range.ipClass}`}
                                    </Badge>
                                    {hasOverlap && (
                                        <Badge variant="destructive" className="text-xs">
                                            Overlap
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onCopy(range.cidr, range.id);
                                                }}
                                            >
                                                {copiedId === range.id ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Copy CIDR</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemove(range.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Remove</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-1">
                                    {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        {/* Mobile badges */}
                        <div className="flex sm:hidden items-center gap-1.5 mt-2 flex-wrap">
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-xs",
                                    isIPv6Range
                                        ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700"
                                        : "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700"
                                )}
                            >
                                IPv{range.ipVersion}
                            </Badge>
                            {range.isPrivate && (
                                <Badge variant="secondary" className="text-xs">
                                    Private
                                </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                                {isIPv6Range ? range.ipClass : `Class ${range.ipClass}`}
                            </Badge>
                            {hasOverlap && (
                                <Badge variant="destructive" className="text-xs">
                                    Overlap
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                        <div className="pt-2">
                            {/* Address & Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                                <RowItem
                                    label="Network Address"
                                    value={range.networkAddress}
                                />
                                <RowItem
                                    label={isIPv6Range ? "Last Address" : "Broadcast Address"}
                                    value={range.broadcastAddress}
                                />
                                <RowItem
                                    label="First Usable"
                                    value={range.firstUsable}
                                />
                                <RowItem
                                    label="Last Usable"
                                    value={range.lastUsable}
                                />
                                <RowItem
                                    label="Subnet Mask"
                                    value={range.subnetMask}
                                />
                                <RowItem
                                    label="Wildcard Mask"
                                    value={range.wildcardMask}
                                />
                                <RowItem
                                    label="Total Hosts"
                                    value={formatHostCount(range.totalHosts)}
                                    highlight
                                />
                                <RowItem
                                    label="Usable Hosts"
                                    value={formatHostCount(range.usableHosts)}
                                    highlight
                                />
                            </div>

                            {/* Divider */}
                            <div className="border-t border-zinc-200 dark:border-zinc-700 mt-4 pt-3">
                                {/* Binary */}
                                <div className="flex items-start gap-2 text-xs overflow-hidden">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3.5 w-3.5 text-zinc-400 mt-0.5 flex-shrink-0 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Binary representation of network address
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <span className="text-zinc-500 flex-shrink-0">Binary:</span>
                                    <code className="font-mono text-zinc-600 dark:text-zinc-400 break-all leading-relaxed overflow-hidden">
                                        {range.binaryNetwork}
                                    </code>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

function RowItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="overflow-hidden pr-2">
            <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
            <code className={cn(
                "font-mono text-sm block overflow-hidden break-all",
                highlight ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300"
            )}>
                {value}
            </code>
        </div>
    );
}
