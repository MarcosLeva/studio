
"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
import { useApp } from "@/app/store";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, editUser } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isMounted = React.useRef(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    form.reset({
        name: user.name,
        email: user.email,
    })
  }, [user, form]);


  const onSubmit = (data: ProfileFormValues) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (isMounted.current) {
        editUser({ name: data.name, email: data.email });
        toast({
          title: "Perfil Actualizado",
          description: "Tu información ha sido actualizada con éxito.",
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        });
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Archivo no válido",
          description: "Por favor, selecciona un archivo de imagen.",
          icon: <AlertTriangle className="h-5 w-5 text-destructive-foreground" />,
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isMounted.current) {
          const dataUrl = reader.result as string;
          editUser({ avatar: dataUrl });
          toast({
            title: "Foto de perfil actualizada",
            description: "Tu nueva foto ha sido guardada.",
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Perfil de Usuario</h1>
        <p className="text-muted-foreground">
          Gestiona la información de tu cuenta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Perfil</CardTitle>
          <CardDescription>
            Edita tu nombre, correo electrónico y foto de perfil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="user avatar" />
                  <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/*"
                />
                <Button type="button" variant="outline" onClick={handleButtonClick}>
                  Cambiar Foto
                </Button>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="tu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
