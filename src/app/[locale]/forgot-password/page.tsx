
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { QrCode, MailCheck } from "lucide-react";
import Link from "next/link";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const getForgotPasswordSchema = (t: (key: string) => string) => z.object({
  email: z.string().email({ message: t('validation.emailInvalid') }),
});

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPasswordPage");
  const forgotPasswordSchema = getForgotPasswordSchema(t);
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: z.infer<typeof forgotPasswordSchema>) => {
    setIsLoading(true);
    // Simulate sending a reset link
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
        <Link href="/login" className="flex items-center gap-2">
          <QrCode className="h-10 w-10 text-primary" />
          <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">
              COCOCO Scan
          </h1>
        </Link>
      </div>
      {isSubmitted ? (
        <Card className="w-full max-w-sm text-center">
          <CardHeader className="items-center">
            <MailCheck className="h-16 w-16 text-primary mb-4" />
            <CardTitle className="text-2xl">{t('successCardTitle')}</CardTitle>
            <CardDescription>
              {t('successCardDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">{t('backToLogin')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">{t('title')}</CardTitle>
            <CardDescription>
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('emailLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('emailPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('buttonLoadingText') : t('buttonText')}
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm">
              <Link
                  href="/login"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {t('backToLogin')}
                </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
