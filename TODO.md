# Canvas Preview & Crop Fix

## Steps
- [x] 1. Fix `useCanvasPainter.ts` — cache background image, fix load order, separate draw from load
- [x] 2. Fix `CropEditor.tsx` — use refs for drag state, fix wheel zoom, clamp coords
- [x] 3. Fix `CropModal.tsx` — add null guards, use refs for drag state
- [x] 4. Verify no regressions in dependent components (imports verified)
