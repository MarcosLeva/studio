
"use client";

import * as React from 'react';
import { QrCode, FileScan, LayoutGrid, BarChart2, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarClose,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAuthPage = [
    '/login', 
    '/forgot-password', 
    '/reset-password', 
    '/set-password'
  ].some(p => pathname.endsWith(p));

  // The root page also shouldn't have the dashboard layout
  const isRootPage = pathname === '/';

  if (isAuthPage || isRootPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-background">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center justify-between p-2">
              <div className='flex items-center gap-2 group-data-[collapsible=icon]:-ml-1'>
                  <QrCode className="h-8 w-8 text-primary" />
                  <span className="text-xl font-headline font-semibold group-data-[collapsible=icon]:hidden">COCOCO Scan</span>
              </div>
              <SidebarClose />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className='px-2'>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/analyze-catalog'} tooltip="Analizar Catálogo">
                  <Link href="/analyze-catalog">
                    <FileScan />
                    <span>Analizar Catálogo</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/categories'} tooltip="Categorías">
                   <Link href="/categories">
                    <LayoutGrid />
                    <span>Categorías</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/results'} tooltip="Resultados Escaneados">
                  <Link href="/results">
                    <BarChart2 />
                    <span>Resultados Escaneados</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/users')} tooltip="Usuarios">
                  <Link href="/users">
                    <Users />
                    <span>Usuarios</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <ThemeToggle />
            <UserNav />
          </SidebarFooter>
        </Sidebar>

        <div className="relative flex flex-1 flex-col bg-background min-w-0">
          <header className="flex h-14 shrink-0 items-center border-b bg-card px-4 lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1" />
            <div className="flex items-center md:hidden">
              <Link href="/analyze-catalog" className="flex items-center gap-2">
                  <QrCode className="h-6 w-6 text-primary" />
                  <span className="font-headline font-semibold">COCOCO Scan</span>
              </Link>
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
