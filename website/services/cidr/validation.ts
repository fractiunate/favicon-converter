// CIDR Validation Functions

import type { CIDRValidationResult } from "./types";
import { MAX_IP_VALUE, MIN_PREFIX_LENGTH, MAX_PREFIX_LENGTH, IP_OCTETS } from "./constants";

/**
 * Validate an IP address string
 */
export function validateIPAddress(ip: string): CIDRValidationResult {
    if (!ip || typeof ip !== "string") {
        return { valid: false, error: "IP address is required" };
    }

    const trimmed = ip.trim();
    if (!trimmed) {
        return { valid: false, error: "IP address cannot be empty" };
    }

    const octets = trimmed.split(".");
    if (octets.length !== IP_OCTETS) {
        return { valid: false, error: "IP address must have exactly 4 octets" };
    }

    for (let i = 0; i < octets.length; i++) {
        const octet = octets[i];

        // Check for empty octet
        if (!octet) {
            return { valid: false, error: `Octet ${i + 1} is empty` };
        }

        // Check for leading zeros (except for "0" itself)
        if (octet.length > 1 && octet.startsWith("0")) {
            return { valid: false, error: `Octet ${i + 1} has leading zeros` };
        }

        // Check if it's a valid number
        if (!/^\d+$/.test(octet)) {
            return { valid: false, error: `Octet ${i + 1} is not a valid number` };
        }

        const value = parseInt(octet, 10);
        if (isNaN(value) || value < 0 || value > MAX_IP_VALUE) {
            return { valid: false, error: `Octet ${i + 1} must be between 0 and ${MAX_IP_VALUE}` };
        }
    }

    return { valid: true };
}

/**
 * Validate a prefix length
 */
export function validatePrefixLength(prefix: number | string): CIDRValidationResult {
    const prefixNum = typeof prefix === "string" ? parseInt(prefix, 10) : prefix;

    if (isNaN(prefixNum)) {
        return { valid: false, error: "Prefix length must be a number" };
    }

    if (!Number.isInteger(prefixNum)) {
        return { valid: false, error: "Prefix length must be an integer" };
    }

    if (prefixNum < MIN_PREFIX_LENGTH || prefixNum > MAX_PREFIX_LENGTH) {
        return { valid: false, error: `Prefix length must be between ${MIN_PREFIX_LENGTH} and ${MAX_PREFIX_LENGTH}` };
    }

    return { valid: true };
}

/**
 * Validate a CIDR notation string (e.g., "192.168.1.0/24")
 * If no prefix is given, assumes /32 (single IP)
 */
export function validateCIDR(cidr: string): CIDRValidationResult {
    if (!cidr || typeof cidr !== "string") {
        return { valid: false, error: "CIDR notation is required" };
    }

    const trimmed = cidr.trim();
    if (!trimmed) {
        return { valid: false, error: "CIDR notation cannot be empty" };
    }

    const parts = trimmed.split("/");

    // If no prefix given, treat as single IP (/32)
    if (parts.length === 1) {
        const ipValidation = validateIPAddress(parts[0]);
        if (!ipValidation.valid) {
            return ipValidation;
        }
        return { valid: true };
    }

    if (parts.length !== 2) {
        return { valid: false, error: "CIDR must be in format IP/prefix (e.g., 192.168.1.0/24)" };
    }

    const [ip, prefix] = parts;

    const ipValidation = validateIPAddress(ip);
    if (!ipValidation.valid) {
        return ipValidation;
    }

    const prefixValidation = validatePrefixLength(prefix);
    if (!prefixValidation.valid) {
        return prefixValidation;
    }

    return { valid: true };
}

/**
 * Normalize CIDR input - adds /32 if no prefix given
 */
export function normalizeCIDRInput(cidr: string): string {
    const trimmed = cidr.trim();
    if (!trimmed.includes("/")) {
        return `${trimmed}/32`;
    }
    return trimmed;
}

/**
 * Check if a CIDR is properly aligned (network address matches the prefix)
 */
export function validateCIDRAlignment(cidr: string): CIDRValidationResult {
    const basicValidation = validateCIDR(cidr);
    if (!basicValidation.valid) {
        return basicValidation;
    }

    const [ip, prefixStr] = cidr.split("/");
    const prefix = parseInt(prefixStr, 10);
    const octets = ip.split(".").map(Number);

    // Calculate the network address (use >>> 0 to ensure unsigned)
    const ipInt = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const networkInt = (ipInt & mask) >>> 0;

    if (ipInt !== networkInt) {
        // Calculate what the correct network address should be
        const correctOctets = [
            (networkInt >>> 24) & 255,
            (networkInt >>> 16) & 255,
            (networkInt >>> 8) & 255,
            networkInt & 255,
        ];
        const correctNetwork = correctOctets.join(".");
        return {
            valid: false,
            error: `IP address is not aligned with the prefix. Did you mean ${correctNetwork}/${prefix}?`,
        };
    }

    return { valid: true };
}
