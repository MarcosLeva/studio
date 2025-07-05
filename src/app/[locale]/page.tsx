"use client";


import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * The root page of the application. Redirects to the login page.
 */
export default function RootPage() {
  const router = useRouter();
  const t = useTranslations("RootPage");

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
      <p>{t('redirecting')}</p>
    </main>
  );
}
