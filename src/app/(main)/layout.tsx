
"use client";

import * as React from 'react';
import { QrCode, FileScan, LayoutGrid, BarChart2, Users, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
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
import { Breadcrumbs } from '@/components/breadcrumbs';
import { HeaderUserNav } from '@/components/header-user-nav';
import { HeaderThemeToggle } from '@/components/header-theme-toggle';
import { useApp } from '../store';
import { LogoSpinner } from '@/components/ui/logo-spinner';
import { Button } from '@/components/ui/button';
import { refreshSession } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAuthLoading } = useApp();
  const { toast } = useToast();

  const handleRefreshToken = async () => {
    toast({
        title: "Refrescando Token...",
        description: "Por favor, espera un momento.",
    });
    try {
        await refreshSession();

        toast({
            title: "¡Token Refrescado!",
            description: "Tu sesión ha sido extendida con éxito.",
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        });
    } catch (error) {
        console.error("Manual refresh failed:", error);
        toast({
            variant: "destructive",
            title: "Error al Refrescar",
            description: "No se pudo refrescar la sesión. Es posible que necesites iniciar sesión de nuevo.",
            icon: <AlertTriangle className="h-5 w-5 text-destructive-foreground" />,
        });
    }
  };

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  if (isAuthLoading) {
    return (
      <div className="flex h-svh w-full items-center justify-center bg-background">
        <LogoSpinner className="scale-125" />
      </div>
    );
  }
  
  // This check prevents a flash of the dashboard layout before redirecting
  if (!isAuthenticated) {
    return null;
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
            <SidebarMenu>
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
          <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4 lg:px-6">
            <SidebarTrigger className="hidden md:flex" />

            {/* Mobile Header: Trigger, Logo */}
            <div className="flex items-center gap-2 md:hidden">
              <SidebarTrigger />
              <Link href="/analyze-catalog" className="flex items-center gap-2">
                <QrCode className="h-6 w-6 text-primary" />
                <span className="font-headline text-lg font-semibold">COCOCO Scan</span>
              </Link>
            </div>

            {/* Desktop Header: Breadcrumbs */}
            <div className="hidden flex-1 md:block">
              <Breadcrumbs />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleRefreshToken}>
                <RefreshCw className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Refrescar token</span>
              </Button>
              <HeaderThemeToggle />
              <HeaderUserNav />
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
