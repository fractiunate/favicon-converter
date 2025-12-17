import type { PasswordOptions, PasswordStrength, GeneratedPassword } from './types';
import { CHARACTER_SETS, STRENGTH_THRESHOLDS } from './constants';

/**
 * Generate a random password based on the provided options
 */
export function generatePassword(options: PasswordOptions): string {
    let charset = '';

    // Build character set based on options
    if (options.includeUppercase) {
        charset += CHARACTER_SETS.UPPERCASE;
    }
    if (options.includeLowercase) {
        charset += CHARACTER_SETS.LOWERCASE;
    }
    if (options.includeNumbers) {
        charset += CHARACTER_SETS.NUMBERS;
    }
    if (options.includeSymbols) {
        charset += CHARACTER_SETS.SYMBOLS;
    }

    // Remove similar characters if requested
    if (options.excludeSimilar) {
        charset = charset.split('').filter(char => !CHARACTER_SETS.SIMILAR.includes(char)).join('');
    }

    // Remove ambiguous characters if requested
    if (options.excludeAmbiguous) {
        charset = charset.split('').filter(char => !CHARACTER_SETS.AMBIGUOUS.includes(char)).join('');
    }

    if (charset.length === 0) {
        throw new Error('No characters available for password generation');
    }

    // Generate password
    let password = '';

    // Ensure at least one character from each selected set (if length allows)
    const requiredChars: string[] = [];
    if (options.includeUppercase) {
        requiredChars.push(getRandomChar(filterCharset(CHARACTER_SETS.UPPERCASE, options)));
    }
    if (options.includeLowercase) {
        requiredChars.push(getRandomChar(filterCharset(CHARACTER_SETS.LOWERCASE, options)));
    }
    if (options.includeNumbers) {
        requiredChars.push(getRandomChar(filterCharset(CHARACTER_SETS.NUMBERS, options)));
    }
    if (options.includeSymbols) {
        requiredChars.push(getRandomChar(filterCharset(CHARACTER_SETS.SYMBOLS, options)));
    }

    // Add required characters first
    const charsToAdd = Math.min(requiredChars.length, options.length);
    for (let i = 0; i < charsToAdd; i++) {
        password += requiredChars[i];
    }

    // Fill remaining length with random characters
    for (let i = password.length; i < options.length; i++) {
        password += getRandomChar(charset);
    }

    // Shuffle the password to avoid predictable patterns
    password = shuffleString(password);

    // Split into segments after N characters if requested (0 means no segments)
    if (options.segmentAfterChars > 0) {
        const segments: string[] = [];
        for (let i = 0; i < password.length; i += options.segmentAfterChars) {
            segments.push(password.substring(i, i + options.segmentAfterChars));
        }
        return segments.join('-');
    }

    return password;
}

/**
 * Calculate password entropy in bits
 */
export function calculateEntropy(password: string, charset: string): number {
    const charsetSize = new Set(charset).size;
    return Math.log2(charsetSize) * password.length;
}

/**
 * Determine password strength based on entropy
 */
export function getPasswordStrength(entropy: number): PasswordStrength {
    if (entropy >= STRENGTH_THRESHOLDS.VERY_STRONG) return 'very-strong';
    if (entropy >= STRENGTH_THRESHOLDS.STRONG) return 'strong';
    if (entropy >= STRENGTH_THRESHOLDS.MEDIUM) return 'medium';
    return 'weak';
}

/**
 * Get the charset used for a given set of options
 */
export function getCharsetForOptions(options: PasswordOptions): string {
    let charset = '';

    if (options.includeUppercase) charset += CHARACTER_SETS.UPPERCASE;
    if (options.includeLowercase) charset += CHARACTER_SETS.LOWERCASE;
    if (options.includeNumbers) charset += CHARACTER_SETS.NUMBERS;
    if (options.includeSymbols) charset += CHARACTER_SETS.SYMBOLS;

    if (options.excludeSimilar) {
        charset = charset.split('').filter(char => !CHARACTER_SETS.SIMILAR.includes(char)).join('');
    }

    if (options.excludeAmbiguous) {
        charset = charset.split('').filter(char => !CHARACTER_SETS.AMBIGUOUS.includes(char)).join('');
    }

    return charset;
}

/**
 * Generate a complete password object with strength analysis
 */
export function generatePasswordWithAnalysis(options: PasswordOptions): GeneratedPassword {
    const password = generatePassword(options);
    const charset = getCharsetForOptions(options);
    const entropy = calculateEntropy(password, charset);
    const strength = getPasswordStrength(entropy);

    return {
        password,
        strength,
        entropy: Math.round(entropy * 100) / 100, // Round to 2 decimal places
    };
}

/**
 * Validate password options
 */
export function validateOptions(options: PasswordOptions): string[] {
    const errors: string[] = [];

    if (options.length < 1) {
        errors.push('Password length must be at least 1');
    }

    if (options.length > 1000) {
        errors.push('Password length cannot exceed 1000 characters');
    }

    if (!options.includeUppercase && !options.includeLowercase &&
        !options.includeNumbers && !options.includeSymbols) {
        errors.push('At least one character type must be selected');
    }

    return errors;
}

// Helper functions

function getRandomChar(charset: string): string {
    const randomIndex = Math.floor(Math.random() * charset.length);
    return charset[randomIndex];
}

function filterCharset(charset: string, options: PasswordOptions): string {
    let filtered = charset;

    if (options.excludeSimilar) {
        filtered = filtered.split('').filter(char => !CHARACTER_SETS.SIMILAR.includes(char)).join('');
    }

    if (options.excludeAmbiguous) {
        filtered = filtered.split('').filter(char => !CHARACTER_SETS.AMBIGUOUS.includes(char)).join('');
    }

    return filtered;
}

function shuffleString(str: string): string {
    const array = str.split('');
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array.join('');
}