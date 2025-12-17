"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, RefreshCw, Eye, EyeOff, History } from 'lucide-react';
import { useToolWorkspace } from '@/lib/workspace';
import {
    generatePasswordWithAnalysis,
    validateOptions,
    DEFAULT_PASSWORD_OPTIONS,
    PASSWORD_CONSTRAINTS,
    STORAGE_KEYS
} from '@/services/password';
import type {
    PasswordOptions,
    GeneratedPassword,
    PasswordWorkspaceData
} from '@/services/password';

export function PasswordGenerator() {
    const { isActive, data: workspaceData, save: saveToWorkspace, workspaceId } = useToolWorkspace<PasswordWorkspaceData>('password-generator');

    const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS);
    const [generatedPassword, setGeneratedPassword] = useState<string>('');
    const [passwordStrength, setPasswordStrength] = useState<string>('');
    const [entropy, setEntropy] = useState<number>(0);
    const [history, setHistory] = useState<GeneratedPassword[]>([]);
    const [showPassword, setShowPassword] = useState<boolean>(true);
    const [showHistoryPasswords, setShowHistoryPasswords] = useState<Set<number>>(new Set());
    const [errors, setErrors] = useState<string[]>([]);
    const [copied, setCopied] = useState<boolean>(false);
    const [hasLoadedData, setHasLoadedData] = useState<boolean>(false);

    // Load data from workspace only - reset to defaults when no workspace
    useEffect(() => {
        if (hasLoadedData) return;

        let loadedOptions = DEFAULT_PASSWORD_OPTIONS;
        let loadedHistory: GeneratedPassword[] = [];

        if (isActive && workspaceData) {
            // Load from workspace, merge with defaults to handle missing properties
            loadedOptions = { ...DEFAULT_PASSWORD_OPTIONS, ...workspaceData.options };
            loadedHistory = workspaceData.generatedPasswords;
        }
        // If no workspace is active, use defaults and don't load from localStorage

        setOptions(loadedOptions);
        setHistory(loadedHistory);
        setHasLoadedData(true);
    }, [isActive, workspaceData]);

    // Handle workspace activation/deactivation changes after initial load
    const prevWorkspaceRef = React.useRef<{ isActive: boolean; workspaceId: string | null }>({ isActive, workspaceId });
    useEffect(() => {
        if (!hasLoadedData) return;

        const prevState = prevWorkspaceRef.current;

        // React to workspace activation/deactivation OR switching between different workspaces
        if (prevState.isActive !== isActive || prevState.workspaceId !== workspaceId) {
            if (isActive && workspaceData) {
                // Switching to workspace or switching between workspaces - load workspace data
                // Merge with defaults to handle missing properties
                setOptions({ ...DEFAULT_PASSWORD_OPTIONS, ...workspaceData.options });
                setHistory(workspaceData.generatedPasswords);
                // Clear generated password display to show default message
                setGeneratedPassword('');
                setPasswordStrength('');
                setEntropy(0);
                // Clear visibility state when switching workspaces
                setShowHistoryPasswords(new Set());
            } else if (!isActive) {
                // Switching to no workspace - reset to defaults
                setOptions(DEFAULT_PASSWORD_OPTIONS);
                setHistory([]);
                // Clear any generated password display
                setGeneratedPassword('');
                setPasswordStrength('');
                setEntropy(0);
                // Clear visibility state
                setShowHistoryPasswords(new Set());
            }

            prevWorkspaceRef.current = { isActive, workspaceId };
        }
    }, [isActive, workspaceId, workspaceData, hasLoadedData]);

    const generatePassword = useCallback(() => {
        const validationErrors = validateOptions(options);
        setErrors(validationErrors);

        if (validationErrors.length > 0) {
            return;
        }

        try {
            const result = generatePasswordWithAnalysis(options);
            setGeneratedPassword(result.password);
            setPasswordStrength(result.strength);
            setEntropy(result.entropy);

            // Add to history (keep last 20)
            setHistory(prev => {
                const newHistory = [result, ...prev];
                return newHistory.slice(0, 20);
            });
        } catch (error) {
            setErrors([error instanceof Error ? error.message : 'Failed to generate password']);
        }
    }, [options]);

    // Save data only when workspace is active - no saving when no workspace selected
    useEffect(() => {
        if (!hasLoadedData) return;

        if (isActive) {
            // Save to workspace
            const dataToSave: PasswordWorkspaceData = {
                generatedPasswords: history,
                options,
            };
            saveToWorkspace(dataToSave);
        }
        // When no workspace is active, don't save anywhere
    }, [options, history, isActive, hasLoadedData]);

    const handleGenerate = () => {
        generatePassword();
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const updateOption = (key: keyof PasswordOptions, value: boolean | number) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    const toggleHistoryPasswordVisibility = (index: number) => {
        setShowHistoryPasswords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handleCopyHistoryPassword = (password: string, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent triggering the row click
        navigator.clipboard.writeText(password);
    };

    const getStrengthColor = (strength: string) => {
        switch (strength) {
            case 'very-strong': return 'bg-green-500';
            case 'strong': return 'bg-green-400';
            case 'medium': return 'bg-yellow-500';
            case 'weak': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const formatStrength = (strength: string) => {
        return strength.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6 space-y-6">
                {/* Error Display */}
                {errors.length > 0 && (
                    <div className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 border rounded-lg p-4">
                        <div className="space-y-1">
                            {errors.map((error, index) => (
                                <p key={index} className="text-sm text-red-600 dark:text-red-400">
                                    {error}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Generated Password Display */}
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Generated Password</h3>
                            {generatedPassword && (
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className={getStrengthColor(passwordStrength)}>
                                        {formatStrength(passwordStrength)}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        Entropy: {entropy} bits
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopy}
                                disabled={!generatedPassword}
                            >
                                <Copy className="h-4 w-4" />
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                            <Button onClick={handleGenerate}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Generate
                            </Button>
                        </div>
                    </div>
                    <div className="p-4 bg-muted rounded-md font-mono text-lg break-all">
                        {generatedPassword ? (
                            showPassword ? generatedPassword : '•'.repeat(generatedPassword.length)
                        ) : (
                            <span className="text-muted-foreground">Click Generate to create a password</span>
                        )}
                    </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Options */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Password Options</h3>
                                <p className="text-sm text-muted-foreground">
                                    Customize your password generation settings
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                                    {PASSWORD_CONSTRAINTS.MAX_LENGTH}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Max Length
                                </div>
                            </div>
                        </div>

                        {/* Length */}
                        <div className="space-y-2">
                            <Label htmlFor="length">
                                Length: {options.length}
                            </Label>
                            <Input
                                id="length"
                                type="range"
                                min={PASSWORD_CONSTRAINTS.MIN_LENGTH}
                                max={PASSWORD_CONSTRAINTS.MAX_LENGTH}
                                value={options.length}
                                onChange={(e) => updateOption('length', parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{PASSWORD_CONSTRAINTS.MIN_LENGTH}</span>
                                <span>{PASSWORD_CONSTRAINTS.MAX_LENGTH}</span>
                            </div>
                        </div>

                        {/* Segment After N Characters */}
                        <div className="space-y-2">
                            <Label htmlFor="segmentAfterChars">
                                Segment after: {options.segmentAfterChars === 0 ? 'None' : `${options.segmentAfterChars} chars`}
                                {options.segmentAfterChars > 0 && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                        (separated by dashes)
                                    </span>
                                )}
                            </Label>
                            <Input
                                id="segmentAfterChars"
                                type="range"
                                min={PASSWORD_CONSTRAINTS.MIN_SEGMENT_CHARS}
                                max={PASSWORD_CONSTRAINTS.MAX_SEGMENT_CHARS}
                                value={options.segmentAfterChars}
                                onChange={(e) => updateOption('segmentAfterChars', parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>None</span>
                                <span>{PASSWORD_CONSTRAINTS.MAX_SEGMENT_CHARS}</span>
                            </div>
                        </div>

                        <Separator />

                        {/* Character Types */}
                        <div className="space-y-4">
                            <Label>Include Characters</Label>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="uppercase">Uppercase Letters (A-Z)</Label>
                                    <Switch
                                        id="uppercase"
                                        checked={options.includeUppercase}
                                        onCheckedChange={(checked) => updateOption('includeUppercase', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="lowercase">Lowercase Letters (a-z)</Label>
                                    <Switch
                                        id="lowercase"
                                        checked={options.includeLowercase}
                                        onCheckedChange={(checked) => updateOption('includeLowercase', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="numbers">Numbers (0-9)</Label>
                                    <Switch
                                        id="numbers"
                                        checked={options.includeNumbers}
                                        onCheckedChange={(checked) => updateOption('includeNumbers', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="symbols">Symbols (!@#$%...)</Label>
                                    <Switch
                                        id="symbols"
                                        checked={options.includeSymbols}
                                        onCheckedChange={(checked) => updateOption('includeSymbols', checked)}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Exclusion Options */}
                        <div className="space-y-4">
                            <Label>Exclude Characters</Label>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="excludeSimilar">Similar Characters</Label>
                                        <p className="text-xs text-muted-foreground">Excludes: i, l, 1, L, o, 0, O</p>
                                    </div>
                                    <Switch
                                        id="excludeSimilar"
                                        checked={options.excludeSimilar}
                                        onCheckedChange={(checked) => updateOption('excludeSimilar', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="excludeAmbiguous">Ambiguous Characters</Label>
                                        <p className="text-xs text-muted-foreground">Excludes: {`{ } [ ] ( ) / \\ ' " \` ~ , ; < > . ?`}</p>
                                    </div>
                                    <Switch
                                        id="excludeAmbiguous"
                                        checked={options.excludeAmbiguous}
                                        onCheckedChange={(checked) => updateOption('excludeAmbiguous', checked)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Recent Passwords
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Recently generated passwords (masked by default)
                            </p>
                        </div>

                        {history.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No passwords generated yet
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {history.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 p-2 border rounded-md hover:bg-muted"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-mono text-sm truncate">
                                                {showHistoryPasswords.has(index) ? item.password : '•'.repeat(item.password.length)}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-xs ${getStrengthColor(item.strength)}`}
                                                >
                                                    {formatStrength(item.strength)}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {item.entropy} bits
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleHistoryPasswordVisibility(index)}
                                                className="h-8 w-8 p-0"
                                            >
                                                {showHistoryPasswords.has(index) ?
                                                    <EyeOff className="h-3 w-3" /> :
                                                    <Eye className="h-3 w-3" />
                                                }
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => handleCopyHistoryPassword(item.password, e)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}