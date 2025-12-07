import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CIDR Calculator",
    description:
        "Calculate CIDR ranges, detect overlaps, and find available IP blocks. Subnet calculator with network address, broadcast, usable hosts. 100% client-side.",
    openGraph: {
        title: "CIDR Calculator | Client-Side Tools",
        description:
            "Calculate CIDR ranges, detect overlaps, and find available subnets. Network planning made easy. Runs entirely in your browser.",
        url: "https://fractiunate.me/client-tools/cidr-calculator",
    },
    twitter: {
        title: "CIDR Calculator | Client-Side Tools",
        description:
            "CIDR calculator with overlap detection and subnet suggestions. 100% private.",
    },
};

export default function CIDRCalculatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
