# beez-ui

Biblioteca React compartida, independiente de Next.js y de gestores de tema. Reúne los componentes de LaTribu y las funcionalidades reutilizables de agenda-mensual. No contiene `next`, `next-themes`, un provider obligatorio ni un componente `Link`.

## Consumo

```tsx
import { Button, Avatar, AvatarImage, DataTable, Calendar } from "beez-ui";
```

Agrupar los imports desde la raíz. El paquete distribuye TypeScript y conserva las fronteras `use client` de los componentes; la gramática de filtros y los helpers de mes-año son independientes de React. En Next.js, el consumidor agrega `beez-ui` a `transpilePackages` y `experimental.optimizePackageImports`.

```css
@import "tailwindcss";
@import "beez-ui/styles.css";
```

La hoja compartida registra las clases mediante `@source` e incluye el **tema default de LaTribu**, sus variantes clara/oscura, radios y fuentes locales Geist, Poppins e IBM Plex Mono. Poppins se reserva para títulos grandes mediante `--font-display`. Los consumidores pueden sobrescribir tokens. Las fuentes conservan sus licencias en `assets/fonts`.

## Responsabilidades del consumidor

- Tema: la app aplica la clase `dark`, decide la preferencia del sistema y conserva la selección. `AnimatedThemeToggler` recibe `theme`, `resolvedTheme` y `onThemeChange`; `ThemedToaster` recibe `theme`. No requieren contexto global.
- Navegación: `PaginationNext`, `PaginationPrevious` y `PaginationLink` usan anclas nativas. El prop opcional `component` admite el adaptador del router que elija la app. La librería no implementa ni importa un router.
- Sidebar: `defaultOpen` y el modo controlado conservan la semántica de LaTribu. `storageKey` activa opcionalmente persistencia local segura tras hidratar, sin cambiar la cookie pública `sidebar_state` ni sus siete días de duración.
- Formularios y tablas: el consumidor provee sus datos, validaciones y callbacks. No se importan servicios, modelos de negocio ni endpoints de agenda-mensual.

## Componentes incorporados desde agenda-mensual

`Alert`, `AnimatedThemeToggler`, `Calendar`, `DataTable`, `FilterQueryBar`, `Form`, `Highlighter`, `InputGroup`, `Label`, `RadioGroup`, `TypingAnimation` y `ThemedToaster`, junto con sus subcomponentes, tipos y gramática de filtros.

La tabla conserva agrupación estable, columnas configurables, memoización, exclusiones y sincronización de qualifiers por identificadores. La barra conserva navegación por teclado, autocompletado y filtros de texto, rangos, fechas, presencia y carpetas. `Calendar` usa español por defecto y acepta otra locale. Los textos y configuraciones de filtros se pueden personalizar por props.

Los componentes compartidos conservan el tema de LaTribu. Se incorporaron atributos `data-variant`/`data-size` del botón, scroll para paneles largos y persistencia opcional del sidebar. Se mantienen `Button.asChild`, estados deshabilitados y skeletons deterministas. `AvatarImage` delega carga y fallback a Base UI; conserva carga diferida y recuperación al cambiar `src`, sin estado de errores duplicado ni dimensiones impuestas por Next. El export original `Toaster` permanece disponible; `ThemedToaster` agrega los estilos e iconos compartidos.

## Desarrollo y validación

Usar pnpm **12.3.4**. Las dependencias tienen rangos `^` y el lockfile fija las versiones verificadas.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm exec playwright install chromium webkit
pnpm test:browser
pnpm pack --pack-destination ../LaTribu/vendor
```

`pnpm check` ejecuta ESLint 10, los typechecks separados de código y tests con TypeScript 7, y Vitest 5. `tests/tsconfig.json` incorpora los matchers de Testing Library y los tipos de Vite sin incluirlos en el código de producción. `test:browser` sirve una app React/Vite real y verifica Chromium y WebKit en desktop y móvil, sin Next.js.

El compilador `tsc` es TypeScript 7. Para `typescript-eslint`, se mantiene la [API de compatibilidad oficial de TypeScript 6](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0) mediante un alias; no reemplaza el compilador de los typechecks.

## Distribución

LaTribu consume `vendor/beez-ui-0.1.0.tgz`. Cualquier app React con un bundler capaz de procesar TypeScript puede instalar ese artefacto con `pnpm add ./ruta/beez-ui-0.1.0.tgz`. No depende de un directorio hermano ni de una publicación pendiente.

Para una entrega posterior: modificar esta biblioteca, ejecutar los checks, incrementar su versión, generar un tarball nuevo y actualizar dependencia y lockfile en los consumidores. No editar componentes instalados ni mantener copias en las apps. Los nuevos componentes de shadcn/ui se agregan mediante su CLI en esta biblioteca y se exportan desde la raíz.

## Procedencia

Fuentes originales: `guidomodarelli/TuTribu` (`components/ui`) y `agenda-mensual` (`src/components/ui`). Se preservan las funcionalidades y los comentarios que explican sus decisiones; la integración adapta imports, contratos y dependencias del consumidor. Consultar `LICENSE.md` para la licencia original de shadcn/ui y `assets/fonts/*-LICENSE.txt` para las fuentes. El icono de WhatsApp proviene del registry `@svgl`.
