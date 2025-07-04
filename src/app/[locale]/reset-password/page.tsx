
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { QrCode, ShieldCheck, CheckCircle2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

const getResetPasswordSchema = (t: (key: string) => string) => z.object({
  password: z.string().min(8, { message: t('validation.passwordLength') }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('validation.passwordsMustMatch'),
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<ReturnType<typeof getResetPasswordSchema>>;

export default function ResetPasswordPage() {
  const t = useTranslations("ResetPasswordPage");
  const resetPasswordSchema = getResetPasswordSchema(t);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const isMounted = React.useRef(true);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
    };
  }, []);

  const onSubmit = () => {
    setIsAlertOpen(true);
  };

  const handlePasswordReset = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (isMounted.current) {
        setIsLoading(false);
        setIsSuccess(true);
        toast({
          title: t('toastSuccessTitle'),
          description: t('toastSuccessDescription'),
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        });
         // Redirect after a short delay
         setTimeout(() => {
          if (isMounted.current) {
            router.push("/login");
          }
        }, 2000);
      }
    }, 1500);
  };
  
  if (isSuccess) {
    return (
        <main className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-sm text-center">
                <CardHeader className="items-center">
                    <ShieldCheck className="h-16 w-16 text-primary mb-4" />
                    <CardTitle className="text-2xl">{t('successCardTitle')}</CardTitle>
                    <CardDescription>
                        {t('successCardDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/login">{t('goToLogin')}</Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    )
  }

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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('passwordLabel')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('passwordPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('passwordPlaceholder')} {...field} />
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
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDialogDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordReset}>
              {t('continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
