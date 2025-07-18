

"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { QrCode, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PasswordInput } from "@/components/ui/password-input";
import { api } from "@/lib/api";

const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { token } = params;

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      await api.post(`/users/reset-password/${token}`, {
        password: data.password,
      });

      toast({
        title: "Contraseña Restablecida",
        description: "Tu contraseña ha sido actualizada con éxito.",
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
      
      setIsSuccess(true);
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al Restablecer",
        description: error.message || "Ocurrió un error. El token puede ser inválido o haber expirado.",
        icon: <AlertTriangle className="h-5 w-5 text-destructive-foreground" />,
      });
      setIsLoading(false);
    }
  };
  
  if (isSuccess) {
    return (
        <main className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-sm text-center">
                <CardHeader className="items-center">
                    <ShieldCheck className="h-16 w-16 text-primary mb-4" />
                    <CardTitle className="text-2xl">¡Éxito!</CardTitle>
                    <CardDescription>
                        Tu contraseña ha sido restablecida correctamente. Serás redirigido al inicio de sesión.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/login">Ir a Iniciar Sesión Ahora</Link>
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
          <CardTitle className="text-2xl">Restablecer Contraseña</CardTitle>
          <CardDescription>
            Introduce tu nueva contraseña a continuación.
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
                    <FormLabel>Nueva Contraseña</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} />
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
                    <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
