import { useEffect, useRef, type RefObject } from 'react';
import type { AdvancedLayer, BrushStroke, ImageLayerData, BrushLayerData, ShapeLayerData, TextLayerData } from '../../types';

const imageCache = new Map<string, HTMLImageElement>();

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
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

function drawBrushStroke(ctx: CanvasRenderingContext2D, stroke: BrushStroke) {
  if (stroke.points.length === 0) return;
  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = stroke.opacity;
  ctx.beginPath();
  if (stroke.points.length === 1) {
    ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = stroke.color;
    ctx.fill();
  } else {
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const mx = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
      const my = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, mx, my);
    }
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawShape(ctx: CanvasRenderingContext2D, data: ShapeLayerData) {
  const { shapeType, x, y, width, height, fill, fillEnabled, stroke, strokeWidth, strokeEnabled, rotation } = data;
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((rotation * Math.PI) / 180);

  const hw = width / 2;
  const hh = height / 2;

  const applyFill = () => { if (fillEnabled) { ctx.fillStyle = fill; ctx.fill(); } };
  const applyStroke = () => { if (strokeEnabled) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeWidth; ctx.stroke(); } };

  switch (shapeType) {
    case 'rect': {
      ctx.beginPath();
      ctx.rect(-hw, -hh, width, height);
      applyFill(); applyStroke();
      break;
    }
    case 'ellipse': {
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(1, Math.abs(hw)), Math.max(1, Math.abs(hh)), 0, 0, Math.PI * 2);
      applyFill(); applyStroke();
      break;
    }
    case 'line': {
      ctx.beginPath();
      ctx.moveTo(-hw, -hh);
      ctx.lineTo(hw, hh);
      if (strokeEnabled) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeWidth; ctx.stroke(); }
      break;
    }
    case 'arrow': {
      const headLen = Math.max(12, strokeWidth * 5);
      const dx = hw - (-hw);
      const dy = hh - (-hh);
      const angle = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.moveTo(-hw, -hh);
      ctx.lineTo(hw, hh);
      ctx.lineTo(hw - headLen * Math.cos(angle - Math.PI / 6), hh - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(hw, hh);
      ctx.lineTo(hw - headLen * Math.cos(angle + Math.PI / 6), hh - headLen * Math.sin(angle + Math.PI / 6));
      if (strokeEnabled) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeWidth; ctx.lineCap = 'round'; ctx.stroke(); }
      break;
    }
    case 'triangle': {
      ctx.beginPath();
      ctx.moveTo(0, -hh);
      ctx.lineTo(hw, hh);
      ctx.lineTo(-hw, hh);
      ctx.closePath();
      applyFill(); applyStroke();
      break;
    }
  }
  ctx.restore();
}

async function drawLayer(ctx: CanvasRenderingContext2D, layer: AdvancedLayer): Promise<void> {
  if (!layer.visible) return;
  ctx.save();
  ctx.globalAlpha = layer.opacity;
  ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;

  switch (layer.type) {
    case 'image': {
      const d = layer.data as ImageLayerData;
      try {
        const img = await loadImage(d.dataUrl);
        ctx.save();
        ctx.translate(d.x + (d.width * d.scale) / 2, d.y + (d.height * d.scale) / 2);
        ctx.rotate((d.rotation * Math.PI) / 180);
        ctx.drawImage(img, -(d.width * d.scale) / 2, -(d.height * d.scale) / 2, d.width * d.scale, d.height * d.scale);
        ctx.restore();
      } catch { /* skip broken images */ }
      break;
    }
    case 'brush': {
      const d = layer.data as BrushLayerData;
      for (const stroke of d.strokes) {
        drawBrushStroke(ctx, stroke);
      }
      break;
    }
    case 'shape': {
      drawShape(ctx, layer.data as ShapeLayerData);
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
  liveBrushStroke,
  liveShape,
}: {
  canvasRef: RefObject<HTMLCanvasElement>;
  layers: AdvancedLayer[];
  canvasWidth: number;
  canvasHeight: number;
  liveBrushStroke: BrushStroke | null;
  liveShape: ShapeLayerData | null;
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
        await drawLayer(ctx, layer);
      }

      // Live brush stroke preview
      if (liveBrushStroke && liveBrushStroke.points.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        drawBrushStroke(ctx, liveBrushStroke);
        ctx.restore();
      }

      // Live shape preview
      if (liveShape && (Math.abs(liveShape.width) > 1 || Math.abs(liveShape.height) > 1)) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        drawShape(ctx, liveShape);
        ctx.restore();
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => { paint(); });

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, canvasWidth, canvasHeight, liveBrushStroke, liveShape]);
}
