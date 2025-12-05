export interface Tool {
    id: string;
    name: string;
    description: string;
    icon: "Image" | "QrCode" | "Braces" | "FileArchive" | "Palette" | "KeyRound" | "Wrench";
    href: string;
    available: boolean;
}

export const tools: Tool[] = [
    {
        id: "favicon-converter",
        name: "Favicon Converter",
        description: "Convert images to all favicon formats",
        icon: "Image",
        href: "/favicon-converter",
        available: true,
    },
    {
        id: "qr-generator",
        name: "QR Code Generator",
        description: "Generate QR codes from text or URLs",
        icon: "QrCode",
        href: "/qr-generator",
        available: true,
    },
    {
        id: "json-formatter",
        name: "JSON Formatter",
        description: "Format and validate JSON",
        icon: "Braces",
        href: "/json-formatter",
        available: false,
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
