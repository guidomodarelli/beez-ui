"use client";

/** Exercises actual Next navigation and image loading through the optional provider. */
import { AnimatedThemeToggler, Avatar, AvatarImage, AvatarFallback, Button, Link, PaginationNext, ThemedToaster, toast } from "beez-ui";
import { BeezUIProvider } from "beez-ui/next";

export default function Page() {
  return <BeezUIProvider><main><h1>Integración opcional</h1><Avatar><AvatarImage src="/avatar.svg" alt="Avatar Next" /><AvatarFallback>GH</AvatarFallback></Avatar><Link href="/destination">Abrir destino</Link><PaginationNext href="/destination" text="Siguiente" /><AnimatedThemeToggler /><Button onClick={() => toast.success("Tema aplicado")}>Notificar</Button><ThemedToaster /></main></BeezUIProvider>;
}

