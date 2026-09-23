/** Renders every motion-enabled component not covered by the basic motion page, with real state. */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useForm } from "react-hook-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  BeezUIProvider,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "beez-ui";
import "./styles.css";

const SECTIONS = ["Inicio", "Reportes", "Ajustes"] as const;
const MANY_COUNTRIES = Array.from({ length: 40 }, (_, index) => `País ${index + 1}`);

/** Validates a required name so the form message and invalid shake appear on submit. */
function ProfileForm() {
  const form = useForm({ defaultValues: { name: "" } });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => undefined)} noValidate>
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "El nombre es obligatorio" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Guardar perfil</Button>
      </form>
    </Form>
  );
}

/** Re-renders its popover every frame, as streaming data would, including while it closes. */
function TickingPopover() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let frameId = requestAnimationFrame(function advance() {
      setTick((current) => current + 1);
      frameId = requestAnimationFrame(advance);
    });
    return () => cancelAnimationFrame(frameId);
  }, []);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Ver en vivo</Button>
      </PopoverTrigger>
      <PopoverContent data-tick={tick}>Datos en vivo</PopoverContent>
    </Popover>
  );
}

/** Exercises every remaining component whose motion changed. */
function MotionCatalog() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("Inicio");
  const [isCodeInvalid, setIsCodeInvalid] = useState(false);
  const [isNoteInvalid, setIsNoteInvalid] = useState(false);
  const [isSwitchShown, setIsSwitchShown] = useState(false);
  const [lastAction, setLastAction] = useState("");
  return (
    <BeezUIProvider>
      <main>
        <h1>Catálogo de movimiento</h1>
        <SidebarProvider className="min-h-0">
          <Sidebar collapsible="none" className="h-auto rounded-lg border">
            <SidebarContent>
              <SidebarMenu aria-label="Secciones del panel">
                {SECTIONS.map((name) => (
                  <SidebarMenuItem key={name}>
                    <SidebarMenuButton
                      isActive={section === name}
                      onClick={() => setSection(name)}
                    >
                      {name}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <output aria-label="Sección activa">{section}</output>
        </SidebarProvider>

        <section className="controls">
          <Sheet>
            <SheetTrigger asChild>
              <Button>Abrir panel</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle>Panel lateral</SheetTitle>
              <SheetDescription>Contenido del panel.</SheetDescription>
            </SheetContent>
          </Sheet>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>Eliminar cuenta</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>¿Eliminar la cuenta?</AlertDialogTitle>
              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>Conservar</AlertDialogCancel>
                <AlertDialogAction onClick={() => setLastAction("Cuenta eliminada")}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Popover>
            <PopoverTrigger asChild>
              <Button>Ver filtros</Button>
            </PopoverTrigger>
            <PopoverContent>Filtros disponibles</PopoverContent>
          </Popover>
          <TickingPopover />
          <HoverCard openDelay={0} closeDelay={0}>
            <HoverCardTrigger href="#perfil">Perfil público</HoverCardTrigger>
            <HoverCardContent>Tarjeta de perfil</HoverCardContent>
          </HoverCard>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Más opciones</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setLastAction("Renombrado")}>Renombrar</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Mover a</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onSelect={() => setLastAction("Movido a archivo")}>Archivo</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setLastAction("Movido a papelera")}>Papelera</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
          <output aria-label="Última acción">{lastAction}</output>
        </section>

        <section className="controls">
          <RadioGroup defaultValue="mensual" aria-label="Frecuencia">
            <div className="controls">
              <RadioGroupItem id="frecuencia-mensual" value="mensual" />
              <Label htmlFor="frecuencia-mensual">Mensual</Label>
              <RadioGroupItem id="frecuencia-anual" value="anual" />
              <Label htmlFor="frecuencia-anual">Anual</Label>
            </div>
          </RadioGroup>
          <InputGroup>
            <InputGroupAddon>#</InputGroupAddon>
            <InputGroupInput aria-label="Código" aria-invalid={isCodeInvalid || undefined} />
          </InputGroup>
          <Button onClick={() => setIsCodeInvalid(true)}>Validar código</Button>
          <Textarea aria-label="Nota" aria-invalid={isNoteInvalid || undefined} />
          <Button onClick={() => setIsNoteInvalid(true)}>Validar nota</Button>
        </section>

        <section>
          <ProfileForm />
        </section>

        <section className="controls">
          <Select>
            <SelectTrigger aria-label="País">
              <SelectValue placeholder="Elegir país" />
            </SelectTrigger>
            <SelectContent position="popper">
              {MANY_COUNTRIES.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsSwitchShown((shown) => !shown)}>Mostrar preferencia</Button>
          <div style={{ display: isSwitchShown ? "flex" : "none" }} className="controls">
            <Switch id="catalog-switch" />
            <Label htmlFor="catalog-switch">Avisos por correo</Label>
          </div>
        </section>

        <section>
          <Tabs defaultValue="activos">
            <TabsList variant="line" aria-label="Estados">
              <TabsTrigger value="activos">Activos</TabsTrigger>
              <TabsTrigger value="pausados">Pausados</TabsTrigger>
            </TabsList>
            <TabsContent value="activos">Elementos activos</TabsContent>
            <TabsContent value="pausados">Elementos pausados</TabsContent>
          </Tabs>
        </section>
      </main>
    </BeezUIProvider>
  );
}
createRoot(document.getElementById("root")!).render(<MotionCatalog />);
