
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { QrCode, MailCheck } from "lucide-react";
import Link from "next/link";

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

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    // Simulate sending a reset link
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
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
            <CardTitle className="text-2xl">Revisa tu Correo</CardTitle>
            <CardDescription>
              Si existe una cuenta con el correo que proporcionaste, hemos enviado un enlace para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Volver a Iniciar Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">¿Olvidaste tu Contraseña?</CardTitle>
            <CardDescription>
              No te preocupes. Introduce tu correo y te enviaremos un enlace para restablecerla.
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
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="nombre@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar Enlace de Restablecimiento"}
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm">
              <Link
                  href="/login"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Volver a Iniciar Sesión
                </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
