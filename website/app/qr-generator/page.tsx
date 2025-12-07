"use client";

import { Sparkles } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { QRGenerator } from "@/components/qr-generator";
import { Card, CardContent } from "@/components/ui/card";
import { useZenMode } from "@/lib/zen-mode";

export default function QRGeneratorPage() {
    const { zenMode } = useZenMode();

    return (
        <PageLayout toolId="qr-generator">
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
                            Generate
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-600">
                                {" "}
                                QR Codes
                            </span>
                        </h1>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            Create QR codes for text, URLs, or WiFi credentials. Customize colors
                            and download in PNG or SVG format.
                        </p>
                    </div>
                )}

                {/* Generator card */}
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                    <CardContent className="p-6 sm:p-8">
                        <QRGenerator />
                    </CardContent>
                </Card>

                {/* Features section */}
                {!zenMode && (
                    <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <FeatureCard
                            title="Multiple Formats"
                            description="Generate QR codes for plain text, URLs, or WiFi credentials"
                        />
                        <FeatureCard
                            title="Customizable"
                            description="Change colors, size, and error correction level"
                        />
                        <FeatureCard
                            title="100% Private"
                            description="Everything runs in your browser. No data is sent to any server."
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
