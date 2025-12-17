export interface PasswordOptions {
    length: number;
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeNumbers: boolean;
    includeSymbols: boolean;
    excludeSimilar: boolean;
    excludeAmbiguous: boolean;
    segmentAfterChars: number;
}

export interface GeneratedPassword {
    password: string;
    strength: PasswordStrength;
    entropy: number;
}

export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong';

export interface PasswordWorkspaceData {
    generatedPasswords: GeneratedPassword[];
    options: PasswordOptions;
}

export interface PasswordGeneratorState extends PasswordOptions {
    generatedPassword: string;
    passwordStrength: PasswordStrength;
    entropy: number;
    history: GeneratedPassword[];
}