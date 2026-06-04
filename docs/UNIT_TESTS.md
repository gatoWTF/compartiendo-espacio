# Pruebas Unitarias — Parkings Together

## ¿Qué son las pruebas unitarias?

Una prueba unitaria es una función automática que verifica que un fragmento específico
de código (una función, un módulo) produce el resultado esperado dado cierto input.

**Ventaja principal:** cada vez que modificas el código corres las pruebas y en segundos
sabes si algo se rompió — sin tener que probar a mano cada caso.

---

## Cómo correr las pruebas

Desde la carpeta `apps/web`:

```bash
# 1. Pruebas de lógica interna (pricing, pagos, geocoding) — Jest
npm run test:unit

# 2. Pruebas de rutas API — Node nativo
npm test
```

Resultado esperado al correr `test:unit`:

```
PASS  tests/pricing.test.js
PASS  tests/payments.test.js
PASS  tests/geocoding.test.js

Tests: 55 passed, 55 total   ← pricing (25) + payments (22) + geocoding (8)
Time:  ~3s
```

---

## Archivos de prueba

```
apps/web/tests/
├── pricing.test.js     # Lógica de precios
├── payments.test.js    # Proveedores de pago
├── geocoding.test.js   # Regiones de Chile
└── api.test.js         # Rutas API (node:test)
```

---

## Detalle de cada suite

### `pricing.test.js` — 25 tests
**Módulo probado:** `src/lib/pricing.js` — funciones `calcTotal` y `calcBreakdown`

Valida que el cálculo de precio por duración sea correcto en todos los casos:

| Caso | Descripción |
|---|---|
| Duración 0 | Siempre devuelve $0 |
| Sin tarifas | Estacionamiento gratuito → $0 |
| Solo hora | 1h exacta, fracción (redondeo), 2h |
| Solo minuto | 45 min × $20 = $900 |
| Solo día | 1 día, 2 días, fracción → redondea al siguiente día |
| Combinado | día + hora + minuto con tarifas completas |
| Breakdown | Cantidad de líneas, labels correctos (singular/plural), suma == calcTotal |

**Por qué importa:** si alguien cambia la lógica de precios, los tests detectan
inmediatamente si el monto calculado deja de ser correcto.

---

### `payments.test.js` — 22 tests
**Módulo probado:** `src/lib/payments.js`

| Función | Qué valida |
|---|---|
| `isValidProvider` | `mock`/`efectivo`/`webpay` son válidos; `paypal`, `stripe`, `""` no lo son |
| `genTransactionId` | Prefijo correcto, formato `PREFIX-timestamp-random`, IDs únicos |
| `isWebpayConfigured` | Devuelve `false` si falta alguna variable de entorno; `true` si ambas están |
| `createCharge('mock')` | Status `completed`, transactionId `TXN-*`, `raw.simulated = true` |
| `createCharge('efectivo')` | Status `pending`, transactionId `CASH-*`, `raw.method = 'efectivo'` |
| `createCharge('webpay')` sin credenciales | Status `completed` simulado, transactionId `WP-SIM-*` |
| Resultado uniforme | Los 3 proveedores devuelven `{ status, transactionId, raw }` |

**Por qué importa:** garantiza que cualquier proveedor nuevo que se añada respeta
el mismo contrato de respuesta que consume `/api/pagos`.

---

### `geocoding.test.js` — 8 tests
**Módulo probado:** `src/lib/comunas-chile.js` — constante `REGIONES` y función `detectarRegion`

| Caso | Descripción |
|---|---|
| Catálogo completo | Chile tiene exactamente 16 regiones |
| Campos requeridos | Cada región tiene `id`, `nombre`, `latMin/Max`, `lngMin/Max`, `comunas[]` |
| Límites coherentes | `latMin < latMax` y `lngMin < lngMax` en todas las regiones |
| Santiago | Coordenadas del centro → Región Metropolitana |
| Valparaíso | Coordenadas de la costa → V Región |
| Fuera de Chile | Brasil y Europa → `null` |
| Referencia | Devuelve el objeto original de `REGIONES`, no una copia |

**Por qué importa:** el geocoding inverso del Dashboard y MiniMap depende de este
catálogo para auto-rellenar la región al hacer clic en el mapa.

---

### `api.test.js` — 6 tests
**Rutas probadas:** `/api/mapas/search` y `/api/reservas/reserve`

Usa `node:test` (sin Jest) con un mock de `fetch` que intercepta las rutas BFF.
Verifica la estructura de respuesta (campos `data`, `success`, `reserva_id`, etc.)
sin necesitar una base de datos real.

Correr con:
```bash
npm test
```

---

## Configuración técnica

### Jest (`jest.config.js`)

```js
const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

module.exports = createJestConfig({
  testEnvironment: 'node',
  testMatch: [
    '**/tests/pricing.test.js',
    '**/tests/payments.test.js',
    '**/tests/geocoding.test.js',
  ],
});
```

`next/jest` se encarga de transformar ESM → CJS con `babel-jest` automáticamente,
lo que permite importar los módulos de `src/lib/` en los tests sin configuración extra.

### Scripts en `package.json`

```json
"test":      "node --test tests/api.test.js",
"test:unit": "jest"
```

---

## Agregar un test nuevo

1. Crea el archivo en `apps/web/tests/mi-modulo.test.js`
2. Importa la función que quieras probar:
   ```js
   import { miFuncion } from '../src/lib/mi-modulo.js';
   ```
3. Escribe los casos con `describe` y `test`:
   ```js
   describe('miFuncion', () => {
     test('caso esperado', () => {
       expect(miFuncion(input)).toBe(resultado);
     });
   });
   ```
4. Agrega el path al `testMatch` en `jest.config.js`
5. Corre `npm run test:unit` para verificar

---

## Estado actual

| Suite | Tests | Estado |
|---|---|---|
| `pricing.test.js` | 25 | ✅ Passing |
| `payments.test.js` | 22 | ✅ Passing |
| `geocoding.test.js` | 8 | ✅ Passing |
| `api.test.js` | 6 | ✅ Passing |
| **Total** | **61** | **✅ 61/61** |
