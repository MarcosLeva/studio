
"use client";

import * as React from 'react';
import { QrCode, FileScan, LayoutGrid, BarChart2, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations('DashboardLayout');

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                <QrCode className="h-8 w-8 text-primary" />
                <span className="text-xl font-headline font-semibold">{t('appName')}</span>
              </div>
            </SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.endsWith('/analyze-catalog')}>
                  <Link href="/analyze-catalog">
                    <FileScan />
                    <span>{t('analyzeCatalog')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.endsWith('/categories')}>
                   <Link href="/categories">
                    <LayoutGrid />
                    <span>{t('categories')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.endsWith('/results')}>
                  <Link href="/results">
                    <BarChart2 />
                    <span>{t('results')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.endsWith('/users')}>
                  <Link href="/users">
                    <Users />
                    <span>{t('users')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <div className="relative flex flex-1 flex-col bg-background min-w-0">
          <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              <div className="flex justify-center md:hidden">
                  <Link href="/analyze-catalog" className="flex items-center gap-2">
                      <QrCode className="h-6 w-6 text-primary" />
                      <span className="font-headline font-semibold">{t('appName')}</span>
                  </Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
                <UserNav />
            </div>
          </header>
          <main key={pathname} className="flex-1 overflow-y-auto p-4 sm:p-6 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
