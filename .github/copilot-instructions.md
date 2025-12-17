# GitHub Copilot Instructions for Frontend Website

## Project Overview
This is a Next.js 16 frontend application using shadcn/ui for components. It provides a suite of client-side tools (Favicon Converter, QR Generator, CIDR Calculator, JSON/YAML Formatter, TLS Certificate Generator, Pomodoro Timer, Todo List).

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Node**: Use Node Version 24 and **NVM** to switch versions `nvm use 24`

## Code Guidelines

### Component Usage
- **Always use shadcn/ui components** when available instead of building custom ones
- Install new shadcn components using: `npx shadcn@latest add <component-name>`
- Check existing components in `components/ui/` before creating new ones
- Reuse existing components when adequate - avoid duplicating functionality

### shadcn/ui Components
Common components to prefer:
- `Button` for all clickable actions
- `Input`, `Textarea`, `Select` for form inputs
- `Card` for content containers
- `Dialog` for modals
- `Sheet` for side panels
- Use the `sonner` component instead for notifications
- `Dropdown` for menus
- `Table` for data display

### NPM Packages
- Use only well-maintained packages with good community support
- Prefer lightweight packages to minimize bundle size
- Avoid adding packages that duplicate existing functionality
- only use packages that are compatible with Next.js and TypeScript
- Regularly review dependencies for updates and security patches
- Remove unused packages to keep the project clean

### File Structure
- Place page components in `app/` directory (each tool has its own folder with `page.tsx` and `layout.tsx`)
- Place reusable components in `components/` directory
- Place shadcn/ui components in `components/ui/` directory
- Place utilities in `lib/` directory
- Place service/business logic in `services/<tool-name>/` directory with:
  - `types.ts` - Type definitions
  - `constants.ts` - Constants and configuration
  - `utils.ts` - Utility functions
  - `index.ts` - Main exports

### Feature Flags
- Use `/lib/feature-flags.ts` for code-level feature toggles
- Feature flags are NOT user-configurable - they are code-level settings
- When adding a new feature that should be toggleable, add a flag and use it in:
  - `/lib/tools.ts` - to show/hide from tools list
  - Relevant components - to conditionally render UI
- Available flags: `POMODORO_ENABLED`, `WORKSPACES_ENABLED`, `ZEN_MODE_ENABLED`, `TODO_LIST_ENABLED`

### Context Providers
- Global state uses React Context (see `/lib/` for providers)
- Use "safe" hook variants when component might render outside provider:
  - `usePomodoroContextSafe()` returns null if no provider
  - `useWorkspaceSafe()` returns null if no provider
  - `useToolWorkspace()` handles missing provider gracefully
- Wrap providers conditionally based on feature flags in `/app/layout.tsx`

### Workspace Integration
- Tools can persist state to workspaces using `useToolWorkspace<T>(toolId)` hook
- Returns `{ isActive, data, save, update, clear }` for managing tool data
- Always fallback to localStorage when workspace is not active
- Define workspace data types in service `types.ts` (e.g., `TodoWorkspaceData`)

### Styling
- Use Tailwind CSS utility classes
- Follow the shadcn/ui theming system with CSS variables
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- Prefer dark mode compatible styles using `dark:` variants
- Support Zen Mode by checking `useZenMode()` and hiding non-essential UI

### TypeScript
- Always use TypeScript with proper type definitions
- Define interfaces for component props
- Use strict type checking
- Export types from service `types.ts` files

### Next.js Conventions
- Use App Router patterns (not Pages Router)
- Prefer Server Components by default
- Add `"use client"` directive only when needed (interactivity, hooks)
- Use Next.js `Image` component for optimized images
- Use Next.js `Link` component for navigation
- Add SEO metadata in `layout.tsx` files

### Adding New Tools
1. Create service in `/services/<tool-name>/` with types, constants, utils, index
2. Create component in `/components/<tool-name>.tsx`
3. Create page in `/app/<tool-name>/page.tsx` and `layout.tsx`
4. Add tool to `/lib/tools.ts` with icon (add icon to `site-header.tsx` iconMap)
5. Optionally add feature flag in `/lib/feature-flags.ts`

### Audio/Sound Effects
- Use Web Audio API for sounds (see Pomodoro context for examples)
- Create oscillator-based sounds for notifications
- Keep sounds short and subtle
- Always wrap in try/catch for unsupported browsers

### Code Quality
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use meaningful variable and function names
- Add comments for complex code and reused logic where necessary

## Unit Tests
- Dont Test Constants
- Focus on testing isolated business logic and utility functions
- use vitest to run unit tests
- Place tests in service directories (e.g., `utils.test.ts`, `validation.test.ts`)