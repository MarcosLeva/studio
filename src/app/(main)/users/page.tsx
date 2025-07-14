
"use client";

import React from "react";
import { PlusCircle, MoreHorizontal, X, Mail, CheckCircle2, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { getColumns } from "./columns";
import { useApp } from "@/app/store";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { cn } from "@/lib/utils";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const userSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  role: z.string({ required_error: "Por favor, selecciona un rol." }),
});

type UserFormValues = z.infer<typeof userSchema>;

function DesktopUsersPageSkeleton() {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-10 w-full sm:w-[150px]" />
      </div>

      {/* Toolbar */}
      <div className="rounded-t-md border bg-card p-4">
        <div className="flex w-full flex-col items-center gap-2 sm:flex-row">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
          <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto sm:flex-shrink-0">
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-b-md border-x border-b">
        <div className="w-full text-sm">
          {/* Table Header */}
          <div className="border-b">
            <div className="flex h-12 items-center px-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="ml-4 h-4 w-32" />
              <Skeleton className="ml-[180px] h-4 w-40" />
              <Skeleton className="ml-[180px] h-4 w-24" />
              <Skeleton className="ml-[70px] h-4 w-24" />
            </div>
          </div>
          {/* Table Body */}
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex h-[73px] items-center border-b px-4 animate-pulse">
                <Skeleton className="h-4 w-4" />
                <div className="ml-4 flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="ml-[52px] h-4 w-48" />
                <Skeleton className="ml-[70px] h-6 w-24 rounded-full" />
                <Skeleton className="ml-[70px] h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
        {/* Table Pagination */}
        <div className="flex items-center justify-end space-x-2 p-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}

function MobileUsersPageSkeleton() {
    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-4 w-72 mt-2" />
                </div>
                <Skeleton className="h-10 w-full sm:w-[150px]" />
            </div>

            {/* Toolbar */}
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 flex justify-between items-start gap-4 animate-pulse">
                            <div className="flex items-center gap-3 flex-grow">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                    <Skeleton className="h-5 w-40" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-8" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default function UsersPage() {
  const { managedUsers, editManagedUser, deleteManagedUser, toggleUserStatus, areUsersLoading, fetchManagedUsers, usersError, isAuthLoading, userPagination } = useApp();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "" },
  });

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [filterValue, setFilterValue] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});
  const isMounted = React.useRef(true);
  
  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );
  const pageCount = userPagination.totalPages;
  
  React.useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
    };
  }, []);
  
  React.useEffect(() => {
    const timeout = setTimeout(() => {
        setGlobalFilter(filterValue);
    }, 300);
    return () => clearTimeout(timeout);
  }, [filterValue]);

  React.useEffect(() => {
    if (!isAuthLoading) {
        const roleFilter = columnFilters.find(f => f.id === 'role')?.value as string | undefined;
        const statusFilter = columnFilters.find(f => f.id === 'status')?.value as string | undefined;
        
        fetchManagedUsers({
            page: pageIndex + 1, 
            limit: pageSize,
            search: globalFilter || undefined,
            role: roleFilter,
            status: statusFilter,
        });
    }
  }, [isAuthLoading, pageIndex, pageSize, fetchManagedUsers, globalFilter, columnFilters]);


  const handleEditClick = React.useCallback((user: User) => {
    setEditingUser(user);
    form.reset(user);
    setIsDialogOpen(true);
  }, [form]);

  const handleDeleteClick = React.useCallback((user: User) => {
    setUserToDelete(user);
  }, []);

  const handleToggleStatusClick = React.useCallback(async (user: User) => {
    try {
      await toggleUserStatus(user.id, user.status);
      toast({
        title: user.status === 'activo' ? "Usuario Desactivado" : "Usuario Activado",
        description: `El estado de "${user.name}" ha sido actualizado.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Error al cambiar estado",
            description: error.message || "No se pudo actualizar el estado del usuario."
        });
    }
  }, [toggleUserStatus, toast]);

  const columns = React.useMemo(() => getColumns(handleEditClick, handleDeleteClick, handleToggleStatusClick), [handleEditClick, handleDeleteClick, handleToggleStatusClick]);

  const table = useReactTable({
    data: managedUsers,
    columns,
    pageCount,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    manualPagination: true,
    manualFiltering: true,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      pagination,
    },
  });
  
  // Reset page index when filters change
  React.useEffect(() => {
    table.setPageIndex(0);
  },[globalFilter, columnFilters, table])

  async function onSubmit(data: UserFormValues) {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await editManagedUser(editingUser.id, data);
        toast({
          title: "Usuario Actualizado",
          description: `Los datos de "${data.name}" han sido actualizados.`,
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        });
      } else {
        const apiRole = data.role === 'Administrador' ? 'admin' : 'user';
        const response = await api.post('/users', {
          name: data.name,
          email: data.email,
          role: apiRole,
        });
        toast({
          title: "Usuario Creado",
          description: response.message || "Se ha enviado una invitación por correo electrónico.",
          icon: <Mail className="h-5 w-5 text-primary" />,
        });
        // Refetch users on the first page after creation
        if (table.getState().pagination.pageIndex !== 0) {
          table.setPageIndex(0);
        } else {
           fetchManagedUsers({ page: 1, limit: pageSize });
        }
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: editingUser ? "Error al actualizar" : "Error al crear usuario",
        description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingUser(null);
      form.reset();
    }
    setIsDialogOpen(open);
  }

  const handleCreateClick = () => {
    setEditingUser(null);
    form.reset({ name: "", email: "", role: undefined });
    setIsDialogOpen(true);
  }

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await deleteManagedUser(userToDelete.id);
        toast({
          title: "Usuario Eliminado",
          description: `El usuario "${userToDelete.name}" ha sido eliminado.`,
          icon: <Trash2 className="h-5 w-5 text-primary" />,
        });
        setUserToDelete(null);
      } catch (error) {
        // Error toast is handled in deleteManagedUser
        setUserToDelete(null);
      }
    }
  };

  const confirmBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const promises = selectedRows.map(row => deleteManagedUser(row.original.id));
    
    try {
        await Promise.all(promises);
        table.resetRowSelection();
        toast({
            title: "Usuarios Eliminados",
            description: `${selectedRows.length} usuarios han sido eliminados.`,
            icon: <Trash2 className="h-5 w-5 text-primary" />,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error en Eliminación Masiva",
            description: "Algunos usuarios no pudieron ser eliminados. Por favor, refresca y vuelve a intentarlo.",
        });
    } finally {
        setIsBulkDeleteOpen(false);
    }
  }

  const handleBulkToggleStatus = async (status: 'activo' | 'inactivo') => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const promises = selectedRows.map(row => {
        if (row.original.status !== status) {
            return toggleUserStatus(row.original.id, row.original.status);
        }
        return Promise.resolve();
    });
    await Promise.all(promises);

    table.resetRowSelection();
    toast({
        title: "Estado de usuarios actualizado",
        description: `El estado de ${selectedRows.length} usuarios ha sido actualizado.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    });
  }

  const roles = [
    { value: "Administrador", label: "Administrador" },
    { value: "Miembro", label: "Miembro" },
  ];
  
  const statuses = [
    { value: "Activo", label: "Activo" },
    { value: "Inactivo", label: "Inactivo" },
    { value: "Pendiente", label: "Pendiente" },
    { value: "Suspendido", label: "Suspendido" },
  ];
  
  const handleClearFilters = () => {
    setFilterValue('');
    table.resetColumnFilters();
  };

  const isFiltered = filterValue !== '' || columnFilters.length > 0;
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;

  const bulkActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => handleBulkToggleStatus('activo')}>Activar</Button>
      <Button variant="outline" size="sm" onClick={() => handleBulkToggleStatus('inactivo')}>Desactivar</Button>
      <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)}>Eliminar</Button>
    </div>
  );
  
  const toolbarContent = (
    <div className="flex w-full flex-col items-center gap-2 sm:flex-row">
      <Input
        placeholder="Filtrar por nombre o correo..."
        value={filterValue}
        onChange={(event) => {
          setFilterValue(event.target.value);
        }}
        className="w-full sm:max-w-sm"
      />
      <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto sm:flex-shrink-0">
        <Select
          value={(table.getColumn("role")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) =>
            table.getColumn("role")?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) =>
            table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
            variant="ghost"
            onClick={handleClearFilters}
            className="h-9 px-2 lg:px-3"
            disabled={!isFiltered}
        >
            Limpiar
            <X className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
  
  const MobileUserCard = ({ user }: { user: User }) => (
    <Card>
      <CardContent className="p-4 flex justify-between items-start gap-4">
        <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="user avatar" />
              <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-4 pt-1">
                <Badge variant={user.role === 'Administrador' ? 'default' : 'secondary'}>
                    {user.role}
                </Badge>
                <div className="flex items-center gap-1.5">
                    <div className="relative flex h-2 w-2">
                        {user.status === 'activo' && (
                            <span className="absolute inline-flex h-full w-full animate-ping-large rounded-full bg-green-400 opacity-75" />
                        )}
                        <span className={cn(
                            "relative inline-flex h-2 w-2 rounded-full",
                            user.status === 'activo' ? 'bg-green-500' : 
                            user.status === 'inactivo' ? 'bg-gray-400' :
                            user.status === 'pendiente' ? 'bg-yellow-500' :
                            user.status === 'suspendido' ? 'bg-red-500' : 'bg-gray-400'
                        )} />
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                        {user.status}
                    </span>
                </div>
              </div>
            </div>
        </div>
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEditClick(user)}>Editar Usuario</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStatusClick(user)} disabled={user.status === 'pendiente' || user.status === 'suspendido'}>
                  {user.status === 'activo' ? "Desactivar Usuario" : "Activar Usuario"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(user)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                Eliminar Usuario
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
  
  const MobilePaginationControls = () => (
    <div className="flex items-center justify-between mt-4">
        <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
        >
            Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </span>
        <Button
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
        >
            Siguiente
        </Button>
    </div>
  );

  if (areUsersLoading && managedUsers.length === 0) {
      return isMobile ? <MobileUsersPageSkeleton /> : <DesktopUsersPageSkeleton />;
  }
  
  if (usersError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-10">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Usuarios</AlertTitle>
          <AlertDescription>
            {usersError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios de tu organización.
          </p>
        </div>
        <Button onClick={handleCreateClick} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Usuario
        </Button>
      </div>

      {isMobile ? (
        <div className="space-y-4">
          {toolbarContent}
          {table.getRowModel().rows?.length ? (
            <div className="space-y-4">
              {table.getRowModel().rows.map((row) => (
                <MobileUserCard key={row.id} user={row.original} />
              ))}
              {pageCount > 1 && <MobilePaginationControls />}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">No hay usuarios.</div>
          )}
        </div>
      ) : (
        <div>
          <div className="rounded-t-md border bg-card p-4">
            <div className="flex items-center">
              {selectedRowCount > 0 ? (
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    {selectedRowCount} de {table.getCoreRowModel().rows.length} fila(s) seleccionadas.
                  </div>
                  {bulkActions}
                </div>
              ) : (
                toolbarContent
              )}
            </div>
          </div>
          <div className="relative">
            <DataTable 
                table={table}
            />
            {areUsersLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-md bg-card/80 backdrop-blur-sm">
                    <LogoSpinner />
                </div>
            )}
          </div>
        </div>
      )}


      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuario" : "Agregar Nuevo Usuario"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Modifica los detalles del usuario." : "Completa el formulario para agregar un nuevo usuario."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="ej., Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Administrador">Administrador</SelectItem>
                        <SelectItem value="Miembro">Miembro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingUser ? "Guardar Cambios" : "Agregar Usuario"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario{' '}
              <span className="font-semibold">{userToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente a los {table.getFilteredSelectedRowModel().rows.length} usuarios seleccionados.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive hover:bg-destructive/90">
                    Eliminar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScrollToTopButton />
    </div>
  );
}
