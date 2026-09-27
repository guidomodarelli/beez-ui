# Cambios

Todos los cambios relevantes de beez-ui se documentan en este archivo con el formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/). Cada cambio agrega sus entradas en `[Unreleased]`; `pnpm create-version` las pasa a la versión publicada con su fecha.

## [Unreleased]

## [0.9.1] - 2026-09-27

### Added

- `FileUploadDropZone` acepta `labels.uploadActionMobileSuffix`, un texto que completa la acción de subir en pantallas chicas.
- `FileUploadItem` acepta `icon` para mostrar un ícono propio por tipo de archivo y `progressVariant="fill"` para indicar el progreso rellenando el fondo del ítem.
- `AccountMenu` acepta clases para el texto, nombre, email y chevron del disparador, el encabezado, su avatar y el ítem de sesión, por ejemplo para ocultar la identidad en un sidebar colapsado.
- `FilterPresetSaveButton` acepta `className` para adaptar el botón al slot de acción de un input.

## [0.9.0] - 2026-09-27

### Added

- `ReactionButton` acepta `activeColor` para elegir el color del ícono activo (por defecto, el color destructivo).
- Entrypoint `beez-ui/hooks` con los hooks de uso general: `useIsMobile`, `useIsHydrated`, `useViewerTimeZone`, `usePrefersReducedMotion`, `useHorizontalSwipe` y `resolveHorizontalSwipe`.
- `FilterPresetsBar` y `FilterPresetSaveButton` para guardar, aplicar, editar y borrar consultas con nombre de `FilterQueryBar`, con `parseFilterPresets` para validar las que la app restaura de su almacenamiento.

### Changed

- `useIsHydrated`, `useViewerTimeZone`, `usePrefersReducedMotion`, `useHorizontalSwipe`, `resolveHorizontalSwipe` y `HORIZONTAL_SWIPE_DIRECTION` se importan desde `beez-ui/hooks` en lugar de la raíz; `useIsMobile` sigue también en la raíz.

### Removed

- Se retiran `EmptyState`, `ErrorState`, `BouncingDotsLoader` e `InfoPopover`: son envoltorios simples que cada app mantiene con su propio diseño.
- `getNameInitials` deja de ser público.
- Se retiran componentes atados a un solo producto que llegaron en 0.8.0: `ExternalBrowserHandoff`, `OpenInBrowserCta`, `detectInAppBrowser`, `buildExternalBrowserUrl`, `NotificationBell`, `NotificationPanel`, `MonthGrid`, `MonthCalendarHeader`, `PwaUpdateControl` y `ConfirmDeleteButton`. Quien los use debe mantener su propia versión.
- Se retiran los helpers `createMonthGridDays`, `splitCalendarWeeks`, `groupItemsByDateKey`, `shiftMonthKey`, `useMonthTransitionDirection`, `useMinuteClock`, `advanceMinuteClockTo`, `navigateToUrl`, `reloadCurrentPage`, `replaceCurrentUrlSearchParams` y `replaceCurrentUrlSearchParamValues`.
- Se retira el entrypoint opcional `beez-ui/emoji-picker` y la dependencia opcional `emoji-picker-react`.

## [0.8.2] - 2026-09-27

### Fixed

- Con movimiento reducido, `PresenceSwap`, `AnimatedListItem` y `AnimatedCollapse` conservan un fundido breve en lugar de cambiar sin transición; `PresenceSwap` ya no queda trabado en el estado anterior cuando su contenido cambia varias veces seguidas (por ejemplo, error → cargando → cargado).

## [0.8.1] - 2026-09-27

### Changed

- Cada versión publicada queda en un commit `X.Y.Z` con el tag `vX.Y.Z` en GitHub (antes era un commit `chore(release): prepara la versión X.Y.Z` sin tag), para ubicar el código exacto de cada versión.
- La publicación en npm la hace el comando compartido de beez-rp, que vuelve a verificar el SHA-256 y el contenido del tarball antes de subirlo; se retira `pnpm release:publish`.
- Publicar con `pnpm publish` queda bloqueado por `beez-rp guard-publish`: cada versión sale sólo desde `pnpm create-version`, que publica con npm el tarball verificado.

## [0.8.0] - 2026-09-26

### Added

- Los tokens de movimiento (`MOTION_TIMING`, `MOTION_EASE`, springs y distancias) se exportan desde la raíz y desde `beez-ui/motion-tokens`, con los nuevos `SPRING_POP`, `MOTION_ITEM_ENTER_SCALE` y las duraciones `pop` y `collapse`, para animar superficies propias igual que la biblioteca.
- Primitivas de movimiento `PresenceSwap`, `AnimatedCount`, `AnimatedCollapse` y `AnimatedListItem`, que respetan el movimiento reducido.
- `BouncingDotsLoader`, `ProgressRing`, `EmptyState`, `ErrorState`, `InfoPopover`, `ConfirmDeleteButton` y `ReactionButton`.
- `AccountMenu`: menú de cuenta con avatar, identidad, inicio de sesión como link o callback, cierre de sesión y variante para sidebar.
- `RichTextContent`, `RichMarkdownContent`, `RichLinkEditor` y `useRichLinkEditor` para mostrar y editar texto con links en markdown sin interpretar HTML, junto con `parseRichTextSegments` y `parseRichMarkdownBlocks`.
- `OpenInBrowserCta` y `ExternalBrowserHandoff` para salir de navegadores internos de otras apps, con `detectInAppBrowser` y `buildExternalBrowserUrl`.
- `PwaUpdateControl`, que ofrece aplicar una actualización pendiente del service worker.
- `NotificationBell` y `NotificationPanel`: bandeja de notificaciones en popover o en sheet según el viewport, a partir de ítems ya resueltos por la app.
- `MonthGrid` y `MonthCalendarHeader` para calendarios mensuales, con `createMonthGridDays`, `groupItemsByDateKey`, `shiftMonthKey` y `useMonthTransitionDirection`.
- `FileUpload`, `FileUploadDropZone`, `FileUploadList` y `FileUploadItem`, con validación por tipo y tamaño (`classifyFiles`, `isFileTypeAccepted`).
- `EmojiPicker` en el entrypoint opcional `beez-ui/emoji-picker`; requiere instalar `emoji-picker-react`.
- Hooks `useIsHydrated`, `useMinuteClock`, `useViewerTimeZone`, `useHorizontalSwipe` y `usePrefersReducedMotion`.
- Utilidades `formatFileSize`, `copyTextToClipboard`, `getNameInitials`, búsqueda difusa (`getFuzzyMatchRank`, `renderHighlightedText`) y helpers de URL (`replaceCurrentUrlSearchParams`).

### Fixed

- `BeezUIProvider` ya no provoca el aviso de React «Encountered a script tag» en apps renderizadas solo en el cliente; con SSR conserva el script que aplica el tema antes de hidratar, sin parpadeo.

## [0.7.0] - 2026-09-26

### Added

- `PaginationContent` desliza el resaltado de la página actual hacia la página elegida cuando la lista permanece montada (paginación en el cliente).
- `Calendar` desliza el mes entrante desde el lado de la navegación (también en RTL) y se mantiene estático con movimiento reducido.
- `AvatarImage` revela la imagen con un desenfoque y un zoom breves al terminar de cargar, en lugar de aparecer de golpe sobre el fallback.
- Las sugerencias de `FilterQueryBar` deslizan el resaltado entre opciones con teclado, como los menús y `Select`.
- `AvatarGroup` eleva levemente el avatar bajo el puntero en dispositivos con hover real.
- El chevron de `DropdownMenuSubTrigger` se desplaza hacia el submenú abierto.

### Changed

- `Skeleton` muestra un brillo que recorre el placeholder en lugar del pulso de opacidad; con movimiento reducido queda como un bloque liso.
- `Sheet` se cierra con una curva de cajón breve en lugar de un spring, y su botón de cierre aparece con un pop demorado como el de `Dialog`.
- `Alert` entra con un leve desplazamiento y desenfoque.
- Los anillos de foco y bordes de `Input`, `Textarea`, `InputGroup`, `SelectTrigger`, `Checkbox` y `RadioGroupItem` aparecen con una transición en lugar de saltar.
- En menús, `Select` y sugerencias, el resaltado sigue al puntero al instante y solo se desliza al navegar con teclado, con un spring más rápido.
- El sidebar colapsa y expande con una curva de cajón de 300 ms en lugar de una transición lineal.
- El thumb de `Switch` tiene una sombra sutil que lo separa del track.

### Fixed

- El cursor de `TypingAnimation` vuelve a parpadear: queda fijo mientras escribe o borra, parpadea en reposo y los lectores de pantalla lo ignoran.
- `Carousel` vertical responde a las flechas arriba y abajo; antes solo reaccionaba a izquierda y derecha.
- `SidebarMenuButton` con `variant="outline"` vuelve a pintar su borde con los tokens `oklch` del tema.
- `FormLabel`, `FormControl`, `FormDescription` y `FormMessage` fuera de un `FormField` lanzan un error claro en lugar de fallar en silencio.
- Los bordes sin color explícito (footers de `Card`, `Dialog` y `AlertDialog`, `Alert`, filas de `Table`, bordes de `Sheet` y del sidebar) usan el token `--border` del tema en lugar del color del texto cuando se consume `beez-ui/styles.css` sin Tailwind.
- `DropdownMenu`, sus submenús, `Popover`, `HoverCard` y `Select` muestran su borde y su sombra desde el primer frame al abrirse; antes el revelado los recortaba durante ~650 ms.
- `DataTable` filtra las columnas apuntadas por `queryFilterConfig` que no declaran `filterFn` (rangos numéricos, enums y año-mes); antes un rango sobre una columna numérica lanzaba `TypeError: val is not iterable` y un enum ocultaba todas las filas. Un `filterFn` propio de la columna sigue teniendo prioridad.
- Las `Card` interactivas conservan su contorno mientras muestran la sombra de hover; antes la sombra reemplazaba el anillo del borde.

## [0.6.2] - 2026-09-26

### Changed

- El comando de release (`pnpm create-version`, alias `pnpm cv`) toma las notas del bloque `[Unreleased]` del CHANGELOG, les asigna la versión y la fecha, y pide a Codex que lo complete cuando está vacío.
- Las cajas del comando de release ajustan el texto largo en varias líneas en lugar de cortarlo.
- Un release interrumpido reusa automáticamente el artefacto ya preparado cuando es posterior al último cambio de código.

### Removed

- La opción `--notes` y las preguntas sobre las notas del CHANGELOG y sobre reusar el artefacto preparado.

## 0.6.1 - 2026-09-26

- Actualiza pnpm a 12.6.0 y next a 16.3.6
- Add terminal UI for interactive prompts and spinners
- Update release banner and icons for improved visibility
- Remove create-version script
- Update release command to create-version and improve documentation

## 0.6.0 - 2026-09-23

- Actualiza el paquete a la versión 0.6.0.

## 0.5.6 - 2026-09-09

- Actualiza el paquete a la versión 0.5.6.

## 0.5.5 - 2026-09-09

- Actualiza el paquete a la versión 0.5.5.

## 0.5.4 - 2026-09-09

- Actualiza el paquete a la versión 0.5.4.

## 0.5.3 - 2026-09-09

- Actualiza el paquete a la versión 0.5.3.

## 0.5.2 - 2026-09-09

- Actualiza el paquete a la versión 0.5.2.

## 0.5.1 - 2026-09-08

- Actualiza el paquete a la versión 0.5.1.

## 0.5.0 - 2026-09-08

- Actualiza el paquete a la versión 0.5.0.

## 0.4.2 - 2026-09-08

- Actualiza el paquete a la versión 0.4.2.

## 0.4.1 - 2026-09-08

- Actualiza el paquete a la versión 0.4.1.

## 0.4.0 - 2026-09-08

- Distribuye los providers nativo, Next y TanStack con tema compartido, navegación e imágenes adaptadas al framework.
- Incluye CSS precompilado, tema y fuentes; los consumidores sólo importan `beez-ui/styles.css`, sin configurar Tailwind.
- Valida el tarball sin compiladores CSS y las integraciones en Chromium y WebKit.

## 0.3.1 - 2026-09-08

- Publica CSS precompilado para que los estilos funcionen sin Tailwind ni detección de clases en el consumidor.
- Conserva el tema, las fuentes y las utilidades compartidas mediante `beez-ui/styles.css`.
- Verifica estilos computados del tarball servido por HTTP sin procesadores CSS en Chromium y WebKit.

## 0.2.0 - 2026-09-08

- Unifica el nombre `BeezUIProvider` en los entrypoints nativo, Next y TanStack; reemplaza `NextBeezUIProvider`.
- Comparte el tema mediante `next-themes`, `themeOptions` y `useTheme` en todos los providers.
- Restaura `Link` desde la raíz con navegación por adaptadores y prefetch desactivado por defecto.
- Integra Unpic para imágenes nativas y de TanStack, y conserva Next Image en el provider de Next.
- Separa los tipos de tests y valida navegación, imágenes y tema en Chromium y WebKit.

## 0.1.1 - 2026-09-08

- Publica JavaScript ESM y declaraciones TypeScript en `dist`.
- Conserva los componentes agrupados y el tema de LaTribu.
- Mantiene visible el área del avatar durante la carga diferida para permitir que el navegador solicite la imagen.
- Agrega `BeezUIProvider` para adaptadores nativos o propios y `NextBeezUIProvider` como integración opcional.
- Incorpora preparación de releases con checks, control del contenido del paquete y checksum SHA-256.
- Documenta la autenticación con `NPM_TOKEN` y la publicación del artefacto validado.

## 0.1.0 - 2026-09-08

- Centraliza los componentes de LaTribu y agenda-mensual con su tema, fuentes y pruebas.
