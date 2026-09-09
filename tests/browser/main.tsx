/** Exercises the public package in a standalone React app without a framework provider. */
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { createRoot } from "react-dom/client";
import { Alert, AlertTitle, AnimatedThemeToggler, Avatar, AvatarImage, BeezUIProvider, Button, Calendar, DataTable, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Highlighter, InputGroup, InputGroupInput, InputGroupAddon, RadioGroup, RadioGroupItem, Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, ThemedToaster, toast, TypingAnimation } from "beez-ui";
import "./styles.css";

const ROWS = [{ name: "Luz", amount: 20 }, { name: "Internet", amount: 40 }];
const COLUMNS = [{ accessorKey: "name", header: "Nombre" }, { accessorKey: "amount", header: "Importe" }];
const QUERY_CONFIG = [{ key: "", kind: "text" as const, label: "Nombre" }];

/** Exercises the native orchestrator's shared theme and image behavior. */
function BrowserExample() {
  const [date, setDate] = useState<Date>();
  const [selectedAction, setSelectedAction] = useState("");
  return <main>
    <h1>Componentes compartidos</h1>
    <div className="controls"><AnimatedThemeToggler /><Button onClick={() => toast.success("Cambios guardados")}>Notificar</Button><Avatar><AvatarImage src="/missing-avatar.png" alt="Perfil de prueba" /></Avatar></div>
    <section>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button size="icon-sm" aria-label="Acciones de envío">⋮</Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setSelectedAction("Editar datos de envío")}><Pencil /><span>Editar datos de envío</span></DropdownMenuItem>
          <DropdownMenuItem variant="destructive"><Trash2 /><span>Eliminar datos de envío</span></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <output aria-label="Acción seleccionada">{selectedAction}</output>
    </section>
    <section><Alert><AlertTitle>Listo para usar en React</AlertTitle></Alert><Avatar><AvatarImage src="/avatar.svg" alt="Avatar nativo" /></Avatar></section>
    <section><DataTable columns={COLUMNS} data={ROWS} emptyMessage="Sin resultados" filterColumnId="name" queryFilterConfig={QUERY_CONFIG} queryFilterLabel="Filtrar filas" /></section>
    <section><InputGroup><InputGroupAddon>Buscar</InputGroupAddon><InputGroupInput aria-label="Búsqueda adicional" /></InputGroup></section>
    <section><RadioGroup defaultValue="weekly"><RadioGroupItem value="weekly" aria-label="Semanal" /><RadioGroupItem value="monthly" aria-label="Mensual" /></RadioGroup></section>
    <section><Calendar mode="single" defaultMonth={new Date(2026, 8, 1)} selected={date} onSelect={setDate} /><output aria-label="Día seleccionado">{date?.getDate()}</output></section>
    <section><TypingAnimation startOnView={false} duration={1} showCursor={false}>Texto animado</TypingAnimation><Highlighter color="var(--primary)">Contenido destacado</Highlighter></section>
    <Sheet><SheetTrigger asChild><Button>Abrir panel largo</Button></SheetTrigger><SheetContent><SheetTitle>Panel largo</SheetTitle><SheetDescription>Contenido desplazable</SheetDescription><div className="long-content"><p>Inicio</p><Button>Última acción</Button></div></SheetContent></Sheet>
    <ThemedToaster />
  </main>;
}

createRoot(document.getElementById("root")!).render(<BeezUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><BrowserExample /></BeezUIProvider>);
