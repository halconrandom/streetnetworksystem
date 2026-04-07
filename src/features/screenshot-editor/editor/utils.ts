import { CHATLOG_REGEX, DEFAULT_COLOR, TIMESTAMP_REGEX } from './constants';
import type { CacheItem, TextBlock, TextSegment } from './types';

/**
 * Parses inline color markers from text.
 * Supports:
 * - (#hex) or {#hex} to start a color
 * - // to reset to default color (action separator)
 *
 * Example: "Hello (#ff0000)world // bye" => [
 *   { text: "Hello ", color: "#ffffff" },
 *   { text: "world ", color: "#ff0000" },
 *   { text: "bye", color: "#ffffff" }
 * ]
 */
export const parseInlineColors = (text: string, defaultColor: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  let currentColor = defaultColor;
  let remaining = text;

  // Regex to match color markers: (#hex) or {#hex}
  const colorMarkerRegex = /[({]#([0-9a-fA-F]{6})[)}]/g;
  // Regex to match action separator: //
  const actionSeparatorRegex = /\/\//g;

  while (remaining.length > 0) {
    // Find next color marker
    colorMarkerRegex.lastIndex = 0;
    const colorMatch = colorMarkerRegex.exec(remaining);

    // Find next action separator
    actionSeparatorRegex.lastIndex = 0;
    const separatorMatch = actionSeparatorRegex.exec(remaining);

    // Determine which comes first
    const colorIndex = colorMatch ? colorMatch.index : Infinity;
    const separatorIndex = separatorMatch ? separatorMatch.index : Infinity;

    if (colorIndex === Infinity && separatorIndex === Infinity) {
      // No more markers, add remaining text with current color
      if (remaining.length > 0) {
        segments.push({ text: remaining, color: currentColor });
      }
      break;
    }

    if (separatorIndex < colorIndex) {
      // Action separator comes first
      const beforeSeparator = remaining.slice(0, separatorIndex);
      if (beforeSeparator.length > 0) {
        segments.push({ text: beforeSeparator, color: currentColor });
      }
      // Reset to default color
      currentColor = defaultColor;
      // Skip the separator "//"
      remaining = remaining.slice(separatorIndex + 2);
    } else {
      // Color marker comes first
      const beforeColor = remaining.slice(0, colorIndex);
      if (beforeColor.length > 0) {
        segments.push({ text: beforeColor, color: currentColor });
      }
      // Extract the new color
      const newColor = `#${colorMatch![1]}`;
      currentColor = newColor;
      // Skip the color marker
      remaining = remaining.slice(colorIndex + colorMatch![0].length);
    }
  }

  // If no segments were created, return the whole text with default color
  if (segments.length === 0) {
    return [{ text, color: defaultColor }];
  }

  return segments;
};

export const parseChatLines = (input: string, defaultColor: string, idPrefix = `${Date.now()}`) => {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  return lines.map((line, index) => {
    // Check for legacy format: color at start of line
    const legacyMatch = line.match(/^\(#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})\)\s*(.*)$/);

    if (legacyMatch) {
      // Legacy format: entire line has this color
      const color = `#${legacyMatch[1]}`;
      const text = legacyMatch[2];
      return {
        id: `${idPrefix}-${index}`,
        text,
        color,
        segments: [{ text, color }],
        enabled: true,
      };
    }

    // New format: parse inline colors
    const segments = parseInlineColors(line, defaultColor);

    return {
      id: `${idPrefix}-${index}`,
      text: line,
      color: defaultColor, // Default color for backwards compatibility
      segments,
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
  const maxItems = Math.min(5, items.length);
  for (let limit = maxItems; limit >= 1; limit -= 1) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(items.slice(0, limit)));
      return;
    } catch {
      // try again with fewer items
    }
  }
  try {
    localStorage.removeItem(cacheKey);
  } catch {
    // ignore
  }
};
