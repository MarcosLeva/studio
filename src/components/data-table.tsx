
"use client";

import * as React from "react";
import {
  flexRender,
  Table as ReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./ui/button";

interface DataTableProps<TData> {
  table: ReactTable<TData>;
  toolbar?: (table: ReactTable<TData>) => React.ReactNode;
  bulkActions?: (table: ReactTable<TData>) => React.ReactNode;
}

export function DataTable<TData>({
  table,
  toolbar,
  bulkActions,
}: DataTableProps<TData>) {
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="rounded-md border bg-card">
       <div className="flex items-center p-4">
        {selectedRowCount > 0 && bulkActions ? (
          <div className="flex w-full items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {selectedRowCount} de {table.getCoreRowModel().rows.length} fila(s) seleccionadas.
            </div>
            {bulkActions(table)}
          </div>
        ) : toolbar ? (
          toolbar(table)
        ) : null}
      </div>
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} style={{ width: header.getSize() }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
