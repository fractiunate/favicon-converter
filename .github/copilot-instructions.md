# GitHub Copilot Instructions for Frontend Website

## Project Overview
This is a Next.js 16 frontend application using shadcn/ui for components.

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

### File Structure
- Place page components in `app/` directory
- Place reusable components in `components/` directory
- Place shadcn/ui components in `components/ui/` directory
- Place utilities in `lib/` directory

### Styling
- Use Tailwind CSS utility classes
- Follow the shadcn/ui theming system with CSS variables
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- Prefer dark mode compatible styles using `dark:` variants

### TypeScript
- Always use TypeScript with proper type definitions
- Define interfaces for component props
- Use strict type checking

### Next.js Conventions
- Use App Router patterns (not Pages Router)
- Prefer Server Components by default
- Add `"use client"` directive only when needed (interactivity, hooks)
- Use Next.js `Image` component for optimized images
- Use Next.js `Link` component for navigation

### Code Quality
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use meaningful variable and function names
- Add comments for complex code and reused logic where necessary
