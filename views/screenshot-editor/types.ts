export type ChatLine = {
  id: string;
  text: string;
  color: string;
  enabled: boolean;
  blockId?: string;
};

export type CacheItem = {
  id: string;
  name: string;
  createdAt: number;
  imageDataUrl: string;
  chatInput?: string;
  textBlocks?: TextBlock[];
  overlays?: OverlayImage[];
  lines: ChatLine[];
  settings: EditorSettings;
};

export type FitMode = 'contain' | 'cover' | 'stretch' | 'crop';
export type TextPosition = 'bottom-left' | 'top-left';
export type PreviewMode = 'canvas' | 'text';
export type BackdropMode = 'text' | 'all';

export type TextBlockSettings = {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  strokeWidth: number;
  strokeColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowColor: string;
  paddingX: number;
  paddingY: number;
  textPosition: TextPosition;
  textOffsetX: number;
  textOffsetY: number;
  textBoxWidth: number;
  textRotation: number;
  backdropEnabled: boolean;
  backdropMode: BackdropMode;
  backdropPadding: number;
  backdropColor: string;
  backdropOpacity: number;
};

export type TextBlock = {
  id: string;
  text: string;
  settings: TextBlockSettings;
  collapsed: boolean;
  settingsOpen: boolean;
  advancedOpen: boolean;
};

export type OverlayImage = {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
};

export type EditorSettings = {
  width: number;
  height: number;
  fitMode: FitMode;
  imageScale: number;
  imageOffsetX: number;
  imageOffsetY: number;
};
