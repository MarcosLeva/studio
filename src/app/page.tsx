"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * The root page of the application. Redirects to the login page.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <p>Redirigiendo a la página de inicio de sesión...</p>
    </main>
  );
}
