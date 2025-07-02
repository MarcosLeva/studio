
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

export default function ScannedResultsPage() {
  const { results, deleteScanResult } = useApp();
  const { toast } = useToast();
  const [resultToDelete, setResultToDelete] = React.useState<ScanResult | null>(null);
  const [isFiltering, setIsFiltering] = React.useState(false);

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
  
  const handleFilterChange = (value: string, table: any) => {
    setIsFiltering(true);
    const filterValue = value === "All" ? "" : value;
    table.getColumn("category")?.setFilterValue(filterValue);

    setTimeout(() => {
        setIsFiltering(false);
    }, 1000);
  };

  const columns = React.useMemo(() => getColumns(handleExport, handleDelete), [handleExport, handleDelete]);

  const categoryNames = React.useMemo(() => [
    "All",
    ...Array.from(new Set(results.map((r) => r.category))),
  ], [results]);

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
        <DataTable
            columns={columns}
            data={results}
            toolbar={(table) => (
            <Select
                value={
                (table.getColumn("category")?.getFilterValue() as string) ?? "All"
                }
                onValueChange={(value) => handleFilterChange(value, table)}
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
            )}
        />
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
    </div>
  );
}
