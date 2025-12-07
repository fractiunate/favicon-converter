// CIDR Calculator Types

export interface CIDRRange {
    id: string;
    cidr: string;
    networkAddress: string;
    broadcastAddress: string;
    firstUsable: string;
    lastUsable: string;
    subnetMask: string;
    wildcardMask: string;
    totalHosts: number;
    usableHosts: number;
    prefixLength: number;
    ipClass: string;
    isPrivate: boolean;
    binaryNetwork: string;
}

export interface CIDROverlap {
    range1Id: string;
    range2Id: string;
    range1Cidr: string;
    range2Cidr: string;
    overlapType: "contains" | "contained" | "partial";
}

export interface SuggestedRange {
    cidr: string;
    reason: string;
    totalHosts: number;
    usableHosts: number;
}

export interface CIDRValidationResult {
    valid: boolean;
    error?: string;
}

export interface ParsedCIDR {
    ip: number[];
    prefixLength: number;
    networkInt: number;
}
