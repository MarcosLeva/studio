
"use client";

import React from "react";
import { PlusCircle, Lightbulb, Loader2, MoreHorizontal, Trash2, X, Eye } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { suggestCategoryPrompt } from "@/ai/flows/suggest-category-prompt";
import type { Category } from "@/lib/types";
import { FileUploader } from "@/components/file-uploader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const readFileAsDataURI = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const categorySchema = z.object({
    name: z.string().min(3, { message: "El nombre de la categoría debe tener al menos 3 caracteres." }),
    description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
    aiModel: z.string({ required_error: "Por favor, selecciona un modelo de IA." }),
    prompt: z.string().min(10, { message: "El prompt debe tener al menos 10 caracteres." }),
    instructions: z.string().min(10, { message: "Las instrucciones deben tener al menos 10 caracteres." }),
    files: z.array(z.instanceof(File)).optional(),
});

function DesktopSkeleton() {
    return (
      <div>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-4 w-80 mt-2" />
          </div>
          <Skeleton className="h-10 w-full sm:w-[170px]" />
        </div>
  
        {/* Toolbar */}
        <div className="rounded-t-md border bg-card p-4">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
        </div>
  
        {/* Table Skeleton */}
        <div className="rounded-b-md border-x border-b">
          <div className="w-full text-sm">
            {/* Table Header */}
            <div className="border-b">
              <div className="flex h-12 items-center px-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="ml-4 h-4 w-48" />
                <Skeleton className="ml-44 h-4 w-32" />
                <Skeleton className="ml-20 h-4 w-32" />
                <Skeleton className="ml-16 h-4 w-52" />
              </div>
            </div>
            {/* Table Body */}
            <div>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex h-[73px] items-center border-b px-4 animate-pulse">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="ml-4 h-4 w-52" />
                  <Skeleton className="ml-40 h-6 w-24 rounded-full" />
                  <Skeleton className="ml-[100px] h-4 w-24" />
                  <Skeleton className="ml-20 h-4 w-56" />
                </div>
              ))}
            </div>
          </div>
          {/* Table Pagination */}
          <div className="flex items-center justify-end space-x-2 p-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
    );
}

function MobileSkeleton() {
    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-4 w-72 mt-2" />
                </div>
                <Skeleton className="h-10 w-full sm:w-[150px]" />
            </div>

            {/* Toolbar & Cards */}
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 flex justify-between items-start gap-4 animate-pulse">
                           <div className="space-y-2 flex-grow">
                                <Skeleton className="h-5 w-3/5" />
                                <Skeleton className="h-3 w-4/5" />
                                <Skeleton className="h-3 w-1/2" />
                                <div className="flex items-center gap-2 pt-1">
                                    <Skeleton className="h-5 w-24 rounded-full" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-8" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default function CategoriesPage() {
  const { categories, addCategory, editCategory, deleteCategory, fetchCategories, areCategoriesLoading, categoryPagination, categoriesError, isAuthLoading } = useApp();
  const { toast } = useToast();
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = React.useState<Category | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isMobile = useIsMobile();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [filterValue, setFilterValue] = React.useState("");
  const isMounted = React.useRef(true);
  
  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      aiModel: "",
      prompt: "",
      instructions: "",
      files: [],
    },
  });
  
  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );
  const pageCount = categoryPagination.totalPages;

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
    };
  }, []);
  
  React.useEffect(() => {
    const timeout = setTimeout(() => {
        setGlobalFilter(filterValue);
    }, 300);
    return () => clearTimeout(timeout);
  }, [filterValue]);

  React.useEffect(() => {
    if (!isAuthLoading) {
      fetchCategories({
        page: pageIndex + 1,
        limit: pageSize,
        search: globalFilter || undefined,
      });
    }
  }, [isAuthLoading, pageIndex, pageSize, fetchCategories, globalFilter]);

  async function onSubmit(values: z.infer<typeof categorySchema>) {
    setIsSubmitting(true);
    try {
        if (editingCategory) {
          await editCategory(editingCategory.id, values);
          toast({
            title: "Categoría Actualizada",
            description: `La categoría "${values.name}" ha sido actualizada con éxito.`,
          });
        } else {
          await addCategory(values);
          toast({
            title: "Categoría Creada",
            description: `La categoría "${values.name}" ha sido añadida con éxito.`,
          });
          // Reset pagination to first page to see the new category
          if(table.getState().pagination.pageIndex !== 0) {
            table.setPageIndex(0);
          }
        }
        setIsFormDialogOpen(false);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error al Guardar",
            description: error.message || "No se pudo guardar la categoría. Inténtalo de nuevo.",
        });
    } finally {
        if(isMounted.current) {
            setIsSubmitting(false);
        }
    }
  }
  
  const handleSuggestPrompt = async () => {
    const { name: categoryName, files } = form.getValues();
    if (!categoryName) {
      toast({
        variant: "destructive",
        title: "No se puede sugerir",
        description: "Por favor, introduce primero un nombre de categoría.",
      });
      return;
    }
    
    setIsSuggesting(true);
    try {
      const fileDataUris =
        files && files.length > 0
          ? await Promise.all(files.map((file) => readFileAsDataURI(file)))
          : undefined;

      const result = await suggestCategoryPrompt({ categoryName, fileDataUris });
      if (isMounted.current) {
        form.setValue("prompt", result.suggestedPrompt, { shouldValidate: true });
        toast({
          title: "¡Prompt Sugerido!",
          description: "La IA ha generado un prompt para ti.",
          icon: <Lightbulb className="h-5 w-5 text-yellow-500" />,
        });
      }
    } catch (error) {
      console.error(error);
      if (isMounted.current) {
        toast({
          variant: "destructive",
          title: "Sugerencia Fallida",
          description: "No se pudo generar un prompt. Por favor, inténtalo de nuevo.",
        });
      }
    } finally {
      if (isMounted.current) {
        setIsSuggesting(false);
      }
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingCategory(null);
      form.reset();
    }
    setIsFormDialogOpen(open);
  }

  const handleCreateClick = () => {
    setEditingCategory(null);
    form.reset();
    setIsFormDialogOpen(true);
  }

  const handleEditClick = React.useCallback((category: Category) => {
    setEditingCategory(category);
    form.reset({
      ...category,
      files: [], // Files are not part of the stored category data
    });
    setIsFormDialogOpen(true);
  }, [form]);

  const handleDeleteClick = React.useCallback((category: Category) => {
    setCategoryToDelete(category);
  }, []);
  
  const handleViewDetailsClick = React.useCallback((category: Category) => {
    setViewingCategory(category);
  }, []);
  
  const confirmDelete = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory(categoryToDelete.id);
        toast({
          title: "Categoría Eliminada",
          description: `La categoría "${categoryToDelete.name}" ha sido eliminada.`,
          icon: <Trash2 className="h-5 w-5 text-primary" />,
        });
        setCategoryToDelete(null);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error al Eliminar",
          description: error.message || "No se pudo eliminar la categoría. Inténtalo de nuevo.",
        });
        setCategoryToDelete(null);
      }
    }
  };

  const confirmBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    selectedRows.forEach(row => {
        deleteCategory(row.original.id);
    });
    table.resetRowSelection();
    toast({
        title: "Categorías Eliminadas",
        description: `${selectedRows.length} categorías han sido eliminadas.`,
        icon: <Trash2 className="h-5 w-5 text-primary" />,
    });
    setIsBulkDeleteOpen(false);
  }

  const columns = React.useMemo(() => getColumns(handleEditClick, handleDeleteClick, handleViewDetailsClick), [handleEditClick, handleDeleteClick, handleViewDetailsClick]);
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: categories,
    columns,
    pageCount,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    manualPagination: true,
    manualFiltering: true,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      pagination,
    },
  });
  
  React.useEffect(() => {
    table.setPageIndex(0);
  },[globalFilter, table])


  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterValue(event.target.value);
  };

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;

  const toolbar = (
    <Input
    placeholder="Filtrar categorías..."
    value={filterValue}
    onChange={handleFilterChange}
    className="max-w-sm"
    />
  );
  
  const bulkActions = (
    <Button variant="destructive" onClick={() => setIsBulkDeleteOpen(true)}>Eliminar</Button>
  );

  const MobileCategoryCard = ({ category }: { category: Category }) => (
    <Card>
      <CardContent className="p-4 flex justify-between items-start gap-4">
        <div className="space-y-2 flex-grow">
          <p className="font-bold">{category.name}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
          <div className="flex items-center gap-2 pt-1">
             <Badge variant={category.aiModel === 'Gemini Pro' ? 'secondary' : 'default'}>{category.aiModel}</Badge>
             <span className="text-xs text-muted-foreground">{category.createdAt}</span>
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
              <DropdownMenuItem onClick={() => handleViewDetailsClick(category)} className="cursor-pointer">
                Ver Completo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(category.id)} className="cursor-pointer">
                Copiar ID de Categoría
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEditClick(category)} className="cursor-pointer">Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteClick(category)} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
  
  const MobilePaginationControls = () => (
    <div className="flex items-center justify-between mt-4">
        <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
        >
            Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </span>
        <Button
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
        >
            Siguiente
        </Button>
    </div>
  );

  if (areCategoriesLoading && categories.length === 0) {
      return isMobile ? <MobileSkeleton /> : <DesktopSkeleton />;
  }

  if (categoriesError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-10">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Categorías</AlertTitle>
          <AlertDescription>
            {categoriesError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Categorías</h1>
          <p className="text-muted-foreground">
            Gestiona tus categorías de análisis aquí.
          </p>
        </div>
        <Button onClick={handleCreateClick} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Categoría
        </Button>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar Categoría" : "Añadir Nueva Categoría"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Modifica los detalles de tu categoría." : "Crea una nueva categoría para clasificar y analizar tus catálogos."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="max-h-[60vh] space-y-4 overflow-y-auto p-1 pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Categoría</FormLabel>
                          <FormControl>
                            <Input placeholder="ej., Descripciones de Productos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="aiModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modelo de IA</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un modelo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Gemini 2.0 Flash">Gemini 2.0 Flash</SelectItem>
                              <SelectItem value="Gemini Pro">Gemini Pro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Una breve descripción para qué sirve esta categoría." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="files"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Archivos de Ejemplo (Opcional)</FormLabel>
                      <FormDescription>
                        Sube uno o más archivos de ejemplo para ayudar a la IA a sugerir un prompt más preciso.
                      </FormDescription>
                      <FormControl>
                        <FileUploader
                          value={field.value ?? []}
                          onChange={field.onChange}
                          dropzoneOptions={{
                            accept: {
                              "application/pdf": [".pdf"],
                              "text/plain": [".txt"],
                              "image/jpeg": [".jpeg", ".jpg"],
                              "image/png": [".png"],
                            },
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between">
                        <span>Prompt de IA</span>
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-primary"
                            onClick={handleSuggestPrompt}
                            disabled={isSuggesting}
                        >
                            {isSuggesting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                            ) : (
                                <Lightbulb className="mr-2 h-4 w-4"/>
                            )}
                            {isSuggesting ? 'Sugiriendo...' : 'Sugerir con IA'}
                        </Button>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Indica a la IA qué extraer, ej., 'Extraer nombres de productos y precios.'"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrucciones para la IA</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Proporciona instrucciones específicas, ej., 'Formatear la salida como JSON.'"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCategory ? "Guardar Cambios" : "Guardar Categoría"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!viewingCategory} onOpenChange={(open) => !open && setViewingCategory(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingCategory?.name}</DialogTitle>
            <DialogDescription>
              Detalles completos de la categoría.
            </DialogDescription>
          </DialogHeader>
          {viewingCategory && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Descripción</h4>
                <p className="text-sm text-muted-foreground">{viewingCategory.description}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Modelo de IA</h4>
                <p className="text-sm text-muted-foreground">{viewingCategory.aiModel}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Prompt</h4>
                <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md font-mono">{viewingCategory.prompt}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Instrucciones</h4>
                <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md font-mono">{viewingCategory.instructions}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Fecha de Creación</h4>
                <p className="text-sm text-muted-foreground">{viewingCategory.createdAt}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewingCategory(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la categoría{' '}
              <span className="font-semibold">{categoryToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
                Esta acción no se puede deshacer. Esto eliminará permanentemente las {table.getFilteredSelectedRowModel().rows.length} categorías seleccionadas.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Eliminar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isMobile ? (
        <div className="space-y-4">
          <Input
            placeholder="Filtrar categorías..."
            value={filterValue}
            onChange={handleFilterChange}
            className="w-full"
          />
          {table.getRowModel().rows?.length ? (
              <div className="space-y-4">
                  {table.getRowModel().rows.map((row) => (
                      <MobileCategoryCard key={row.id} category={row.original} />
                  ))}
                  {pageCount > 1 && <MobilePaginationControls />}
              </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">No hay categorías.</div>
          )}
        </div>
      ) : (
        <div>
          <div className="rounded-t-md border bg-card p-4">
            <div className="flex items-center">
              {selectedRowCount > 0 ? (
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    {selectedRowCount} de {table.getCoreRowModel().rows.length} fila(s) seleccionadas.
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
            {areCategoriesLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-md bg-card/80 backdrop-blur-sm">
                    <LogoSpinner />
                </div>
            )}
          </div>
        </div>
      )}
      <ScrollToTopButton />
    </div>
  );
}
