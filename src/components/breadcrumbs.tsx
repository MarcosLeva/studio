
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const pathTranslations: { [key: string]: string } = {
  "analyze-catalog": "Analizar Catálogo",
  "categories": "Categorías",
  "results": "Resultados",
  "users": "Usuarios",
  "profile": "Perfil",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex">
      <ol className="flex items-center space-x-2 text-sm whitespace-nowrap">
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const translatedSegment = pathTranslations[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

          return (
            <React.Fragment key={href}>
              <li>
                <div className="flex items-center">
                  <Link
                    href={href}
                    className={cn(
                      "font-medium text-muted-foreground hover:text-foreground",
                      isLast && "text-foreground pointer-events-none"
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {translatedSegment}
                  </Link>
                </div>
              </li>
              {!isLast && (
                <li>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
