
"use client";

import React from "react";
import { PlusCircle, MoreHorizontal, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type SortingState,
  type ColumnFiltersState,
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

const userSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  role: z.string({ required_error: "Por favor, selecciona un rol." }),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const { managedUsers, addManagedUser, editManagedUser, deleteManagedUser, toggleUserStatus } = useApp();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);
  const [visibleRows, setVisibleRows] = React.useState(10);
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "" },
  });

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});

  const handleEditClick = React.useCallback((user: User) => {
    setEditingUser(user);
    form.reset(user);
    setIsDialogOpen(true);
  }, [form]);

  const handleDeleteClick = React.useCallback((user: User) => {
    setUserToDelete(user);
  }, []);

  const handleToggleStatusClick = React.useCallback((user: User) => {
    toggleUserStatus(user.id);
    toast({
      title: `Usuario ${user.status === 'activo' ? 'Desactivado' : 'Activado'}`,
      description: `El estado de "${user.name}" ha sido actualizado.`,
    });
  }, [toggleUserStatus, toast]);

  const table = useReactTable({
    data: managedUsers,
    columns: React.useMemo(() => getColumns(handleEditClick, handleDeleteClick, handleToggleStatusClick), [handleEditClick, handleDeleteClick, handleToggleStatusClick]),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
    },
  });

  function onSubmit(data: UserFormValues) {
    if (editingUser) {
      editManagedUser(editingUser.id, data);
      toast({
        title: "Usuario Actualizado",
        description: `Los datos de "${data.name}" han sido actualizados.`,
      });
    } else {
      addManagedUser(data);
      toast({
        title: "Invitación Enviada",
        description: `Se ha enviado una invitación por correo electrónico a ${data.email}.`,
      });
    }
    setIsDialogOpen(false);
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

  const confirmDelete = () => {
    if (userToDelete) {
      deleteManagedUser(userToDelete.id);
      toast({
        title: "Usuario Eliminado",
        description: `El usuario "${userToDelete.name}" ha sido eliminado.`,
      });
      setUserToDelete(null);
    }
  };

  const confirmBulkDelete = () => {
    table.getFilteredSelectedRowModel().rows.forEach(row => {
        deleteManagedUser(row.original.id);
    });
    toast({
        title: "Usuarios Eliminados",
        description: `${table.getFilteredSelectedRowModel().rows.length} usuarios han sido eliminados.`
    });
    table.resetRowSelection();
    setIsBulkDeleteOpen(false);
  }

  const handleBulkToggleStatus = (status: 'activo' | 'inactivo') => {
    table.getFilteredSelectedRowModel().rows.forEach(row => {
        if (row.original.status !== status) {
            toggleUserStatus(row.original.id);
        }
    });
    table.resetRowSelection();
    toast({
        title: "Estado de usuarios actualizado",
        description: `El estado de ${table.getFilteredSelectedRowModel().rows.length} usuarios ha sido actualizado.`,
    });
  }

  const roles = [
    { value: "Administrador", label: "Administrador" },
    { value: "Miembro", label: "Miembro" },
  ];
  
  const statuses = [
    { value: "activo", label: "Activo" },
    { value: "inactivo", label: "Inactivo" },
  ];
  
  const handleClearFilters = () => {
    setGlobalFilter('');
    table.resetColumnFilters();
  };

  const isFiltered = globalFilter !== '' || columnFilters.length > 0;

  const toolbarContent = (
    <div className="flex w-full flex-col items-center gap-2 sm:flex-row">
      <Input
        placeholder="Filtrar por nombre o correo..."
        value={globalFilter ?? ""}
        onChange={(event) => setGlobalFilter(event.target.value)}
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
        {isFiltered && (
            <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="h-9 px-2 lg:px-3"
            >
                Limpiar
                <X className="ml-2 h-4 w-4" />
            </Button>
        )}
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
                <Badge variant={user.role === 'Administrador' ? 'default' : 'secondary'}>{user.role}</Badge>
                <div className="flex items-center gap-1.5">
                    <span className={cn(
                        "h-2 w-2 rounded-full",
                        user.status === 'activo' ? 'bg-green-500' : 'bg-gray-400'
                    )} />
                    <span className="text-xs text-muted-foreground capitalize">{user.status}</span>
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
              <DropdownMenuItem onClick={() => handleToggleStatusClick(user)}>
                  {user.status === 'activo' ? 'Desactivar Usuario' : 'Activar Usuario'}
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios de tu organización.
          </p>
        </div>
        <Button onClick={handleCreateClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Usuario
        </Button>
      </div>

      {isMobile ? (
        <div className="space-y-4">
          {toolbarContent}
          {table.getRowModel().rows?.length ? (
            <div className="space-y-4">
              {table.getRowModel().rows.slice(0, visibleRows).map((row) => (
                <MobileUserCard key={row.id} user={row.original} />
              ))}
               {visibleRows < table.getRowModel().rows.length && (
                <Button
                  onClick={() => setVisibleRows(prev => prev + 10)}
                  variant="outline"
                  className="w-full"
                >
                  Cargar más
                </Button>
              )}
            </div>
          ) : (
             <div className="text-center py-10 text-muted-foreground">No hay usuarios.</div>
          )}
        </div>
      ) : (
        <DataTable
          table={table}
          toolbar={() => toolbarContent}
          bulkActions={(table) => (
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkToggleStatus('activo')}>Activar</Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkToggleStatus('inactivo')}>Desactivar</Button>
                <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)}>Eliminar</Button>
            </div>
          )}
        />
      )}


      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Modifica los detalles del usuario.' : 'Completa el formulario para agregar un nuevo usuario.'}
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">{editingUser ? 'Guardar Cambios' : 'Agregar Usuario'}</Button>
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              al usuario <span className="font-semibold">{userToDelete?.name}</span>.
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
                Esta acción no se puede deshacer. Esto eliminará permanentemente
                a los {table.getFilteredSelectedRowModel().rows.length} usuarios seleccionados.
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
