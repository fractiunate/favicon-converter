import { describe, it, expect } from "vitest";
import {
    checkOverlap,
    findAllOverlaps,
    findNextAvailableBlock,
    suggestRanges,
    splitCIDR,
    canMergeCIDRs,
    calculateSupernet,
} from "./calculator";
import { calculateCIDRRange } from "./utils";

describe("CIDR Calculator", () => {
    describe("checkOverlap", () => {
        it("should detect when range1 contains range2", () => {
            const range1 = calculateCIDRRange("10.0.0.0/8");
            const range2 = calculateCIDRRange("10.1.0.0/16");

            const overlap = checkOverlap(range1, range2);
            expect(overlap).not.toBeNull();
            expect(overlap?.overlapType).toBe("contains");
        });

        it("should detect when range2 contains range1", () => {
            const range1 = calculateCIDRRange("10.1.0.0/16");
            const range2 = calculateCIDRRange("10.0.0.0/8");

            const overlap = checkOverlap(range1, range2);
            expect(overlap).not.toBeNull();
            expect(overlap?.overlapType).toBe("contained");
        });

        it("should return null for non-overlapping ranges", () => {
            const range1 = calculateCIDRRange("192.168.1.0/24");
            const range2 = calculateCIDRRange("192.168.2.0/24");

            const overlap = checkOverlap(range1, range2);
            expect(overlap).toBeNull();
        });

        it("should detect partial overlap", () => {
            const range1 = calculateCIDRRange("192.168.0.0/23"); // .0.0 - .1.255
            const range2 = calculateCIDRRange("192.168.1.0/24"); // .1.0 - .1.255

            const overlap = checkOverlap(range1, range2);
            expect(overlap).not.toBeNull();
        });

        it("should not overlap adjacent ranges", () => {
            const range1 = calculateCIDRRange("192.168.0.0/24"); // ends at .0.255
            const range2 = calculateCIDRRange("192.168.1.0/24"); // starts at .1.0

            const overlap = checkOverlap(range1, range2);
            expect(overlap).toBeNull();
        });
    });

    describe("findAllOverlaps", () => {
        it("should find no overlaps in non-overlapping ranges", () => {
            const ranges = [
                calculateCIDRRange("192.168.1.0/24"),
                calculateCIDRRange("192.168.2.0/24"),
                calculateCIDRRange("192.168.3.0/24"),
            ];

            const overlaps = findAllOverlaps(ranges);
            expect(overlaps).toHaveLength(0);
        });

        it("should find overlaps in overlapping ranges", () => {
            const ranges = [
                calculateCIDRRange("10.0.0.0/8"),
                calculateCIDRRange("10.1.0.0/16"),
                calculateCIDRRange("10.1.1.0/24"),
            ];

            const overlaps = findAllOverlaps(ranges);
            expect(overlaps.length).toBeGreaterThan(0);
        });

        it("should return empty array for empty input", () => {
            expect(findAllOverlaps([])).toHaveLength(0);
        });

        it("should return empty array for single range", () => {
            const ranges = [calculateCIDRRange("192.168.1.0/24")];
            expect(findAllOverlaps(ranges)).toHaveLength(0);
        });
    });

    describe("splitCIDR", () => {
        it("should split /24 into two /25s", () => {
            const subnets = splitCIDR("192.168.1.0/24", 25);
            expect(subnets).toHaveLength(2);
            expect(subnets[0]).toBe("192.168.1.0/25");
            expect(subnets[1]).toBe("192.168.1.128/25");
        });

        it("should split /24 into four /26s", () => {
            const subnets = splitCIDR("192.168.1.0/24", 26);
            expect(subnets).toHaveLength(4);
            expect(subnets[0]).toBe("192.168.1.0/26");
            expect(subnets[1]).toBe("192.168.1.64/26");
            expect(subnets[2]).toBe("192.168.1.128/26");
            expect(subnets[3]).toBe("192.168.1.192/26");
        });

        it("should return original if new prefix is smaller or equal", () => {
            const subnets = splitCIDR("192.168.1.0/24", 24);
            expect(subnets).toHaveLength(1);
            expect(subnets[0]).toBe("192.168.1.0/24");
        });
    });

    describe("canMergeCIDRs", () => {
        it("should merge adjacent /25s into /24", () => {
            const merged = canMergeCIDRs("192.168.1.0/25", "192.168.1.128/25");
            expect(merged).toBe("192.168.1.0/24");
        });

        it("should merge adjacent /24s into /23", () => {
            const merged = canMergeCIDRs("192.168.0.0/24", "192.168.1.0/24");
            expect(merged).toBe("192.168.0.0/23");
        });

        it("should return null for non-adjacent ranges", () => {
            const merged = canMergeCIDRs("192.168.0.0/24", "192.168.2.0/24");
            expect(merged).toBeNull();
        });

        it("should return null for different prefix lengths", () => {
            const merged = canMergeCIDRs("192.168.0.0/24", "192.168.1.0/25");
            expect(merged).toBeNull();
        });

        it("should return null for non-aligned merge", () => {
            // These are adjacent but can't form a valid larger block
            const merged = canMergeCIDRs("192.168.1.0/24", "192.168.2.0/24");
            expect(merged).toBeNull();
        });
    });

    describe("calculateSupernet", () => {
        it("should return the same CIDR for single input", () => {
            expect(calculateSupernet(["192.168.1.0/24"])).toBe("192.168.1.0/24");
        });

        it("should return null for empty input", () => {
            expect(calculateSupernet([])).toBeNull();
        });

        it("should calculate supernet for multiple CIDRs", () => {
            const supernet = calculateSupernet([
                "192.168.0.0/24",
                "192.168.1.0/24",
            ]);
            expect(supernet).toBe("192.168.0.0/23");
        });

        it("should calculate supernet for non-contiguous CIDRs", () => {
            const supernet = calculateSupernet([
                "192.168.0.0/24",
                "192.168.3.0/24",
            ]);
            // Should find smallest block that contains both
            expect(supernet).toBe("192.168.0.0/22");
        });
    });

    describe("findNextAvailableBlock", () => {
        it("should find available block when no conflicts", () => {
            const block = findNextAvailableBlock(
                0xC0A80000, // 192.168.0.0
                24,
                []
            );
            expect(block).toBe("192.168.1.0/24");
        });

        it("should skip existing ranges", () => {
            const existing = [calculateCIDRRange("192.168.1.0/24")];
            const block = findNextAvailableBlock(
                0xC0A80000, // 192.168.0.0
                24,
                existing
            );
            expect(block).toBe("192.168.2.0/24");
        });
    });

    describe("suggestRanges", () => {
        it("should suggest ranges for empty list", () => {
            const suggestions = suggestRanges([]);
            expect(suggestions.length).toBeGreaterThan(0);
        });

        it("should suggest non-overlapping ranges", () => {
            const existing = [
                calculateCIDRRange("10.0.0.0/24"),
                calculateCIDRRange("10.0.1.0/24"),
            ];
            const suggestions = suggestRanges(existing);

            // All suggestions should not overlap with existing
            for (const suggestion of suggestions) {
                const suggestionRange = calculateCIDRRange(suggestion.cidr);
                const overlaps = findAllOverlaps([...existing, suggestionRange]);
                expect(overlaps).toHaveLength(0);
            }
        });

        it("should include host counts in suggestions", () => {
            const suggestions = suggestRanges([]);
            for (const suggestion of suggestions) {
                expect(suggestion.totalHosts).toBeGreaterThan(0);
                expect(suggestion.usableHosts).toBeGreaterThan(0);
            }
        });
    });
});
