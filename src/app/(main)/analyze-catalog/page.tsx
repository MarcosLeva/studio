
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Loader2, CheckCircle2, AlertTriangle, Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/file-uploader";
import { useApp } from "@/app/store";
import { analyzeCatalogInput } from "@/ai/flows/analyze-catalog-input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const readFileAsDataURI = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const formSchema = z.object({
    category: z.string().min(1, { message: "Por favor, selecciona una categoría." }),
    catalogName: z.string().min(1, { message: "El nombre del catálogo es obligatorio." }),
    files: z.array(z.instanceof(File)).min(1, { message: "Se requiere al menos un archivo." }),
});

export default function AnalyzeCatalogPage() {
  const { categories, addScanResult, fetchCategories, areCategoriesLoading, isAuthLoading } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const isMounted = React.useRef(true);
  const [isCategoryPopoverOpen, setCategoryPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (!isAuthLoading) {
      // Fetch all categories for the dropdown
      fetchCategories({ page: 1, limit: 1000 });
    }
  }, [isAuthLoading, fetchCategories]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      catalogName: "",
      files: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const selectedCategory = categories.find(c => c.id === values.category);

    if (!selectedCategory) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Categoría seleccionada no encontrada.",
        icon: <AlertTriangle className="h-5 w-5 text-destructive-foreground" />,
      });
      setIsLoading(false);
      return;
    }

    try {
      const fileDataUris = await Promise.all(
        values.files.map(file => readFileAsDataURI(file))
      );
      
      const result = await analyzeCatalogInput({
        categoryName: selectedCategory.name,
        catalogName: values.catalogName,
        fileDataUris,
        instructions: selectedCategory.instructions,
        prompt: selectedCategory.prompt,
      });

      addScanResult({
        category: selectedCategory.name,
        catalogName: values.catalogName,
        analysis: result.analysisResults,
      });

      toast({
        title: "Análisis Completo",
        description: "Tu catálogo ha sido analizado con éxito.",
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
      router.push("/results");

    } catch (error) {
      console.error("Analysis failed:", error);
      if(isMounted.current){
        toast({
          variant: "destructive",
          title: "Análisis Fallido",
          description: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
          icon: <AlertTriangle className="h-5 w-5 text-destructive-foreground" />,
        });
        setIsLoading(false);
      }
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analizar Catálogo</h1>
        <p className="text-muted-foreground">
          Selecciona una categoría, sube uno o más archivos de catálogo y deja que nuestra IA haga el resto.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo Análisis</CardTitle>
          <CardDescription>
            Completa los detalles a continuación para iniciar un nuevo análisis de catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Categoría</FormLabel>
                          <Popover open={isCategoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isCategoryPopoverOpen}
                                  className={cn(
                                    "w-full justify-between font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={areCategoriesLoading}
                                >
                                  {areCategoriesLoading
                                    ? "Cargando categorías..."
                                    : field.value
                                    ? categories.find(
                                        (cat) => cat.id === field.value
                                      )?.name
                                    : "Selecciona una categoría"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                               <Command>
                                <CommandInput placeholder="Buscar categoría..." />
                                <CommandList>
                                  <CommandEmpty>No se encontraron categorías.</CommandEmpty>
                                  <CommandGroup>
                                    {categories.map((cat) => (
                                      <CommandItem
                                        value={cat.name}
                                        key={cat.id}
                                        onSelect={() => {
                                          form.setValue("category", cat.id);
                                          setCategoryPopoverOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            cat.id === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {cat.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="catalogName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Catálogo</FormLabel>
                          <FormControl>
                            <Input placeholder="ej., Colección Primavera 2024" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <FormField
                  control={form.control}
                  name="files"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Archivos de Catálogo</FormLabel>
                      <FormControl>
                         <FileUploader
                            value={field.value}
                            onChange={field.onChange}
                            dropzoneOptions={{
                              accept: {
                                "application/pdf": [".pdf"],
                                "text/plain": [".txt"],
                                "image/jpeg": [".jpeg", ".jpg"],
                                "image/png": [".png"],
                              },
                              maxSize: 10 * 1024 * 1024, // 10MB
                            }}
                         />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-start gap-3 rounded-lg border bg-secondary/50 p-4">
                  <Lightbulb className="h-6 w-6 shrink-0 text-accent" />
                  <p className="text-sm text-muted-foreground">
                    La IA analizará el archivo basándose en el prompt y las instrucciones definidas en la categoría seleccionada.
                  </p>
              </div>


              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Analizando...' : 'Analizar Catálogo'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
