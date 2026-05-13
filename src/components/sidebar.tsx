'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Inbox, 
  Users, 
  BarChart3, 
  Settings, 
  MessageSquare,
  FileText,
  CreditCard,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Creators', href: '/creators', icon: Users },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Content', href: '/content', icon: FileText },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const secondaryNavigation = [
  { name: 'Help & Docs', href: '/help', icon: HelpCircle },
  { name: 'Sandbox', href: '/sandbox', icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500" />
          <span className="text-xl font-bold text-gray-900">Fansly CRM</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        <div className="text-xs font-semibold uppercase text-gray-500 px-4 mb-2">
          Main
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-l-4 border-purple-500'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn(
                'mr-3 h-5 w-5',
                isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'
              )} />
              {item.name}
            </Link>
          );
        })}
        
        <div className="pt-6">
          <div className="text-xs font-semibold uppercase text-gray-500 px-4 mb-2">
            Tools
          </div>
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-300" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName || user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </div>
  );
}