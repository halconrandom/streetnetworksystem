import { CHATLOG_REGEX, DEFAULT_COLOR, TIMESTAMP_REGEX } from './constants';
import type { CacheItem, ChatLine, TextBlock } from './types';

export const parseChatLines = (input: string, defaultColor: string, idPrefix = `${Date.now()}`) => {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  return lines.map((line, index) => {
    const match = line.match(/^\(#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})\)\s*(.*)$/);
    const color = match ? `#${match[1]}` : defaultColor;
    const text = match ? match[2] : line;
    return {
      id: `${idPrefix}-${index}`,
      text,
      color,
      enabled: true,
    };
  });
};

export const sanitizeChatInput = (input: string) =>
  input
    .split(/\r?\n/)
    .map((line) => line.replace(CHATLOG_REGEX, '').replace(TIMESTAMP_REGEX, '').trimEnd())
    .filter((line) => line.length > 0)
    .join('\n');

export const sanitizeTextBlocks = (blocks: TextBlock[]) =>
  blocks.map((block) => ({
    ...block,
    text: sanitizeChatInput(block.text),
  }));

export const getCombinedText = (blocks: TextBlock[]) =>
  blocks
    .map((block) => block.text.trimEnd())
    .filter((text) => text.length > 0)
    .join('\n');

export const buildLinesFromBlocks = (blocks: TextBlock[]) =>
  blocks.flatMap((block) =>
    parseChatLines(block.text, DEFAULT_COLOR, block.id).map((line) => ({
      ...line,
      blockId: block.id,
    }))
  );

export const toHexByte = (value: number) => {
  const hex = Math.round(value).toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
};

export const colorWithAlpha = (color: string, alpha: number) => {
  const normalized = color.startsWith('#') ? color.slice(1) : color;
  const base = normalized.length === 3
    ? normalized.split('').map((c) => `${c}${c}`).join('')
    : normalized.slice(0, 6);
  return `#${base}${toHexByte(alpha * 255)}`;
};

export const getReadableTextColor = (color: string) => {
  const normalized = color.startsWith('#') ? color.slice(1) : color;
  const base = normalized.length === 3
    ? normalized.split('').map((c) => `${c}${c}`).join('')
    : normalized.slice(0, 6);
  const r = parseInt(base.slice(0, 2), 16);
  const g = parseInt(base.slice(2, 4), 16);
  const b = parseInt(base.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.7 ? '#000000' : '#ffffff';
};

export const normalizeHexInput = (value: string) => {
  let next = value.trim();
  if (next.length === 0) return '#';
  if (!next.startsWith('#')) {
    next = `#${next}`;
  }
  next = `#${next.slice(1).replace(/[^0-9a-fA-F]/g, '').slice(0, 8)}`;
  return next;
};

export const readCache = (cacheKey: string): CacheItem[] => {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CacheItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeCache = (cacheKey: string, items: CacheItem[]) => {
  localStorage.setItem(cacheKey, JSON.stringify(items.slice(0, 5)));
};
