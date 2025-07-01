"use client";

import * as React from 'react';
import { ScanLine, FileScan, LayoutGrid, List, BarChart2 } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/dashboard/user-nav';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                <ScanLine className="h-8 w-8 text-primary" />
                <span className="text-xl font-headline font-semibold">COCOCO Scan</span>
              </div>
            </SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                  <Link href="/dashboard">
                    <FileScan />
                    <span>Analizar Catálogo</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/dashboard/categories'}>
                   <Link href="/dashboard/categories">
                    <LayoutGrid />
                    <span>Categorías</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/dashboard/results'}>
                  <Link href="/dashboard/results">
                    <BarChart2 />
                    <span>Resultados Escaneados</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <div className="relative flex flex-1 flex-col min-h-svh bg-background min-w-0">
          <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              {/* Optional: Add breadcrumbs or page title here */}
            </div>
            <UserNav />
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
