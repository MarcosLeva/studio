
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export const getColumns = (
  onEdit: (user: User) => void,
  onDelete: (user: User) => void,
  onToggleStatus: (user: User) => void
): ColumnDef<User>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todo"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="user avatar" />
            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.name}</span>
        </div>
      )
    },
    size: 220,
  },
  {
    accessorKey: "email",
    header: "Correo Electrónico",
    size: 250,
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return <Badge variant={role === 'Administrador' ? 'default' : 'secondary'}>{role}</Badge>
    },
    filterFn: 'equalsString',
    size: 120,
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const isActive = status === 'activo';
      return (
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            {isActive && (
              <span className="absolute inline-flex h-full w-full animate-ping-large rounded-full bg-green-400 opacity-75" />
            )}
            <span className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                isActive ? 'bg-green-500' : 'bg-gray-400'
            )} />
          </div>
          <span className="capitalize">{status}</span>
        </div>
      )
    },
    filterFn: 'equalsString',
    size: 120,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(user)}>Editar Usuario</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                  {user.status === 'activo' ? 'Desactivar Usuario' : 'Activar Usuario'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(user)}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  Eliminar Usuario
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
    size: 80,
  },
];
