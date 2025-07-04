
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/file-uploader";
import { useApp } from "@/app/store";
import { analyzeCatalogInput } from "@/ai/flows/analyze-catalog-input";
import { useToast } from "@/hooks/use-toast";

const readFileAsDataURI = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export default function AnalyzeCatalogPage() {
  const t = useTranslations("AnalyzeCatalogPage");
  
  const formSchema = z.object({
    category: z.string().min(1, { message: t('categoryMissingError') }),
    catalogName: z.string().min(1, { message: t('catalogNameMissingError') }),
    files: z.array(z.instanceof(File)).min(1, { message: t('fileMissingError') }),
  });

  const { categories, addScanResult } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
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
        description: t('categoryNotFoundError'),
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
        title: t('analysisSuccessToastTitle'),
        description: t('analysisSuccessToastDescription'),
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
      router.push("/results");

    } catch (error) {
      console.error("Analysis failed:", error);
      if(isMounted.current){
        toast({
          variant: "destructive",
          title: t('analysisFailedToastTitle'),
          description: t('analysisFailedToastDescription'),
          icon: <AlertTriangle className="h-5 w-5 text-destructive-foreground" />,
        });
        setIsLoading(false);
      }
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('newAnalysisTitle')}</CardTitle>
          <CardDescription>
            {t('newAnalysisDescription')}
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
                        <FormItem>
                          <FormLabel>{t('categoryLabel')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('categoryPlaceholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="catalogName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('catalogNameLabel')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('catalogNamePlaceholder')} {...field} />
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
                      <FormLabel>{t('filesLabel')}</FormLabel>
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

              <div className="flex items-center justify-between rounded-lg border bg-secondary/50 p-4">
                  <div className="flex items-center gap-3">
                      <Lightbulb className="h-8 w-8 text-accent-foreground/80" />
                      <p className="text-sm text-muted-foreground">
                        {t('tip')}
                      </p>
                  </div>
              </div>


              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? t('analyzingButton') : t('analyzeButton')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
