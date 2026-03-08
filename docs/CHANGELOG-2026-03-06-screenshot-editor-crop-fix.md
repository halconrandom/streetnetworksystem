# Changelog - Screenshot Editor Crop Fix

**Fecha:** 6 de marzo de 2026

---

## Bug Fixed

### Crop de Overlays no se aplicaba y el canvas se ponía en negro

**Problema:** Al usar el CropEditor para recortar un overlay y hacer clic en "Apply" o "Save Copy & Add", el canvas se quedaba en negro y el crop no se aplicaba correctamente.

**Causa:** 
1. El orden de las operaciones era incorrecto: `updateOverlay()` se llamaba antes de `invalidateCache()`
2. El hook `useCanvasPainter` no tenía un mecanismo para forzar re-renderizados cuando el cache se invalidaba
3. La imagen de fondo no se manejaba correctamente cuando ya estaba en cache del navegador
4. El código tenía estructura rota con función `performDraw` definida pero nunca llamada

---

## Archivos Modificados

### `src/features/screenshot-editor/components/ScreenshotEditorView.tsx`

**Cambio:** Reordenamiento de operaciones en los handlers del CropEditor.

```tsx
// ANTES (incorrecto)
onApply={(updateValue) => {
  updateOverlay(activeCropOverlayId, { crop: updateValue });
  setActiveCropOverlayId(null);
  invalidateCache(activeCropOverlayId); // ← Demasiado tarde
  commitHistory();
}}

// DESPUÉS (correcto)
onApply={(updateValue) => {
  invalidateCache(activeCropOverlayId); // ← Primero invalidar
  updateOverlay(activeCropOverlayId, { crop: updateValue });
  setActiveCropOverlayId(null);
  commitHistory();
}}
```

### `src/features/screenshot-editor/editor/hooks/useCanvasPainter.ts`

**Cambios principales:**
1. **Reescritura completa del hook** - El código anterior tenía una función `performDraw` que nunca se llamaba
2. **Estado de versión de renderizado** - Añadido `renderVersion` state que se incrementa cuando se invalida el cache
3. **Dependencia del useEffect** - `renderVersion` añadido a las dependencias para forzar re-render
4. **Manejo de imagen de fondo** - Verificación de `image.complete` para manejar imágenes ya cargadas
5. **Limpieza del código** - Eliminado código duplicado y estructurado correctamente

```tsx
// Estado para forzar re-renders cuando el cache se invalida
const [renderVersion, forceUpdate] = useState(0);

// useEffect incluye renderVersion como dependencia
useEffect(() => {
  // ... render logic
}, [imageDataUrl, settings, textBlocks, visibleLines, overlays, layerOrder, redactionAreas, renderVersion]);

// invalidateCache fuerza re-render
const invalidateCache = useCallback((id: string) => {
  delete overlayImageCacheRef.current[id];
  forceUpdate(n => n + 1);
}, []);
```

---

## Testing

- [x] TypeScript compila sin errores
- [x] Test manual: Aplicar crop a overlay → Canvas renderiza correctamente
- [x] Test manual: Save Copy & Add → Nuevo overlay con crop se crea correctamente
- [x] Test manual: Cancelar → No hay cambios en el canvas

---

## Notas Técnicas

El problema tenía múltiples capas:

1. **Race condition**: El estado de React se actualizaba antes de invalidar el cache de imágenes
2. **Código roto**: La función `performDraw` estaba definida dentro de `drawCanvas` pero nunca se llamaba
3. **Falta de trigger**: El useEffect no tenía forma de saber que debía re-renderizar cuando el cache cambiaba
4. **Imagen de fondo**: No se manejaba el caso donde la imagen ya estaba en cache del navegador

La solución:
1. Invalidar el cache ANTES de actualizar el estado
2. Usar un contador de versión (`renderVersion`) como dependencia del useEffect
3. Cuando `invalidateCache` se llama, incrementa el contador → dispara re-render
4. El re-render usa el cache actualizado con la nueva imagen
