import { useEffect, useRef, useCallback } from 'react';
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

const pixelateRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, size: number = 8) => {
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
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, sw, sh, x, y, w, h);
    ctx.restore();
  } catch (e) {
    console.warn('Pixelation failed', e);
  }
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): { text: string; redactions: RedactionRegion[] }[] => {
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

const wrapChatLines = (ctx: CanvasRenderingContext2D, chatLines: ChatLine[], maxWidth: number): RenderLine[] => {
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
  const overlayImageCacheRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const drawCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas || !imageDataUrl) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const image = new window.Image();
      image.onload = () => {
        canvas.width = settings.width || 1920;
        canvas.height = settings.height || 1080;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const canvasRatio = canvas.width / canvas.height;
        const imageRatio = image.width / image.height;

        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;

        // Defensive: use defaultFilterSettings if filters are missing
        const filters = { ...defaultFilterSettings, ...(settings.filters || {}) };
        const { brightness, contrast, saturate, sepia, vignette } = filters;

        if (settings.fitMode === 'crop') {
          drawWidth = image.width * (settings.imageScale || 1);
          drawHeight = image.height * (settings.imageScale || 1);
          offsetX = (canvas.width - drawWidth) / 2 + (settings.imageOffsetX || 0);
          offsetY = (canvas.height - drawHeight) / 2 + (settings.imageOffsetY || 0);

          ctx.save();
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) sepia(${sepia}%)`;

          if (settings.imageRotation !== 0) {
            ctx.translate(offsetX + drawWidth / 2, offsetY + drawHeight / 2);
            ctx.rotate(((settings.imageRotation || 0) * Math.PI) / 180);
            ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
          } else {
            ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
          }
          ctx.restore();
          ctx.filter = 'none';
        } else if (settings.fitMode === 'contain') {
          if (imageRatio > canvasRatio) {
            drawWidth = canvas.width;
            drawHeight = canvas.width / imageRatio;
            offsetY = (canvas.height - drawHeight) / 2;
          } else {
            drawHeight = canvas.height;
            drawWidth = canvas.height * imageRatio;
            offsetX = (canvas.width - drawWidth) / 2;
          }
          ctx.save();
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) sepia(${sepia}%)`;
          ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
          ctx.restore();
          ctx.filter = 'none';
        } else if (settings.fitMode === 'cover') {
          if (imageRatio > canvasRatio) {
            drawHeight = canvas.height;
            drawWidth = canvas.height * imageRatio;
            offsetX = (canvas.width - drawWidth) / 2;
          } else {
            drawWidth = canvas.width;
            drawHeight = canvas.width / imageRatio;
            offsetY = (canvas.height - drawHeight) / 2;
          }
          ctx.save();
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) sepia(${sepia}%)`;
          ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
          ctx.restore();
          ctx.filter = 'none';
        } else {
          // Stretch
          ctx.save();
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) sepia(${sepia}%)`;
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          ctx.restore();
          ctx.filter = 'none';
        }

        // Apply Vignette
        if (vignette > 0) {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radius = Math.sqrt(centerX ** 2 + centerY ** 2);
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
          gradient.addColorStop(0, 'transparent');
          gradient.addColorStop(1, `rgba(0,0,0,${vignette})`);

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Render redaction areas (before text/overlays)
        if (redactionAreas && redactionAreas.length > 0) {
          redactionAreas.forEach(area => {
            pixelateRect(ctx, area.x, area.y, area.width, area.height, area.intensity || 8);
          });
        }

        const linesByBlock = visibleLines.reduce<Record<string, ChatLine[]>>((acc, line) => {
          const key = line.blockId ?? 'default';
          if (!acc[key]) acc[key] = [];
          acc[key].push(line);
          return acc;
        }, {});

        const renderOverlay = (overlay: OverlayImage) => {
          if (overlay.visible === false) return;

          let overlayImage = overlayImageCacheRef.current[overlay.id];
          if (!overlayImage) {
            overlayImage = new window.Image();
            overlayImageCacheRef.current[overlay.id] = overlayImage;
            // Set onload BEFORE src so it fires before browser can make image complete
            overlayImage.onload = () => drawCanvas();
            overlayImage.onerror = () => {
              delete overlayImageCacheRef.current[overlay.id];
            };
            overlayImage.src = overlay.dataUrl;
            // Some browsers (or data-URL handling) may set complete=true synchronously
            // before onload fires. Schedule a redraw to handle that case.
            if (overlayImage.complete) {
              queueMicrotask(() => drawCanvas());
            }
          }
          if (!overlayImage.complete) return;

          const sourceX = overlay.crop?.x ?? 0;
          const sourceY = overlay.crop?.y ?? 0;
          const sourceW = overlay.crop?.width ?? overlayImage.width;
          const sourceH = overlay.crop?.height ?? overlayImage.height;

          // Maintain the display size based on the overlay dimensions and scale.
          // The crop only changes which part of the source image is sampled.
          const drawW = overlay.width * overlay.scale;
          const drawH = overlay.height * overlay.scale;

          const rotation = (overlay.rotation * Math.PI) / 180;
          ctx.save();
          ctx.globalAlpha = overlay.opacity;
          ctx.translate(overlay.x, overlay.y);
          ctx.rotate(rotation);

          ctx.drawImage(
            overlayImage,
            sourceX, sourceY, sourceW, sourceH,
            -drawW / 2, -drawH / 2, drawW, drawH
          );
          ctx.restore();
        };

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
          } else {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }
          ctx.lineWidth = blockSettings.strokeWidth;
          ctx.strokeStyle = blockSettings.strokeColor;

          const startX = blockSettings.paddingX;
          let startY = blockSettings.textPosition === 'bottom-left'
            ? canvas.height - blockSettings.paddingY
            : blockSettings.paddingY;
          startY += blockSettings.textOffsetY;
          const baseX = startX + blockSettings.textOffsetX;
          const availableWidth = Math.max(0, canvas.width - baseX);
          const maxWidth = Math.max(0, Math.min(blockSettings.textBoxWidth, availableWidth));
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
          const localStartY = rotationRadians !== 0 ? 0 : startY;
          if (rotationRadians !== 0) {
            ctx.translate(baseX, startY);
            ctx.rotate(rotationRadians);
          }

          const totalHeight = renderLines.length > 1 ? (renderLines.length - 1) * effectiveLineHeight : 0;
          if (blockSettings.textPosition === 'bottom-left') {
            const bottomStartY = canvas.height - blockSettings.paddingY - totalHeight - fontHeight;
            if (rotationRadians !== 0) {
              ctx.translate(0, bottomStartY - startY);
            } else {
              startY = bottomStartY;
            }
          }

          if (blockSettings.backdropEnabled && blockSettings.backdropMode === 'all') {
            const maxLineWidth = renderLines.reduce(
              (max, line) => Math.max(max, Math.min(ctx.measureText(line.text).width, maxWidth)),
              0
            );
            const blockHeight = (renderLines.length - 1) * effectiveLineHeight + fontHeight;
            const backdropHeight = blockHeight + blockSettings.backdropPadding * 2;
            const backdropWidth = Math.max(0, Math.min(maxLineWidth, maxWidth));
            ctx.fillStyle = colorWithAlpha(blockSettings.backdropColor, blockSettings.backdropOpacity);
            ctx.fillRect(
              localBaseX - blockSettings.backdropPadding,
              localStartY - blockSettings.backdropPadding,
              backdropWidth + blockSettings.backdropPadding * 2,
              backdropHeight
            );
          }

          renderLines.forEach((line, index) => {
            const lineTopY = localStartY + index * effectiveLineHeight;
            const lineMetrics = ctx.measureText(line.text);
            const textWidth = Math.min(lineMetrics.width, maxWidth);

            let lineX = localBaseX;
            if (blockSettings.align === 'center') {
              lineX = localBaseX + (maxWidth - textWidth) / 2;
            } else if (blockSettings.align === 'right') {
              lineX = localBaseX + (maxWidth - textWidth);
            }

            if (blockSettings.backdropEnabled && blockSettings.backdropMode === 'text') {
              const backdropWidth = Math.max(0, textWidth);
              const backdropHeight = fontHeight + blockSettings.backdropPadding * 2;
              const backdropY = lineTopY - blockSettings.backdropPadding;
              ctx.fillStyle = colorWithAlpha(blockSettings.backdropColor, blockSettings.backdropOpacity);
              ctx.fillRect(
                lineX - blockSettings.backdropPadding,
                backdropY,
                backdropWidth + blockSettings.backdropPadding * 2,
                backdropHeight
              );
            }
            ctx.fillStyle = line.color;
            if (blockSettings.strokeWidth > 0) {
              ctx.strokeText(line.text, lineX, lineTopY);
            }
            ctx.fillText(line.text, lineX, lineTopY);

            if (line.redactions && line.redactions.length > 0) {
              line.redactions.forEach(reg => {
                const pixelSize = Math.max(3, Math.floor(fontHeight / 3));
                pixelateRect(ctx, lineX + reg.startX, lineTopY, reg.width, fontHeight, pixelSize);
              });
            }
          });
          ctx.restore();
        };

        // Render based on layerOrder
        if (layerOrder && layerOrder.length > 0) {
          layerOrder.forEach(id => {
            const overlay = overlays.find(o => o.id === id);
            if (overlay) {
              renderOverlay(overlay);
              return;
            }
            const block = textBlocks.find(b => b.id === id);
            if (block) {
              renderTextBlock(block);
              return;
            }
          });
        } else {
          overlays.forEach(renderOverlay);
          textBlocks.forEach(renderTextBlock);
        }

        // Render manual redaction masks (after everything)
        if (redactionAreas && redactionAreas.length > 0) {
          redactionAreas.forEach(area => {
            pixelateRect(ctx, area.x, area.y, area.width, area.height, area.intensity || 10);
          });
        }
      };

      image.src = imageDataUrl;
    };

    drawCanvas();
  }, [imageDataUrl, settings, textBlocks, visibleLines, overlays, layerOrder, redactionAreas]);

  const invalidateCache = useCallback((id: string) => {
    delete overlayImageCacheRef.current[id];
  }, []);

  return {
    invalidateCache
  };
};