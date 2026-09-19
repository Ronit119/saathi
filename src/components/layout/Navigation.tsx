'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HelpCircle, ListOrdered, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/ask', label: 'Ask Saathi', icon: HelpCircle },
  { href: '/guides', label: 'Guides', icon: ListOrdered },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      className="w-full bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs"
      aria-label="Main Navigation"
    >
      <div className="max-w-5xl mx-auto px-2 sm:px-4">
        <ul className="flex items-center justify-around sm:justify-start sm:gap-2 py-1 sm:py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href} className="flex-1 sm:flex-initial">
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold transition-colors min-h-[48px] text-center border-2',
                    isActive
                      ? 'bg-amber-100/70 text-amber-900 border-amber-600 shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100 border-transparent hover:border-stone-300'
                  )}
                >
                  <Icon
                    className={cn('w-6 h-6', isActive ? 'text-amber-800' : 'text-stone-600')}
                    aria-hidden="true"
                  />
                  <span className="text-sm sm:text-base tracking-tight">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
