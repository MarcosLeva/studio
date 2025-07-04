"use client";

import * as React from "react";
import { ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = React.useState(false);

  const toggleVisibility = React.useCallback(() => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  React.useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, [toggleVisibility]);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-background/80 shadow-lg backdrop-blur-sm transition-all hover:scale-110",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <ChevronUp className="h-6 w-6" />
      <span className="sr-only">Ir arriba</span>
    </Button>
  );
};
