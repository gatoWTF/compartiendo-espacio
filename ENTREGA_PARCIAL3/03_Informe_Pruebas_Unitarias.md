# Informe de Pruebas Unitarias
## Parkings Together — Evaluación Parcial N°3 (DSY1106)

> **Todas las métricas de este informe son reales**, generadas con
> `jest --coverage` sobre el código del repositorio. El reporte HTML navegable
> está en `03_Cobertura_HTML/index.html`.

---

## 1. Resumen ejecutivo

| Métrica | Valor real | Umbral pauta | Cumple |
|---|---|---|---|
| Pruebas totales | **66 / 66 passing** | — | ✅ |
| Cobertura de **sentencias** | **71.22 %** | ≥ 60 % | ✅ |
| Cobertura de **líneas** | **70.76 %** | ≥ 60 % | ✅ |
| Cobertura de **ramas** | **69.23 %** | ≥ 60 % | ✅ |
| Cobertura de **funciones** | 38.46 % | ≥ 60 % | ⚠️ (ver §6) |
| Suites | 5 | — | ✅ |
| Tiempo de ejecución | ~2.7 s | — | ✅ |

> Tres de las cuatro métricas de cobertura **superan el 60 %** exigido. La métrica
> de funciones es menor porque el orquestador `api.js` agrupa muchas funciones
> auxiliares de red de las cuales se prueban las rutas críticas; el plan de mejora
> está en §6.

---

## 2. Herramientas y metodología

| Herramienta | Uso |
|---|---|
| **Jest** | Framework de pruebas y motor de cobertura (Istanbul) |
| **babel-jest** | Transpila ESM → CJS para importar los módulos `src/lib` |
| **jest.mock()** | Aislamiento de dependencias (repositorios, Supabase) |
| **node:test** | Pruebas de contrato de rutas API (suite complementaria) |

**Patrón de diseño de pruebas:** todas las pruebas siguen **AAA
(Arrange‑Act‑Assert)** y el principio de **aislamiento** mediante *mocks*: las
unidades se prueban sin base de datos ni red reales (los repositorios se sustituyen
por dobles de prueba). Esto las hace **deterministas, rápidas y reproducibles**.

```bash
# Ejecutar todas las pruebas
npx jest

# Ejecutar con cobertura (genera carpeta coverage/)
npx jest --coverage
```

---

## 3. Cobertura por componente (salida real de Istanbul)

```
----------------------------------------------|---------|----------|---------|---------
File                                          | % Stmts | % Branch | % Funcs | % Lines
----------------------------------------------|---------|----------|---------|---------
All files                                     |   71.22 |    69.23 |   38.46 |   70.76
 apps/ms-reservas/.../reserve/services         |   78.57 |   100.00 |   50.00 |   78.57
  reserva.service.js                           |   78.57 |   100.00 |   50.00 |   78.57
 apps/web/src/lib                              |   72.72 |    76.31 |   40.00 |   72.27
  comunas-chile.js                             |  100.00 |   100.00 |  100.00 |  100.00
  pricing.js                                   |  100.00 |    97.50 |  100.00 |  100.00
  payments.js                                  |   92.30 |    80.00 |  100.00 |   92.30
  api.js                                       |   39.58 |    25.00 |   12.50 |   38.63
 packages/supabase-db                          |   53.33 |    41.66 |    0.00 |   53.33
  index.js                                     |   53.33 |    41.66 |    0.00 |   53.33
----------------------------------------------|---------|----------|---------|---------
```

**Módulos de lógica de negocio crítica al 100 % / cercano:** `pricing.js` (cálculo
de tarifas), `comunas-chile.js` (geocoding) y `payments.js` (92 %). El servicio del
microservicio de reservas (`reserva.service.js`) alcanza **78.57 %** con **100 % de
ramas** cubiertas — los dos caminos de la Saga (éxito y compensación) están
probados.

---

## 4. Detalle de las suites (66 pruebas)

| Suite | Componente | N° | Qué valida |
|---|---|---:|---|
| `pricing.test.js` | BFF · `pricing.js` | **24** | Cálculo de precio por hora/minuto/día, redondeos, breakdown, total = suma |
| `payments.test.js` | BFF · `payments.js` | **30** | Proveedores válidos, IDs de transacción únicos, contrato uniforme `{status,transactionId,raw}` |
| `geocoding.test.js` | BFF · `comunas-chile.js` | **8** | 16 regiones de Chile, límites coherentes, detección RM/Valparaíso, fuera de Chile → null |
| `reserveService.test.js` | **ms‑reservas** | **2** | **Rechazo CQRS** (plaza llena) y **compensación Saga** (rollback) |
| `api.timeout.test.js` | BFF · resiliencia | **2** | `fetchWithTimeout` aborta y degrada con `AbortController` ante latencia |
| **Total** | | **66** | **66/66 passing** |

---

## 5. Ejemplos de pruebas y resultados

### 5.1 Patrón Saga + transacción compensatoria (ms‑reservas)

Prueba que demuestra **patrones de diseño aplicados** (indicador 8 de la defensa):
ante un fallo al actualizar la ocupación, la Saga **revierte** la reserva creada.

```js
test('Debe realizar rollback (compensación) si la actualización de plazas falla', async () => {
  ReserveRepository.getParkingAvailability.mockResolvedValue({ occupied_spots: 5, total_spots: 10, id: 'p-123' });
  ReserveRepository.createReserve.mockResolvedValue({ id: 'res-999' });
  ReserveRepository.updateParkingOccupancy.mockRejectedValue(new Error('Concurrency error'));

  await expect(ReserveService.processSaga({ parking_id: 'p-123', user_id: 'u-123' }))
    .rejects.toThrow('Saga Compensada');

  expect(ReserveRepository.deleteReserve).toHaveBeenCalledWith('res-999'); // ROLLBACK verificado
});
```
**Resultado:** ✅ PASS — se verifica que `deleteReserve('res-999')` fue invocado.

### 5.2 Rechazo por capacidad (CQRS)

```js
test('Debe rechazar la reserva si el estacionamiento está lleno (CQRS)', async () => {
  ReserveRepository.getParkingAvailability.mockResolvedValue({ occupied_spots: 10, total_spots: 10, id: 'p-123' });
  await expect(ReserveService.processSaga({ parking_id: 'p-123', user_id: 'u-123' }))
    .rejects.toThrow('El estacionamiento ya está lleno');
  expect(ReserveRepository.createReserve).not.toHaveBeenCalled();
});
```
**Resultado:** ✅ PASS — no se crea reserva cuando no hay cupo.

### 5.3 Cálculo de tarifas (regla de negocio)

```js
test('combina día + hora + minuto con tarifas completas', () => {
  expect(calcTotal({ pricePerDay: 8000, pricePerHour: 1500, pricePerMinute: 30 }, 1530))
    .toBe(/* día + 1h + 30min */ ...);
});
```
**Resultado:** ✅ PASS — 24/24 pruebas de `pricing.js` verdes (100 % de cobertura).

---

## 6. Análisis y plan de mejora de cobertura

- **Fortalezas:** la lógica de negocio pura (precios, pagos, geocoding) y el núcleo
  del microservicio de reservas están **muy bien cubiertos** (100 % / 92 % / 78 %).
- **Brecha:** `api.js` (orquestador BFF, 39 %) y `supabase-db/index.js` (53 %) bajan
  la métrica de **funciones**. Son adaptadores de red/IO difíciles de cubrir sin
  un entorno de integración.
- **Plan:** añadir pruebas de los wrappers de `api.js` con `fetch` mockeado y de la
  fábrica `getSupabaseWithToken` elevaría funciones por sobre el 60 %. Es trabajo
  incremental de bajo riesgo ya iniciado en `api.timeout.test.js`.

---

## 7. Reproducibilidad

1. `npm install` en la raíz del monorepo.
2. `npx jest` → **66 passed**.
3. `npx jest --coverage` → genera `coverage/` (HTML + lcov + json‑summary).
4. Abrir `coverage/index.html` (incluido aquí como `03_Cobertura_HTML/`).

**Configuración** (`jest.config.js`): entorno `node`, `babel-jest`, polyfill de
`WebSocket` (`jest.setup.js`) para que el cliente Supabase no falle en el sandbox.
