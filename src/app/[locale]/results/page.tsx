
"use client";

import React from "react";
import * as XLSX from "xlsx";
import { useApp } from "@/app/store";
import { DataTable } from "@/components/data-table";
import { getColumns } from "./columns";
import type { ScanResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
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
import { MoreHorizontal, FileDown, Trash2 } from "lucide-react";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { useTranslations } from "next-intl";

export default function ScannedResultsPage() {
  const t = useTranslations("ResultsPage");
  const tCol = useTranslations("ResultsColumns");
  const { results, deleteScanResult } = useApp();
  const { toast } = useToast();
  const [resultToDelete, setResultToDelete] = React.useState<ScanResult | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);
  const [isFiltering, setIsFiltering] = React.useState(false);
  const isMobile = useIsMobile();
  const [visibleRows, setVisibleRows] = React.useState(10);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
    };
  }, []);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  
  const handleDelete = React.useCallback((result: ScanResult) => {
    setResultToDelete(result);
  }, []);

  const handleExport = React.useCallback((result: ScanResult) => {
    const data = [
      {
        [tCol('catalogName')]: result.catalogName,
        [tCol('category')]: result.category,
        [tCol('dateScanned')]: result.dateScanned,
        [tCol('analysis')]: result.analysis,
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultado");
    XLSX.writeFile(workbook, `${result.catalogName}.xlsx`);
    toast({
      title: t('toastExportSuccessTitle'),
      description: t('toastExportSuccessDescription', { name: result.catalogName }),
      icon: <FileDown className="h-5 w-5 text-primary" />,
    });
  }, [toast, t, tCol]);
  
  const columns = React.useMemo(() => getColumns(handleExport, handleDelete, (key) => tCol(key)), [handleExport, handleDelete, tCol]);

  const table = useReactTable({
    data: results,
    columns,
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

  React.useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      if (isMounted.current) {
        setIsFiltering(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [columnFilters]);


  const confirmDelete = () => {
    if (resultToDelete) {
      deleteScanResult(resultToDelete.id);
      toast({
        title: t('toastResultDeletedTitle'),
        description: t('toastResultDeletedDescription', { name: resultToDelete.catalogName }),
        icon: <Trash2 className="h-5 w-5 text-primary" />,
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
        title: t('toastResultsDeletedTitle'),
        description: t('toastResultsDeletedDescription', { count: selectedRows.length }),
        icon: <Trash2 className="h-5 w-5 text-primary" />,
    });
    setIsBulkDeleteOpen(false);
  }

  const handleBulkExport = React.useCallback(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const data = selectedRows.map(row => ({
        [tCol('catalogName')]: row.original.catalogName,
        [tCol('category')]: row.original.category,
        [tCol('dateScanned')]: row.original.dateScanned,
        [tCol('analysis')]: row.original.analysis,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados Seleccionados");
    XLSX.writeFile(workbook, `Resultados_Seleccionados.xlsx`);
    toast({
      title: t('toastExportSuccessTitle'),
      description: t('toastBulkExportSuccessDescription', { count: selectedRows.length }),
      icon: <FileDown className="h-5 w-5 text-primary" />,
    });
    table.resetRowSelection();
  }, [table, toast, t, tCol]);
    
  const categoryOptions = React.useMemo(() => 
    Array.from(new Set(results.map((r) => r.category))).map(cat => ({
      value: cat,
      label: cat,
    })),
  [results]);

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;

  const toolbar = (
    <MultiSelectCombobox
      options={categoryOptions}
      selected={(table.getColumn("category")?.getFilterValue() as string[]) ?? []}
      onChange={(value) => table.getColumn("category")?.setFilterValue(value.length > 0 ? value : undefined)}
      className="w-full sm:w-[320px]"
      placeholder={t('filterPlaceholder')}
    />
  );
  
  const bulkActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={handleBulkExport}>{t('exportButton')}</Button>
      <Button variant="destructive" onClick={() => setIsBulkDeleteOpen(true)}>{t('deleteButton')}</Button>
    </div>
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
              <DropdownMenuLabel>{tCol('actions')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport(result)}>
                {tCol('exportExcel')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(result)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                {tCol('delete')}
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
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Card className="flex flex-col items-center justify-center py-20">
          <CardHeader>
            <CardTitle className="text-2xl">{t('noResultsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('noResultsDescription')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

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
                          {t('loadMore')}
                      </Button>
                  )}
              </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">{t('noResultsTitle')}</div>
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
                  toolbar
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

      <AlertDialog
        open={!!resultToDelete}
        onOpenChange={(open) => !open && setResultToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialogDescription')}{' '}
              <span className="font-semibold">
                {resultToDelete?.catalogName}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResultToDelete(null)}>
              {t('cancelButton')}
            </AlertDialogCancel>
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
