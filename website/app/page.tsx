"use client";

import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tools } from "@/lib/tools";
import {
  Image,
  QrCode,
  Braces,
  FileArchive,
  Palette,
  KeyRound,
  Wrench,
  ShieldCheck,
  Network,
  LucideIcon,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useZenMode } from "@/lib/zen-mode";

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  Image,
  QrCode,
  Braces,
  FileArchive,
  Palette,
  KeyRound,
  Wrench,
  ShieldCheck,
  Network,
};

export default function OverviewPage() {
  const { zenMode } = useZenMode();
  const availableTools = tools.filter((tool) => tool.available && tool.featureEnabled);
  const comingSoonTools = tools.filter(
    (tool) => !(tool.available && tool.featureEnabled)
  );

  return (
    <PageLayout>
      <main className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ${zenMode ? "py-6 sm:py-8" : "py-12 sm:py-16"}`}>
        {/* Hero section */}
        {!zenMode && (
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              100% Free & Private
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
              Free
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-600">
                {" "}
                Client-Side{" "}
              </span>
              Tools
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              A collection of useful developer tools that run entirely in your browser.
              No uploads, no servers, no tracking. Your data stays on your device.
            </p>
          </div>
        )}

        {/* Available tools */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
            Available Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableTools.map((tool) => {
              const IconComponent = iconMap[tool.icon] || Wrench;
              return (
                <Link key={tool.id} href={tool.href}>
                  <Card className="border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-500/10 transition-all cursor-pointer group h-full">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {tool.name}
                          </h3>
                          <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {tool.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Coming soon */}
        {comingSoonTools.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
              Coming Soon
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comingSoonTools.map((tool) => {
                const IconComponent = iconMap[tool.icon] || Wrench;
                return (
                  <Card
                    key={tool.id}
                    className="border-zinc-200 dark:border-zinc-800 opacity-60"
                  >
                    <CardContent className="p-5 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-5 w-5 text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                            {tool.name}
                          </h3>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Soon
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">
                          {tool.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Features */}
        {!zenMode && (
          <section className="mt-20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FeatureCard
                title="100% Private"
                description="All tools run locally in your browser. Your files never leave your device."
              />
              <FeatureCard
                title="No Sign-up"
                description="Use any tool instantly without creating an account or signing in."
              />
              <FeatureCard
                title="Open Source"
                description="All code is open source and available on GitHub. Contribute or self-host."
              />
            </div>
          </section>
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
