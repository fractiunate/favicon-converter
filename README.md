# Client-Side Tools

A collection of fast, free, and privacy-friendly web tools that run entirely in your browser. No data ever leaves your device.

## 🛠️ Available Tools

### Favicon Converter
Convert images to all favicon formats needed for modern web development.
- **Input Formats**: PNG, JPG, JPEG, GIF, WebP, SVG, ICO
- **Output Formats**: ICO, PNG (16x16 to 512x512), Apple Touch Icons, Android Chrome Icons
- **Bulk Download**: Download all formats as a ZIP file

### QR Code Generator
Generate QR codes for various use cases with customization options.
- **Content Types**: Text, URLs, WiFi credentials, vCards
- **Customization**: Custom colors, sizes, and error correction levels
- **Export**: Download as PNG or SVG

### TLS Certificate Generator
Generate self-signed TLS/SSL certificates for development and testing.
- **Key Types**: RSA (2048, 4096) or ECDSA (P-256, P-384, P-521)
- **Formats**: PEM certificates and private keys
- **Options**: Custom validity period, subject details, and SANs

### JSON & YAML Formatter
Format, validate, and convert between JSON and YAML formats.
- **Features**: Syntax validation, pretty printing, minification
- **Conversion**: JSON ↔ YAML bidirectional conversion
- **Options**: Configurable indentation and formatting styles

### CIDR Calculator
Calculate and analyze IPv4 and IPv6 subnets.
- **Calculations**: Network address, broadcast, usable hosts, wildcard mask
- **Analysis**: Subnet overlap detection, available range finder
- **Support**: Both IPv4 and IPv6 CIDR notation

### Pomodoro Timer
Boost productivity with customizable focus sessions and breaks.
- **Technique**: Classic Pomodoro with configurable durations
- **Features**: Auto-start options, session tracking, sound notifications
- **Workspace Integration**: Save timer state per workspace, persistent across page refreshes
- **UI**: Global sticky playbar, zen mode support

## ✨ Key Features

- 🔒 **Privacy First** - All processing happens locally in your browser
- ⚡ **Fast & Free** - No upload limits, no sign-up required
- 🌐 **Offline Capable** - Works without internet after initial load
- 🎨 **Dark Mode** - Full dark mode support
- 💾 **Workspaces** - Save and organize your work across sessions
- 🧘 **Zen Mode** - Distraction-free interface for focused work

## 🚀 Getting Started

### Prerequisites

- Node.js 24+ (use `nvm use 24`)
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone git@github.com:fractiunate/favicon-converter.git
cd favicon-converter/website

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

### Testing

```bash
# Run tests
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Testing**: Vitest with Testing Library

## 📁 Project Structure

```
website/
├── app/                 # Next.js App Router pages
│   ├── favicon-converter/
│   ├── qr-generator/
│   ├── cert-generator/
│   ├── json-formatter/
│   ├── cidr-calculator/
│   └── pomodoro-timer/
├── components/          # React components
│   └── ui/             # shadcn/ui components
├── lib/                # Utilities and contexts
└── services/           # Business logic and tests
    ├── favicon/
    ├── qr/
    ├── cert/
    ├── json-yaml/
    ├── cidr/
    ├── pomodoro/
    └── workspace/
```

## 📄 License

MIT

## 👤 Author

**Fractiunate** - [Website](https://fractiunate.me) • [GitHub](https://github.com/Fractiunate)