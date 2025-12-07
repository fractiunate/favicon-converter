// CIDR Calculator Utility Functions

import type { CIDRRange, ParsedCIDR } from "./types";
import { PRIVATE_RANGES, IP_CLASSES, BITS_PER_OCTET } from "./constants";

/**
 * Parse an IP address string to an array of octets
 */
export function parseIP(ip: string): number[] {
    return ip.split(".").map(Number);
}

/**
 * Convert an array of octets to an IP string
 */
export function octetsToIP(octets: number[]): string {
    return octets.join(".");
}

/**
 * Convert an IP array to a 32-bit integer
 */
export function ipToInt(octets: number[]): number {
    return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

/**
 * Convert a 32-bit integer to an IP array
 */
export function intToOctets(int: number): number[] {
    return [
        (int >>> 24) & 255,
        (int >>> 16) & 255,
        (int >>> 8) & 255,
        int & 255,
    ];
}

/**
 * Convert a 32-bit integer to an IP string
 */
export function intToIP(int: number): string {
    return octetsToIP(intToOctets(int));
}

/**
 * Calculate the subnet mask from prefix length
 */
export function prefixToMask(prefix: number): number {
    if (prefix === 0) return 0;
    return (~0 << (32 - prefix)) >>> 0;
}

/**
 * Convert prefix length to dotted decimal subnet mask
 */
export function prefixToSubnetMask(prefix: number): string {
    const mask = prefixToMask(prefix);
    return intToIP(mask);
}

/**
 * Convert prefix length to wildcard mask
 */
export function prefixToWildcardMask(prefix: number): string {
    const mask = prefixToMask(prefix);
    const wildcard = (~mask) >>> 0;
    return intToIP(wildcard);
}

/**
 * Calculate the number of total hosts in a subnet
 */
export function calculateTotalHosts(prefix: number): number {
    if (prefix === 32) return 1;
    return Math.pow(2, 32 - prefix);
}

/**
 * Calculate the number of usable hosts in a subnet
 */
export function calculateUsableHosts(prefix: number): number {
    if (prefix >= 31) return prefix === 32 ? 1 : 2;
    return Math.pow(2, 32 - prefix) - 2;
}

/**
 * Get the network address from an IP and prefix
 */
export function getNetworkAddress(ipInt: number, prefix: number): number {
    const mask = prefixToMask(prefix);
    return (ipInt & mask) >>> 0;
}

/**
 * Get the broadcast address from an IP and prefix
 */
export function getBroadcastAddress(ipInt: number, prefix: number): number {
    const mask = prefixToMask(prefix);
    const wildcard = (~mask) >>> 0;
    const network = (ipInt & mask) >>> 0;
    return (network | wildcard) >>> 0;
}

/**
 * Get the first usable host address
 */
export function getFirstUsableAddress(networkInt: number, prefix: number): number {
    if (prefix >= 31) return networkInt;
    return networkInt + 1;
}

/**
 * Get the last usable host address
 */
export function getLastUsableAddress(broadcastInt: number, prefix: number): number {
    if (prefix >= 31) return broadcastInt;
    return broadcastInt - 1;
}

/**
 * Convert an IP integer to binary string
 */
export function ipToBinary(ipInt: number): string {
    return ipInt.toString(2).padStart(32, "0");
}

/**
 * Format binary string with dots between octets
 */
export function formatBinaryIP(binary: string): string {
    return [
        binary.slice(0, 8),
        binary.slice(8, 16),
        binary.slice(16, 24),
        binary.slice(24, 32),
    ].join(".");
}

/**
 * Determine the IP class
 */
export function getIPClass(firstOctet: number): string {
    for (const ipClass of IP_CLASSES) {
        if (firstOctet >= ipClass.start && firstOctet <= ipClass.end) {
            return ipClass.class;
        }
    }
    return "Unknown";
}

/**
 * Check if an IP is in a private range
 */
export function isPrivateIP(ipInt: number): boolean {
    for (const range of PRIVATE_RANGES) {
        const startInt = ipToInt(parseIP(range.start));
        const endInt = ipToInt(parseIP(range.end));
        if (ipInt >= startInt && ipInt <= endInt) {
            return true;
        }
    }
    return false;
}

/**
 * Parse a CIDR string into components
 */
export function parseCIDR(cidr: string): ParsedCIDR {
    const [ipStr, prefixStr] = cidr.split("/");
    const ip = parseIP(ipStr);
    const prefixLength = parseInt(prefixStr, 10);
    const networkInt = getNetworkAddress(ipToInt(ip), prefixLength);

    return {
        ip,
        prefixLength,
        networkInt,
    };
}

/**
 * Generate a unique ID for a CIDR range
 */
export function generateRangeId(): string {
    return `cidr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate full CIDR range information
 */
export function calculateCIDRRange(cidr: string): CIDRRange {
    const [ipStr, prefixStr] = cidr.split("/");
    const prefix = parseInt(prefixStr, 10);
    const octets = parseIP(ipStr);
    const ipInt = ipToInt(octets);

    const networkInt = getNetworkAddress(ipInt, prefix);
    const broadcastInt = getBroadcastAddress(ipInt, prefix);
    const firstUsableInt = getFirstUsableAddress(networkInt, prefix);
    const lastUsableInt = getLastUsableAddress(broadcastInt, prefix);

    return {
        id: generateRangeId(),
        cidr: `${intToIP(networkInt)}/${prefix}`,
        networkAddress: intToIP(networkInt),
        broadcastAddress: intToIP(broadcastInt),
        firstUsable: intToIP(firstUsableInt),
        lastUsable: intToIP(lastUsableInt),
        subnetMask: prefixToSubnetMask(prefix),
        wildcardMask: prefixToWildcardMask(prefix),
        totalHosts: calculateTotalHosts(prefix),
        usableHosts: calculateUsableHosts(prefix),
        prefixLength: prefix,
        ipClass: getIPClass(octets[0]),
        isPrivate: isPrivateIP(networkInt),
        binaryNetwork: formatBinaryIP(ipToBinary(networkInt)),
    };
}

/**
 * Normalize a CIDR to its network address
 */
export function normalizeCIDR(cidr: string): string {
    const [ipStr, prefixStr] = cidr.split("/");
    const prefix = parseInt(prefixStr, 10);
    const octets = parseIP(ipStr);
    const ipInt = ipToInt(octets);
    const networkInt = getNetworkAddress(ipInt, prefix);
    return `${intToIP(networkInt)}/${prefix}`;
}
