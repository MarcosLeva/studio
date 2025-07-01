"use client";

import React from "react";
import { PlusCircle, Loader2, Lightbulb } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useApp } from "../store";
import { useToast } from "@/hooks/use-toast";
import { suggestCategoryPrompt } from "@/ai/flows/suggest-category-prompt";

const categorySchema = z.object({
  name: z.string().min(3, { message: "Category name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  aiModel: z.string({ required_error: "Please select an AI model." }),
  prompt: z.string().min(10, { message: "Prompt must be at least 10 characters." }),
  instructions: z.string().min(10, { message: "Instructions must be at least 10 characters." }),
});

export default function CategoriesPage() {
  const { categories, addCategory } = useApp();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isSuggesting, setIsSuggesting] = React.useState(false);

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      prompt: "",
      instructions: "",
    },
  });

  async function onSubmit(values: z.infer<typeof categorySchema>) {
    addCategory(values);
    toast({
      title: "Category Created",
      description: `The category "${values.name}" has been added successfully.`,
    });
    setOpen(false);
    form.reset();
  }
  
  const handleSuggestPrompt = async () => {
    const categoryName = form.getValues("name");
    if (!categoryName) {
      toast({
        variant: "destructive",
        title: "Cannot Suggest",
        description: "Please enter a category name first.",
      });
      return;
    }
    
    setIsSuggesting(true);
    try {
      const result = await suggestCategoryPrompt({ categoryName });
      form.setValue("prompt", result.suggestedPrompt, { shouldValidate: true });
      toast({
        title: "Prompt Suggested!",
        description: "The AI has generated a prompt for you."
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Suggestion Failed",
        description: "Could not generate a prompt. Please try again.",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage your analysis categories here.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new category to classify and analyze your catalogs.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Product Descriptions" {...field} />
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
                          <FormLabel>AI Model</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a model" />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A brief description of what this category is for." {...field} />
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
                        <span>AI Prompt</span>
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
                            Suggest with AI
                        </Button>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell the AI what to extract, e.g., 'Extract product names and prices.'"
                          className="min-h-[100px]"
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
                      <FormLabel>AI Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide specific instructions, e.g., 'Format output as JSON.'"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Category</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={categories} />
    </div>
  );
}
