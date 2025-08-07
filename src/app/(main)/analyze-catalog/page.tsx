
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useState } from "react";
import { Lightbulb, Loader2, AlertTriangle, FileUp, Sparkles } from "lucide-react";
import { marked } from "marked";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/file-uploader";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  prompt: z.string().min(10, { message: "El prompt debe tener al menos 10 caracteres." }),
  file: z
    .array(z.instanceof(File))
    .min(1, { message: "Se requiere un archivo." })
    .max(1, { message: "Solo puedes subir un archivo a la vez." }),
});

export default function AnalyzeCatalogPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const { toast } = useToast();
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
    };
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      file: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('prompt', values.prompt);
    formData.append('file', values.file[0]);

    try {
      const result = await api.post('/uploads/upload-file', formData);
      
      if (isMounted.current) {
        const geminiResult = result.data.geminiResult;
        const htmlResult = await marked.parse(geminiResult || "Análisis completado, pero no se recibió contenido.");
        setAnalysisResult(htmlResult);
      }

    } catch (error) {
      console.error("Analysis failed:", error);
      if(isMounted.current){
        toast({
          variant: "destructive",
          title: "Análisis Fallido",
          description: (error as Error).message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
          icon: <AlertTriangle className="h-5 w-5 text-destructive-foreground" />,
        });
      }
    } finally {
        if(isMounted.current){
            setIsLoading(false);
        }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3"><FileUp className="h-8 w-8 text-primary"/> Análisis de Archivos con IA</h1>
        <p className="text-muted-foreground mt-2">
          Sube un archivo, escribe un prompt y deja que nuestra IA haga el resto.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo Análisis</CardTitle>
          <CardDescription>
            Completa los detalles a continuación para iniciar un nuevo análisis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
                    <FormField
                        control={form.control}
                        name="prompt"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Prompt</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Ej: Extrae todos los nombres de productos y sus precios de este catálogo y muéstralos en una tabla."
                                rows={8}
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Archivo</FormLabel>
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
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
                                "application/vnd.ms-excel": [".xls"]
                              },
                              maxSize: 10 * 1024 * 1024, // 10MB
                              maxFiles: 1,
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
                    La IA analizará el archivo basándose en tu prompt. Puedes pedirle que extraiga datos, resuma contenido, lo formatee como tabla, etc.
                  </p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Analizando...' : 'Analizar Archivo'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {(isLoading || analysisResult) && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                Resultados del Análisis
              </CardTitle>
              <CardDescription>
                Esta es la respuesta generada por la IA basada en tu prompt y el archivo subido.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Analizando, por favor espera...</p>
                </div>
              ) : (
                analysisResult && (
                  <div 
                    className="prose dark:prose-invert max-w-none [&_table]:w-full [&_table]:table-auto [&_th]:p-2 [&_th]:border [&_td]:p-2 [&_td]:border"
                    dangerouslySetInnerHTML={{ __html: analysisResult }} 
                  />
                )
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
