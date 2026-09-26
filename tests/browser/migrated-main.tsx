/** Mounts the components migrated from LaTribu and agenda-mensual in a plain React consumer. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BeezUIProvider,
  BouncingDotsLoader,
  Button,
  MonthGrid,
  NOTIFICATION_BELL_SURFACE,
  NOTIFICATION_PANEL_STATUS,
  NotificationBell,
  copyTextToClipboard,
  type MonthGridItem,
} from "beez-ui";
import { EmojiPicker } from "beez-ui/emoji-picker";
import "./styles.css";

const CALENDAR_ITEMS: MonthGridItem[] = [
  { id: "class", dateKey: "2026-05-06", title: "Clase abierta", timeLabel: "18:00" },
  { id: "meetup", dateKey: "2026-05-06", title: "Encuentro", timeLabel: "20:00" },
];
const CLIPBOARD_TEXT = "https://example.com/invitacion";

/** Groups the migrated components that depend on real layout, media queries or browser APIs. */
function MigratedExample() {
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [emoji, setEmoji] = useState("");
  const [copyResult, setCopyResult] = useState("");

  return (
    <main>
      <h1>Componentes migrados</h1>
      <section aria-label="Cargadores">
        <BouncingDotsLoader label="Cargando panel" />
        <BouncingDotsLoader label="Cargando fila" size="sm" />
      </section>
      <section className="controls" aria-label="Encabezado">
        <NotificationBell
          surface={NOTIFICATION_BELL_SURFACE.responsive}
          isOpen={isInboxOpen}
          onOpenChange={setIsInboxOpen}
          unreadCount={1}
          isMarkingAll={false}
          listStatus={NOTIFICATION_PANEL_STATUS.loaded}
          notifications={[{ id: "first", title: "Taller de álgebra", href: "#taller", isUnread: true }]}
          onMarkAllRead={() => {}}
          onRetry={() => {}}
          onSelectNotification={() => {}}
        />
        <EmojiPicker label="Ícono del canal" value={emoji} onChange={setEmoji} />
        <Button type="button" onClick={() => void copyTextToClipboard(CLIPBOARD_TEXT).then((isCopied) => setCopyResult(isCopied ? "Copiado" : "No se pudo copiar"))}>
          Copiar invitación
        </Button>
        <output aria-label="Resultado de copia">{copyResult}</output>
      </section>
      <section aria-label="Calendario">
        <MonthGrid month="2026-05" items={CALENDAR_ITEMS} todayKey="2026-05-06" activeDayKey={activeDayKey} onSelectDay={setActiveDayKey} onSelectItem={() => {}} />
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <BeezUIProvider>
    <MigratedExample />
  </BeezUIProvider>,
);
