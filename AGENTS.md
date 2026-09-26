# Reglas del repositorio

## Entorno de tests

- Usar Vitest con jsdom para los tests compatibles con ese entorno.
- Cuando jsdom no soporte una API o no reproduzca fielmente el comportamiento que se necesita validar (layout, Web Animations, media queries reales, observers de tamaño o intersección), implementar o trasladar ese caso a Playwright en `tests/browser/`, ejecutándolo en los navegadores y tamaños de pantalla relevantes.
- Se permiten shims mínimos de APIs de plataforma que jsdom no implementa (por ejemplo `matchMedia`) solo cuando son necesarios para montar los componentes. Deben vivir en `vitest.setup.ts`, estar documentados y no modelar el comportamiento de la API: ningún test puede afirmar sobre ese comportamiento a través del shim.
- No agregar mocks ni polyfills para simular el comportamiento faltante y hacer pasar esos casos. No debilitar assertions ni omitir cobertura: validar el comportamiento real con Playwright cuando jsdom no lo soporte.

## CHANGELOG

- Todo cambio que modifique el comportamiento, la API pública, los estilos, las dependencias publicadas o el proceso de release debe actualizar `CHANGELOG.md` en el mismo commit.
- Las entradas van siempre dentro del bloque `## [Unreleased]`, nunca en una versión ya publicada. No escribir la versión ni la fecha: `pnpm create-version` renombra `[Unreleased]` a `## [X.Y.Z] - AAAA-MM-DD` al publicar y deja un `[Unreleased]` vacío arriba.
- Agrupar las entradas con el formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), usando solo estas secciones y en este orden: `### Added`, `### Changed`, `### Deprecated`, `### Removed`, `### Fixed`, `### Security`. Omitir las secciones vacías.
- Una línea `- ` por cambio, en español, escrita para quien consume el paquete (qué cambia para él), sin detalles internos de implementación.
- Cambios que no afectan a quien consume el paquete (tests, refactors internos sin efecto visible, tooling local) no necesitan entrada.
- Si al publicar `[Unreleased]` está vacío, `pnpm create-version` invoca a Codex para completarlo desde los commits sin publicar; si no puede, el release se corta.
