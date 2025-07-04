
"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { useApp } from "@/app/store";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

type ProfileFormValues = z.infer<ReturnType<typeof getProfileSchema>>;

const getProfileSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(3, { message: t('validation.nameLength') }),
  email: z.string().email({ message: t('validation.emailInvalid') }),
});

export default function ProfilePage() {
  const t = useTranslations("ProfilePage");
  const profileSchema = getProfileSchema(t);

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
          title: t('toastProfileUpdatedTitle'),
          description: t('toastProfileUpdatedDescription'),
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
          title: t('toastInvalidFileTitle'),
          description: t('toastInvalidFileDescription'),
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
            title: t('toastAvatarUpdatedTitle'),
            description: t('toastAvatarUpdatedDescription'),
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
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('cardTitle')}</CardTitle>
          <CardDescription>
            {t('cardDescription')}
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
                  {t('changePhotoButton')}
                </Button>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nameLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('namePlaceholder')} {...field} />
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
                    <FormLabel>{t('emailLabel')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t('emailPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('savingButton')}
                  </>
                ) : (
                  t('saveButton')
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
