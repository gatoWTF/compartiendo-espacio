# Entrega — Evaluación Parcial N°3 (DSY1106 · Desarrollo Fullstack III)
## Integración de arquitectura de microservicios — Proyecto **Parkings Together**

> **Caso:** continuación de las Parciales 1 y 2. Plataforma peer‑to‑peer de
> estacionamientos con geolocalización en tiempo real.
> **Repositorio:** https://github.com/jeffplop/Parkings-Together
> **Producción:** https://parkings-web.vercel.app

---

## 1. Contenido de esta entrega

| # | Archivo | Requisito de la pauta que cubre |
|---|---------|---------------------------------|
| 00 | `00_LEEME_ENTREGA.md` / `.pdf` | Índice + auto‑auditoría contra la rúbrica |
| 00 | `00_repositorios.txt` | Enlaces a repositorios GitHub + descripción |
| 01 | `01_Diagrama_Arquitectura/arquitectura.svg` / `.png` / `.pdf` | **Diagrama de Arquitectura** (frontend, backend, API REST, persistencia) |
| 02 | `02_Descripcion_Persistencia.md` / `.pdf` | **Descripción de la Persistencia** (SP/RPC, PostGIS, RLS) |
| 03 | `03_Informe_Pruebas_Unitarias.md` / `.pdf` | **Informe de Pruebas Unitarias** (cobertura, métricas, ejemplos) |
| 03 | `03_Cobertura_HTML/` | Reporte de cobertura generado por Jest (HTML navegable) |
| 04 | `04_API_REST/openapi.yaml` + `ejemplos.http` | **Especificación API REST** (Swagger/OpenAPI 3.0 + ejemplos) |
| 05 | `05_Defensa_Oral_Guia.md` / `.pdf` | Guía de estudio para la defensa oral individual |

> Los **componentes desarrollados** (frontend, BFF, microservicios, persistencia
> y código de pruebas) están versionados en GitHub y se referencian en
> `00_repositorios.txt`. Esta carpeta documenta y empaqueta dicho trabajo.

---

## 2. Resumen del sistema (1 párrafo)

Parkings Together es un **monorepo Turborepo** que implementa una **arquitectura de
microservicios** con un **BFF (Backend For Frontend)** —`apps/web`, Next.js— que
orquesta tres microservicios independientes: **ms‑mapas** (búsqueda geoespacial de
estacionamientos), **ms‑reservas** (reservas con patrón **Saga/CQRS**) y **auth**
(autenticación). Todos comparten un paquete NPM **`@parkings/supabase-db`** (cliente
Singleton) y persisten en **PostgreSQL 17 + PostGIS** mediante **stored procedures
(funciones PL/pgSQL)** y políticas **RLS**. La comunicación es **API REST** sobre
HTTP/JSON. El sistema está **desplegado en producción** (Vercel + Supabase) y cuenta
con **66 pruebas unitarias** automatizadas (cobertura de sentencias **71.22 %**).

---

## 3. Auto‑auditoría contra la rúbrica (Dimensión: Encargo grupal — 30 %)

| Indicador (peso) | Evidencia en esta entrega | Nivel apuntado |
|---|---|---|
| **1. Propuesta BFF + 2 microservicios (5 %)** | Diagrama `01/` + §2 de `02_…` y `05_…`. División real: BFF `apps/web` + ms‑mapas + ms‑reservas (+ auth como 3.º). | **100 %** |
| **2. Frontend + backend, distintos lenguajes/tecnologías (10 %)** | Frontend React/Next + BFF JS + microservicios JS + **persistencia en SQL/PL‑pgSQL** (SP). READMEs por componente. | **100 %** |
| **3. Integración API REST + persistencia JPA/SP (5 %)** | `04_API_REST/openapi.yaml` + `02_Descripcion_Persistencia` (SP/RPC + PostGIS). Integración verificada en producción. | **100 %** |
| **4. Pruebas unitarias cobertura ≥ 60 % + patrones (10 %)** | `03_Informe…` + `03_Cobertura_HTML/`. Real: **71.22 % stmts / 70.76 % lines / 69.23 % branches**; 66 tests verdes. | **100 %** (supera 60 %) |

> **Nota de transparencia académica:** todas las métricas de este informe son
> **reales** (generadas con `jest --coverage` sobre el código del repositorio, no
> estimadas). La defensa oral (70 %) es **individual**; la guía `05_…` es material
> de **estudio** para que cada integrante comprenda y defienda su propio trabajo,
> no un guion para memorizar.

---

## 4. Cómo verificar la entrega (reproducible)

```bash
# 1. Clonar e instalar
git clone https://github.com/jeffplop/Parkings-Together
cd Parkings-Together && npm install

# 2. Correr TODAS las pruebas unitarias
npx jest                       # 66 passed

# 3. Regenerar el reporte de cobertura (carpeta coverage/)
npx jest --coverage

# 4. Levantar el sistema completo (monorepo)
npm run dev                    # turbo: web:3000, auth:3001, ms-mapas:3002, ms-reservas:3003
```

---

## 5. Checklist de formato del entregable (pauta §2.1)

- [x] Diagrama de arquitectura (imagen/PDF) — `01/`
- [x] Descripción de la persistencia (PDF) — `02_…`
- [x] Informe de pruebas unitarias (PDF) con cobertura, métricas y ejemplos — `03_…`
- [x] Componente frontend empaquetado NPM + `package.json` + `src/` + `README.md` — `apps/web/` (GitHub)
- [x] Microservicios: código + config (`package.json`, `next.config.mjs`) + `README.md` — `apps/ms-*`, `apps/auth` (GitHub)
- [x] API REST: especificación (OpenAPI/Swagger) + ejemplos petición/respuesta — `04/`
- [x] Recurso de persistencia (SP/RPC + esquema SQL) — `sql/`, `supabase_schema.sql` (GitHub)
- [x] Código de pruebas por componente + config + reporte de cobertura + guía — `03/` y `apps/*/tests`
- [x] `repositorios.txt` con enlaces y descripción — `00_repositorios.txt`
- [x] Todo versionado en GitHub
