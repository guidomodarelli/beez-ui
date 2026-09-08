# beez-ui

Biblioteca de componentes React reutilizables, con adaptadores opcionales por framework y tema compartido. Reúne los componentes de LaTribu y las funcionalidades reutilizables de agenda-mensual.

## Consumo

```tsx
import { Button, Avatar, AvatarImage, DataTable, Calendar } from "beez-ui";
```

Agrupar los imports de componentes desde la raíz. El paquete publica JavaScript ESM y declaraciones TypeScript en `dist`; el consumidor no necesita transpilar el código fuente de la librería. La gramática de filtros y los helpers de mes-año son independientes de React.

```css
@import "beez-ui/styles.css";
```

`beez-ui/styles.css` es CSS listo para el navegador: incluye reset, utilidades, tema claro/oscuro, radios y fuentes locales Geist, Poppins e IBM Plex Mono. No requiere Tailwind, plugins PostCSS ni declaraciones `@source` en el consumidor. Las clases se compilan en el build de la biblioteca y se publican en `dist/styles.css`; `styles.source.css` es la entrada de desarrollo y no se distribuye.

Los consumidores pueden sobrescribir tokens mediante CSS normal. Poppins se reserva para títulos grandes mediante `--font-display`; las licencias se incluyen en `assets/fonts`. Si la aplicación usa Tailwind para sus propios estilos puede mantenerlo, pero ya no necesita escanear beez-ui.

## Providers de UI

Elegir un único `BeezUIProvider` según el framework. Los componentes y `useTheme` siempre se importan desde `beez-ui`.

| Import del provider | Navegación | Imágenes de avatar |
| --- | --- | --- |
| `beez-ui` | Anclas nativas | `@unpic/react` |
| `beez-ui/next` | `next/link` | `next/image` |
| `beez-ui/tanstack` | TanStack Router | `@unpic/react` |

```tsx
"use client";

import type { ReactNode } from "react";
import { BeezUIProvider } from "beez-ui/next";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BeezUIProvider themeOptions={{ storageKey: "tutribu-theme", defaultTheme: "system" }}>
      {children}
    </BeezUIProvider>
  );
}
```

Todos los providers usan `next-themes` con clases CSS. El consumidor configura `themeOptions` y conecta sus controles a `useTheme` desde `beez-ui`. Al migrar una aplicación, conservar su clave de almacenamiento y retirar los scripts y estados anteriores que modifiquen el tema. En Next, mantener `suppressHydrationWarning` en el elemento `html` porque el provider restaura la preferencia antes de hidratar.

El provider de Next desactiva prefetch y optimización de imágenes por defecto, como LaTribu. Se activan con `prefetch` y `optimizeImages`; para optimizar imágenes remotas hay que configurar sus hosts en la app. `Link` y los enlaces de paginación usan el adaptador del provider. El contrato común de `Link` acepta href como string y atributos de ancla, no todas las opciones exclusivas de Next.

El provider de TanStack se monta dentro del router de la aplicación. Preserva query y hash; `prefetch` activa precarga por intención. TanStack no aporta un componente Image propio: Unpic genera variantes responsivas para CDNs compatibles y conserva las URLs que no reconoce; no instala un servidor de optimización.

Next y TanStack Router son peers opcionales aislados en sus entrypoints. El provider nativo admite overrides mediante `components`. Sin provider, los componentes conservan anclas e imágenes HTML como fallback.

## Responsabilidades del consumidor

- Tema: `AnimatedThemeToggler` y `ThemedToaster` consumen el contexto compartido. Sus props explícitas de tema siguen disponibles para usos controlados.
- Navegación: `PaginationNext`, `PaginationPrevious` y `PaginationLink` usan anclas nativas. El prop opcional `component` admite el adaptador del router que elija la app. Sin proveedor usa el elemento nativo; con el proveedor de Next usa su navegación cliente.
- Sidebar: `defaultOpen` y el modo controlado conservan la semántica de LaTribu. `storageKey` activa opcionalmente persistencia local segura tras hidratar, sin cambiar la cookie pública `sidebar_state` ni sus siete días de duración.
- Formularios y tablas: el consumidor provee sus datos, validaciones y callbacks. No se importan servicios, modelos de negocio ni endpoints de agenda-mensual.

## Componentes incorporados desde agenda-mensual

`Alert`, `AnimatedThemeToggler`, `Calendar`, `DataTable`, `FilterQueryBar`, `Form`, `Highlighter`, `InputGroup`, `Label`, `RadioGroup`, `TypingAnimation` y `ThemedToaster`, junto con sus subcomponentes, tipos y gramática de filtros.

La tabla conserva agrupación estable, columnas configurables, memoización, exclusiones y sincronización de qualifiers por identificadores. La barra conserva navegación por teclado, autocompletado y filtros de texto, rangos, fechas, presencia y carpetas. `Calendar` usa español por defecto y acepta otra locale. Los textos y configuraciones de filtros se pueden personalizar por props.

Los componentes compartidos conservan el tema de LaTribu. Se incorporaron atributos `data-variant`/`data-size` del botón, scroll para paneles largos y persistencia opcional del sidebar. Se mantienen `Button.asChild`, estados deshabilitados y skeletons deterministas. `AvatarImage` delega carga y fallback a Base UI; conserva carga diferida y recuperación al cambiar `src`. El export original `Toaster` permanece disponible; `ThemedToaster` agrega los estilos e iconos compartidos.

## Desarrollo y validación

Usar pnpm **12.3.4**. Las dependencias tienen rangos `^` y el lockfile fija las versiones verificadas.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm exec playwright install chromium webkit
pnpm test:browser
pnpm build
pnpm release:prepare
```

`pnpm build` compila JavaScript, declaraciones y CSS con el CLI de Tailwind. `pnpm check` ejecuta ESLint 10, los typechecks separados de código y tests con TypeScript 7, y Vitest 5. `tests/tsconfig.json` incorpora los matchers de Testing Library y los tipos de Vite sin incluirlos en el código de producción. `test:browser` verifica una app React/Vite nativa y una app Next real en Chromium y WebKit, tanto en desktop como en móvil. Los tests unitarios importan los archivos compilados. Los consumidores de navegador no instalan plugins de Tailwind, y una prueba adicional sirve el tarball por HTTP sin procesadores CSS para verificar estilos computados y carga de fuentes. Una prueba adicional instala el tarball en un consumidor aislado sin Next y verifica render, filtrado y declaraciones públicas.

Los tests resuelven `beez-ui`, `beez-ui/next` y `beez-ui/tanstack` mediante rutas explícitas a las declaraciones compiladas en `tests/tsconfig.json`. Ejecutar `pnpm build` después de clonar o si falta `dist`; los comandos de validación completos ya lo hacen. Si el editor conserva diagnósticos anteriores después del build, reiniciar su servidor de TypeScript.

El compilador `tsc` es TypeScript 7. Para `typescript-eslint`, se mantiene la [API de compatibilidad oficial de TypeScript 6](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0) mediante un alias; no reemplaza el compilador de los typechecks.

## Preparar y publicar una versión

El flujo sigue el utilizado en `eslint-plugin-no-magic`: build reproducible, checks, validación del contenido del tarball y publicación explícita.

1. Actualizar `package.json` y la primera entrada de `CHANGELOG.md` con la misma versión.
2. Ejecutar `pnpm release:prepare`. Instala desde el lockfile congelado, compila JavaScript y tipos, ejecuta lint, typechecks, tests unitarios, prueba del tarball y tests de navegador.
3. El comando deja un archivo en `releases/<version>-<sha256>/beez-ui-<version>.tgz`, verifica sus exports y excluye fuentes privadas, tests, scripts, `.env` y `.npmrc`. Las fuentes, estilos y licencias públicas sí forman parte del paquete. Conserva releases anteriores.
4. Revisar y commitear la versión y sus notas. La preparación no crea commits ni tags y no publica.
5. Configurar `NPM_TOKEN` con permiso de publicación en el entorno o en `.env`, tomando `.env.example` como referencia. Mantener el archivo local existente si ya está configurado.
6. Publicar el artefacto exacto que imprimió la preparación:

```sh
pnpm release:publish releases/<version>-<sha256>/beez-ui-<version>.tgz
```

El comando valida nuevamente nombre, versión, contenido y checksum antes de invocar `pnpm publish --access public`. Carga `.env` sólo si el token no existe en el entorno y no imprime su contenido. La autenticación se configura mediante `.npmrc` con la referencia `${NPM_TOKEN}`. Los controles de Git de pnpm permanecen activos.

`prepack` ejecuta el build para los empaquetados manuales. `dist` y `releases` son generados e ignorados por Git. La CI verifica los checks y los tres providers en ambos motores de navegador en Linux y Windows; no publica automáticamente.

Tras publicar, los consumidores pueden instalar `pnpm add beez-ui`. También pueden instalar directamente el `.tgz` validado antes de una publicación. LaTribu mantiene un artefacto versionado en `vendor` y su lockfile para instalaciones reproducibles.

Los componentes nuevos de shadcn/ui se agregan mediante su CLI en esta biblioteca y se exportan desde la raíz. No editar las copias instaladas en los consumidores.

## Procedencia

Fuentes originales: `guidomodarelli/TuTribu` (`components/ui`) y `agenda-mensual` (`src/components/ui`). Se preservan las funcionalidades y los comentarios que explican sus decisiones; la integración adapta imports, contratos y dependencias del consumidor. Consultar `LICENSE.md` para la licencia original de shadcn/ui y `assets/fonts/*-LICENSE.txt` para las fuentes. El icono de WhatsApp proviene del registry `@svgl`.
