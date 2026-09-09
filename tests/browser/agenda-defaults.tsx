/** Exercises shared defaults with interactive menus, forms and viewport-bound panels. */
import { createRoot } from "react-dom/client";
import { BeezUIProvider, Button, Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter, AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Popover, PopoverTrigger, PopoverContent, Tabs, TabsList, TabsTrigger, TabsContent, Textarea, Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "beez-ui";
import "./styles.css";

/** Renders the public primitives without consumer size or spacing overrides. */
function AgendaDefaults() {
  return <BeezUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><main>
    <h1>Personalizaciones compartidas</h1>
    <section><Select defaultValue="monthly"><SelectTrigger aria-label="Frecuencia"><SelectValue /></SelectTrigger><SelectContent position="popper"><SelectItem value="monthly">Mensual</SelectItem><SelectItem value="weekly">Semanal</SelectItem></SelectContent></Select></section>
    <section><Tabs defaultValue="first"><TabsList aria-label="Secciones"><TabsTrigger value="first">Primera</TabsTrigger><TabsTrigger value="second">Segunda</TabsTrigger></TabsList><TabsContent value="first">Primer contenido</TabsContent><TabsContent value="second">Segundo contenido</TabsContent></Tabs></section>
    <section><Textarea disabled aria-label="Mensaje deshabilitado" value="Pendiente" /><Textarea aria-label="Mensaje editable" defaultValue="Editable" /></section>
    <section><Popover><PopoverTrigger asChild><Button>Abrir detalle</Button></PopoverTrigger><PopoverContent aria-label="Detalle">Contenido del detalle</PopoverContent></Popover></section>
    <section><Dialog><DialogTrigger asChild><Button>Abrir diálogo</Button></DialogTrigger><DialogContent><DialogTitle>Editar datos</DialogTitle><DialogDescription>Revisá los datos.</DialogDescription><DialogFooter showCloseButton /></DialogContent></Dialog></section>
    <section><AlertDialog><AlertDialogTrigger asChild><Button>Abrir confirmación</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogTitle>Confirmar cambio</AlertDialogTitle><AlertDialogDescription>Revisá la acción.</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel></AlertDialogFooter></AlertDialogContent></AlertDialog></section>
    <section><DropdownMenu><DropdownMenuTrigger asChild><Button>Abrir acciones</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>Editar</DropdownMenuItem><DropdownMenuSub><DropdownMenuSubTrigger>Carpetas</DropdownMenuSubTrigger><DropdownMenuSubContent><DropdownMenuItem>Archivo</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuSub></DropdownMenuContent></DropdownMenu></section>
    {(["top", "bottom"] as const).map(side => <section key={side}><Sheet><SheetTrigger asChild><Button>Abrir panel {side}</Button></SheetTrigger><SheetContent side={side}><SheetTitle>Panel {side}</SheetTitle><SheetDescription>Contenido largo desplazable</SheetDescription><div className="long-content"><Button>Inicio del panel</Button><Button>Fin del panel</Button></div></SheetContent></Sheet></section>)}
  </main></BeezUIProvider>;
}

createRoot(document.getElementById("root")!).render(<AgendaDefaults />);
