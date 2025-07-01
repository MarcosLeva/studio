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

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "aiModel",
    header: "AI Model",
    cell: ({ row }) => {
        const model = row.getValue("aiModel");
        const variant = model === 'Gemini Pro' ? 'secondary' : 'default';
        return <Badge variant={variant}>{model as string}</Badge>
    }
  },
  {
    accessorKey: "dateCreated",
    header: "Date Created",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <div className="max-w-xs truncate">{row.getValue("description")}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const category = row.original;

      return (
        <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(category.id)}
                >
                  Copy Category ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];
