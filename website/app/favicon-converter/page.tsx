"use client";

import { useState, useEffect, useRef } from "react";
import { FileUpload } from "@/components/file-upload";
import { FormatSelector } from "@/components/format-selector";
import { ConversionResults } from "@/components/conversion-results";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { convertFavicon, ConversionResult, cleanupResults } from "@/lib/api";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useZenMode } from "@/lib/zen-mode";
import { useToolWorkspace } from "@/lib/workspace";

/** Workspace data structure for Favicon Converter */
interface FaviconWorkspaceData {
    selectedFormats: string[];
}

export default function FaviconConverterPage() {
    const [file, setFile] = useState<File | null>(null);
    const [selectedFormats, setSelectedFormats] = useState<string[]>([
        "ico",
        "png-16",
        "png-32",
        "png-180",
        "png-192",
        "png-512",
    ]);
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<ConversionResult[]>([]);

    // Workspace integration
    const { isActive, isLoaded, data: workspaceData, workspaceId, save } = useToolWorkspace<FaviconWorkspaceData>("favicon-converter");
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
            if (workspaceData.selectedFormats) setSelectedFormats(workspaceData.selectedFormats);
        } else {
            // Reset to defaults (no workspace or empty workspace)
            setSelectedFormats([
                "ico",
                "png-16",
                "png-32",
                "png-180",
                "png-192",
                "png-512",
            ]);
        }
        // Reset file and results when workspace changes
        setFile(null);
        setResults([]);
        setProgress(0);

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
            selectedFormats,
        });
    }, [selectedFormats, isActive, isLoaded]);

    // Cleanup blob URLs when component unmounts or results change
    useEffect(() => {
        return () => {
            if (results.length > 0) {
                cleanupResults(results);
            }
        };
    }, [results]);

    const handleConvert = async () => {
        if (!file) {
            toast.error("Please upload an image first");
            return;
        }

        if (selectedFormats.length === 0) {
            toast.error("Please select at least one output format");
            return;
        }

        // Cleanup previous results
        if (results.length > 0) {
            cleanupResults(results);
        }

        setIsConverting(true);
        setProgress(0);
        setResults([]);

        try {
            const response = await convertFavicon(file, selectedFormats, (p) => {
                setProgress(p);
            });

            if (response.success) {
                setResults(response.results);
                toast.success(response.message);
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            toast.error("An error occurred during conversion");
            console.error(error);
        } finally {
            setIsConverting(false);
            setTimeout(() => setProgress(0), 500);
        }
    };

    const handleReset = () => {
        if (results.length > 0) {
            cleanupResults(results);
        }
        setFile(null);
        setResults([]);
        setProgress(0);
    };

    const { zenMode } = useZenMode();

    return (
        <PageLayout toolId="favicon-converter">
            {/* Main content */}
            <main className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ${zenMode ? "py-6 sm:py-8" : "py-12 sm:py-16"}`}>
                {/* Hero section */}
                {!zenMode && (
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-4">
                            <Sparkles className="h-4 w-4" />
                            Free & Fast
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
                            Convert Images to
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-600">
                                {" "}
                                Favicons
                            </span>
                        </h1>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            And Vice Versa.
                            Generate all the favicon formats you need in seconds. ICO, PNG, SVG,
                            Apple Touch Icons, and more.
                        </p>
                    </div>
                )}

                {/* Conversion card */}
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                    <CardContent className="p-6 sm:p-8 space-y-8">
                        {/* Step 1: Upload */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold">
                                    1
                                </div>
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                    Upload your image
                                </h2>
                            </div>
                            <FileUpload
                                onFileSelect={setFile}
                                selectedFile={file}
                                disabled={isConverting}
                            />
                        </section>

                        <Separator />

                        {/* Step 2: Select formats */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold">
                                    2
                                </div>
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                    Select output formats
                                </h2>
                            </div>
                            <FormatSelector
                                selectedFormats={selectedFormats}
                                onFormatsChange={setSelectedFormats}
                                disabled={isConverting}
                            />
                        </section>

                        <Separator />

                        {/* Step 3: Convert */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold">
                                    3
                                </div>
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                    Convert & Download
                                </h2>
                            </div>

                            {/* Progress bar */}
                            {isConverting && (
                                <div className="mb-4">
                                    <Progress value={progress} className="h-2" />
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                                        Converting... {progress}%
                                    </p>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={handleConvert}
                                    disabled={!file || selectedFormats.length === 0 || isConverting}
                                    size="lg"
                                    className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25"
                                >
                                    {isConverting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Converting...
                                        </>
                                    ) : (
                                        <>
                                            Convert Now
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                                {results.length > 0 && (
                                    <Button
                                        onClick={handleReset}
                                        variant="outline"
                                        size="lg"
                                        disabled={isConverting}
                                    >
                                        Convert Another
                                    </Button>
                                )}
                            </div>
                        </section>

                        {/* Results */}
                        {results.length > 0 && (
                            <>
                                <Separator />
                                <ConversionResults results={results} />
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Features section */}
                {!zenMode && (
                    <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <FeatureCard
                            title="All Formats"
                            description="ICO, PNG (all sizes), SVG, Apple Touch Icons, Android Chrome icons"
                        />
                        <FeatureCard
                            title="Fast & Free"
                            description="No sign-up required. Convert your images instantly with no limits."
                        />
                        <FeatureCard
                            title="100% Private"
                            description="Everything runs in your browser. Your files never leave your device."
                        />
                    </div>
                )}
            </main>
        </PageLayout>
    );
}

function FeatureCard({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900/50">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {title}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>
    );
}
