export interface Tool {
    id: string;
    name: string;
    description: string;
    icon: "Image" | "QrCode" | "Braces" | "FileArchive" | "Palette" | "KeyRound" | "Wrench" | "ShieldCheck" | "Network";
    href: string;
    available: boolean;
}

export const tools: Tool[] = [
    {
        id: "favicon-converter",
        name: "Favicon Converter",
        description: "Convert images to ICO, PNG, Apple Touch Icons & Android Chrome icons",
        icon: "Image",
        href: "/favicon-converter",
        available: true,
    },
    {
        id: "qr-generator",
        name: "QR Code Generator",
        description: "Generate QR codes for text, URLs, WiFi & vCards with custom colors",
        icon: "QrCode",
        href: "/qr-generator",
        available: true,
    },
    {
        id: "cert-generator",
        name: "TLS Certificate Generator",
        description: "Generate self-signed TLS/SSL certificates with RSA or ECDSA keys",
        icon: "ShieldCheck",
        href: "/cert-generator",
        available: true,
    },
    {
        id: "json-formatter",
        name: "JSON & YAML Formatter",
        description: "Format, validate & convert between JSON and YAML formats",
        icon: "Braces",
        href: "/json-formatter",
        available: true,
    },
    {
        id: "cidr-calculator",
        name: "CIDR Calculator",
        description: "Calculate subnets, detect overlaps & find available IP ranges",
        icon: "Network",
        href: "/cidr-calculator",
        available: true,
    },
    {
        id: "image-compressor",
        name: "Image Compressor",
        description: "Compress images without quality loss",
        icon: "FileArchive",
        href: "/image-compressor",
        available: false,
    },
    {
        id: "color-converter",
        name: "Color Converter",
        description: "Convert between HEX, RGB, HSL",
        icon: "Palette",
        href: "/color-converter",
        available: false,
    },
    {
        id: "password-generator",
        name: "Password Generator",
        description: "Generate secure random passwords",
        icon: "KeyRound",
        href: "/password-generator",
        available: false,
    },
];

export function getToolById(id: string): Tool | undefined {
    return tools.find((tool) => tool.id === id);
}
