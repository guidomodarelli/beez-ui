"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "next-themes"
import { CircleCheck, Info, TriangleAlert, OctagonAlert, Loader } from "lucide-react"

/** Renders shared notification styling using the consumer's resolved theme. */
const ThemedToaster = ({ theme, ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()
  const activeTheme = theme ?? (resolvedTheme === "dark" ? "dark" : "light")

  return (
    <Sonner
      theme={activeTheme}
      className="toaster group"
      icons={{
        success: (
          <CircleCheck className="size-4" />
        ),
        info: (
          <Info className="size-4" />
        ),
        warning: (
          <TriangleAlert className="size-4" />
        ),
        error: (
          <OctagonAlert className="size-4" />
        ),
        loading: (
          <Loader className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { ThemedToaster }
