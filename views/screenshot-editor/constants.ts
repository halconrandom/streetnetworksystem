import type { EditorSettings, FilterSettings, TextBlockSettings } from './types';

export const CACHE_KEY = 'screenshot_editor_cache_v1';
export const DEFAULT_COLOR = '#ffffff';
export const TIMESTAMP_REGEX = /^\s*\[?\d{1,2}:\d{2}:\d{2}\]?\s*/;
export const CHATLOG_REGEX = /\[Chatlog\]\s*/i;

export const defaultFilterSettings: FilterSettings = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  vignette: 0,
  sepia: 0,
};

export const defaultSettings: EditorSettings = {
  width: 1920,
  height: 1080,
  fitMode: 'contain',
  imageScale: 1,
  imageRotation: 0,
  imageOffsetX: 0,
  imageOffsetY: 0,
  filters: defaultFilterSettings,
};

export const defaultTextSettings: TextBlockSettings = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontWeight: 700,
  fontSize: 18,
  lineHeight: 25,
  strokeWidth: 2,
  strokeColor: '#000000',
  shadowBlur: 4,
  shadowOffsetX: 1,
  shadowOffsetY: 1,
  shadowColor: '#000000',
  shadowEnabled: true,
  paddingX: 24,
  paddingY: 24,
  textPosition: 'top-left',
  textOffsetX: 0,
  textOffsetY: 0,
  textBoxWidth: 980,
  textRotation: 0,
  align: 'left',
  backdropEnabled: false,
  backdropMode: 'text',
  backdropPadding: 6,
  backdropColor: '#000000',
  backdropOpacity: 0.25,
};
