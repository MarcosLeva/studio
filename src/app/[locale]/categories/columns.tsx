
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
import { Checkbox } from "@/components/ui/checkbox";

export const getColumns = (
  onEdit: (category: Category) => void,
  onDelete: (category: Category) => void,
  t: (key: string) => string
): ColumnDef<Category>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label={t('selectAll')}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={t('selectRow')}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "name",
    size: 250,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('name')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "aiModel",
    header: t('aiModel'),
    size: 150,
    cell: ({ row }) => {
        const model = row.getValue("aiModel");
        const variant = model === 'Gemini Pro' ? 'secondary' : 'default';
        return <Badge variant={variant}>{model as string}</Badge>
    }
  },
  {
    accessorKey: "dateCreated",
    header: t('dateCreated'),
    size: 150,
  },
  {
    accessorKey: "description",
    header: t('description'),
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
                <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(category.id)}
                >
                  {t('copyId')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(category)}>{t('edit')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(category)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">{t('delete')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];
