/** Exercises the public package in a standalone React app without a framework provider. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Alert, AlertTitle, AnimatedThemeToggler, Avatar, AvatarImage, Button, Calendar, DataTable, Highlighter, InputGroup, InputGroupInput, InputGroupAddon, RadioGroup, RadioGroupItem, Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, ThemedToaster, toast, TypingAnimation, type ThemeMode } from "beez-ui";
import "./styles.css";

const ROWS = [{ name: "Luz", amount: 20 }, { name: "Internet", amount: 40 }];
const COLUMNS = [{ accessorKey: "name", header: "Nombre" }, { accessorKey: "amount", header: "Importe" }];
const QUERY_CONFIG = [{ key: "", kind: "text" as const, label: "Nombre" }];

/** Owns all theme state, demonstrating that the library does not persist or resolve it. */
function BrowserExample() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [date, setDate] = useState<Date>();
  const resolvedTheme = theme === "dark" ? "dark" : "light";
  return <main>
    <h1>Componentes compartidos</h1>
    <div className="controls"><AnimatedThemeToggler theme={theme} resolvedTheme={resolvedTheme} onThemeChange={(nextTheme) => { setTheme(nextTheme); document.documentElement.classList.toggle("dark", nextTheme === "dark"); }} /><Button onClick={() => toast.success("Cambios guardados")}>Notificar</Button><Avatar><AvatarImage src="/missing-avatar.png" alt="Perfil de prueba" /></Avatar></div>
    <section><Alert><AlertTitle>Listo para usar en React</AlertTitle></Alert><Avatar><AvatarImage src="/avatar.svg" alt="Avatar nativo" /></Avatar></section>
    <section><DataTable columns={COLUMNS} data={ROWS} emptyMessage="Sin resultados" filterColumnId="name" queryFilterConfig={QUERY_CONFIG} queryFilterLabel="Filtrar filas" /></section>
    <section><InputGroup><InputGroupAddon>Buscar</InputGroupAddon><InputGroupInput aria-label="Búsqueda adicional" /></InputGroup></section>
    <section><RadioGroup defaultValue="weekly"><RadioGroupItem value="weekly" aria-label="Semanal" /><RadioGroupItem value="monthly" aria-label="Mensual" /></RadioGroup></section>
    <section><Calendar mode="single" defaultMonth={new Date(2026, 8, 1)} selected={date} onSelect={setDate} /><output aria-label="Día seleccionado">{date?.getDate()}</output></section>
    <section><TypingAnimation startOnView={false} duration={1} showCursor={false}>Texto animado</TypingAnimation><Highlighter color="var(--primary)">Contenido destacado</Highlighter></section>
    <Sheet><SheetTrigger asChild><Button>Abrir panel largo</Button></SheetTrigger><SheetContent><SheetTitle>Panel largo</SheetTitle><SheetDescription>Contenido desplazable</SheetDescription><div className="long-content"><p>Inicio</p><Button>Última acción</Button></div></SheetContent></Sheet>
    <ThemedToaster theme={resolvedTheme} />
  </main>;
}

createRoot(document.getElementById("root")!).render(<BrowserExample />);
