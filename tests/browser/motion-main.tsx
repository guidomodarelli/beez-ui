/** Exercises motion without replacing the real primitives or their event handlers. */
import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BeezUIProvider,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  TypingAnimation,
  Skeleton,
  Highlighter,
  Checkbox,
  Label,
  Input,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  DropdownMenuCheckboxItem,
  AnimatedThemeToggler,
  DataTable,
} from "beez-ui";

const GROUPED_ROWS = [
  { name: "Luz", currency: "ARS" },
  { name: "Internet", currency: "ARS" },
  { name: "Hosting", currency: "USD" },
];
const GROUPED_COLUMNS = [{ accessorKey: "name", header: "Servicio" }];
import "./styles.css";

/** Demonstrates state changes and deliberately slow typing for reduced-motion checks. */
function MotionExamples() {
  const [message, setMessage] = useState("Lectura sin esperas");
  const [action, setAction] = useState("");
  const [isEmailInvalid, setIsEmailInvalid] = useState(false);
  const [isArchivedVisible, setIsArchivedVisible] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const rowGroups = useMemo(
    () => ({
      getGroupKey: (row: (typeof GROUPED_ROWS)[number]) => row.currency,
      renderGroupHeader: (groupKey: string, groupRowCount: number) =>
        `${groupKey} (${groupRowCount})`,
      collapsedGroupKeys: collapsedGroups,
      onGroupToggle: (groupKey: string) =>
        setCollapsedGroups((current) => {
          const next = new Set(current);
          if (next.has(groupKey)) next.delete(groupKey);
          else next.add(groupKey);
          return next;
        }),
    }),
    [collapsedGroups],
  );
  return (
    <BeezUIProvider>
      <main>
        <h1>Movimiento compartido</h1>
        <section className="controls">
          <Button>Acción principal</Button>
          <Button disabled>Acción deshabilitada</Button>
          <Checkbox id="motion-choice" />
          <Label htmlFor="motion-choice">Recibir novedades</Label>
        </section>
        <section>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Abrir menú</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={() => setAction("Edición seleccionada")}
              >
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAction("Copia seleccionada")}>
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuCheckboxItem
                checked={isArchivedVisible}
                onCheckedChange={setIsArchivedVisible}
                onSelect={(event) => event.preventDefault()}
              >
                Mostrar archivados
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <output aria-label="Acción">{action}</output>
        </section>
        <section>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Abrir diálogo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Confirmar cambios</DialogTitle>
              <DialogDescription>
                El foco y el cierre siguen funcionando.
              </DialogDescription>
              <DialogFooter showCloseButton />
            </DialogContent>
          </Dialog>
        </section>
        <section>
          <TypingAnimation duration={1000} delay={10000} startOnView={false}>
            {message}
          </TypingAnimation>
          <Button onClick={() => setMessage("Texto actualizado")}>
            Actualizar texto
          </Button>
        </section>
        <section className="controls">
          <Switch id="motion-switch" />
          <Label htmlFor="motion-switch">Modo compacto</Label>
          <Input
            aria-label="Correo"
            aria-invalid={isEmailInvalid || undefined}
          />
          <Button onClick={() => setIsEmailInvalid(true)}>Validar correo</Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button>Ayuda</Button>
              </TooltipTrigger>
              <TooltipContent>Explicación breve</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </section>
        <section className="controls">
          <Select>
            <SelectTrigger aria-label="Moneda">
              <SelectValue placeholder="Elegir moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ars">Pesos</SelectItem>
              <SelectItem value="usd">Dólares</SelectItem>
              <SelectItem value="eur">Euros</SelectItem>
            </SelectContent>
          </Select>
          <AnimatedThemeToggler />
        </section>
        <section>
          <DataTable
            columns={GROUPED_COLUMNS}
            data={GROUPED_ROWS}
            emptyMessage="Sin servicios"
            rowGroups={rowGroups}
          />
        </section>
        <section>
          <Tabs defaultValue="resumen">
            <TabsList aria-label="Secciones">
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="detalle">Detalle</TabsTrigger>
            </TabsList>
            <TabsContent value="resumen">Contenido del resumen</TabsContent>
            <TabsContent value="detalle">Contenido del detalle</TabsContent>
          </Tabs>
        </section>
        <section>
          <Highlighter>Lectura destacada</Highlighter>
          <Skeleton className="motion-skeleton" />
        </section>
      </main>
    </BeezUIProvider>
  );
}
createRoot(document.getElementById("root")!).render(<MotionExamples />);
