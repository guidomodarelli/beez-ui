/** Exercises the polished motion and fixed behaviors through the public barrel, with real state. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  BeezUIProvider,
  Button,
  Calendar,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  FilterQueryBar,
  type FilterQualifierConfig,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  Skeleton,
  TypingAnimation,
} from "beez-ui";
import "./styles.css";

const PAGES = [1, 2, 3] as const;
const SLIDES = ["Primera", "Segunda", "Tercera"] as const;
/** Fixed month, so navigation and its direction are deterministic across runs. */
const INITIAL_MONTH = new Date(2026, 0, 1);
const FILTER_CONFIGS: FilterQualifierConfig[] = [
  { key: "", kind: "text", label: "Concepto" },
  {
    key: "estado",
    kind: "enum",
    columnId: "status",
    label: "Estado",
    options: [
      { slug: "pagado", value: "Pagado", label: "Pagado" },
      { slug: "pendiente", value: "Pendiente", label: "Pendiente" },
    ],
  },
];

/** Keeps the query in local state, as a consumer table would. */
function StatefulFilter() {
  const [query, setQuery] = useState("");
  return (
    <FilterQueryBar
      configs={FILTER_CONFIGS}
      value={query}
      onValueChange={setQuery}
      ariaLabel="Filtrar movimientos"
    />
  );
}

/** Pages through local state, as a client-side table would, keeping the list mounted. */
function StatefulPagination() {
  const [page, setPage] = useState<number>(1);
  return (
    <Pagination aria-label="Páginas de resultados">
      <PaginationContent>
        {PAGES.map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              href={`#pagina-${pageNumber}`}
              isActive={page === pageNumber}
              onClick={(event) => {
                event.preventDefault();
                setPage(pageNumber);
              }}
            >
              {pageNumber}
            </PaginationLink>
          </PaginationItem>
        ))}
      </PaginationContent>
    </Pagination>
  );
}

/** Swaps the avatar source on demand, so a fresh load reveals the image in place. */
function ReloadableAvatar() {
  const [version, setVersion] = useState(0);
  return (
    <div className="controls">
      <Avatar size="lg">
        <AvatarImage
          src={version === 0 ? null : `/avatar.svg?version=${version}`}
          alt="Foto de Ana"
        />
        <AvatarFallback>AN</AvatarFallback>
      </Avatar>
      <Button onClick={() => setVersion((current) => current + 1)}>Cargar foto</Button>
      <AvatarGroup aria-label="Equipo">
        <Avatar>
          <AvatarFallback>LU</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>MA</AvatarFallback>
        </Avatar>
      </AvatarGroup>
    </div>
  );
}

/** Renders the polished components with deterministic data. */
function PolishExamples() {
  return (
    <BeezUIProvider>
      <main>
        <h1>Pulido de componentes</h1>
        <section>
          <StatefulPagination />
        </section>
        <section>
          <StatefulFilter />
        </section>
        <section>
          <Card aria-label="Resumen del mes" className="summary-card">
            <CardHeader>
              <CardTitle>Resumen del mes</CardTitle>
            </CardHeader>
            <CardContent>Total: $ 184.200</CardContent>
            <CardFooter>
              <Button variant="outline">Ver detalle</Button>
            </CardFooter>
          </Card>
        </section>
        <section>
          <Calendar mode="single" defaultMonth={INITIAL_MONTH} />
        </section>
        <section>
          <ReloadableAvatar />
        </section>
        <section>
          <Skeleton aria-label="Cargando resumen" className="motion-skeleton" />
          <TypingAnimation startOnView={false} duration={20} pauseDelay={60000} words={["Hola", "Chau"]} />
        </section>
        <section>
          <Sheet>
            <SheetTrigger asChild>
              <Button>Abrir ajustes</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle>Ajustes</SheetTitle>
              <SheetDescription>Preferencias del panel.</SheetDescription>
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Más acciones</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Renombrar</DropdownMenuItem>
              <DropdownMenuItem>Duplicar</DropdownMenuItem>
              <DropdownMenuItem>Archivar</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Compartir</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Por enlace</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </section>
        <section>
          <SidebarProvider className="min-h-0">
            <SidebarMenu aria-label="Accesos">
              <SidebarMenuItem>
                <SidebarMenuButton variant="outline">Accesos rápidos</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarProvider>
        </section>
        <section className="carousel-frame">
          <Carousel orientation="vertical" aria-label="Novedades" className="vertical-carousel">
            <CarouselContent className="vertical-carousel-content">
              {SLIDES.map((slide) => (
                <CarouselItem key={slide}>{`Diapositiva ${slide}`}</CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </section>
      </main>
    </BeezUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<PolishExamples />);
