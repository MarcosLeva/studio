
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
import type { Category } from "@/lib/types";

export const getColumns = (
  onEdit: (category: Category) => void
): ColumnDef<Category>[] => [
  {
    accessorKey: "name",
    size: 250,
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
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "aiModel",
    header: "Modelo de IA",
    size: 150,
    cell: ({ row }) => {
        const model = row.getValue("aiModel");
        const variant = model === 'Gemini Pro' ? 'secondary' : 'default';
        return <Badge variant={variant}>{model as string}</Badge>
    }
  },
  {
    accessorKey: "dateCreated",
    header: "Fecha de Creación",
    size: 150,
  },
  {
    accessorKey: "description",
    header: "Descripción",
    size: 350,
    cell: ({ row }) => <div className="max-w-sm truncate">{row.getValue("description")}</div>,
  },
  {
    id: "actions",
    size: 80,
    cell: ({ row }) => {
      const category = row.original;

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
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(category.id)}
                >
                  Copiar ID de Categoría
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(category)}>Editar</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];
