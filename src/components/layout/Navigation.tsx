'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/i18n/context';
import { Home, HelpCircle, ListOrdered, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: '/', labelKey: 'nav.home', icon: Home },
    { href: '/ask', labelKey: 'nav.ask', icon: HelpCircle },
    { href: '/guides', labelKey: 'nav.guides', icon: ListOrdered },
    { href: '/reminders', labelKey: 'nav.reminders', icon: Bell },
    { href: '/settings', labelKey: 'nav.settings', icon: Settings },
  ];

  return (
    <nav
      className="w-full bg-white border-t sm:border-t-0 sm:border-b border-stone-200 fixed bottom-0 left-0 right-0 sm:sticky sm:top-[69px] z-40 shadow-md sm:shadow-xs"
      aria-label="Main Navigation"
    >
      <div className="max-w-5xl mx-auto px-1 sm:px-4">
        <ul className="flex items-center justify-around sm:justify-start sm:gap-2 py-1.5 sm:py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const label = t(item.labelKey);
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
                    'flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-xl font-bold transition-colors min-h-[50px] text-center border-2',
                    isActive
                      ? 'bg-amber-100/80 text-amber-950 border-amber-600 shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100 border-transparent hover:border-stone-300'
                  )}
                >
                  <Icon
                    className={cn('w-5 h-5 sm:w-6 sm:h-6 shrink-0', isActive ? 'text-amber-800 stroke-[2.5]' : 'text-stone-600')}
                    aria-hidden="true"
                  />
                  <span className="text-xs sm:text-base tracking-tight truncate max-w-[70px] sm:max-w-none">
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
