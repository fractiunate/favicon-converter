import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Password Generator - Frontend Tools',
    description: 'Generate secure random passwords with customizable options including length, character types, and exclusions.',
    keywords: ['password generator', 'secure password', 'random password', 'password security', 'entropy'],
};

export default function PasswordGeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}