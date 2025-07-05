
"use client";

import React from "react";
import { PlusCircle, MoreHorizontal, X, Mail, CheckCircle2, Trash2 } from "lucide-react";
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
import { LogoSpinner } from "@/components/ui/logo-spinner";

type UserFormValues = z.infer<ReturnType<typeof getUserSchema>>;

const getUserSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(3, { message: t('validation.nameLength') }),
  email: z.string().email({ message: t('validation.emailInvalid') }),
  role: z.string({ required_error: t('validation.roleRequired') }),
});


export default function UsersPage() {
  const t = useTranslations("UsersPage");
  const tCol = useTranslations("UsersColumns");
  const userSchema = getUserSchema(t);

  const { managedUsers, addManagedUser, editManagedUser, deleteManagedUser, toggleUserStatus } = useApp();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);
  const [visibleRows, setVisibleRows] = React.useState(10);
  const [isFiltering, setIsFiltering] = React.useState(false);
  
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
  
  React.useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setGlobalFilter(filterValue);
      if (isMounted.current) {
        setIsFiltering(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [filterValue]);


  React.useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
        if (isMounted.current) {
            setIsFiltering(false);
        }
    }, 500);

    return () => clearTimeout(timer);
  }, [columnFilters]);

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
      title: user.status === 'activo' ? t('toastUserDeactivated') : t('toastUserActivated'),
      description: t('toastUserStatusUpdated', { name: user.name }),
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    });
  }, [toggleUserStatus, toast, t]);

  const columns = React.useMemo(() => getColumns(handleEditClick, handleDeleteClick, handleToggleStatusClick, (key) => tCol(key)), [handleEditClick, handleDeleteClick, handleToggleStatusClick, tCol]);

  const table = useReactTable({
    data: managedUsers,
    columns,
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
        title: t('toastUserUpdatedTitle'),
        description: t('toastUserUpdatedDescription', { name: data.name }),
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
    } else {
      addManagedUser(data);
      toast({
        title: t('toastInvitationSentTitle'),
        description: t('toastInvitationSentDescription', { email: data.email }),
        icon: <Mail className="h-5 w-5 text-primary" />,
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
        title: t('toastUserDeletedTitle'),
        description: t('toastUserDeletedDescription', { name: userToDelete.name }),
        icon: <Trash2 className="h-5 w-5 text-primary" />,
      });
      setUserToDelete(null);
    }
  };

  const confirmBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    selectedRows.forEach(row => {
        deleteManagedUser(row.original.id);
    });
    table.resetRowSelection();
    toast({
        title: t('toastUsersDeletedTitle'),
        description: t('toastUsersDeletedDescription', { count: selectedRows.length }),
        icon: <Trash2 className="h-5 w-5 text-primary" />,
    });
    setIsBulkDeleteOpen(false);
  }

  const handleBulkToggleStatus = (status: 'activo' | 'inactivo') => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    selectedRows.forEach(row => {
        if (row.original.status !== status) {
            toggleUserStatus(row.original.id);
        }
    });
    table.resetRowSelection();
    toast({
        title: t('toastUserStatusUpdatedTitle'),
        description: t('toastUserStatusUpdatedDescription', { count: selectedRows.length }),
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    });
  }

  const roles = [
    { value: "Administrador", label: t('adminRole') },
    { value: "Miembro", label: t('memberRole') },
  ];
  
  const statuses = [
    { value: "activo", label: t('activeStatus') },
    { value: "inactivo", label: t('inactiveStatus') },
  ];
  
  const handleClearFilters = () => {
    setFilterValue('');
    table.resetColumnFilters();
  };

  const isFiltered = filterValue !== '' || columnFilters.length > 0;
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;

  const bulkActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => handleBulkToggleStatus('activo')}>{t('activateButton')}</Button>
      <Button variant="outline" size="sm" onClick={() => handleBulkToggleStatus('inactivo')}>{t('deactivateButton')}</Button>
      <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)}>{t('deleteButton')}</Button>
    </div>
  );
  
  const toolbarContent = (
    <div className="flex w-full flex-col items-center gap-2 sm:flex-row">
      <Input
        placeholder={t('filterPlaceholder')}
        value={filterValue}
        onChange={(event) => {
          setIsFiltering(true);
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
            <SelectValue placeholder={t('filterRolePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allRoles')}</SelectItem>
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
            <SelectValue placeholder={t('filterStatusPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
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
            {t('clearFilters')}
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
                    {user.role === 'Administrador' ? t('adminRole') : t('memberRole')}
                </Badge>
                <div className="flex items-center gap-1.5">
                    <div className="relative flex h-2 w-2">
                        {user.status === 'activo' && (
                            <span className="absolute inline-flex h-full w-full animate-ping-large rounded-full bg-green-400 opacity-75" />
                        )}
                        <span className={cn(
                            "relative inline-flex h-2 w-2 rounded-full",
                            user.status === 'activo' ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                        {user.status === 'activo' ? t('activeStatus') : t('inactiveStatus')}
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
              <DropdownMenuLabel>{tCol('actions')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEditClick(user)}>{tCol('editUser')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStatusClick(user)}>
                  {user.status === 'activo' ? tCol('deactivateUser') : tCol('activateUser')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(user)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                {tCol('deleteUser')}
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
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button onClick={handleCreateClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('addUserButton')}
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
                  {t('loadMore')}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">{t('noUsers')}</div>
          )}
        </div>
      ) : (
        <div>
          <div className="rounded-t-md border bg-card p-4">
            <div className="flex items-center">
              {selectedRowCount > 0 ? (
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    {t('selectedRows', { count: selectedRowCount, total: table.getCoreRowModel().rows.length })}
                  </div>
                  {bulkActions}
                </div>
              ) : (
                toolbarContent
              )}
            </div>
          </div>
          <div className="relative">
            <DataTable table={table} />
            {isFiltering && (
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
            <DialogTitle>{editingUser ? t('editDialogTitle') : t('addDialogTitle')}</DialogTitle>
            <DialogDescription>
              {editingUser ? t('editDialogDescription') : t('addDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nameLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('namePlaceholder')} {...field} />
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
                    <FormLabel>{t('emailLabel')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t('emailPlaceholder')} {...field} />
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
                    <FormLabel>{t('roleLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('rolePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Administrador">{t('adminRole')}</SelectItem>
                        <SelectItem value="Miembro">{t('memberRole')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('cancelButton')}</Button>
                <Button type="submit">{editingUser ? t('saveChangesButton') : t('saveUserButton')}</Button>
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
            <AlertDialogTitle>{t('deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialogDescription')}{' '}
              <span className="font-semibold">{userToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>{t('cancelButton')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('deleteButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('deleteDialogTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                {t('bulkDeleteDialogDescription', { count: table.getFilteredSelectedRowModel().rows.length })}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('cancelButton')}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive hover:bg-destructive/90">
                    {t('deleteButton')}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScrollToTopButton />
    </div>
  );
}
