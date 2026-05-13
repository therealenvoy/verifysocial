'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode, useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Check if Clerk keys are available
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkAvailable = clerkPublishableKey && clerkPublishableKey.startsWith('pk_');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (stored) {
      setTheme(stored);
      if (stored === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Default to light
      localStorage.setItem('theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Content with theme toggle button
  const content = (
    <div className="relative">
      {/* Theme toggle button */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-border hover:bg-elevated-surface transition-colors"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </button>
      {children}
    </div>
  );

  // Wrap with ClerkProvider only if keys are available
  if (clerkAvailable) {
    return (
      <ClerkProvider>
        {content}
      </ClerkProvider>
    );
  }

  // Otherwise, render without authentication (sandbox mode)
  return content;
}