/** Composes the library into a realistic panel, so its motion can be judged in context. */
import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarDays, CheckCircle2, Settings } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AnimatedThemeToggler,
  Avatar,
  AvatarFallback,
  AvatarGroup,
  Badge,
  Button,
  Calendar,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TypingAnimation,
} from "beez-ui";

/** Time the activity tab shows its loading placeholder before the content arrives. */
const ACTIVITY_LOADING_MS = 1600;
const TEAM = ["AN", "LU", "MA", "JO"] as const;
const PAGE_COUNT = 4;
const ACTIVITY = [
  "Ana aprobó el presupuesto de marzo",
  "Lucas agregó 3 gastos compartidos",
  "Mara actualizó la categoría Hogar",
] as const;

/** Shows placeholders first, then the recent activity, as a slow request would. */
function ActivityFeed() {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), ACTIVITY_LOADING_MS);
    return () => clearTimeout(timeout);
  }, []);
  if (isLoading) {
    return (
      <div className="StoryStack" role="status" aria-label="Cargando actividad">
        {ACTIVITY.map((entry) => (
          <Skeleton key={entry} className="StorySkeleton" />
        ))}
      </div>
    );
  }
  return (
    <ul className="StoryStack">
      {ACTIVITY.map((entry) => (
        <li key={entry}>{entry}</li>
      ))}
    </ul>
  );
}

/** Groups the preferences with toggles, a validated field and a date picker. */
function PreferencesForm() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const isEmailInvalid = isSubmitted && !email.includes("@");
  return (
    <form
      className="StoryStack"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setIsSubmitted(true);
        setIsSaved(email.includes("@"));
      }}
    >
      <div className="StoryRow">
        <Switch id="showcase-digest" defaultChecked />
        <Label htmlFor="showcase-digest">Resumen semanal</Label>
      </div>
      <div className="StoryRow">
        <Checkbox id="showcase-alerts" />
        <Label htmlFor="showcase-alerts">Alertas de gastos altos</Label>
      </div>
      <div className="StoryStack">
        <Label htmlFor="showcase-email">Correo de avisos</Label>
        <Input
          id="showcase-email"
          type="email"
          placeholder="nombre@correo.com"
          value={email}
          aria-invalid={isEmailInvalid || undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            setIsSaved(false);
          }}
        />
      </div>
      <div className="StoryRow">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" type="button">
              <CalendarDays data-icon="inline-start" />
              {date ? date.toLocaleDateString("es-AR") : "Fecha de cierre"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={setDate} />
          </PopoverContent>
        </Popover>
        <Button type="submit">Guardar</Button>
      </div>
      {isSaved && (
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Preferencias guardadas</AlertTitle>
          <AlertDescription>Vas a recibir los avisos en {email}.</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

/** Pages through local state, so the current-page highlight glides between pages. */
function ReportPagination() {
  const [page, setPage] = useState(1);
  return (
    <Pagination>
      <PaginationContent>
        {Array.from({ length: PAGE_COUNT }, (_, index) => index + 1).map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              href={`#reporte-${pageNumber}`}
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

const meta = {
  title: "Showcase/Panel",
  parameters: {
    docs: {
      description: {
        story:
          "Panel completo para evaluar el movimiento en contexto: pestañas y paginación con indicador deslizante, placeholders con brillo, validación con temblor, calendario con transición de mes y alerta con entrada suave.",
      },
    },
  },
  render: () => (
    <Card className="StoryShowcase">
      <CardHeader>
        <CardTitle>
          <TypingAnimation startOnView={false} duration={45}>
            Gastos compartidos
          </TypingAnimation>
        </CardTitle>
        <CardDescription>Casa · marzo 2026</CardDescription>
        <CardAction>
          <div className="StoryRow">
            <AvatarGroup aria-label="Integrantes">
              {TEAM.map((initials) => (
                <Avatar key={initials}>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
            <AnimatedThemeToggler className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted" />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="resumen">
          <TabsList aria-label="Secciones del panel">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="actividad">Actividad</TabsTrigger>
            <TabsTrigger value="ajustes">
              <Settings data-icon="inline-start" />
              Ajustes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="resumen">
            <div className="StoryStack">
              <div className="StoryRow">
                <Badge>Al día</Badge>
                <Badge variant="secondary">12 movimientos</Badge>
              </div>
              <p>Total del mes: $ 184.200, repartido entre cuatro personas.</p>
              <ReportPagination />
            </div>
          </TabsContent>
          <TabsContent value="actividad">
            <ActivityFeed />
          </TabsContent>
          <TabsContent value="ajustes">
            <PreferencesForm />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost">¿Cómo se reparte?</Button>
          </TooltipTrigger>
          <TooltipContent>En partes iguales, salvo excepciones</TooltipContent>
        </Tooltip>
      </CardFooter>
    </Card>
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;
export const Panel: Story = {};
