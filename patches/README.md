# Parches de dependencias

## happy-dom 20.14.0

`happy-dom@20.14.0.patch` corrige el manejo de la promesa `Animation.finished`
durante `cancel()`. El estándar exige rechazarla con `AbortError` y marcarla
como manejada. Happy DOM omite este último paso, lo que produce rechazos sin
manejar cuando Motion cancela animaciones al actualizar o desmontar componentes.

El parche conserva el rechazo para los consumidores que esperan la promesa y
mantiene las animaciones reales. No desactiva errores de Vitest ni modifica Motion.
Se aplica automáticamente con pnpm mediante `patchedDependencies`.

Referencia: https://drafts.csswg.org/web-animations-1/#canceling-an-animation

Al actualizar Happy DOM, comprobar si ya incorpora esta corrección y ejecutar
`pnpm exec vitest run tests/dom-animation.test.ts` y la suite completa antes
de retirar el parche.
