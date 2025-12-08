"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveAs } from "file-saver";
import {
    Download,
    Copy,
    Check,
    Plus,
    Trash2,
    AlertTriangle,
    Shield,
    Key,
    FileText,
    Eye,
    EyeOff,
    X,
} from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useToolWorkspace } from "@/lib/workspace";

// Import business logic from lib/cert
import {
    type SubjectInfo,
    type KeySettings,
    type ValiditySettings,
    type SANEntry,
    type KeyUsageSettings,
    type ExtKeyUsageSettings,
    type CASettings,
    type RootCAInput,
    type OutputSettings,
    type GeneratedCert,
    type CertPreset,
    DEFAULT_SUBJECT,
    DEFAULT_KEY_SETTINGS,
    DEFAULT_VALIDITY,
    DEFAULT_KEY_USAGE,
    DEFAULT_EXT_KEY_USAGE,
    DEFAULT_CA_SETTINGS,
    DEFAULT_OUTPUT_SETTINGS,
    PRESETS,
    COUNTRY_CODES,
    PRESET_CONFIGS,
    generateCertificate,
    validateSubject,
    validateSANs,
    validateValidity,
} from "@/services/cert";

/** Workspace data structure for Certificate Generator */
interface CertWorkspaceData {
    preset: CertPreset;
    subject: SubjectInfo;
    keySettings: KeySettings;
    validity: ValiditySettings;
    sans: SANEntry[];
    keyUsage: KeyUsageSettings;
    extKeyUsage: ExtKeyUsageSettings;
    caSettings: CASettings;
    outputSettings: OutputSettings;
}

// ============ Main Component ============

export function CertGenerator() {
    // State
    const [preset, setPreset] = useState<CertPreset>("webServer");
    const [subject, setSubject] = useState<SubjectInfo>(DEFAULT_SUBJECT);
    const [keySettings, setKeySettings] = useState<KeySettings>(DEFAULT_KEY_SETTINGS);
    const [validity, setValidity] = useState<ValiditySettings>(DEFAULT_VALIDITY);
    const [sans, setSans] = useState<SANEntry[]>([]);
    const [keyUsage, setKeyUsage] = useState<KeyUsageSettings>(DEFAULT_KEY_USAGE);
    const [extKeyUsage, setExtKeyUsage] = useState<ExtKeyUsageSettings>(DEFAULT_EXT_KEY_USAGE);
    const [caSettings, setCaSettings] = useState<CASettings>(DEFAULT_CA_SETTINGS);
    const [useExistingCA, setUseExistingCA] = useState(false);
    const [rootCAInput, setRootCAInput] = useState<RootCAInput>({
        certificate: "",
        privateKey: "",
        passphrase: "",
    });
    const [outputSettings, setOutputSettings] = useState<OutputSettings>(DEFAULT_OUTPUT_SETTINGS);
    const [generatedCert, setGeneratedCert] = useState<GeneratedCert | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [activeTab, setActiveTab] = useState("subject");
    const [showWarningDialog, setShowWarningDialog] = useState(false);

    // Workspace integration
    const { isActive, isLoaded, data: workspaceData, workspaceId, save } = useToolWorkspace<CertWorkspaceData>("cert-generator");
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
            if (workspaceData.preset) setPreset(workspaceData.preset);
            if (workspaceData.subject) setSubject(workspaceData.subject);
            if (workspaceData.keySettings) setKeySettings(workspaceData.keySettings);
            if (workspaceData.validity) setValidity(workspaceData.validity);
            if (workspaceData.sans) setSans(workspaceData.sans);
            if (workspaceData.keyUsage) setKeyUsage(workspaceData.keyUsage);
            if (workspaceData.extKeyUsage) setExtKeyUsage(workspaceData.extKeyUsage);
            if (workspaceData.caSettings) setCaSettings(workspaceData.caSettings);
            if (workspaceData.outputSettings) setOutputSettings(workspaceData.outputSettings);
        } else {
            // Reset to defaults (no workspace or empty workspace)
            setPreset("webServer");
            setSubject(DEFAULT_SUBJECT);
            setKeySettings(DEFAULT_KEY_SETTINGS);
            setValidity(DEFAULT_VALIDITY);
            setSans([]);
            setKeyUsage(DEFAULT_KEY_USAGE);
            setExtKeyUsage(DEFAULT_EXT_KEY_USAGE);
            setCaSettings(DEFAULT_CA_SETTINGS);
            setOutputSettings(DEFAULT_OUTPUT_SETTINGS);
        }
        setGeneratedCert(null);

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
            preset,
            subject,
            keySettings,
            validity,
            sans,
            keyUsage,
            extKeyUsage,
            caSettings,
            outputSettings,
        });
    }, [preset, subject, keySettings, validity, sans, keyUsage, extKeyUsage, caSettings, outputSettings, isActive, isLoaded]);

    // Show warning dialog on first visit (check localStorage)
    useEffect(() => {
        const hasSeenWarning = localStorage.getItem("cert-generator-warning-seen");
        if (!hasSeenWarning) {
            setShowWarningDialog(true);
        }
    }, []);

    // Handle warning dialog dismissal
    const handleDismissWarning = useCallback(() => {
        setShowWarningDialog(false);
        localStorage.setItem("cert-generator-warning-seen", "true");
    }, []);

    // Apply preset using configuration from constants
    const applyPreset = useCallback((newPreset: CertPreset) => {
        setPreset(newPreset);

        const config = PRESET_CONFIGS[newPreset];
        setKeyUsage(config.keyUsage);
        setExtKeyUsage(config.extKeyUsage);
        setCaSettings(config.caSettings);
        setValidity(prev => ({ ...prev, days: config.validityDays }));

        if (config.rsaKeySize) {
            setKeySettings(prev => ({ ...prev, rsaKeySize: config.rsaKeySize! }));
        }

        // Special handling for wildcard preset
        if (newPreset === "wildcard") {
            setSubject(prev => ({
                ...prev,
                commonName: prev.commonName && !prev.commonName.startsWith("*.")
                    ? "*." + prev.commonName
                    : prev.commonName
            }));
        }

        // Special handling for custom preset - reset everything
        if (newPreset === "custom") {
            setSubject(DEFAULT_SUBJECT);
            setKeySettings(DEFAULT_KEY_SETTINGS);
            setValidity(DEFAULT_VALIDITY);
            setSans([]);
            setUseExistingCA(false);
            setOutputSettings(DEFAULT_OUTPUT_SETTINGS);
        }
    }, []);

    // Add SAN entry
    const addSAN = useCallback(() => {
        setSans(prev => [...prev, { type: "dns", value: "" }]);
    }, []);

    // Remove SAN entry
    const removeSAN = useCallback((index: number) => {
        setSans(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Update SAN entry
    const updateSAN = useCallback((index: number, field: "type" | "value", value: string) => {
        setSans(prev => {
            const newSans = [...prev];
            newSans[index] = { ...newSans[index], [field]: value };
            return newSans;
        });
    }, []);

    // Copy to clipboard
    const copyToClipboard = useCallback(async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
            toast.success("Copied to clipboard");
        } catch {
            toast.error("Failed to copy");
        }
    }, []);

    // Download file
    const downloadFile = useCallback((content: string | ArrayBuffer, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        saveAs(blob, filename);
        toast.success(`Downloaded ${filename}`);
    }, []);

    // Generate certificate using the service
    const handleGenerateCertificate = useCallback(async () => {
        // Client-side validation with toast notifications
        const subjectValidation = validateSubject(subject);
        if (!subjectValidation.valid) {
            toast.error(subjectValidation.error);
            return;
        }

        const sansValidation = validateSANs(sans);
        if (!sansValidation.valid) {
            toast.error(sansValidation.error);
            return;
        }

        const validityValidation = validateValidity(validity);
        if (!validityValidation.valid) {
            toast.error(validityValidation.error);
            return;
        }

        setIsGenerating(true);
        setGeneratedCert(null);

        const result = await generateCertificate({
            subject,
            keySettings,
            validity,
            sans,
            keyUsage,
            extKeyUsage,
            caSettings,
            useExistingCA,
            rootCAInput,
        });

        if (result.success && result.certificate) {
            setGeneratedCert(result.certificate);
            toast.success("Certificate generated successfully!");
        } else {
            toast.error(result.error || "Failed to generate certificate");
        }

        setIsGenerating(false);
    }, [subject, keySettings, validity, sans, keyUsage, extKeyUsage, caSettings, useExistingCA, rootCAInput]);

    return (
        <div className="space-y-6">
            {/* Security Warning Dialog */}
            <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
                <DialogContent className="sm:max-w-md border-amber-200 dark:border-amber-900">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                            Development/Testing Only
                        </DialogTitle>
                        <DialogDescription className="text-amber-700 dark:text-amber-300 pt-2">
                            These certificates are self-signed and should only be used for development or testing.
                            All cryptographic operations run locally in your browser - private keys never leave your device.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleDismissWarning}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            I Understand
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Presets */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Certificate Template
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {(Object.entries(PRESETS) as [CertPreset, typeof PRESETS[CertPreset]][]).map(([key, value]) => (
                            <button
                                key={key}
                                onClick={() => applyPreset(key)}
                                className={`p-3 rounded-lg border text-left transition-all ${preset === key
                                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                    }`}
                            >
                                <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                    {value.label}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    {value.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Main Configuration */}
            <Card>
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b border-zinc-200 dark:border-zinc-800 px-4">
                            <TabsList className="bg-transparent h-12 p-0 gap-4">
                                <TabsTrigger value="subject" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-violet-500 rounded-none px-1">
                                    Subject
                                </TabsTrigger>
                                <TabsTrigger value="technical" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-violet-500 rounded-none px-1">
                                    Technical
                                </TabsTrigger>
                                <TabsTrigger value="extensions" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-violet-500 rounded-none px-1">
                                    Extensions
                                </TabsTrigger>
                                <TabsTrigger value="ca" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-violet-500 rounded-none px-1">
                                    CA Options
                                </TabsTrigger>
                                <TabsTrigger value="output" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-violet-500 rounded-none px-1">
                                    Output
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Subject Tab */}
                        <TabsContent value="subject" className="p-4 space-y-4 mt-0">
                            <p className="text-xs text-muted-foreground mb-2">
                                Fields marked with <span className="text-destructive font-medium">*</span> are required
                            </p>

                            {/* Required Fields */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium flex items-center justify-between">
                                    <span>Subject Information</span>
                                    <Badge variant="destructive" className="text-[10px]">Required</Badge>
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Label htmlFor="cn" className="flex items-center gap-1">
                                        Common Name (CN) <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="cn"
                                        placeholder="example.com or *.example.com"
                                        value={subject.commonName}
                                        onChange={(e) => setSubject({ ...subject, commonName: e.target.value })}
                                        className="mt-1.5"
                                        required
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Primary domain or wildcard domain (required)</p>
                                </div>
                            </div>

                            {/* Optional Fields */}
                            <div className="space-y-4 mt-6">
                                <h3 className="text-sm font-medium flex items-center justify-between">
                                    <span>Organization Details</span>
                                    <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="org" className="text-muted-foreground">Organization (O)</Label>
                                    <Input
                                        id="org"
                                        placeholder="Company Name"
                                        value={subject.organization}
                                        onChange={(e) => setSubject({ ...subject, organization: e.target.value })}
                                        className="mt-1.5"
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Your company or organization name</p>
                                </div>
                                <div>
                                    <Label htmlFor="ou" className="text-muted-foreground">Organizational Unit (OU)</Label>
                                    <Input
                                        id="ou"
                                        placeholder="IT Department"
                                        value={subject.organizationalUnit}
                                        onChange={(e) => setSubject({ ...subject, organizationalUnit: e.target.value })}
                                        className="mt-1.5"
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Department or division</p>
                                </div>
                                <div>
                                    <Label htmlFor="country" className="text-muted-foreground">Country (C)</Label>
                                    <Select
                                        value={subject.country}
                                        onValueChange={(value) => setSubject({ ...subject, country: value })}
                                    >
                                        <SelectTrigger className="mt-1.5 w-full">
                                            <SelectValue placeholder="Select country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COUNTRY_CODES.map((c) => (
                                                <SelectItem key={c.code} value={c.code}>
                                                    {c.code} - {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-zinc-500 mt-1">2-letter country code</p>
                                </div>
                                <div>
                                    <Label htmlFor="state" className="text-muted-foreground">State/Province (ST)</Label>
                                    <Input
                                        id="state"
                                        placeholder="California"
                                        value={subject.state}
                                        onChange={(e) => setSubject({ ...subject, state: e.target.value })}
                                        className="mt-1.5"
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">State or province name</p>
                                </div>
                                <div>
                                    <Label htmlFor="locality" className="text-muted-foreground">Locality (L)</Label>
                                    <Input
                                        id="locality"
                                        placeholder="San Francisco"
                                        value={subject.locality}
                                        onChange={(e) => setSubject({ ...subject, locality: e.target.value })}
                                        className="mt-1.5"
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">City or locality name</p>
                                </div>
                                <div>
                                    <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@example.com"
                                        value={subject.email}
                                        onChange={(e) => setSubject({ ...subject, email: e.target.value })}
                                        className="mt-1.5"
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Contact email for the certificate</p>
                                </div>
                            </div>

                            {/* Subject Alternative Names */}
                            <Separator className="my-4" />
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Label>Subject Alternative Names (SANs)</Label>
                                        <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={addSAN}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add SAN
                                    </Button>
                                </div>
                                <p className="text-xs text-zinc-500 mb-3">Additional domains or IP addresses (recommended for modern browsers)</p>
                                {sans.length === 0 ? (
                                    <p className="text-sm text-zinc-500 italic">No SANs configured</p>
                                ) : (
                                    <div className="space-y-2">
                                        {sans.map((san, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Select
                                                    value={san.type}
                                                    onValueChange={(value) => updateSAN(index, "type", value)}
                                                >
                                                    <SelectTrigger className="w-24">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="dns">DNS</SelectItem>
                                                        <SelectItem value="ip">IP</SelectItem>
                                                        <SelectItem value="email">Email</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    placeholder={san.type === "dns" ? "www.example.com" : san.type === "ip" ? "192.168.1.1" : "user@example.com"}
                                                    value={san.value}
                                                    onChange={(e) => updateSAN(index, "value", e.target.value)}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeSAN(index)}
                                                    className="text-zinc-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Technical Tab */}
                        <TabsContent value="technical" className="p-4 space-y-4 mt-0">
                            <div className="space-y-2 mb-4">
                                <h3 className="text-sm font-medium flex items-center justify-between">
                                    <span>Key & Validity Settings</span>
                                    <Badge variant="destructive" className="text-[10px]">Required</Badge>
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Configure cryptographic algorithm and certificate validity period
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="flex items-center gap-1">
                                        Key Algorithm <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={keySettings.algorithm}
                                        onValueChange={(value: "RSA" | "ECDSA") => setKeySettings({ ...keySettings, algorithm: value })}
                                    >
                                        <SelectTrigger className="mt-1.5 w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="RSA">RSA</SelectItem>
                                            <SelectItem value="ECDSA">ECDSA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {keySettings.algorithm === "RSA" ? (
                                    <div>
                                        <Label>RSA Key Size</Label>
                                        <Select
                                            value={keySettings.rsaKeySize}
                                            onValueChange={(value: "2048" | "3072" | "4096") => setKeySettings({ ...keySettings, rsaKeySize: value })}
                                        >
                                            <SelectTrigger className="mt-1.5 w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="2048">2048 bits</SelectItem>
                                                <SelectItem value="3072">3072 bits</SelectItem>
                                                <SelectItem value="4096">4096 bits</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <div>
                                        <Label>ECDSA Curve</Label>
                                        <Select
                                            value={keySettings.ecdsaCurve}
                                            onValueChange={(value: "P-256" | "P-384" | "P-521") => setKeySettings({ ...keySettings, ecdsaCurve: value })}
                                        >
                                            <SelectTrigger className="mt-1.5 w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="P-256">P-256 (secp256r1)</SelectItem>
                                                <SelectItem value="P-384">P-384 (secp384r1)</SelectItem>
                                                <SelectItem value="P-521">P-521 (secp521r1)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div>
                                    <Label>Signing Algorithm</Label>
                                    <Select
                                        value={keySettings.signingAlgorithm}
                                        onValueChange={(value: "SHA-256" | "SHA-384" | "SHA-512") => setKeySettings({ ...keySettings, signingAlgorithm: value })}
                                    >
                                        <SelectTrigger className="mt-1.5 w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SHA-256">SHA-256</SelectItem>
                                            <SelectItem value="SHA-384">SHA-384</SelectItem>
                                            <SelectItem value="SHA-512">SHA-512</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="flex items-center gap-1">
                                        Validity Period <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="7300"
                                            value={validity.days}
                                            onChange={(e) => setValidity({ ...validity, days: parseInt(e.target.value) || 365 })}
                                            className="w-24"
                                            disabled={validity.useCustomDates}
                                        />
                                        <span className="text-sm text-zinc-500">days</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4">
                                <input
                                    type="checkbox"
                                    id="customDates"
                                    checked={validity.useCustomDates}
                                    onChange={(e) => setValidity({ ...validity, useCustomDates: e.target.checked })}
                                    className="rounded border-zinc-300"
                                />
                                <Label htmlFor="customDates" className="text-sm cursor-pointer">Use custom date range</Label>
                            </div>

                            {validity.useCustomDates && (
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <Label>Start Date</Label>
                                        <Input
                                            type="date"
                                            value={validity.customStartDate}
                                            onChange={(e) => setValidity({ ...validity, customStartDate: e.target.value })}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label>End Date</Label>
                                        <Input
                                            type="date"
                                            value={validity.customEndDate}
                                            onChange={(e) => setValidity({ ...validity, customEndDate: e.target.value })}
                                            className="mt-1.5"
                                        />
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* Extensions Tab */}
                        <TabsContent value="extensions" className="p-4 space-y-4 mt-0">
                            <p className="text-xs text-muted-foreground mb-2">
                                Extension fields are optional but recommended for specific use cases
                            </p>
                            <div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-base">Key Usage</Label>
                                    <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                                </div>
                                <p className="text-xs text-zinc-500 mb-3">Define how the certificate key can be used (pre-configured based on template)</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        { key: "digitalSignature", label: "Digital Signature" },
                                        { key: "keyEncipherment", label: "Key Encipherment" },
                                        { key: "dataEncipherment", label: "Data Encipherment" },
                                        { key: "keyAgreement", label: "Key Agreement" },
                                        { key: "keyCertSign", label: "Certificate Signing" },
                                        { key: "crlSign", label: "CRL Signing" },
                                    ].map((item) => (
                                        <label
                                            key={item.key}
                                            className="flex items-center gap-2 p-2 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={keyUsage[item.key as keyof KeyUsageSettings]}
                                                onChange={(e) => setKeyUsage({ ...keyUsage, [item.key]: e.target.checked })}
                                                className="rounded border-zinc-300"
                                            />
                                            <span className="text-sm">{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-base">Extended Key Usage</Label>
                                    <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                                </div>
                                <p className="text-xs text-zinc-500 mb-3">Additional purposes for certificate usage (pre-configured based on template)</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { key: "serverAuth", label: "Server Auth" },
                                        { key: "clientAuth", label: "Client Auth" },
                                        { key: "codeSigning", label: "Code Signing" },
                                        { key: "emailProtection", label: "Email Protection" },
                                    ].map((item) => (
                                        <label
                                            key={item.key}
                                            className="flex items-center gap-2 p-2 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={extKeyUsage[item.key as keyof ExtKeyUsageSettings]}
                                                onChange={(e) => setExtKeyUsage({ ...extKeyUsage, [item.key]: e.target.checked })}
                                                className="rounded border-zinc-300"
                                            />
                                            <span className="text-sm">{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* CA Options Tab */}
                        <TabsContent value="ca" className="p-4 space-y-4 mt-0">
                            <p className="text-xs text-muted-foreground mb-2">
                                CA options are optional and only needed for certificate authority setups
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={caSettings.isCA}
                                                onChange={(e) => setCaSettings({ ...caSettings, isCA: e.target.checked })}
                                                className="rounded border-zinc-300"
                                            />
                                            <span className="font-medium">This is a CA Certificate</span>
                                        </label>
                                        <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1 ml-6">Enable if this certificate will sign other certificates</p>
                                </div>

                                {caSettings.isCA && (
                                    <div className="ml-6">
                                        <Label>Path Length Constraint</Label>
                                        <Select
                                            value={caSettings.pathLengthConstraint?.toString() ?? "unlimited"}
                                            onValueChange={(value) => setCaSettings({
                                                ...caSettings,
                                                pathLengthConstraint: value === "unlimited" ? null : parseInt(value)
                                            })}
                                        >
                                            <SelectTrigger className="mt-1.5 w-48">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unlimited">Unlimited</SelectItem>
                                                <SelectItem value="0">0 (Cannot issue sub-CAs)</SelectItem>
                                                <SelectItem value="1">1</SelectItem>
                                                <SelectItem value="2">2</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-zinc-500 mt-1">How many levels of sub-CAs can be created</p>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useExistingCA}
                                                onChange={(e) => setUseExistingCA(e.target.checked)}
                                                className="rounded border-zinc-300"
                                            />
                                            <span className="font-medium">Sign with existing Root CA</span>
                                        </label>
                                        <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1 ml-6">Upload an existing CA certificate and key to sign this certificate (leave unchecked for self-signed)</p>
                                </div>

                                {useExistingCA && (
                                    <div className="ml-6 space-y-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                                        <div>
                                            <Label>CA Certificate (PEM)</Label>
                                            <textarea
                                                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                                                value={rootCAInput.certificate}
                                                onChange={(e) => setRootCAInput({ ...rootCAInput, certificate: e.target.value })}
                                                className="mt-1.5 w-full h-32 px-3 py-2 text-sm font-mono border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 resize-none"
                                            />
                                        </div>
                                        <div>
                                            <Label>CA Private Key (PEM)</Label>
                                            <textarea
                                                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                                                value={rootCAInput.privateKey}
                                                onChange={(e) => setRootCAInput({ ...rootCAInput, privateKey: e.target.value })}
                                                className="mt-1.5 w-full h-32 px-3 py-2 text-sm font-mono border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 resize-none"
                                            />
                                        </div>
                                        <div>
                                            <Label>Private Key Passphrase (if encrypted)</Label>
                                            <div className="relative mt-1.5">
                                                <Input
                                                    type={showPassphrase ? "text" : "password"}
                                                    placeholder="Leave empty if not encrypted"
                                                    value={rootCAInput.passphrase}
                                                    onChange={(e) => setRootCAInput({ ...rootCAInput, passphrase: e.target.value })}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassphrase(!showPassphrase)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                                >
                                                    {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Output Tab */}
                        <TabsContent value="output" className="p-4 space-y-4 mt-0">
                            <p className="text-xs text-muted-foreground mb-2">
                                Output format options (defaults are recommended for most use cases)
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <Label>Certificate Format</Label>
                                        <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                                    </div>
                                    <Select
                                        value={outputSettings.certFormat}
                                        onValueChange={(value: "pem" | "der") => setOutputSettings({ ...outputSettings, certFormat: value })}
                                    >
                                        <SelectTrigger className="mt-1.5 w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pem">PEM (Base64)</SelectItem>
                                            <SelectItem value="der">DER (Binary)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between">
                                        <Label>Private Key Format</Label>
                                        <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                                    </div>
                                    <Select
                                        value={outputSettings.keyFormat}
                                        onValueChange={(value: "pkcs1" | "pkcs8") => setOutputSettings({ ...outputSettings, keyFormat: value })}
                                    >
                                        <SelectTrigger className="mt-1.5 w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pkcs8">PKCS#8 (Recommended)</SelectItem>
                                            <SelectItem value="pkcs1">PKCS#1 (Traditional)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="includeChain"
                                    checked={outputSettings.includeChain}
                                    onChange={(e) => setOutputSettings({ ...outputSettings, includeChain: e.target.checked })}
                                    className="rounded border-zinc-300"
                                    disabled={!useExistingCA}
                                />
                                <Label htmlFor="includeChain" className={`text-sm cursor-pointer ${!useExistingCA ? "opacity-50" : ""}`}>
                                    Include full certificate chain in output
                                </Label>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex justify-center">
                <Button
                    onClick={handleGenerateCertificate}
                    disabled={isGenerating || !subject.commonName}
                    size="lg"
                    className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 px-8"
                >
                    {isGenerating ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span>
                            Generating...
                        </>
                    ) : (
                        <>
                            <Key className="mr-2 h-4 w-4" />
                            Generate Certificate
                        </>
                    )}
                </Button>
            </div>

            {/* Generated Output */}
            {generatedCert && (
                <Card className="border-green-200 dark:border-green-900">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                            <Check className="h-5 w-5" />
                            Certificate Generated Successfully
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Certificate */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Certificate
                                </Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(generatedCert.certificate, "cert")}
                                    >
                                        {copiedField === "cert" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadFile(
                                            outputSettings.certFormat === "pem" ? generatedCert.certificate : generatedCert.certificateDer!,
                                            `certificate.${outputSettings.certFormat === "pem" ? "crt" : "der"}`,
                                            outputSettings.certFormat === "pem" ? "application/x-pem-file" : "application/x-x509-ca-cert"
                                        )}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <pre className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-xs font-mono overflow-x-auto max-h-40">
                                {generatedCert.certificate}
                            </pre>
                        </div>

                        {/* Private Key */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label className="flex items-center gap-2">
                                    <Key className="h-4 w-4" />
                                    Private Key
                                    <Badge variant="destructive" className="text-[10px]">Keep Secret</Badge>
                                </Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(generatedCert.privateKey, "key")}
                                    >
                                        {copiedField === "key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadFile(generatedCert.privateKey, "private.key", "application/x-pem-file")}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <pre className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-xs font-mono overflow-x-auto max-h-40">
                                {generatedCert.privateKey}
                            </pre>
                        </div>

                        {/* Public Key */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Public Key
                                </Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(generatedCert.publicKey, "pub")}
                                    >
                                        {copiedField === "pub" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadFile(generatedCert.publicKey, "public.pem", "application/x-pem-file")}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <pre className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-xs font-mono overflow-x-auto max-h-40">
                                {generatedCert.publicKey}
                            </pre>
                        </div>

                        {/* Download All Button */}
                        <div className="flex justify-center pt-2">
                            <Button
                                onClick={() => {
                                    downloadFile(generatedCert.certificate, "certificate.crt", "application/x-pem-file");
                                    setTimeout(() => downloadFile(generatedCert.privateKey, "private.key", "application/x-pem-file"), 100);
                                    setTimeout(() => downloadFile(generatedCert.publicKey, "public.pem", "application/x-pem-file"), 200);
                                }}
                                variant="outline"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download All Files
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
