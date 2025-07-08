
"use client";

import React from "react";
import { PlusCircle, Lightbulb, Loader2, MoreHorizontal, CheckCircle2, AlertTriangle, Trash2, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type SortingState,
  type ColumnFiltersState,
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

export default function CategoriesPage() {
  const { categories, addCategory, editCategory, deleteCategory } = useApp();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const isMobile = useIsMobile();
  const [visibleRows, setVisibleRows] = React.useState(10);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const isMounted = React.useRef(true);
  
  // Filter state
  const [filterValue, setFilterValue] = React.useState("");
  const [isFiltering, setIsFiltering] = React.useState(false);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
    };
  }, []);

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

  async function onSubmit(values: z.infer<typeof categorySchema>) {
    if (editingCategory) {
      editCategory(editingCategory.id, values);
      toast({
        title: "Categoría Actualizada",
        description: `La categoría "${values.name}" ha sido actualizada con éxito.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
    } else {
      addCategory(values);
      toast({
        title: "Categoría Creada",
        description: `La categoría "${values.name}" ha sido añadida con éxito.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
    }
    setIsDialogOpen(false);
  }
  
  const handleSuggestPrompt = async () => {
    const { name: categoryName, files } = form.getValues();
    if (!categoryName) {
      toast({
        variant: "destructive",
        title: "No se puede sugerir",
        description: "Por favor, introduce primero un nombre de categoría.",
        icon: <AlertTriangle className="h-5 w-5 text-destructive-foreground" />,
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
          icon: <AlertTriangle className="h-5 w-5 text-destructive-foreground" />,
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
    setIsDialogOpen(open);
  }

  const handleCreateClick = () => {
    setEditingCategory(null);
    form.reset();
    setIsDialogOpen(true);
  }

  const handleEditClick = React.useCallback((category: Category) => {
    setEditingCategory(category);
    form.reset(category);
    setIsDialogOpen(true);
  }, [form]);

  const handleDeleteClick = React.useCallback((category: Category) => {
    setCategoryToDelete(category);
  }, []);
  
  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
      toast({
        title: "Categoría Eliminada",
        description: `La categoría "${categoryToDelete.name}" ha sido eliminada.`,
        icon: <Trash2 className="h-5 w-5 text-primary" />,
      });
      setCategoryToDelete(null);
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

  const columns = React.useMemo(() => getColumns(handleEditClick, handleDeleteClick), [handleEditClick, handleDeleteClick]);
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: categories,
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
    const timeout = setTimeout(() => {
      if (isMounted.current) {
        table.getColumn("name")?.setFilterValue(filterValue);
        setIsFiltering(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [filterValue, table]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterValue(event.target.value);
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleRows(prev => prev + 10);
      if (isMounted.current) {
        setIsLoadingMore(false);
      }
    }, 500);
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
             <span className="text-xs text-muted-foreground">{category.dateCreated}</span>
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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(category.id)}>
                Copiar ID de Categoría
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEditClick(category)}>Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteClick(category)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

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

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
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
                <Button type="submit">{editingCategory ? "Guardar Cambios" : "Guardar Categoría"}</Button>
              </DialogFooter>
            </form>
          </Form>
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
                Esta acción no se puede deshacer. Esto eliminará permanentemente las {table.getFilteredSelectedRowModel().rows.length} categorías seleccionadas.
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

      {isMobile ? (
        <div className="space-y-4">
          <Input
            placeholder="Filtrar categorías..."
            value={filterValue}
            onChange={handleFilterChange}
            className="max-w-sm"
          />
          {table.getFilteredRowModel().rows?.length ? (
              <div className="space-y-4">
                  {table.getFilteredRowModel().rows.slice(0, visibleRows).map((row) => (
                      <MobileCategoryCard key={row.id} category={row.original} />
                  ))}
                  {visibleRows < table.getFilteredRowModel().rows.length && (
                      <Button
                          onClick={handleLoadMore}
                          variant="outline"
                          className="w-full"
                          disabled={isLoadingMore}
                      >
                          {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isLoadingMore ? "Cargando..." : "Cargar más"}
                      </Button>
                  )}
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
            {isFiltering && (
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

    
