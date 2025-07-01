"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Loader2 } from "lucide-react";

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
import { useApp } from "./store";
import { analyzeCatalogInput } from "@/ai/flows/analyze-catalog-input";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  category: z.string().min(1, { message: "Please select a category." }),
  catalogName: z.string().min(1, { message: "Catalog name is required." }),
  file: z.instanceof(File).refine(file => file.size > 0, "A file is required."),
});

const readFileAsDataURI = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export default function AnalyzeCatalogPage() {
  const { categories, addScanResult } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      catalogName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const selectedCategory = categories.find(c => c.id === values.category);

    if (!selectedCategory) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selected category not found.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const fileDataUri = await readFileAsDataURI(values.file);
      
      const result = await analyzeCatalogInput({
        categoryName: selectedCategory.name,
        catalogName: values.catalogName,
        fileDataUri,
        instructions: selectedCategory.instructions,
        prompt: selectedCategory.prompt,
      });

      addScanResult({
        category: selectedCategory.name,
        catalogName: values.catalogName,
        analysis: result.analysisResults,
      });

      toast({
        title: "Analysis Complete",
        description: "Your catalog has been successfully analyzed.",
      });
      router.push("/dashboard/results");

    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analyze Catalog</h1>
        <p className="text-muted-foreground">
          Select a category, upload a catalog file, and let our AI do the rest.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Analysis</CardTitle>
          <CardDescription>
            Fill in the details below to start a new catalog analysis.
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
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category for analysis" />
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
                          <FormLabel>Catalog Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Spring 2024 Collection" {...field} />
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
                      <FormLabel>Catalog File</FormLabel>
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
                        The AI will analyze the file based on the prompt and instructions defined in the selected category.
                      </p>
                  </div>
              </div>


              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Analyzing..." : "Analyze Catalog"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
