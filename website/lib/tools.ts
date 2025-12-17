import { FEATURE_FLAGS } from "@/lib/feature-flags";

interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    icon: "Image" | "QrCode" | "Braces" | "FileArchive" | "Palette" | "KeyRound" | "Wrench" | "ShieldCheck" | "Network" | "Timer" | "ListTodo" | "Code";
    href: string;
    available: boolean;
    /** Feature flag that controls this tool's visibility */
    featureFlag?: keyof typeof FEATURE_FLAGS;
}

export interface Tool extends ToolDefinition {
    featureEnabled: boolean;
}

const allTools: ToolDefinition[] = [
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
        description: "Calculate IPv4 & IPv6 subnets, detect overlaps & find available ranges",
        icon: "Network",
        href: "/cidr-calculator",
        available: true,
    },
    {
        id: "pomodoro-timer",
        name: "Pomodoro Timer",
        description: "Boost productivity with customizable focus sessions and breaks",
        icon: "Timer",
        href: "/pomodoro-timer",
        available: true,
        featureFlag: "POMODORO_ENABLED",
    },
    {
        id: "todo-list",
        name: "Todo List",
        description: "Manage tasks with priorities, filters, and progress tracking",
        icon: "ListTodo",
        href: "/todo-list",
        available: true,
        featureFlag: "TODO_LIST_ENABLED",
    },
    {
        id: "code-editor",
        name: "AI Code Editor",
        description: "Write code faster with unlimited AI-powered autocomplete",
        icon: "Code",
        href: "/code-editor",
        available: true,
        featureFlag: "CODE_EDITOR_ENABLED",
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
        description: "Generate secure random passwords with customizable options",
        icon: "KeyRound",
        href: "/password-generator",
        available: true,
        featureFlag: "PASSWORD_GENERATOR_ENABLED",
    },
];

export const tools: Tool[] = allTools.map((tool) => ({
    ...tool,
    featureEnabled: !tool.featureFlag || FEATURE_FLAGS[tool.featureFlag],
}));

export function getToolById(id: string): Tool | undefined {
    return tools.find((tool) => tool.id === id);
}
