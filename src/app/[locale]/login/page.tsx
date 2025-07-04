
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { QrCode, ShieldCheck, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

const getLoginSchema = (t: (key: string) => string) => z.object({
  email: z.string().email({ message: t('validation.emailInvalid') }),
  password: z.string().min(1, { message: t('validation.passwordRequired') }),
});

type LoginFormValues = z.infer<ReturnType<typeof getLoginSchema>>;

export default function LoginPage() {
  const t = useTranslations('LoginPage');
  const loginSchema = getLoginSchema(t);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const isMounted = React.useRef(true);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
    };
  }, []);

  const onSubmit = (data: LoginFormValues) => {
    setIsLoading(true);
    // Faux authentication
    setTimeout(() => {
      if (isMounted.current) {
        setIsLoading(false);
        // Basic validation check for demo purposes
        if (data.email && data.password) {
          setIsSuccess(true);
          setTimeout(() => {
              router.push("/analyze-catalog");
          }, 2000);
        } else {
          toast({
            variant: "destructive",
            title: t('errorToastTitle'),
            description: t('errorToastDescription'),
          });
        }
      }
    }, 1000);
  };

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="flex items-center gap-2">
            <QrCode className="h-10 w-10 text-primary" />
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">
                {t('title')}
            </h1>
        </div>
        <p className="max-w-xl text-muted-foreground md:text-xl">
            {t('subtitle')}
        </p>
      </div>
      {isSuccess ? (
        <Card className="mt-8 w-full max-w-sm text-center">
          <CardHeader className="items-center">
              <ShieldCheck className="h-16 w-16 text-primary mb-4" />
              <CardTitle className="text-2xl">{t('successTitle')}</CardTitle>
              <CardDescription>
                  {t('successDescription')}
              </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-8 w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">{t('cardTitle')}</CardTitle>
            <CardDescription>{t('cardDescription')}</CardDescription>
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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>{t('passwordLabel')}</FormLabel>
                        <Link
                            href="/forgot-password"
                            className="text-sm font-medium text-primary hover:underline underline-offset-4"
                        >
                            {t('forgotPassword')}
                        </Link>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder={t('passwordPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('loginButton') : t('loginButtonIdle')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
