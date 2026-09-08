"use client";

/** Exercises actual Next navigation and image loading through the optional provider. */
import { Avatar, AvatarImage, AvatarFallback, PaginationNext } from "beez-ui";
import { NextBeezUIProvider } from "beez-ui/next";

export default function Page() {
  return <NextBeezUIProvider><main><h1>Integración opcional</h1><Avatar><AvatarImage src="/avatar.svg" alt="Avatar Next" /><AvatarFallback>GH</AvatarFallback></Avatar><PaginationNext href="/destination" text="Siguiente" /></main></NextBeezUIProvider>;
}
