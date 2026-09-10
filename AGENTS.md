# Reglas del repositorio

## Entorno de tests

- Usar Vitest con happy-dom para los tests compatibles con ese entorno.
- Cuando happy-dom no soporte una API o no reproduzca fielmente el comportamiento que se necesita validar, implementar o trasladar ese caso a Playwright en `tests/browser/`, ejecutándolo en los navegadores y tamaños de pantalla relevantes.
- Se permiten parches de happy-dom para corregir incompatibilidades o implementar soporte fiel al comportamiento del navegador. Deben estar versionados, documentados y cubiertos por tests del contrato corregido. Si el parche no permite validar fielmente el caso, usar Playwright.
- No agregar mocks ni polyfills para simular el comportamiento faltante y hacer pasar esos casos. No debilitar assertions ni omitir cobertura: validar el comportamiento real con Playwright cuando happy-dom no lo soporte.
