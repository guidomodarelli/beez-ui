# Cambios

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
