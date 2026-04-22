export type BlendMode =
  | 'source-over' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten' | 'color-dodge' | 'color-burn'
  | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';

export type LayerType = 'draw' | 'image' | 'text';
export type ShapeType = 'rect' | 'ellipse' | 'line' | 'arrow' | 'triangle';
export type ToolType = 'select' | 'brush' | 'shape' | 'marquee' | 'text';

// A draw layer holds strokes AND shapes — you draw on it freely
export type DrawItem =
  | {
      kind: 'stroke';
      points: { x: number; y: number }[];
      color: string;
      size: number;
      opacity: number;
    }
  | {
      kind: 'shape';
      shapeType: ShapeType;
      x: number; y: number;
      width: number; height: number;
      fill: string; fillEnabled: boolean;
      stroke: string; strokeWidth: number; strokeEnabled: boolean;
      rotation: number;
    };

export type DrawLayerData = { items: DrawItem[] };

export type ImageLayerData = {
  dataUrl: string;
  x: number; y: number;
  width: number; height: number;
  scale: number; rotation: number;
};

export type TextLayerData = {
  text: string;
  x: number; y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  rotation: number;
};

export type LayerData = DrawLayerData | ImageLayerData | TextLayerData;

export type AdvancedLayer = {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  data: LayerData;
};

export type RectSelection = {
  type: 'rect';
  x: number; y: number;
  width: number; height: number;
};

export type Selection = RectSelection | null;

// Live preview state (not committed to history)
export type LiveStroke = {
  points: { x: number; y: number }[];
  color: string;
  size: number;
  opacity: number;
};

export type LiveShape = {
  shapeType: ShapeType;
  x: number; y: number;
  width: number; height: number;
  fill: string; fillEnabled: boolean;
  stroke: string; strokeWidth: number; strokeEnabled: boolean;
  rotation: number;
};

export type ToolOptions = {
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  shapeSubType: ShapeType;
  shapeFill: string;
  shapeFillEnabled: boolean;
  shapeStroke: string;
  shapeStrokeWidth: number;
  shapeStrokeEnabled: boolean;
  textFontFamily: string;
  textFontSize: number;
  textFontWeight: string;
  textColor: string;
};

export type EditorSnapshot = {
  layers: AdvancedLayer[];
  canvasWidth: number;
  canvasHeight: number;
};

export const defaultToolOptions: ToolOptions = {
  brushColor: '#ff3b3b',
  brushSize: 20,
  brushOpacity: 1,
  shapeSubType: 'rect',
  shapeFill: '#ff3b3b',
  shapeFillEnabled: true,
  shapeStroke: '#ffffff',
  shapeStrokeWidth: 2,
  shapeStrokeEnabled: false,
  textFontFamily: 'Arial, sans-serif',
  textFontSize: 32,
  textFontWeight: '700',
  textColor: '#ffffff',
};
