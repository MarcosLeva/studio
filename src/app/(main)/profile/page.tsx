
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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useApp } from "@/app/store";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle2, AlertTriangle, KeyRound, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PasswordInput } from "@/components/ui/password-input";

const profileSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: "La contraseña actual es obligatoria." }),
    newPassword: z.string().min(8, { message: "La nueva contraseña debe tener al menos 8 caracteres." }),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});


type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, editUser } = useApp();
  const { toast } = useToast();
  const [isProfileLoading, setIsProfileLoading] = React.useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = React.useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isMounted = React.useRef(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
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


  const onProfileSubmit = (data: ProfileFormValues) => {
    setIsProfileLoading(true);
    setTimeout(() => {
      if (isMounted.current) {
        editUser({ name: data.name, email: data.email });
        toast({
          title: "Perfil Actualizado",
          description: "Tu información ha sido actualizada con éxito.",
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        });
        setIsProfileLoading(false);
        setIsProfileDialogOpen(false);
      }
    }, 1000);
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    setIsPasswordLoading(true);
    setTimeout(() => {
        if(isMounted.current){
            console.log("Password change data:", data);
            toast({
                title: "Contraseña Actualizada",
                description: "Tu contraseña ha sido cambiada con éxito.",
                icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            });
            setIsPasswordLoading(false);
            setIsPasswordDialogOpen(false);
            passwordForm.reset();
        }
    }, 1500);
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
            <CardContent className="space-y-6">
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

              <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nombre</Label>
                    <p className="text-lg">{user.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Correo Electrónico</Label>
                    <p className="text-lg">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Rol</Label>
                    <p className="text-lg">{user.role}</p>
                  </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4">
                  <Dialog open={isPasswordDialogOpen} onOpenChange={(isOpen) => {
                    setIsPasswordDialogOpen(isOpen);
                    if (!isOpen) passwordForm.reset();
                  }}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="w-full sm:w-auto">
                            <KeyRound className="mr-2 h-4 w-4" />
                            Cambiar Contraseña
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Cambiar Contraseña</DialogTitle>
                            <DialogDescription>
                                Usa una contraseña segura para proteger tu cuenta.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña Actual</FormLabel>
                                        <FormControl>
                                        <PasswordInput placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
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
                                    control={passwordForm.control}
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
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={isPasswordLoading}>
                                        {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar Contraseña
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                
                <Dialog open={isProfileDialogOpen} onOpenChange={(isOpen) => {
                  setIsProfileDialogOpen(isOpen);
                  if (!isOpen) form.reset();
                }}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar Perfil
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Editar Perfil</DialogTitle>
                            <DialogDescription>
                                Actualiza tu nombre y correo electrónico.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-4">
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
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsProfileDialogOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={isProfileLoading}>
                                        {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar Cambios
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardFooter>
        </Card>
    </div>
  );
}
