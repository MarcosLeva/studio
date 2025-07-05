
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
import { LogoSpinner } from "@/components/ui/logo-spinner";
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

const readFileAsDataURI = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export default function CategoriesPage() {
  const t = useTranslations("CategoriesPage");
  const tCol = useTranslations("CategoriesColumns");
  
  const categorySchema = z.object({
    name: z.string().min(3, { message: t('validation.nameLength') }),
    description: z.string().min(10, { message: t('validation.descriptionLength') }),
    aiModel: z.string({ required_error: t('validation.aiModelRequired') }),
    prompt: z.string().min(10, { message: t('validation.promptLength') }),
    instructions: z.string().min(10, { message: t('validation.instructionsLength') }),
    files: z.array(z.instanceof(File)).optional(),
  });

  const { categories, addCategory, editCategory, deleteCategory } = useApp();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [isFiltering, setIsFiltering] = React.useState(false);
  const isMobile = useIsMobile();
  const [visibleRows, setVisibleRows] = React.useState(10);
  const isMounted = React.useRef(true);
  
  // Filter state
  const [filterValue, setFilterValue] = React.useState("");

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
        title: t('toastCategoryUpdatedTitle'),
        description: t('toastCategoryUpdatedDescription', { name: values.name }),
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
    } else {
      addCategory(values);
      toast({
        title: t('toastCategoryCreatedTitle'),
        description: t('toastCategoryCreatedDescription', { name: values.name }),
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
        title: t('toastSuggestErrorTitle'),
        description: t('toastSuggestErrorDescription'),
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
          title: t('toastPromptSuggestedTitle'),
          description: t('toastPromptSuggestedDescription'),
          icon: <Lightbulb className="h-5 w-5 text-yellow-500" />,
        });
      }
    } catch (error) {
      console.error(error);
      if (isMounted.current) {
        toast({
          variant: "destructive",
          title: t('toastSuggestFailedTitle'),
          description: t('toastSuggestFailedDescription'),
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
        title: t('toastCategoryDeletedTitle'),
        description: t('toastCategoryDeletedDescription', { name: categoryToDelete.name }),
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
        title: t('toastCategoriesDeletedTitle'),
        description: t('toastCategoriesDeletedDescription', { count: selectedRows.length }),
        icon: <Trash2 className="h-5 w-5 text-primary" />,
    });
    setIsBulkDeleteOpen(false);
  }

  const columns = React.useMemo(() => getColumns(handleEditClick, handleDeleteClick, (key) => tCol(key)), [handleEditClick, handleDeleteClick, tCol]);
  
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
    const timeout = setTimeout(() => {
      table.getColumn("name")?.setFilterValue(filterValue);
      setIsFiltering(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [filterValue, table]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsFiltering(true);
    setFilterValue(event.target.value);
  };
  
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;

  const toolbar = (
    <Input
    placeholder={t('filterPlaceholder')}
    value={filterValue}
    onChange={handleFilterChange}
    className="max-w-sm"
    />
  );
  
  const bulkActions = (
    <Button variant="destructive" onClick={() => setIsBulkDeleteOpen(true)}>{t('deleteButton')}</Button>
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
              <DropdownMenuLabel>{tCol('actions')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(category.id)}>
                {tCol('copyId')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEditClick(category)}>{tCol('edit')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteClick(category)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">{tCol('delete')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button onClick={handleCreateClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('newCategoryButton')}
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCategory ? t('editDialogTitle') : t('addDialogTitle')}</DialogTitle>
            <DialogDescription>
              {editingCategory ? t('editDialogDescription') : t('addDialogDescription')}
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
                          <FormLabel>{t('categoryNameLabel')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('categoryNamePlaceholder')} {...field} />
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
                          <FormLabel>{t('aiModelLabel')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('aiModelPlaceholder')} />
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
                      <FormLabel>{t('descriptionLabel')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('descriptionPlaceholder')} {...field} />
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
                      <FormLabel>{t('sampleFilesLabel')}</FormLabel>
                      <FormDescription>
                        {t('sampleFilesDescription')}
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
                        <span>{t('promptLabel')}</span>
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
                            {isSuggesting ? t('suggestingButton') : t('suggestButton')}
                        </Button>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('promptPlaceholder')}
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
                      <FormLabel>{t('instructionsLabel')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('instructionsPlaceholder')}
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('cancelButton')}</Button>
                <Button type="submit">{editingCategory ? t('saveChangesButton') : t('saveCategoryButton')}</Button>
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
            <AlertDialogTitle>{t('deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialogDescription')}{' '}
              <span className="font-semibold">{categoryToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancelButton')}</AlertDialogCancel>
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

      {isMobile ? (
        <div className="space-y-4">
          <Input
            placeholder={t('filterPlaceholder')}
            value={filterValue}
            onChange={handleFilterChange}
            className="max-w-sm"
          />
          {table.getRowModel().rows?.length ? (
              <div className="space-y-4">
                  {table.getRowModel().rows.slice(0, visibleRows).map((row) => (
                      <MobileCategoryCard key={row.id} category={row.original} />
                  ))}
                  {visibleRows < table.getRowModel().rows.length && (
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
            <div className="text-center py-10 text-muted-foreground">{t('noCategories')}</div>
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
      <ScrollToTopButton />
    </div>
  );
}
