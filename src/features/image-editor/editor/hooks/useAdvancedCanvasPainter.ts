import { useEffect, useRef, type RefObject } from 'react';
import type { AdvancedLayer, DrawItem, DrawLayerData, ImageLayerData, LiveShape, LiveStroke, TextLayerData } from '../../types';

const imageCache = new Map<string, HTMLImageElement>();

function loadImageCached(dataUrl: string): Promise<HTMLImageElement> {
  if (imageCache.has(dataUrl)) return Promise.resolve(imageCache.get(dataUrl)!);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { imageCache.set(dataUrl, img); resolve(img); };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function drawCheckerboard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const size = 16;
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      ctx.fillStyle = ((x / size + y / size) % 2 === 0) ? '#1a1a1a' : '#141414';
      ctx.fillRect(x, y, size, size);
    }
  }
}

function drawStroke(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], color: string, size: number, opacity: number) {
  if (pts.length === 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  if (pts.length === 1) {
    ctx.arc(pts[0].x, pts[0].y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawShapeData(ctx: CanvasRenderingContext2D, item: Extract<DrawItem, { kind: 'shape' }>) {
  const { shapeType, x, y, width, height, fill, fillEnabled, stroke, strokeWidth, strokeEnabled, rotation } = item;
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  const hw = width / 2, hh = height / 2;

  const doFill = () => { if (fillEnabled) { ctx.fillStyle = fill; ctx.fill(); } };
  const doStroke = () => { if (strokeEnabled) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeWidth; ctx.stroke(); } };

  switch (shapeType) {
    case 'rect':
      ctx.beginPath(); ctx.rect(-hw, -hh, width, height); doFill(); doStroke(); break;
    case 'ellipse':
      ctx.beginPath(); ctx.ellipse(0, 0, Math.max(1, Math.abs(hw)), Math.max(1, Math.abs(hh)), 0, 0, Math.PI * 2); doFill(); doStroke(); break;
    case 'line':
      ctx.beginPath(); ctx.moveTo(-hw, -hh); ctx.lineTo(hw, hh);
      if (strokeEnabled) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeWidth; ctx.stroke(); } break;
    case 'arrow': {
      const hl = Math.max(12, strokeWidth * 5);
      const angle = Math.atan2(hh - (-hh), hw - (-hw));
      ctx.beginPath();
      ctx.moveTo(-hw, -hh); ctx.lineTo(hw, hh);
      ctx.lineTo(hw - hl * Math.cos(angle - Math.PI / 6), hh - hl * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(hw, hh);
      ctx.lineTo(hw - hl * Math.cos(angle + Math.PI / 6), hh - hl * Math.sin(angle + Math.PI / 6));
      if (strokeEnabled) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeWidth; ctx.lineCap = 'round'; ctx.stroke(); } break;
    }
    case 'triangle':
      ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(hw, hh); ctx.lineTo(-hw, hh); ctx.closePath(); doFill(); doStroke(); break;
  }
  ctx.restore();
}

function drawDrawItem(ctx: CanvasRenderingContext2D, item: DrawItem) {
  if (item.kind === 'stroke') {
    drawStroke(ctx, item.points, item.color, item.size, item.opacity);
  } else {
    drawShapeData(ctx, item);
  }
}

async function renderLayer(ctx: CanvasRenderingContext2D, layer: AdvancedLayer) {
  if (!layer.visible) return;
  ctx.save();
  ctx.globalAlpha = layer.opacity;
  ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;

  switch (layer.type) {
    case 'draw': {
      const d = layer.data as DrawLayerData;
      for (const item of d.items) drawDrawItem(ctx, item);
      break;
    }
    case 'image': {
      const d = layer.data as ImageLayerData;
      try {
        const img = await loadImageCached(d.dataUrl);
        ctx.save();
        ctx.translate(d.x + (d.width * d.scale) / 2, d.y + (d.height * d.scale) / 2);
        ctx.rotate((d.rotation * Math.PI) / 180);
        ctx.drawImage(img, -(d.width * d.scale) / 2, -(d.height * d.scale) / 2, d.width * d.scale, d.height * d.scale);
        ctx.restore();
      } catch { /* skip broken images */ }
      break;
    }
    case 'text': {
      const d = layer.data as TextLayerData;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate((d.rotation * Math.PI) / 180);
      ctx.font = `${d.fontWeight} ${d.fontSize}px ${d.fontFamily}`;
      ctx.fillStyle = d.color;
      ctx.fillText(d.text, 0, 0);
      ctx.restore();
      break;
    }
  }
  ctx.restore();
}

export function useAdvancedCanvasPainter({
  canvasRef,
  layers,
  canvasWidth,
  canvasHeight,
  liveStroke,
  liveShape,
}: {
  canvasRef: RefObject<HTMLCanvasElement>;
  layers: AdvancedLayer[];
  canvasWidth: number;
  canvasHeight: number;
  liveStroke: LiveStroke | null;
  liveShape: LiveShape | null;
}) {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const paint = async () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      drawCheckerboard(ctx, canvasWidth, canvasHeight);

      for (const layer of layers) {
        await renderLayer(ctx, layer);
      }

      // Live stroke preview
      if (liveStroke && liveStroke.points.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        drawStroke(ctx, liveStroke.points, liveStroke.color, liveStroke.size, liveStroke.opacity);
        ctx.restore();
      }

      // Live shape preview
      if (liveShape && (Math.abs(liveShape.width) > 1 || Math.abs(liveShape.height) > 1)) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        drawShapeData(ctx, { kind: 'shape', ...liveShape });
        ctx.restore();
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => { paint(); });

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, canvasWidth, canvasHeight, liveStroke, liveShape]);
}
