/** Exercises motion without replacing the real primitives or their event handlers. */
import { useState } from "react";
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
} from "beez-ui";
import "./styles.css";

/** Demonstrates state changes and deliberately slow typing for reduced-motion checks. */
function MotionExamples() {
  const [message, setMessage] = useState("Lectura sin esperas");
  const [action, setAction] = useState("");
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
        <section>
          <Highlighter>Lectura destacada</Highlighter>
          <Skeleton className="motion-skeleton" />
        </section>
      </main>
    </BeezUIProvider>
  );
}
createRoot(document.getElementById("root")!).render(<MotionExamples />);
