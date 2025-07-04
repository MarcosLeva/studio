
"use client";

import React from "react";
import * as XLSX from "xlsx";
import { useApp } from "@/app/store";
import { DataTable } from "@/components/data-table";
import { getColumns } from "./columns";
import type { ScanResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";

export default function ScannedResultsPage() {
  const { results, deleteScanResult } = useApp();
  const { toast } = useToast();
  const [resultToDelete, setResultToDelete] = React.useState<ScanResult | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);
  const [isFiltering, setIsFiltering] = React.useState(false);
  const isMobile = useIsMobile();
  const [visibleRows, setVisibleRows] = React.useState(10);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  
  const table = useReactTable({
    data: results,
    columns: React.useMemo(() => getColumns(handleExport, handleDelete), []),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  const handleDelete = React.useCallback((result: ScanResult) => {
    setResultToDelete(result);
  }, []);

  const confirmDelete = () => {
    if (resultToDelete) {
      deleteScanResult(resultToDelete.id);
      toast({
        title: "Resultado Eliminado",
        description: `El resultado para "${resultToDelete.catalogName}" ha sido eliminado.`,
      });
      setResultToDelete(null);
    }
  };
  
  const confirmBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    selectedRows.forEach(row => {
        deleteScanResult(row.original.id);
    });
    table.resetRowSelection();
    toast({
        title: "Resultados Eliminados",
        description: `${selectedRows.length} resultados han sido eliminados.`
    });
    setIsBulkDeleteOpen(false);
  }

  const handleExport = React.useCallback((result: ScanResult) => {
    const data = [
      {
        "Nombre del Catálogo": result.catalogName,
        "Categoría": result.category,
        "Fecha de Escaneo": result.dateScanned,
        "Análisis": result.analysis,
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultado");
    XLSX.writeFile(workbook, `${result.catalogName}.xlsx`);
    toast({
      title: "Exportación Exitosa",
      description: `El resultado para "${result.catalogName}" ha sido exportado.`,
    });
  }, [toast]);

  const handleBulkExport = React.useCallback(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const data = selectedRows.map(row => ({
        "Nombre del Catálogo": row.original.catalogName,
        "Categoría": row.original.category,
        "Fecha de Escaneo": row.original.dateScanned,
        "Análisis": row.original.analysis,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados Seleccionados");
    XLSX.writeFile(workbook, `Resultados_Seleccionados.xlsx`);
    toast({
      title: "Exportación Exitosa",
      description: `${selectedRows.length} resultados han sido exportados.`,
    });
    table.resetRowSelection();
  }, [table, toast]);
  
  const handleFilterChange = (value: string) => {
    setIsFiltering(true);
    const filterValue = value === "All" ? "" : value;
    table.getColumn("category")?.setFilterValue(filterValue);

    setTimeout(() => {
        setIsFiltering(false);
    }, 500);
  };
  
  const categoryNames = React.useMemo(() => [
    "All",
    ...Array.from(new Set(results.map((r) => r.category))),
  ], [results]);
  
  const toolbar = (
    <Select
        value={
        (table.getColumn("category")?.getFilterValue() as string) ?? "All"
        }
        onValueChange={handleFilterChange}
    >
        <SelectTrigger className="w-full sm:w-[220px]">
        <SelectValue placeholder="Filtrar por categoría" />
        </SelectTrigger>
        <SelectContent>
        {categoryNames.map((category) => (
            <SelectItem key={category} value={category}>
            {category === "All" ? "Todas las categorías" : category}
            </SelectItem>
        ))}
        </SelectContent>
    </Select>
  );

  const MobileResultCard = ({ result }: { result: ScanResult }) => (
    <Card>
      <CardContent className="p-4 flex justify-between items-start gap-4">
        <div className="space-y-2 flex-grow">
          <p className="font-bold">{result.catalogName}</p>
          <p className="text-sm text-muted-foreground line-clamp-3">{result.analysis}</p>
          <div className="flex items-center gap-2 pt-1">
             <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{result.category}</span>
             <span className="text-xs text-muted-foreground">{result.dateScanned}</span>
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
              <DropdownMenuItem onClick={() => handleExport(result)}>
                Exportar como Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(result)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  if (results.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Resultados Escaneados</h1>
          <p className="text-muted-foreground">
            Revisa el análisis de tus catálogos escaneados previamente.
          </p>
        </div>
        <Card className="flex flex-col items-center justify-center py-20">
          <CardHeader>
            <CardTitle className="text-2xl">Aún no hay resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Realiza un análisis desde el panel de control para ver los resultados aquí.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Resultados Escaneados</h1>
        <p className="text-muted-foreground">
          Revisa y gestiona el análisis de tus catálogos escaneados.
        </p>
      </div>

      <div className="relative">
        {isMobile ? (
          <div className="space-y-4">
            {toolbar}
            {table.getFilteredRowModel().rows?.length ? (
                <div className="space-y-4">
                    {table.getFilteredRowModel().rows.slice(0, visibleRows).map((row) => (
                        <MobileResultCard key={row.id} result={row.original} />
                    ))}
                    {visibleRows < table.getFilteredRowModel().rows.length && (
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
              <div className="text-center py-10 text-muted-foreground">No hay resultados.</div>
            )}
          </div>
        ) : (
          <DataTable 
            table={table} 
            toolbar={() => toolbar}
            bulkActions={(table) => (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleBulkExport}>Exportar</Button>
                <Button variant="destructive" onClick={() => setIsBulkDeleteOpen(true)}>Eliminar</Button>
              </div>
            )}
          />
        )}

        {isFiltering && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-card/80 backdrop-blur-sm">
                <LogoSpinner />
            </div>
        )}
      </div>

      <AlertDialog
        open={!!resultToDelete}
        onOpenChange={(open) => !open && setResultToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el resultado del análisis para{' '}
              <span className="font-semibold">
                {resultToDelete?.catalogName}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResultToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
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
                los {table.getFilteredSelectedRowModel().rows.length} resultados seleccionados.
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
