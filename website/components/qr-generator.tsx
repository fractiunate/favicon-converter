"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import QRCode from "qrcode";
import { saveAs } from "file-saver";
import { Download, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useToolWorkspace } from "@/lib/workspace";

interface QROptions {
    size: number;
    margin: number;
    darkColor: string;
    lightColor: string;
    errorCorrectionLevel: "L" | "M" | "Q" | "H";
}

/** Workspace data structure for QR Generator */
interface QRWorkspaceData {
    inputType: "text" | "url" | "wifi";
    text: string;
    url: string;
    wifiSSID: string;
    wifiPassword: string;
    wifiEncryption: "WPA" | "WEP" | "nopass";
    options: QROptions;
}

const DEFAULT_OPTIONS: QROptions = {
    size: 256,
    margin: 2,
    darkColor: "#000000",
    lightColor: "#ffffff",
    errorCorrectionLevel: "M",
};

const SIZE_OPTIONS = [
    { value: "128", label: "128 x 128" },
    { value: "256", label: "256 x 256" },
    { value: "512", label: "512 x 512" },
    { value: "1024", label: "1024 x 1024" },
];

const ERROR_LEVELS = [
    { value: "L", label: "Low (7%)" },
    { value: "M", label: "Medium (15%)" },
    { value: "Q", label: "Quartile (25%)" },
    { value: "H", label: "High (30%)" },
];

export function QRGenerator() {
    const [inputType, setInputType] = useState<"text" | "url" | "wifi">("text");
    const [text, setText] = useState("");
    const [url, setUrl] = useState("");
    const [wifiSSID, setWifiSSID] = useState("");
    const [wifiPassword, setWifiPassword] = useState("");
    const [wifiEncryption, setWifiEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");
    const [options, setOptions] = useState<QROptions>(DEFAULT_OPTIONS);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Workspace integration
    const { isActive, isLoaded, data: workspaceData, workspaceId, save } = useToolWorkspace<QRWorkspaceData>("qr-generator");
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
            if (workspaceData.inputType) setInputType(workspaceData.inputType);
            if (workspaceData.text !== undefined) setText(workspaceData.text);
            if (workspaceData.url !== undefined) setUrl(workspaceData.url);
            if (workspaceData.wifiSSID !== undefined) setWifiSSID(workspaceData.wifiSSID);
            if (workspaceData.wifiPassword !== undefined) setWifiPassword(workspaceData.wifiPassword);
            if (workspaceData.wifiEncryption) setWifiEncryption(workspaceData.wifiEncryption);
            if (workspaceData.options) setOptions(workspaceData.options);
        } else {
            // Reset to defaults (no workspace or empty workspace)
            setInputType("text");
            setText("");
            setUrl("");
            setWifiSSID("");
            setWifiPassword("");
            setWifiEncryption("WPA");
            setOptions(DEFAULT_OPTIONS);
        }
        setQrDataUrl(null);

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
            inputType,
            text,
            url,
            wifiSSID,
            wifiPassword,
            wifiEncryption,
            options,
        });
    }, [inputType, text, url, wifiSSID, wifiPassword, wifiEncryption, options, isActive, isLoaded]);

    const getQRContent = useCallback(() => {
        switch (inputType) {
            case "text":
                return text;
            case "url":
                return url;
            case "wifi":
                if (!wifiSSID) return "";
                return `WIFI:T:${wifiEncryption};S:${wifiSSID};P:${wifiPassword};;`;
            default:
                return "";
        }
    }, [inputType, text, url, wifiSSID, wifiPassword, wifiEncryption]);

    const generateQR = useCallback(async () => {
        const content = getQRContent();
        if (!content) {
            setQrDataUrl(null);
            return;
        }

        try {
            const dataUrl = await QRCode.toDataURL(content, {
                width: options.size,
                margin: options.margin,
                color: {
                    dark: options.darkColor,
                    light: options.lightColor,
                },
                errorCorrectionLevel: options.errorCorrectionLevel,
            });
            setQrDataUrl(dataUrl);
        } catch (error) {
            console.error("QR generation error:", error);
            toast.error("Failed to generate QR code");
        }
    }, [getQRContent, options]);

    // Generate QR code when content or options change
    useEffect(() => {
        const debounce = setTimeout(() => {
            generateQR();
        }, 300);
        return () => clearTimeout(debounce);
    }, [generateQR]);

    const downloadQR = async (format: "png" | "svg") => {
        const content = getQRContent();
        if (!content) {
            toast.error("Please enter content first");
            return;
        }

        try {
            if (format === "png") {
                const dataUrl = await QRCode.toDataURL(content, {
                    width: options.size,
                    margin: options.margin,
                    color: {
                        dark: options.darkColor,
                        light: options.lightColor,
                    },
                    errorCorrectionLevel: options.errorCorrectionLevel,
                });

                // Convert data URL to blob
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                saveAs(blob, "qrcode.png");
                toast.success("QR code downloaded as PNG");
            } else {
                const svg = await QRCode.toString(content, {
                    type: "svg",
                    width: options.size,
                    margin: options.margin,
                    color: {
                        dark: options.darkColor,
                        light: options.lightColor,
                    },
                    errorCorrectionLevel: options.errorCorrectionLevel,
                });
                const blob = new Blob([svg], { type: "image/svg+xml" });
                saveAs(blob, "qrcode.svg");
                toast.success("QR code downloaded as SVG");
            }
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Failed to download QR code");
        }
    };

    const copyToClipboard = async () => {
        if (!qrDataUrl) return;

        try {
            // Create a canvas to get the image data
            const img = new Image();
            img.src = qrDataUrl;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Could not get canvas context");

            ctx.drawImage(img, 0, 0);

            // Try the modern clipboard API first
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    toast.error("Failed to create image");
                    return;
                }

                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ "image/png": blob }),
                    ]);
                    setCopied(true);
                    toast.success("QR code copied to clipboard");
                    setTimeout(() => setCopied(false), 2000);
                } catch {
                    // Fallback: copy the data URL as text
                    try {
                        await navigator.clipboard.writeText(qrDataUrl);
                        setCopied(true);
                        toast.success("QR code URL copied to clipboard");
                        setTimeout(() => setCopied(false), 2000);
                    } catch {
                        toast.error("Clipboard access denied. Try downloading instead.");
                    }
                }
            }, "image/png");
        } catch (error) {
            console.error("Copy error:", error);
            toast.error("Failed to copy QR code");
        }
    };

    const hasContent = getQRContent().length > 0;

    return (
        <div className="grid gap-8 lg:grid-cols-2">
            {/* Input Section */}
            <div className="space-y-6">
                {/* Content Type Tabs */}
                <Tabs value={inputType} onValueChange={(v) => setInputType(v as typeof inputType)}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="text">Text</TabsTrigger>
                        <TabsTrigger value="url">URL</TabsTrigger>
                        <TabsTrigger value="wifi">WiFi</TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="text-input">Text Content</Label>
                            <Input
                                id="text-input"
                                placeholder="Enter any text..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="h-12"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="url" className="mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="url-input">URL</Label>
                            <Input
                                id="url-input"
                                type="url"
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="h-12"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="wifi" className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="wifi-ssid">Network Name (SSID)</Label>
                            <Input
                                id="wifi-ssid"
                                placeholder="My WiFi Network"
                                value={wifiSSID}
                                onChange={(e) => setWifiSSID(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wifi-password">Password</Label>
                            <Input
                                id="wifi-password"
                                type="password"
                                placeholder="WiFi password"
                                value={wifiPassword}
                                onChange={(e) => setWifiPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Encryption</Label>
                            <Select
                                value={wifiEncryption}
                                onValueChange={(v) => setWifiEncryption(v as typeof wifiEncryption)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WPA">WPA/WPA2</SelectItem>
                                    <SelectItem value="WEP">WEP</SelectItem>
                                    <SelectItem value="nopass">None (Open)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Options */}
                <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Options</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Size</Label>
                            <Select
                                value={options.size.toString()}
                                onValueChange={(v) => setOptions({ ...options, size: parseInt(v) })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SIZE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Error Correction</Label>
                            <Select
                                value={options.errorCorrectionLevel}
                                onValueChange={(v) =>
                                    setOptions({ ...options, errorCorrectionLevel: v as QROptions["errorCorrectionLevel"] })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ERROR_LEVELS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dark-color">Foreground Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="dark-color"
                                    type="color"
                                    value={options.darkColor}
                                    onChange={(e) => setOptions({ ...options, darkColor: e.target.value })}
                                    className="w-12 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={options.darkColor}
                                    onChange={(e) => setOptions({ ...options, darkColor: e.target.value })}
                                    className="flex-1 uppercase"
                                    maxLength={7}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="light-color">Background Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="light-color"
                                    type="color"
                                    value={options.lightColor}
                                    onChange={(e) => setOptions({ ...options, lightColor: e.target.value })}
                                    className="w-12 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={options.lightColor}
                                    onChange={(e) => setOptions({ ...options, lightColor: e.target.value })}
                                    className="flex-1 uppercase"
                                    maxLength={7}
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOptions(DEFAULT_OPTIONS)}
                        className="mt-2"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Options
                    </Button>
                </div>
            </div>

            {/* Preview Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Preview</h3>
                    {hasContent && (
                        <span className="text-xs text-zinc-500">
                            {getQRContent().length} characters
                        </span>
                    )}
                </div>

                {/* QR Preview */}
                <div
                    className="relative aspect-square rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden"
                    style={{ maxWidth: "400px" }}
                >
                    {qrDataUrl ? (
                        <img
                            src={qrDataUrl}
                            alt="QR Code"
                            className="max-w-full max-h-full"
                        />
                    ) : (
                        <div className="text-center text-zinc-400 dark:text-zinc-500 p-8">
                            <div className="text-6xl mb-4">📱</div>
                            <p>Enter content to generate QR code</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={() => downloadQR("png")}
                        disabled={!hasContent}
                        className="flex-1 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download PNG
                    </Button>
                    <Button
                        onClick={() => downloadQR("svg")}
                        disabled={!hasContent}
                        variant="outline"
                        className="flex-1"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download SVG
                    </Button>
                    <Button
                        onClick={copyToClipboard}
                        disabled={!hasContent}
                        variant="outline"
                        size="icon"
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
