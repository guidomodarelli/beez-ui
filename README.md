# beez-ui

Biblioteca de componentes React reutilizables, con adaptadores opcionales por framework y tema compartido. Reúne los componentes de LaTribu y las funcionalidades reutilizables de agenda-mensual.

## Storybook

```bash
pnpm storybook
```

Abre `http://localhost:6006` para explorar los componentes con controles de texto,
variantes, tamaños, estados y comportamiento. El selector de la barra permite
probar el tema claro, oscuro o del sistema. Las stories de componentes compuestos
incluyen sus piezas en ejemplos completos; los campos editables y selectores
sincronizan sus interacciones con Controls. `BeezUIProvider` configura el preview
y no forma parte del catálogo. Las notificaciones se exploran en `ThemedToaster`,
sin duplicar una story de `Toaster`; `WhatsappIcon` está en la sección `Icons`.

```bash
pnpm build-storybook       # Genera storybook-static para servirlo o publicarlo
pnpm typecheck:stories    # Comprueba stories y configuración con TypeScript
pnpm test:storybook       # Build y navegación/interacciones en Chromium y WebKit
```

El catálogo consume los exports públicos y el CSS compilado de la librería. Los
scripts compilan `beez-ui` antes de arrancar; si editás sus fuentes con Storybook
abierto, ejecutá `pnpm build` para actualizar el paquete que muestra el preview.
Los cambios en las stories se actualizan durante el desarrollo. Storybook y sus
addons son dependencias de desarrollo y no se incluyen en el paquete publicado.

Configuración basada en [React con Vite](https://storybook.js.org/docs/get-started/frameworks/react-vite)
y [Controls](https://storybook.js.org/docs/essentials/controls).

## Uso del paquete

```tsx
import { Button, Avatar, AvatarImage, DataTable, Calendar } from "beez-ui";
```

Agrupar los imports de componentes desde la raíz. El paquete publica JavaScript ESM y declaraciones TypeScript en `dist`; el consumidor no necesita transpilar el código fuente de la librería. La gramática de filtros y los helpers de mes-año son independientes de React.

La utilidad `cn`, también exportada desde `beez-ui`, usa el paquete `cn` para combinar clases condicionales y resolver conflictos de Tailwind.

```css
@import "beez-ui/styles.css";
```

`beez-ui/styles.css` es CSS listo para el navegador: incluye reset, utilidades, tema claro/oscuro, radios y fuentes locales Geist, Poppins e IBM Plex Mono. No requiere Tailwind, plugins PostCSS ni declaraciones `@source` en el consumidor. Las clases se compilan en el build de la biblioteca y se publican en `dist/styles.css`; `styles.source.css` es la entrada de desarrollo y no se distribuye.

Los consumidores pueden sobrescribir tokens mediante CSS normal. Poppins se reserva para títulos grandes mediante `--font-display`; las licencias se incluyen en `assets/fonts`. Si la aplicación usa Tailwind para sus propios estilos puede mantenerlo, pero ya no necesita escanear beez-ui.

`DropdownMenuContent` toma el ancho natural de sus opciones, con un mínimo de 12 rem y un máximo limitado por el espacio disponible. No hereda el ancho del botón disparador: los menús abiertos desde un icono deben mantener sus etiquetas legibles. Para un ancho específico, usar `className` y ajustar también el mínimo cuando se necesite un menú más pequeño.

Los componentes usan por defecto los espaciados compactos de Agenda: `Select` mide 2 rem (1.75 rem en tamaño pequeño), `TabsList` horizontal mide 2 rem y `PopoverContent` usa 0.625 rem de padding. Los menús y submenús tienen un mínimo de 12 rem, con filas compactas. `Dialog` y `AlertDialog` usan 1 rem de padding y un footer con borde superior y fondo diferenciado; `Textarea` distingue el estado deshabilitado mediante su fondo. Estos valores conservan los colores y fuentes del tema compartido. Son cambios de los defaults, sin una prop adicional para activarlos; los consumidores pueden personalizarlos mediante `className`.

Los `Sheet` superiores e inferiores limitan su altura al viewport dinámico (`100dvh`) y permiten desplazar el contenido para mantener accesibles las acciones de paneles largos.

## Movimiento

Las nuevas animaciones usan la dependencia `motion`: `animate` controla la
reproducción, `hover` y `press` los gestos, y `AnimatePresence` / `usePresence`
retienen los overlays durante su salida. Los presets y tiempos viven en
`src/motion/`. No se usan keyframes CSS para estas animaciones.

`MotionSlot` anima el nodo original del primitive mediante refs compuestos,
sin agregar wrappers al DOM ni reemplazar sus handlers. Las pulsaciones reducen
la escala a 0.98; cards y enlaces responden al hover; campos e indicadores
responden al foco y la selección. Menús, popovers, diálogos y sheets usan entradas
cortas y salidas de 120 ms. El skeleton pulsa con Motion. Las animaciones
especializadas existentes de Embla, Sonner y rough-notation se conservan.

El contenido que está saliendo deja de ser interactivo y accesible de inmediato.
Cada familia de overlays tiene un contexto de visibilidad independiente para
soportar composiciones anidadas; los portales sin nodo visible no bloquean el
cierre del padre. `Select` conserva su desmontaje nativo y usa Motion en la entrada.
La elección explícita de `forceMount` permanece bajo control del consumidor.

Se respeta `prefers-reduced-motion`: las nuevas animaciones se cancelan y se
restauran los estilos; las anotaciones se dibujan sin animación y el texto aparece
completo, incluidas todas las palabras de una secuencia. Los controles del carrusel
avanzan directamente. El CSS solo aporta el fallback de movimiento reducido para
los efectos heredados. `BeezUIProvider` configura `MotionConfig` con
`reducedMotion="user"`. El primer render conserva el contrato de SSR.

El selector aplica el tema inmediatamente y anima su icono con Motion; no depende
de View Transitions nativas ni de una animación para completar el cambio. Los estilos temporales se liberan al terminar
la reproducción. Las stories permiten probar los gestos y estados reales; el
selector de tema de la story y la barra de Storybook se mantienen sincronizados.

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

## React Compiler

El build usa el port de React Compiler en Rust de [Oxc](https://oxc.rs/blog/2026-08-18-react-compiler-support), mediante `oxc-transform-react`. Esta integración sigue marcada como experimental por Oxc.

Las optimizaciones se incluyen en el JavaScript publicado: el consumidor no necesita habilitar React Compiler en Vite, Next ni otro bundler. El target es React 19 y utiliza `react/compiler-runtime`, incluido en el peer React 19.2; no se añade un runtime independiente.

TypeScript 7 valida los tipos y genera las declaraciones. Oxc recibe los fuentes originales y ejecuta React Compiler antes de eliminar TypeScript y transformar JSX. Conserva ESM, los exports y las directivas de cliente. Sólo los módulos cuyo prólogo declara `"use client"` reciben memoización automática; los módulos compatibles con Server Components se emiten sin cachés de cliente. Esto evita introducir hooks del runtime de cliente en el render servidor de Next.

La cobertura depende de las heurísticas del compilador y de las reglas de React: algunas funciones conservan su implementación sin optimizar. Las memoizaciones y comentarios del código fuente permanecen intactos. El build informa cuántos módulos incluyen memoización automática y falla ante errores fatales de transformación.

```sh
# Comparar el comportamiento sin memoización automática.
pnpm test:uncompiled

# Volver a generar la distribución optimizada.
pnpm build
```

`test:uncompiled` usa `pnpm build --no-react-compiler` y ejecuta Vitest. CI y `release:prepare` ejecutan esa comparación antes del check normal, que restaura el build optimizado. Los consumidores de prueba no habilitan un segundo compilador: ejercen el paquete generado, incluido un componente de servidor real en Next.

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

`pnpm build` genera las declaraciones con TypeScript 7, JavaScript con Oxc/React Compiler y CSS con el CLI de Tailwind. `pnpm check` ejecuta ESLint 10, los typechecks separados de código y tests con TypeScript 7, y Vitest 5. `tests/tsconfig.json` incorpora los matchers de Testing Library y los tipos de Vite sin incluirlos en el código de producción. `test:browser` verifica una app React/Vite nativa y una app Next real en Chromium y WebKit, tanto en desktop como en móvil. Los tests unitarios importan los archivos compilados. Los consumidores de navegador no instalan plugins de Tailwind, y una prueba adicional sirve el tarball por HTTP sin procesadores CSS para verificar estilos computados y carga de fuentes. Una prueba adicional instala el tarball en un consumidor aislado sin Next y verifica render, filtrado y declaraciones públicas.

Los tests resuelven `beez-ui`, `beez-ui/next` y `beez-ui/tanstack` mediante rutas explícitas a las declaraciones compiladas en `tests/tsconfig.json`. Ejecutar `pnpm build` después de clonar o si falta `dist`; los comandos de validación completos ya lo hacen. Si el editor conserva diagnósticos anteriores después del build, reiniciar su servidor de TypeScript.

El compilador `tsc` es TypeScript 7. Para `typescript-eslint`, se mantiene la [API de compatibilidad oficial de TypeScript 6](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0) mediante un alias; no reemplaza el compilador de los typechecks.

## Crear y publicar una versión

Desde el repositorio de beez-ui, configurar `NPM_TOKEN` con permiso de publicación en el entorno o en `.env`, tomando `.env.example` como referencia. Mantener el archivo local existente si ya está configurado. Después ejecutar:

```sh
pnpm run create-version patch
pnpm run create-version minor --notes "Agrega un componente" --notes "Amplía sus opciones"
pnpm run create-version 0.5.0 --notes "Describe los cambios de esta versión"
```

Acepta `patch`, `minor`, `major` o una versión estable explícita mayor que la actual. Las notas son opcionales y pueden repetirse. Sin `--notes`, se agrega una entrada básica que indica la nueva versión; las notas explícitas no pueden estar vacías. `pnpm run create-version --help` muestra la sintaxis.

El comando ejecuta el flujo completo:

1. Actualiza `package.json` y agrega la entrada del changelog con fecha UTC, conservando el historial.
2. Prepara la release: instalación congelada, tests sin React Compiler, build optimizado de JavaScript, tipos y CSS, lint, typechecks, tests unitarios y pruebas de navegador.
3. Genera el tarball en `releases/<version>-<sha256>/beez-ui-<version>.tgz` y valida su contenido, exports e integridad.
4. Crea un commit con el contenido validado de `package.json` y `CHANGELOG.md`, conservando otros archivos staged, y pushea ese commit a la rama upstream configurada.
5. Publica ese mismo artefacto en npm con acceso público y etiqueta `latest`.

La publicación usa el cliente oficial de npm para admitir su flujo interactivo de verificación en el navegador/2FA. Instalación, build y checks siguen usando pnpm 12. Ejecutar desde una terminal interactiva cuando la cuenta requiera autenticación adicional. El token se carga sólo al publicar, no se imprime y se referencia mediante `${NPM_TOKEN}` en `.npmrc`.

El comando requiere una rama Git con upstream configurado. El commit se limita a los dos archivos de metadatos, incluidos sus cambios previos; revisar el código antes de ejecutar la release. No crea tags ni hace force push. Si cambian el checkout, el upstream o los metadatos durante las validaciones, se detiene. También comprueba que los hooks de Git no hayan agregado archivos ni alterado los metadatos validados antes de pushear. Si falla una validación, el commit o el push, no publica. Los metadatos de la nueva versión quedan disponibles: corregir el error, ejecutar `pnpm release:prepare`, commitear y pushear los metadatos y publicar el artefacto resultante. Si falla el push después del commit, resolver el problema y pushear ese commit antes de publicar el tarball preparado. Si falla la publicación, comprobar primero si npm recibió la versión y reintentar sólo la publicación del mismo tarball. No ejecutar nuevamente `create-version` para reintentar la misma release.

Los pasos individuales siguen disponibles:

```sh
# Sólo validar y empaquetar la versión actual, sin publicarla.
pnpm release:prepare

# Publicar un artefacto ya preparado.
pnpm release:publish releases/<version>-<sha256>/beez-ui-<version>.tgz
```

`release:publish` vuelve a verificar nombre, versión, contenido y checksum antes de invocar `npm publish`. El paquete excluye fuentes privadas, tests, scripts, `.env` y `.npmrc`; incluye JavaScript, declaraciones, CSS, fuentes tipográficas y licencias. Conserva releases anteriores.

`prepack` ejecuta el build para los empaquetados manuales. `dist` y `releases` son generados e ignorados por Git. La CI verifica los checks y los tres providers en ambos motores de navegador en Linux y Windows; no publica automáticamente.

Tras publicar, los consumidores pueden instalar `pnpm add beez-ui`. También pueden instalar directamente el `.tgz` validado antes de una publicación. LaTribu consume la versión publicada en npm y fija la resolución e integridad mediante su lockfile, sin guardar tarballs locales.

Los componentes nuevos de shadcn/ui se agregan mediante su CLI en esta biblioteca y se exportan desde la raíz. No editar las copias instaladas en los consumidores.

## Procedencia

Fuentes originales: `guidomodarelli/TuTribu` (`components/ui`) y `agenda-mensual` (`src/components/ui`). Se preservan las funcionalidades y los comentarios que explican sus decisiones; la integración adapta imports, contratos y dependencias del consumidor. Consultar `LICENSE.md` para la licencia original de shadcn/ui y `assets/fonts/*-LICENSE.txt` para las fuentes. El icono de WhatsApp proviene del registry `@svgl`.
