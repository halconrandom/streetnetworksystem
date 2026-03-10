import { useEffect, useRef, useCallback, useState } from 'react';
import { defaultTextSettings, DEFAULT_COLOR, defaultFilterSettings } from '../constants';
import type { ChatLine, EditorSettings, OverlayImage, RedactionArea, TextBlock } from '../types';
import { colorWithAlpha, parseChatLines } from '../utils';

type RedactionRegion = {
  startX: number;
  width: number;
};

type RenderSegment = {
  text: string;
  color: string;
};

type RenderLine = {
  text: string;
  color: string;
  segments: RenderSegment[];
  redactions?: RedactionRegion[];
};

// Pixelation helper
const pixelateRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  size: number = 8
) => {
  if (w <= 0 || h <= 0) return;

  try {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const sw = Math.max(1, Math.ceil(w / size));
    const sh = Math.max(1, Math.ceil(h / size));
    tempCanvas.width = sw;
    tempCanvas.height = sh;

    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(ctx.canvas, x, y, w, h, 0, 0, sw, sh);

    ctx.save();
    ctx.filter = 'none';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, sw, sh, x, y, w, h);
    ctx.restore();
  } catch (e) {
    console.warn('Pixelation failed', e);
  }
};

const wrapChatLines = (
  ctx: CanvasRenderingContext2D,
  chatLines: ChatLine[],
  maxWidth: number
): RenderLine[] => {
  const wrapped: RenderLine[] = [];
  
  chatLines.forEach((line) => {
    // Use segments if available, otherwise fall back to single color
    const segments = line.segments ?? [{ text: line.text, color: line.color }];
    
    // Process each segment and wrap text while preserving colors
    let currentLineSegments: RenderSegment[] = [];
    let currentLineWidth = 0;
    
    const flushLine = () => {
      if (currentLineSegments.length > 0) {
        const fullText = currentLineSegments.map(s => s.text).join('');
        wrapped.push({
          text: fullText,
          color: line.color,
          segments: [...currentLineSegments],
          redactions: [],
        });
        currentLineSegments = [];
        currentLineWidth = 0;
      }
    };
    
    segments.forEach((segment) => {
      const words = segment.text.split(/(\s+)/);
      
      words.forEach((word) => {
        if (!word) return;
        
        const wordWidth = ctx.measureText(word).width;
        
        if (currentLineWidth + wordWidth > maxWidth && currentLineSegments.length > 0) {
          flushLine();
        }
        
        currentLineSegments.push({ text: word, color: segment.color });
        currentLineWidth += wordWidth;
      });
    });
    
    flushLine();
  });
  
  return wrapped;
};

type UseCanvasPainterProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imageDataUrl: string | null;
  settings: EditorSettings;
  textBlocks: TextBlock[];
  visibleLines: ChatLine[];
  overlays: OverlayImage[];
  layerOrder?: string[];
  redactionAreas: RedactionArea[];
};

export const useCanvasPainter = ({
  canvasRef,
  imageDataUrl,
  settings,
  textBlocks,
  visibleLines,
  overlays,
  layerOrder,
  redactionAreas,
}: UseCanvasPainterProps) => {
  // ── Cached images ──────────────────────────────────────────────────
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const bgImageUrlRef = useRef<string | null>(null);
  const overlayImageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const loadingOverlaysRef = useRef<Set<string>>(new Set());
  const [renderTick, setRenderTick] = useState(0);
  const rafRef = useRef<number>(0);

  // ── Load background image (only when URL changes) ──────────────────
  useEffect(() => {
    if (!imageDataUrl) {
      bgImageRef.current = null;
      bgImageUrlRef.current = null;
      return;
    }

    // Skip if already loaded for this URL
    if (bgImageUrlRef.current === imageDataUrl && bgImageRef.current?.complete) {
      return;
    }

    bgImageUrlRef.current = imageDataUrl;
    bgImageRef.current = null; // Mark as loading

    const img = new window.Image();

    img.onload = () => {
      // Only accept if this is still the current URL (guard against race)
      if (bgImageUrlRef.current === imageDataUrl) {
        bgImageRef.current = img;
        setRenderTick(t => t + 1); // Trigger re-paint
      }
    };

    img.onerror = () => {
      console.error('Failed to load background image');
      bgImageRef.current = null;
    };

    // Set src AFTER attaching onload to avoid missing synchronous loads
    img.src = imageDataUrl;

    // For data-URLs the browser may decode synchronously.
    // If so, onload already fired and bgImageRef is set.
    // If not, onload will fire later and bump renderTick.
    if (img.complete && img.naturalWidth > 0) {
      bgImageRef.current = img;
    }
  }, [imageDataUrl]);

  // ── Load overlay images into cache ─────────────────────────────────
  const loadOverlayImage = useCallback((overlay: OverlayImage): HTMLImageElement | null => {
    const cached = overlayImageCacheRef.current.get(overlay.id);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      return cached;
    }

    if (loadingOverlaysRef.current.has(overlay.id)) {
      return null;
    }

    loadingOverlaysRef.current.add(overlay.id);
    const img = new window.Image();

    img.onload = () => {
      overlayImageCacheRef.current.set(overlay.id, img);
      loadingOverlaysRef.current.delete(overlay.id);
      setRenderTick(v => v + 1);
    };

    img.onerror = () => {
      loadingOverlaysRef.current.delete(overlay.id);
      console.error(`Failed to load overlay image: ${overlay.id}`);
    };

    img.src = overlay.dataUrl;

    // Handle synchronous decode for data-URLs
    if (img.complete && img.naturalWidth > 0) {
      overlayImageCacheRef.current.set(overlay.id, img);
      loadingOverlaysRef.current.delete(overlay.id);
    }

    return overlayImageCacheRef.current.get(overlay.id) ?? null;
  }, []);

  // ── Synchronous draw (only paints if bg image is ready) ────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgImage = bgImageRef.current;

    const width = settings.width || 1920;
    const height = settings.height || 1080;

    // Resize canvas (resets context state)
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    // ── Draw background ────────────────────────────────────────────
    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
      const canvasRatio = width / height;
      const imageRatio = bgImage.naturalWidth / bgImage.naturalHeight;

      let drawWidth: number;
      let drawHeight: number;
      let offsetX = 0;
      let offsetY = 0;

      const filters = { ...defaultFilterSettings, ...(settings.filters || {}) };
      const { brightness, contrast, saturate, sepia, vignette } = filters;

      ctx.save();
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) sepia(${sepia}%)`;

      if (settings.fitMode === 'crop') {
        drawWidth = bgImage.naturalWidth * (settings.imageScale || 1);
        drawHeight = bgImage.naturalHeight * (settings.imageScale || 1);
        offsetX = (width - drawWidth) / 2 + (settings.imageOffsetX || 0);
        offsetY = (height - drawHeight) / 2 + (settings.imageOffsetY || 0);

        if (settings.imageRotation !== 0) {
          ctx.translate(offsetX + drawWidth / 2, offsetY + drawHeight / 2);
          ctx.rotate(((settings.imageRotation || 0) * Math.PI) / 180);
          ctx.drawImage(bgImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        } else {
          ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);
        }
      } else if (settings.fitMode === 'contain') {
        if (imageRatio > canvasRatio) {
          drawWidth = width;
          drawHeight = width / imageRatio;
          offsetY = (height - drawHeight) / 2;
        } else {
          drawHeight = height;
          drawWidth = height * imageRatio;
          offsetX = (width - drawWidth) / 2;
        }
        ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);
      } else if (settings.fitMode === 'cover') {
        if (imageRatio > canvasRatio) {
          drawHeight = height;
          drawWidth = height * imageRatio;
          offsetX = (width - drawWidth) / 2;
        } else {
          drawWidth = width;
          drawHeight = width / imageRatio;
          offsetY = (height - drawHeight) / 2;
        }
        ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);
      } else {
        // Stretch
        ctx.drawImage(bgImage, 0, 0, width, height);
      }
      ctx.restore();

      // Vignette
      if (vignette > 0) {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.sqrt(centerX ** 2 + centerY ** 2);
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, `rgba(0,0,0,${vignette})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
    }

    // ── Redaction areas (before overlays/text) ─────────────────────
    if (redactionAreas && redactionAreas.length > 0) {
      redactionAreas.forEach(area => {
        pixelateRect(ctx, area.x, area.y, area.width, area.height, area.intensity || 8);
      });
    }

    // ── Group lines by block ───────────────────────────────────────
    const linesByBlock = visibleLines.reduce<Record<string, ChatLine[]>>((acc, line) => {
      const key = line.blockId ?? 'default';
      if (!acc[key]) acc[key] = [];
      acc[key].push(line);
      return acc;
    }, {});

    // ── Render overlay with crop support ───────────────────────────
    const renderOverlay = (overlay: OverlayImage) => {
      if (overlay.visible === false) return;

      const img = loadOverlayImage(overlay);
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const sourceX = overlay.crop?.x ?? 0;
      const sourceY = overlay.crop?.y ?? 0;
      const sourceW = overlay.crop?.width ?? img.naturalWidth;
      const sourceH = overlay.crop?.height ?? img.naturalHeight;

      // Use crop dimensions for display size so the overlay shrinks to the cropped region
      const drawW = (overlay.crop ? overlay.crop.width : overlay.width) * overlay.scale;
      const drawH = (overlay.crop ? overlay.crop.height : overlay.height) * overlay.scale;

      const rotation = (overlay.rotation * Math.PI) / 180;
      ctx.save();
      ctx.globalAlpha = overlay.opacity;
      ctx.translate(overlay.x, overlay.y);
      ctx.rotate(rotation);

      ctx.drawImage(
        img,
        sourceX, sourceY, sourceW, sourceH,
        -drawW / 2, -drawH / 2, drawW, drawH
      );
      ctx.restore();
    };

    // ── Render text block ──────────────────────────────────────────
    const renderTextBlock = (block: TextBlock) => {
      if (block.visible === false) return;

      const blockSettings = { ...defaultTextSettings, ...(block.settings ?? {}) };
      const blockLines = linesByBlock[block.id] ?? parseChatLines(block.text, DEFAULT_COLOR, block.id);
      if (blockLines.length === 0) return;

      ctx.save();
      ctx.font = `${blockSettings.fontWeight} ${blockSettings.fontSize}px ${blockSettings.fontFamily}`;
      ctx.textBaseline = 'top';

      if (blockSettings.shadowEnabled) {
        ctx.shadowColor = blockSettings.shadowColor;
        ctx.shadowBlur = blockSettings.shadowBlur;
        ctx.shadowOffsetX = blockSettings.shadowOffsetX;
        ctx.shadowOffsetY = blockSettings.shadowOffsetY;
      }
      ctx.lineWidth = blockSettings.strokeWidth;
      ctx.strokeStyle = blockSettings.strokeColor;

      const startX = blockSettings.paddingX;
      let startY = blockSettings.textPosition === 'bottom-left'
        ? height - blockSettings.paddingY
        : blockSettings.paddingY;
      startY += blockSettings.textOffsetY;
      const baseX = startX + blockSettings.textOffsetX;
      const maxWidth = Math.max(0, Math.min(blockSettings.textBoxWidth, width - baseX));
      const effectiveLineHeight = blockSettings.backdropMode === 'text'
        ? blockSettings.lineHeight + 2
        : blockSettings.lineHeight;
      const fontMetrics = ctx.measureText('Mg');
      const fontHeight = fontMetrics.actualBoundingBoxAscent + fontMetrics.actualBoundingBoxDescent || blockSettings.fontSize;
      const renderLines = wrapChatLines(ctx, blockLines, maxWidth);

      if (renderLines.length === 0) {
        ctx.restore();
        return;
      }

      const rotationRadians = (blockSettings.textRotation * Math.PI) / 180;
      const localBaseX = rotationRadians !== 0 ? 0 : baseX;
      let localStartY = rotationRadians !== 0 ? 0 : startY;

      if (rotationRadians !== 0) {
        ctx.translate(baseX, startY);
        ctx.rotate(rotationRadians);
      }

      const totalHeight = renderLines.length > 1 ? (renderLines.length - 1) * effectiveLineHeight : 0;
      if (blockSettings.textPosition === 'bottom-left') {
        const bottomStartY = height - blockSettings.paddingY - totalHeight - fontHeight;
        if (rotationRadians !== 0) {
          ctx.translate(0, bottomStartY - startY);
        } else {
          localStartY = bottomStartY;
        }
      }

      if (blockSettings.backdropEnabled && blockSettings.backdropMode === 'all') {
        const maxLineWidth = renderLines.reduce(
          (max, line) => Math.max(max, Math.min(ctx.measureText(line.text).width, maxWidth)),
          0
        );
        const blockHeight = (renderLines.length - 1) * effectiveLineHeight + fontHeight;
        ctx.fillStyle = colorWithAlpha(blockSettings.backdropColor, blockSettings.backdropOpacity);
        ctx.fillRect(
          localBaseX - blockSettings.backdropPadding,
          localStartY - blockSettings.backdropPadding,
          maxLineWidth + blockSettings.backdropPadding * 2,
          blockHeight + blockSettings.backdropPadding * 2
        );
      }

      renderLines.forEach((line, index) => {
        const lineTopY = localStartY + index * effectiveLineHeight;
        const lineX = localBaseX;

        // Calculate total line width for backdrop
        const textWidth = ctx.measureText(line.text).width;

        if (blockSettings.backdropEnabled && blockSettings.backdropMode === 'text') {
          ctx.fillStyle = colorWithAlpha(blockSettings.backdropColor, blockSettings.backdropOpacity);
          ctx.fillRect(
            lineX - blockSettings.backdropPadding,
            lineTopY - blockSettings.backdropPadding,
            textWidth + blockSettings.backdropPadding * 2,
            fontHeight + blockSettings.backdropPadding * 2
          );
        }

        // Draw stroke for entire line first (if enabled)
        if (blockSettings.strokeWidth > 0) {
          ctx.strokeText(line.text, lineX, lineTopY);
        }

        // Draw each segment with its own color
        let segmentX = lineX;
        line.segments.forEach((segment) => {
          ctx.fillStyle = segment.color;
          ctx.fillText(segment.text, segmentX, lineTopY);
          segmentX += ctx.measureText(segment.text).width;
        });

        if (line.redactions && line.redactions.length > 0) {
          line.redactions.forEach(redaction => {
            pixelateRect(
              ctx,
              lineX + redaction.startX,
              lineTopY,
              redaction.width,
              fontHeight,
              4
            );
          });
        }
      });

      ctx.restore();
    };

    // ── Render layers in order ─────────────────────────────────────
    const orderedLayers = layerOrder && layerOrder.length > 0
      ? layerOrder
      : [...overlays.map(o => o.id), ...textBlocks.map(b => b.id)];

    const overlayMap = new Map(overlays.map(o => [o.id, o]));
    const textBlockMap = new Map(textBlocks.map(b => [b.id, b]));

    orderedLayers.forEach(layerId => {
      const overlay = overlayMap.get(layerId);
      if (overlay) {
        renderOverlay(overlay);
        return;
      }

      const textBlock = textBlockMap.get(layerId);
      if (textBlock) {
        renderTextBlock(textBlock);
        return;
      }
    });

    // ── Final redaction pass (after overlays/text) ─────────────────
    if (redactionAreas && redactionAreas.length > 0) {
      redactionAreas.forEach(area => {
        pixelateRect(ctx, area.x, area.y, area.width, area.height, area.intensity || 8);
      });
    }
  }, [
    canvasRef,
    settings,
    textBlocks,
    visibleLines,
    overlays,
    layerOrder,
    redactionAreas,
    loadOverlayImage,
  ]);

  // ── Schedule paint via rAF whenever draw or renderTick changes ───
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      draw();
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw, renderTick]);

  // ── Invalidate cache helper ──────────────────────────────────────
  const invalidateCache = useCallback((id?: string) => {
    if (id) {
      overlayImageCacheRef.current.delete(id);
      loadingOverlaysRef.current.delete(id);
    } else {
      overlayImageCacheRef.current.clear();
      loadingOverlaysRef.current.clear();
    }
    setRenderTick(v => v + 1);
  }, []);

  return { invalidateCache };
};
