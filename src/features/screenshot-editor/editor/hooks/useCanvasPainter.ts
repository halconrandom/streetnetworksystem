import { useEffect, useRef, useCallback, useState } from 'react';
import { defaultTextSettings, DEFAULT_COLOR, defaultFilterSettings } from '../constants';
import type { ChatLine, EditorSettings, OverlayImage, RedactionArea, TextBlock } from '../types';
import { colorWithAlpha, parseChatLines } from '../utils';

type RedactionRegion = {
  startX: number;
  width: number;
};

type RenderLine = {
  text: string;
  color: string;
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

// Text wrapping helper
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): { text: string; redactions: RedactionRegion[] }[] => {
  if (!text) return [{ text: '', redactions: [] }];
  if (maxWidth <= 0) return [{ text, redactions: [] }];

  const MARKER = '//';
  const tokens = text.split(/(\s+|\/\/)/).filter(s => s !== undefined && s !== "");
  const lines: { text: string; redactions: RedactionRegion[] }[] = [];

  let currentText = '';
  let inRedaction = false;
  let redactionStartPos: number | null = null;
  let currentRedactions: RedactionRegion[] = [];

  const pushLine = () => {
    if (inRedaction && redactionStartPos !== null) {
      const endPos = ctx.measureText(currentText).width;
      if (endPos > redactionStartPos) {
        currentRedactions.push({ startX: redactionStartPos, width: endPos - redactionStartPos });
      }
    }
    lines.push({ text: currentText, redactions: [...currentRedactions] });
    currentText = '';
    currentRedactions = [];
    if (inRedaction) {
      redactionStartPos = 0;
    } else {
      redactionStartPos = null;
    }
  };

  tokens.forEach((token) => {
    if (token === MARKER) {
      if (!inRedaction) {
        inRedaction = true;
        redactionStartPos = ctx.measureText(currentText).width;
      } else {
        const endPos = ctx.measureText(currentText).width;
        if (endPos > (redactionStartPos ?? 0)) {
          currentRedactions.push({
            startX: redactionStartPos!,
            width: endPos - redactionStartPos!
          });
        }
        inRedaction = false;
        redactionStartPos = null;
      }
      return;
    }

    if (currentText === "" && /^\s+$/.test(token)) return;

    const testText = currentText + token;
    const testWidth = ctx.measureText(testText).width;

    if (testWidth > maxWidth) {
      if (currentText !== "") {
        pushLine();
        if (/^\s+$/.test(token)) return;
      }

      if (ctx.measureText(token).width > maxWidth) {
        for (let i = 0; i < token.length; i++) {
          const char = token[i];
          if (ctx.measureText(currentText + char).width > maxWidth) {
            pushLine();
          }
          currentText += char;
        }
      } else {
        currentText = token;
      }
    } else {
      currentText = testText;
    }
  });

  if (currentText !== "" || lines.length === 0 || inRedaction) {
    pushLine();
  }

  return lines;
};

const wrapChatLines = (
  ctx: CanvasRenderingContext2D,
  chatLines: ChatLine[],
  maxWidth: number
): RenderLine[] => {
  const wrapped: RenderLine[] = [];
  chatLines.forEach((line) => {
    wrapText(ctx, line.text, maxWidth).forEach((res) => {
      wrapped.push({ text: res.text, color: line.color, redactions: res.redactions });
    });
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
  // Cache for loaded overlay images
  const overlayImageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  // Track which overlays are currently loading
  const loadingOverlaysRef = useRef<Set<string>>(new Set());
  // Version counter to force re-renders
  const [renderVersion, setRenderVersion] = useState(0);

  // Load an overlay image into cache
  const loadOverlayImage = useCallback((overlay: OverlayImage): HTMLImageElement | null => {
    const cached = overlayImageCacheRef.current.get(overlay.id);
    if (cached && cached.complete) {
      return cached;
    }

    // If already loading, don't start again
    if (loadingOverlaysRef.current.has(overlay.id)) {
      return null;
    }

    // Start loading
    loadingOverlaysRef.current.add(overlay.id);
    const img = new window.Image();
    
    img.onload = () => {
      overlayImageCacheRef.current.set(overlay.id, img);
      loadingOverlaysRef.current.delete(overlay.id);
      setRenderVersion(v => v + 1);
    };
    
    img.onerror = () => {
      loadingOverlaysRef.current.delete(overlay.id);
      console.error(`Failed to load overlay image: ${overlay.id}`);
    };
    
    img.src = overlay.dataUrl;
    return null;
  }, []);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageDataUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load background image
    const bgImage = new window.Image();
    
    const drawEverything = () => {
      const width = settings.width || 1920;
      const height = settings.height || 1080;
      
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      const canvasRatio = width / height;
      const imageRatio = bgImage.width / bgImage.height;

      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      const filters = { ...defaultFilterSettings, ...(settings.filters || {}) };
      const { brightness, contrast, saturate, sepia, vignette } = filters;

      // Draw background based on fit mode
      ctx.save();
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) sepia(${sepia}%)`;

      if (settings.fitMode === 'crop') {
        drawWidth = bgImage.width * (settings.imageScale || 1);
        drawHeight = bgImage.height * (settings.imageScale || 1);
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

      // Apply vignette
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

      // Render redaction areas (before overlays/text)
      if (redactionAreas && redactionAreas.length > 0) {
        redactionAreas.forEach(area => {
          pixelateRect(ctx, area.x, area.y, area.width, area.height, area.intensity || 8);
        });
      }

      // Group lines by block
      const linesByBlock = visibleLines.reduce<Record<string, ChatLine[]>>((acc, line) => {
        const key = line.blockId ?? 'default';
        if (!acc[key]) acc[key] = [];
        acc[key].push(line);
        return acc;
      }, {});

      // Render overlay with crop support
      const renderOverlay = (overlay: OverlayImage) => {
        if (overlay.visible === false) return;

        // Get or load the overlay image
        const img = loadOverlayImage(overlay);
        if (!img) return; // Still loading

        // Calculate source coordinates (with crop)
        const sourceX = overlay.crop?.x ?? 0;
        const sourceY = overlay.crop?.y ?? 0;
        const sourceW = overlay.crop?.width ?? img.width;
        const sourceH = overlay.crop?.height ?? img.height;

        // Calculate draw dimensions
        const drawW = overlay.width * overlay.scale;
        const drawH = overlay.height * overlay.scale;

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

      // Render text block
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
          const textWidth = Math.min(ctx.measureText(line.text).width, maxWidth);
