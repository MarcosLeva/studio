
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
import type { ScanResult } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

export const getColumns = (
  onExport: (result: ScanResult) => void,
  onDelete: (result: ScanResult) => void
): ColumnDef<ScanResult>[] => [
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
        accessorKey: "catalogName",
        header: "Nombre del Catálogo",
        size: 250,
    },
    {
        accessorKey: "category",
        header: ({ column }) => {
            return (
                <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                Categoría
                <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        size: 200,
        filterFn: 'arrIncludesSome',
    },
    {
        accessorKey: "dateScanned",
        header: "Fecha de Escaneo",
        size: 150,
    },
    {
        accessorKey: "analysis",
        header: "Análisis",
        size: 400,
        cell: ({ row }) => <div className="max-w-md truncate">{row.getValue("analysis")}</div>,
    },
    {
        id: "actions",
        size: 80,
        cell: ({ row }) => {
            const result = row.original;
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
                        <DropdownMenuItem onClick={() => onExport(result)} className="cursor-pointer">
                            Exportar como Excel
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                        onClick={() => onDelete(result)}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                        >
                        Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    },
];
