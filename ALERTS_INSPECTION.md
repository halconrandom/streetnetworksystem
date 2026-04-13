# 📋 Inspeccion de Alertas - Street Network Admin Redesign

## Resumen

| Categoría | Cantidad |
|-----------|----------|
| Warnings de Build | 2 |
| Errores de Tipo (`any`) | 50+ |
| `@ts-ignore` | 4 |
| `console.error` | 60+ |
| Depreciaciones/Problemas | Varios |

---

## 🚨 Alertas de Build (Webpack/Next.js)

### 1. Webpack Cache Warning

**Cuando aparece:** Build completo  
**Que dice:**
```
[w] [webpack.cache.PackFileCacheStrategy] Serializing big strings (192kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)
```

**Causa probable:** Algún dato grande (posiblemente el cache de BG removal o datos de editor) se está serializando en el cache de webpack.

**Ubicación probable:**
- `src/features/screenshot-editor/editor/hooks/useEditorState.ts` - BG removal session
- Datos de imágenes guardados en cache

**Recomendación:** Investigar qué datos se están cacheando y considerar usar `Buffer` o reducir el tamaño.

---

### 2. Clerk/Next.js Import Error

**Cuando aparece:** Build y runtime  
**Que dice:**
```
Attempted import error: 'useContext' is not exported from 'react' (imported as 'useContext').
Import trace: navigation.js → @clerk/nextjs → clerkMiddleware.js
```

**Causa:** Conflicto entre Next.js 15.5.x y Clerk 6.39.x. El middleware de Clerk intenta importar algo de Next.js que no está disponible.

**Ubicación:**
- `node_modules/next/dist/esm/client/components/navigation.js`
- Afecta a `@clerk/nextjs`

**Framework/Librería:** Next.js 15.5.12 + Clerk 6.39.0

**Impacto:** Warning durante build - el build termina exitosamente pero puede causar problemas en runtime del middleware.

**Recomendación:** Esperar actualización de Clerk o downgradear Next.js a 15.4.x.

---

## ⚠️ TypeScript: Uso de `any` (50+ instances)

**Descripción:** El proyecto tiene muchos tipos `any` lo cual reduce la seguridad de tipos.

### Ejemplos notables:

| Archivo | Cantidad | Contexto |
|---------|----------|----------|
| `lib/db.ts` | 3 | Funciones genéricas de base de datos |
| `pages/api/*` | 15+ | Parámetros de API |
| `src/features/message-builder/state.ts` | 6 | Estado del reducer |
| `src/features/screenshot-editor/*` | 10+ | Manejo de eventos y datos |

**Recomendación:** Definir interfaces específicas para los tipos de datos de API y eventos.

---

## ⚠️ `@ts-ignore` (4 instances)

### 1. `src/features/message-builder/BetterInput.tsx` (L7)
```tsx
// @ts-ignore
type="text"
```
**Contexto:** `TextareaAutosize` no tiene la prop `type` en sus tipos.

---

### 2. `src/features/message-builder/EmojiPicker.tsx` (L18, L20)
```tsx
{/* @ts-ignore */}
{/* @ts-ignore */}
```
**Contexto:** Componente `EmojiMart` con tipos incompatibles.

---

### 3. `src/integrations/components-sdk/dnd/components.ts` (L164)
```tsx
// @ts-ignore We trust that guessComponentType() will ensure that comp is a valid component
```
**Contexto:** Función de tipado dinámico para componentes.

---

## 🔴 `console.error` / `console.warn` (60+ instances)

La mayoría están en:
- **APIs (`pages/api/*`)**: Errores de base de datos y logging
- **Screenshot Editor**: Errores de carga de imágenes, BG removal, cache
- **Message Builder**: Errores de estado

### Ubicaciones principales:

| Archivo | Cantidad | Tipo |
|---------|----------|------|
| `pages/api/screenshot-editor/submit-review.ts` | 7 | Mixto (error + warn) |
| `src/features/screenshot-editor/editor/hooks/useEditorState.ts` | 9 | Errores varios |
| `pages/api/tickets/[id]/*` | 4 | Errores de DB |
| `pages/api/vault/*` | 2 | Errores de DB |

**Recomendación:** Reemplazar `console.error` con un sistema de logging apropiado (ej: `sonner` ya está instalado).

---

## 📦 Framework y Librerías Detectadas

### UI Components (Shadcn-like)

El proyecto usa componentes UI personalizados en `components/ui/`:

| Componente | Archivo | Usado en |
|------------|---------|----------|
| Button | `components/ui/button.tsx` | MessageBuilder |
| Badge | `components/ui/badge.tsx` | Index, Tickets, Users, Vault |
| Input | `components/ui/input.tsx` | Audit, Tickets, Users, Vault |
| Card | `components/ui/card.tsx` | (no encontrado en uso) |

**Framework:** Shadcn UI (custom implementation, no el paquete oficial `@shadcn/ui`)

---

### Otras Librerías Principales

| Librería | Versión | Uso |
|----------|---------|-----|
| Next.js | 15.5.12 | Framework principal |
| React | 18.2.0 | UI |
| Clerk | 6.39.0 | Autenticación |
| Tailwind CSS | 4.1.14 | Estilos |
| Redux Toolkit | 1.8.5 | Estado global |
| Framer Motion | 12.34.3 | Animaciones |
| Lucide React | 0.562.0 | Iconos |
| i18next | 22.4.10 | Internacionalización |
| @imgly/background-removal | 1.7.0 | Remover fondo de imágenes |
| onnxruntime-web | 1.21.0 | ML (usado por @imgly) |
| react-dnd | 16.0.1 | Drag & drop |
| sonner | 2.0.7 | Notificaciones toast |
| rc-slider | 9.7.5 | Sliders |
| react-select | 5.10.1 | Selects |
| emoji-mart | 3.0.1 | Selector de emojis |

---

## 🔍 Problemas de Depreciación / Best Practices

### 1. Emoji-mart peer dependency conflict
```
peer react@"^0.14.0 || ^15.0.0-0 || ^16.0.0 || ^17.0.0" from emoji-mart@3.0.1
```
**Problema:** emoji-mart@3.0.1 requiere React 17 máximo, pero el proyecto usa React 18.  
**Solución actual:** `--legacy-peer-deps`  
**Mejor solución:** Actualizar a emoji-mart@5.x que soporta React 18.

---

### 2. onnxruntime-web instalación manual
**Problema:** `@imgly/background-removal` no incluye `onnxruntime-web` como dependencia explícita, causando error de WebGPU en build.

**Solución aplicada:** Instalación manual de `onnxruntime-web`.

---

## 📊 Métricas del Proyecto

- **Build:** ✅ Exitoso (con warnings)
- **Lint (tsc):** ✅ Sin errores
- **Pages estáticas:** 4
- **Pages dinámicas:** 8
- **APIs:** 20+
- **Features principales:** Dashboard, Tickets, Users, Vault, Audit, Message Builder, Screenshot Editor

---

*Generado: 2026-04-12*