"use client";

import { useState, useCallback, useMemo } from "react";
import {
    Plus,
    Trash2,
    AlertTriangle,
    Lightbulb,
    Copy,
    Check,
    Network,
    Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
    type CIDRRange,
    type CIDROverlap,
    type SuggestedRange,
    validateCIDR,
    validateCIDRAlignment,
    calculateCIDRRange,
    findAllOverlaps,
    suggestRanges,
    normalizeCIDR,
    normalizeCIDRInput,
} from "@/services/cidr";

export function CIDRCalculator() {
    const [cidrInput, setCidrInput] = useState("");
    const [ranges, setRanges] = useState<CIDRRange[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Calculate overlaps whenever ranges change
    const overlaps = useMemo(() => findAllOverlaps(ranges), [ranges]);

    // Get suggested ranges
    const suggestions = useMemo(() => suggestRanges(ranges, true), [ranges]);

    // Get IDs of ranges that have overlaps
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

        // Normalize input (add /32 if no prefix given)
        const normalizedInput = normalizeCIDRInput(cidrInput);

        // Validate CIDR format
        const validation = validateCIDR(normalizedInput);
        if (!validation.valid) {
            setError(validation.error || "Invalid CIDR format");
            return;
        }

        // Check alignment
        const alignmentCheck = validateCIDRAlignment(normalizedInput);
        if (!alignmentCheck.valid) {
            setError(alignmentCheck.error || "CIDR not aligned");
            return;
        }

        // Normalize and check for duplicates
        const normalized = normalizeCIDR(normalizedInput);
        const isDuplicate = ranges.some((r) => r.cidr === normalized);
        if (isDuplicate) {
            setError("This CIDR range is already added");
            return;
        }

        // Calculate and add the range
        const newRange = calculateCIDRRange(normalizedInput);
        setRanges((prev) => [...prev, newRange]);
        setCidrInput("");
        toast.success(`Added ${newRange.cidr}`);
    }, [cidrInput, ranges]);

    const handleRemoveRange = useCallback((id: string) => {
        setRanges((prev) => prev.filter((r) => r.id !== id));
    }, []);

    const handleAddSuggestion = useCallback((suggestion: SuggestedRange) => {
        const newRange = calculateCIDRRange(suggestion.cidr);
        setRanges((prev) => [...prev, newRange]);
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

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Network className="h-5 w-5" />
                        Add CIDR Range
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                placeholder="e.g., 192.168.1.0/24"
                                value={cidrInput}
                                onChange={(e) => setCidrInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className={error ? "border-red-500" : ""}
                            />
                        </div>
                        <Button onClick={handleAddRange}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                        </Button>
                    </div>
                    {error && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            {error}
                        </p>
                    )}
                    <p className="text-xs text-zinc-500">
                        Enter a CIDR notation like 10.0.0.0/8, 172.16.0.0/12, or 192.168.1.0/24
                    </p>
                </CardContent>
            </Card>

            {/* Overlaps Warning */}
            {overlaps.length > 0 && (
                <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-5 w-5" />
                            Overlapping Ranges Detected
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {overlaps.map((overlap, idx) => (
                                <li
                                    key={idx}
                                    className="text-sm text-amber-700 dark:text-amber-400"
                                >
                                    <strong>{overlap.range1Cidr}</strong>
                                    {overlap.overlapType === "contains" && " contains "}
                                    {overlap.overlapType === "contained" && " is contained by "}
                                    {overlap.overlapType === "partial" && " partially overlaps with "}
                                    <strong>{overlap.range2Cidr}</strong>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Ranges List */}
            {ranges.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Added Ranges ({ranges.length})
                    </h3>
                    <div className="grid gap-4">
                        {ranges.map((range) => (
                            <RangeCard
                                key={range.id}
                                range={range}
                                hasOverlap={overlappingRangeIds.has(range.id)}
                                copiedId={copiedId}
                                onRemove={handleRemoveRange}
                                onCopy={handleCopy}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Suggestions */}
            {ranges.length > 0 && suggestions.length > 0 && (
                <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                            <Lightbulb className="h-5 w-5" />
                            Suggested Non-Overlapping Ranges
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {suggestions.map((suggestion, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-900 border border-green-200 dark:border-green-800"
                                >
                                    <div>
                                        <p className="font-mono text-sm font-medium">
                                            {suggestion.cidr}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {suggestion.usableHosts.toLocaleString()} usable hosts
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAddSuggestion(suggestion)}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {ranges.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                    <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No CIDR ranges added yet.</p>
                    <p className="text-sm">Add a range above to get started.</p>
                </div>
            )}
        </div>
    );
}

interface RangeCardProps {
    range: CIDRRange;
    hasOverlap: boolean;
    copiedId: string | null;
    onRemove: (id: string) => void;
    onCopy: (text: string, id: string) => void;
}

function RangeCard({ range, hasOverlap, copiedId, onRemove, onCopy }: RangeCardProps) {
    return (
        <Card
            className={`border-zinc-200 dark:border-zinc-800 ${hasOverlap ? "ring-2 ring-amber-500" : ""
                }`}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h4 className="font-mono text-lg font-semibold">{range.cidr}</h4>
                        {range.isPrivate && (
                            <Badge variant="secondary" className="text-xs">
                                Private
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                            Class {range.ipClass}
                        </Badge>
                        {hasOverlap && (
                            <Badge variant="destructive" className="text-xs">
                                Overlapping
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onCopy(range.cidr, range.id)}
                                    >
                                        {copiedId === range.id ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Copy CIDR</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRemove(range.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Remove range</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                    <InfoItem label="Network Address" value={range.networkAddress} />
                    <InfoItem label="Broadcast Address" value={range.broadcastAddress} />
                    <InfoItem label="First Usable" value={range.firstUsable} />
                    <InfoItem label="Last Usable" value={range.lastUsable} />
                    <InfoItem label="Subnet Mask" value={range.subnetMask} />
                    <InfoItem label="Wildcard Mask" value={range.wildcardMask} />
                    <InfoItem
                        label="Total Hosts"
                        value={range.totalHosts.toLocaleString()}
                    />
                    <InfoItem
                        label="Usable Hosts"
                        value={range.usableHosts.toLocaleString()}
                    />
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-zinc-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Binary representation of network address</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <span className="text-xs text-zinc-500">Binary:</span>
                        <code className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                            {range.binaryNetwork}
                        </code>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="font-mono text-zinc-900 dark:text-zinc-100">{value}</p>
        </div>
    );
}
