
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useSidebar } from "./ui/sidebar"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const { state } = useSidebar()

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <Button
        variant="ghost"
        size="sm"
        className={cn(
            "w-full justify-start",
            state === 'collapsed' && "h-10 w-10 justify-center p-0"
        )}
        onClick={toggleTheme}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className={cn("ml-2", state === 'collapsed' && "hidden")}>
        {resolvedTheme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
      </span>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
