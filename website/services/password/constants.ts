import type { PasswordOptions } from './types';

// Default password generation options
export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
    segmentAfterChars: 0,
};

// Character sets for password generation
export const CHARACTER_SETS = {
    UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
    NUMBERS: '0123456789',
    SYMBOLS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    SIMILAR: 'il1Lo0O',
    AMBIGUOUS: '{}[]()/\\\'"`~,;<>.?'
} as const;

// Password length constraints
export const PASSWORD_CONSTRAINTS = {
    MIN_LENGTH: 4,
    MAX_LENGTH: 128,
    RECOMMENDED_MIN_LENGTH: 12,
    MIN_SEGMENT_CHARS: 0,
    MAX_SEGMENT_CHARS: 32,
} as const;

// Entropy thresholds for password strength
export const STRENGTH_THRESHOLDS = {
    WEAK: 0,
    MEDIUM: 25,
    STRONG: 50,
    VERY_STRONG: 75,
} as const;

// Storage keys
export const STORAGE_KEYS = {
    PASSWORD_OPTIONS: 'password-generator-options',
    PASSWORD_HISTORY: 'password-generator-history',
} as const;