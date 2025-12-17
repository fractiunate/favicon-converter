import { describe, it, expect } from 'vitest';
import {
    generatePassword,
    calculateEntropy,
    getPasswordStrength,
    getCharsetForOptions,
    generatePasswordWithAnalysis,
    validateOptions
} from './utils';
import type { PasswordOptions } from './types';
import { CHARACTER_SETS, DEFAULT_PASSWORD_OPTIONS } from './constants';

describe('Password Utils', () => {
    describe('generatePassword', () => {
        it('should generate password of correct length', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                length: 20,
            };
            const password = generatePassword(options);
            expect(password.length).toBe(20);
        });

        it('should include uppercase when option is enabled', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                includeUppercase: true,
                includeLowercase: false,
                includeNumbers: false,
                includeSymbols: false,
                length: 20,
            };
            const password = generatePassword(options);
            expect(password).toMatch(/[A-Z]/);
        });

        it('should include lowercase when option is enabled', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                includeUppercase: false,
                includeLowercase: true,
                includeNumbers: false,
                includeSymbols: false,
                length: 20,
            };
            const password = generatePassword(options);
            expect(password).toMatch(/[a-z]/);
        });

        it('should include numbers when option is enabled', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                includeUppercase: false,
                includeLowercase: false,
                includeNumbers: true,
                includeSymbols: false,
                length: 20,
            };
            const password = generatePassword(options);
            expect(password).toMatch(/[0-9]/);
        });

        it('should include symbols when option is enabled', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                includeUppercase: false,
                includeLowercase: false,
                includeNumbers: false,
                includeSymbols: true,
                length: 20,
            };
            const password = generatePassword(options);
            expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/);
        });

        it('should exclude similar characters when option is enabled', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                excludeSimilar: true,
                length: 50,
            };
            const password = generatePassword(options);

            // Check that similar characters are not present
            const similarChars = CHARACTER_SETS.SIMILAR.split('');
            similarChars.forEach(char => {
                expect(password).not.toContain(char);
            });
        });

        it('should exclude ambiguous characters when option is enabled', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                excludeAmbiguous: true,
                includeSymbols: true,
                length: 50,
            };
            const password = generatePassword(options);

            // Check that ambiguous characters are not present
            const ambiguousChars = CHARACTER_SETS.AMBIGUOUS.split('');
            ambiguousChars.forEach(char => {
                expect(password).not.toContain(char);
            });
        });

        it('should throw error when no character types are selected', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                includeUppercase: false,
                includeLowercase: false,
                includeNumbers: false,
                includeSymbols: false,
            };

            expect(() => generatePassword(options)).toThrow('No characters available for password generation');
        });

        it('should generate different passwords on multiple calls', () => {
            const options = DEFAULT_PASSWORD_OPTIONS;
            const password1 = generatePassword(options);
            const password2 = generatePassword(options);

            // Very unlikely to be the same with default 16-character password
            expect(password1).not.toBe(password2);
        });
    });

    describe('calculateEntropy', () => {
        it('should calculate entropy correctly for simple charset', () => {
            const password = 'abcd';
            const charset = 'abcd';
            const entropy = calculateEntropy(password, charset);

            // log2(4) * 4 = 2 * 4 = 8
            expect(entropy).toBe(8);
        });

        it('should calculate entropy correctly for larger charset', () => {
            const password = 'Test123!';
            const charset = CHARACTER_SETS.UPPERCASE + CHARACTER_SETS.LOWERCASE +
                CHARACTER_SETS.NUMBERS + CHARACTER_SETS.SYMBOLS;
            const entropy = calculateEntropy(password, charset);

            // Should be positive and reasonable
            expect(entropy).toBeGreaterThan(0);
            expect(entropy).toBeLessThan(1000);
        });

        it('should return 0 for empty password', () => {
            const entropy = calculateEntropy('', 'abc');
            expect(entropy).toBe(0);
        });
    });

    describe('getPasswordStrength', () => {
        it('should return weak for low entropy', () => {
            expect(getPasswordStrength(10)).toBe('weak');
            expect(getPasswordStrength(24)).toBe('weak');
        });

        it('should return medium for moderate entropy', () => {
            expect(getPasswordStrength(25)).toBe('medium');
            expect(getPasswordStrength(49)).toBe('medium');
        });

        it('should return strong for high entropy', () => {
            expect(getPasswordStrength(50)).toBe('strong');
            expect(getPasswordStrength(74)).toBe('strong');
        });

        it('should return very-strong for very high entropy', () => {
            expect(getPasswordStrength(75)).toBe('very-strong');
            expect(getPasswordStrength(100)).toBe('very-strong');
            expect(getPasswordStrength(150)).toBe('very-strong');
        });
    });

    describe('getCharsetForOptions', () => {
        it('should return correct charset for all options enabled', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                includeUppercase: true,
                includeLowercase: true,
                includeNumbers: true,
                includeSymbols: true,
                excludeSimilar: false,
                excludeAmbiguous: false,
            };

            const charset = getCharsetForOptions(options);
            const expectedCharset = CHARACTER_SETS.UPPERCASE + CHARACTER_SETS.LOWERCASE +
                CHARACTER_SETS.NUMBERS + CHARACTER_SETS.SYMBOLS;

            expect(charset).toBe(expectedCharset);
        });

        it('should exclude similar characters when option is enabled', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                excludeSimilar: true,
            };

            const charset = getCharsetForOptions(options);
            const similarChars = CHARACTER_SETS.SIMILAR.split('');

            similarChars.forEach(char => {
                expect(charset).not.toContain(char);
            });
        });

        it('should return only numbers when only numbers are enabled', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                includeUppercase: false,
                includeLowercase: false,
                includeNumbers: true,
                includeSymbols: false,
            };

            const charset = getCharsetForOptions(options);
            expect(charset).toBe(CHARACTER_SETS.NUMBERS);
        });
    });

    describe('generatePasswordWithAnalysis', () => {
        it('should return complete password object', () => {
            const options = DEFAULT_PASSWORD_OPTIONS;
            const result = generatePasswordWithAnalysis(options);

            expect(result).toHaveProperty('password');
            expect(result).toHaveProperty('strength');
            expect(result).toHaveProperty('entropy');

            expect(typeof result.password).toBe('string');
            expect(result.password.length).toBe(options.length);
            expect(['weak', 'medium', 'strong', 'very-strong']).toContain(result.strength);
            expect(typeof result.entropy).toBe('number');
            expect(result.entropy).toBeGreaterThan(0);
        });

        it('should have entropy rounded to 2 decimal places', () => {
            const options = DEFAULT_PASSWORD_OPTIONS;
            const result = generatePasswordWithAnalysis(options);

            // Check that entropy doesn't have more than 2 decimal places
            const decimalPart = result.entropy.toString().split('.')[1];
            if (decimalPart) {
                expect(decimalPart.length).toBeLessThanOrEqual(2);
            }
        });
    });

    describe('validateOptions', () => {
        it('should return no errors for valid options', () => {
            const options = DEFAULT_PASSWORD_OPTIONS;
            const errors = validateOptions(options);
            expect(errors).toHaveLength(0);
        });

        it('should return error for length less than 1', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                length: 0,
            };
            const errors = validateOptions(options);
            expect(errors).toContain('Password length must be at least 1');
        });

        it('should return error for length greater than 1000', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                length: 1001,
            };
            const errors = validateOptions(options);
            expect(errors).toContain('Password length cannot exceed 1000 characters');
        });

        it('should return error when no character types are selected', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                includeUppercase: false,
                includeLowercase: false,
                includeNumbers: false,
                includeSymbols: false,
            };
            const errors = validateOptions(options);
            expect(errors).toContain('At least one character type must be selected');
        });

        it('should return multiple errors when multiple issues exist', () => {
            const options: PasswordOptions = {
                ...DEFAULT_PASSWORD_OPTIONS,
                length: 0,
                includeUppercase: false,
                includeLowercase: false,
                includeNumbers: false,
                includeSymbols: false,
            };
            const errors = validateOptions(options);
            expect(errors.length).toBeGreaterThan(1);
        });
    });
});