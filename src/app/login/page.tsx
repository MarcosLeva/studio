
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { QrCode, ShieldCheck, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
  password: z.string().min(1, { message: "La contraseña es obligatoria." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
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
            title: "Error al Iniciar Sesión",
            description: "Por favor, comprueba tus credenciales e inténtalo de nuevo.",
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
                COCOCO Scan
            </h1>
        </div>
        <p className="max-w-xl text-muted-foreground md:text-xl">
            Análisis de Catálogos con IA. Optimizado. Inteligente.
        </p>
      </div>
      {isSuccess ? (
        <Card className="mt-8 w-full max-w-sm text-center">
          <CardHeader className="items-center">
              <ShieldCheck className="h-16 w-16 text-primary mb-4" />
              <CardTitle className="text-2xl">¡Inicio de Sesión Exitoso!</CardTitle>
              <CardDescription>
                  ¡Bienvenido de nuevo! Serás redirigido en un momento.
              </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-8 w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>Introduce tu correo electrónico para iniciar sesión.</CardDescription>
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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Contraseña</FormLabel>
                        <Link
                            href="/forgot-password"
                            className="text-sm font-medium text-primary hover:underline underline-offset-4"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Iniciando Sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
