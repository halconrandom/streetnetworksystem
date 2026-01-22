import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CenterColumn } from './screenshot-editor/CenterColumn';
import { LeftColumn } from './screenshot-editor/LeftColumn';
import { RightColumn } from './screenshot-editor/RightColumn';
import { CACHE_KEY, DEFAULT_COLOR, defaultSettings, defaultTextSettings } from './screenshot-editor/constants';
import type { CacheItem, ChatLine, EditorSettings, OverlayImage, PreviewMode, TextBlock, TextBlockSettings } from './screenshot-editor/types';
import { buildLinesFromBlocks, colorWithAlpha, getCombinedText, parseChatLines, readCache, sanitizeChatInput, writeCache } from './screenshot-editor/utils';

type RenderLine = {
  text: string;
  color: string;
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  if (!text) return [''];
  if (maxWidth <= 0) return [text];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  const pushCurrent = () => {
    if (current) lines.push(current);
    current = '';
  };

  const splitWord = (word: string) => {
    let chunk = '';
    for (const char of word) {
      const test = chunk + char;
      if (ctx.measureText(test).width > maxWidth && chunk) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk = test;
      }
    }
    return chunk;
  };

  words.forEach((word) => {
    if (!current) {
      if (ctx.measureText(word).width <= maxWidth) {
        current = word;
      } else {
        current = splitWord(word);
      }
      return;
    }

    const test = `${current} ${word}`;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      pushCurrent();
      if (ctx.measureText(word).width <= maxWidth) {
        current = word;
      } else {
        current = splitWord(word);
      }
    }
  });

  pushCurrent();
  return lines.length > 0 ? lines : [''];
};

const wrapChatLines = (ctx: CanvasRenderingContext2D, lines: ChatLine[], maxWidth: number): RenderLine[] => {
  const wrapped: RenderLine[] = [];
  lines.forEach((line) => {
    wrapText(ctx, line.text, maxWidth).forEach((text) => {
      wrapped.push({ text, color: line.color });
    });
  });
  return wrapped;
};

export const ScreenshotEditorView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('Untitled');
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [rawTextFile, setRawTextFile] = useState<string>('');
  const [overlays, setOverlays] = useState<OverlayImage[]>([]);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([
    {
      id: `${Date.now()}`,
      text: '',
      settings: { ...defaultTextSettings },
      collapsed: false,
      settingsOpen: false,
      advancedOpen: false,
    },
  ]);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [filterText, setFilterText] = useState<string>('');
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings);
  const [zoom, setZoom] = useState<number>(1);
  const [autoFit, setAutoFit] = useState<boolean>(true);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('canvas');
  const [colorPicker, setColorPicker] = useState<string>('#ffffff');
  const [colorAlpha, setColorAlpha] = useState<number>(1);
  const [selectedTemplateColor, setSelectedTemplateColor] = useState<string | null>(null);
  const [cacheItems, setCacheItems] = useState<CacheItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [spaceDown, setSpaceDown] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isPreviewHover, setIsPreviewHover] = useState<boolean>(false);
  const [rpName, setRpName] = useState<string>('');
  const panStateRef = useRef<{
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);
  const [dragState, setDragState] = useState<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    blockId: string;
  } | null>(null);
  const [overlayDragState, setOverlayDragState] = useState<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    overlayId: string;
  } | null>(null);
  const [imageDragState, setImageDragState] = useState<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const overlayImageCacheRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    setCacheItems(readCache(CACHE_KEY));
  }, []);

  useEffect(() => {
    setLines(buildLinesFromBlocks(textBlocks));
  }, [textBlocks]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      const target = event.target as HTMLElement | null;
      const isEditable = target
        ? ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
        : false;
      if (!isEditable && isPreviewHover) {
        event.preventDefault();
        setSpaceDown(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      setSpaceDown(false);
      setIsPanning(false);
      panStateRef.current = null;
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const visibleLines = useMemo(() => {
    const normalizedFilter = filterText.trim().toLowerCase();
    return lines.filter((line) => {
      if (!line.enabled) return false;
      if (!normalizedFilter) return true;
      return line.text.toLowerCase().includes(normalizedFilter);
    });
  }, [filterText, lines]);

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString();
      if (!result) return;
      setImageDataUrl(result);
      setImageName(file.name);
      setAutoFit(true);
      const img = new window.Image();
      img.onload = () => {
        setImageSize({ width: img.width || 0, height: img.height || 0 });
        setSettings((prev) => ({
          ...prev,
          width: img.width || prev.width,
          height: img.height || prev.height,
        }));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleChatFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() ?? '';
      setRawTextFile(sanitizeChatInput(result));
    };
    reader.readAsText(file);
  };

  const handleOverlayFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString();
      if (!result) return;
      const img = new window.Image();
      img.onload = () => {
        const maxWidth = settings.width * 0.35;
        const maxHeight = settings.height * 0.35;
        const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
        setOverlays((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${prev.length}`,
            name: file.name,
            dataUrl: result,
            width: img.width || 1,
            height: img.height || 1,
            x: settings.width / 2,
            y: settings.height / 2,
            scale: Number.isFinite(scale) ? Number(scale.toFixed(2)) : 1,
            rotation: 0,
            opacity: 1,
          },
        ]);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageDataUrl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = new window.Image();
    image.onload = () => {
      canvas.width = settings.width;
      canvas.height = settings.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const canvasRatio = settings.width / settings.height;
      const imageRatio = image.width / image.height;

      let drawWidth = settings.width;
      let drawHeight = settings.height;
      let offsetX = 0;
      let offsetY = 0;

      if (settings.fitMode === 'crop') {
        drawWidth = image.width * settings.imageScale;
        drawHeight = image.height * settings.imageScale;
        offsetX = (settings.width - drawWidth) / 2 + settings.imageOffsetX;
        offsetY = (settings.height - drawHeight) / 2 + settings.imageOffsetY;
      } else if (settings.fitMode === 'contain') {
        if (imageRatio > canvasRatio) {
          drawWidth = settings.width;
          drawHeight = settings.width / imageRatio;
          offsetY = (settings.height - drawHeight) / 2;
        } else {
          drawHeight = settings.height;
          drawWidth = settings.height * imageRatio;
          offsetX = (settings.width - drawWidth) / 2;
        }
      } else if (settings.fitMode === 'cover') {
        if (imageRatio > canvasRatio) {
          drawHeight = settings.height;
          drawWidth = settings.height * imageRatio;
          offsetX = (settings.width - drawWidth) / 2;
        } else {
          drawWidth = settings.width;
          drawHeight = settings.width / imageRatio;
          offsetY = (settings.height - drawHeight) / 2;
        }
      }

      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

      overlays.forEach((overlay) => {
        let overlayImage = overlayImageCacheRef.current[overlay.id];
        if (!overlayImage) {
          overlayImage = new window.Image();
          overlayImage.onload = () => drawCanvas();
          overlayImage.src = overlay.dataUrl;
          overlayImageCacheRef.current[overlay.id] = overlayImage;
        }
        if (!overlayImage.complete) return;
        const drawW = overlay.width * overlay.scale;
        const drawH = overlay.height * overlay.scale;
        const rotation = (overlay.rotation * Math.PI) / 180;
        ctx.save();
        ctx.globalAlpha = overlay.opacity;
        ctx.translate(overlay.x, overlay.y);
        ctx.rotate(rotation);
        ctx.drawImage(overlayImage, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      });

      const linesByBlock = visibleLines.reduce<Record<string, ChatLine[]>>((acc, line) => {
        const key = line.blockId ?? 'default';
        if (!acc[key]) acc[key] = [];
        acc[key].push(line);
        return acc;
      }, {});

      textBlocks.forEach((block) => {
        const blockSettings = { ...defaultTextSettings, ...(block.settings ?? {}) };
        const blockLines = linesByBlock[block.id] ?? parseChatLines(block.text, DEFAULT_COLOR, block.id);
        if (blockLines.length === 0) return;

        ctx.save();
        ctx.font = `${blockSettings.fontWeight} ${blockSettings.fontSize}px ${blockSettings.fontFamily}`;
        ctx.textBaseline = 'top';
        ctx.shadowColor = blockSettings.shadowColor;
        ctx.shadowBlur = blockSettings.shadowBlur;
        ctx.shadowOffsetX = blockSettings.shadowOffsetX;
        ctx.shadowOffsetY = blockSettings.shadowOffsetY;
        ctx.lineWidth = blockSettings.strokeWidth;
        ctx.strokeStyle = blockSettings.strokeColor;

        const startX = blockSettings.paddingX;
        let startY = blockSettings.textPosition === 'bottom-left'
          ? settings.height - blockSettings.paddingY
          : blockSettings.paddingY;
        startY += blockSettings.textOffsetY;
        const baseX = startX + blockSettings.textOffsetX;
        const availableWidth = Math.max(0, settings.width - baseX);
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
          const bottomStartY = settings.height - blockSettings.paddingY - totalHeight - fontHeight;
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
          if (blockSettings.backdropEnabled && blockSettings.backdropMode === 'text') {
            const textWidth = Math.min(lineMetrics.width, maxWidth);
            const backdropWidth = Math.max(0, textWidth);
            const backdropHeight = fontHeight + blockSettings.backdropPadding * 2;
            const backdropY = lineTopY - blockSettings.backdropPadding;
            ctx.fillStyle = colorWithAlpha(blockSettings.backdropColor, blockSettings.backdropOpacity);
            ctx.fillRect(
              localBaseX - blockSettings.backdropPadding,
              backdropY,
              backdropWidth + blockSettings.backdropPadding * 2,
              backdropHeight
            );
          }
          ctx.fillStyle = line.color;
          if (blockSettings.strokeWidth > 0) {
            ctx.strokeText(line.text, localBaseX, lineTopY);
          }
          ctx.fillText(line.text, localBaseX, lineTopY);
        });

        ctx.restore();
      });
    };
    image.src = imageDataUrl;
  };

  useEffect(() => {
    drawCanvas();
  }, [imageDataUrl, settings, textBlocks, visibleLines, overlays]);

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = imageName.replace(/\.[^/.]+$/, '') || 'screenshot';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!navigator.clipboard || !(window as any).ClipboardItem) {
      return;
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
    if (!blob) return;
    const item = new (window as any).ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
  };

  const handleAddToCache = () => {
    if (!imageDataUrl) return;
    const item: CacheItem = {
      id: `${Date.now()}`,
      name: imageName,
      createdAt: Date.now(),
      imageDataUrl,
      textBlocks,
      overlays,
      chatInput: getCombinedText(textBlocks),
      lines,
      settings,
    };
    const next = [item, ...cacheItems].slice(0, 5);
    setCacheItems(next);
    writeCache(CACHE_KEY, next);
  };

  const handleLoadCache = (item: CacheItem) => {
    setImageDataUrl(item.imageDataUrl);
    setImageName(item.name);
    overlayImageCacheRef.current = {};
    if (item.textBlocks && item.textBlocks.length > 0) {
      setTextBlocks(
        item.textBlocks.map((block) => ({
          ...block,
          settings: { ...defaultTextSettings, ...(block.settings ?? {}) },
          collapsed: false,
          settingsOpen: block.settingsOpen ?? false,
          advancedOpen: block.advancedOpen ?? false,
        }))
      );
    } else {
      const fallback = item.chatInput ?? '';
      setTextBlocks([
        {
          id: `${Date.now()}`,
          text: fallback,
          settings: { ...defaultTextSettings },
          collapsed: false,
          settingsOpen: false,
          advancedOpen: false,
        },
      ]);
    }
    setLines(item.lines);
    setSettings({ ...defaultSettings, ...item.settings });
    setOverlays(item.overlays ?? []);
    setAutoFit(true);
  };

  const handleRemoveCache = (id: string) => {
    const next = cacheItems.filter((item) => item.id !== id);
    setCacheItems(next);
    writeCache(CACHE_KEY, next);
  };

  const handleParseChat = () => {
    setLines(buildLinesFromBlocks(textBlocks));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      handleImageFile(file);
    } else if (file.type === 'text/plain') {
      handleChatFile(file);
    }
  };

  const updateLine = (id: string, update: Partial<ChatLine>) => {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...update } : line)));
  };

  const updateBlock = (id: string, text: string) => {
    const trimmed = text.trim();
    setTextBlocks((prev) =>
      prev.map((block) =>
        block.id === id
          ? {
              ...block,
              text,
              settingsOpen: trimmed.length === 0 ? false : block.settingsOpen,
            }
          : block
      )
    );
  };

  const updateBlockSettings = (id: string, update: Partial<TextBlockSettings>) => {
    setTextBlocks((prev) =>
      prev.map((block) =>
        block.id === id
          ? {
              ...block,
              settings: { ...defaultTextSettings, ...(block.settings ?? {}), ...update },
            }
          : block
      )
    );
  };

  const updateOverlay = (id: string, update: Partial<OverlayImage>) => {
    setOverlays((prev) => prev.map((item) => (item.id === id ? { ...item, ...update } : item)));
  };

  const removeOverlay = (id: string) => {
    setOverlays((prev) => prev.filter((item) => item.id !== id));
    delete overlayImageCacheRef.current[id];
  };

  const getBlockSettings = (blockId: string) => {
    const block = textBlocks.find((item) => item.id === blockId);
    if (!block) return defaultTextSettings;
    return { ...defaultTextSettings, ...(block.settings ?? {}) };
  };

  const addBlock = () => {
    setTextBlocks((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        text: '',
        settings: { ...defaultTextSettings },
        collapsed: false,
        settingsOpen: false,
        advancedOpen: false,
      },
    ]);
  };

  const appendToBlock = (text: string) => {
    const targetId = activeBlockId ?? textBlocks[0]?.id;
    if (!targetId) return;
    setTextBlocks((prev) =>
      prev.map((block) =>
        block.id === targetId
          ? {
              ...block,
              text: block.text.length > 0 ? `${block.text}\n${text}` : text,
              settingsOpen: true,
              collapsed: false,
            }
          : block
      )
    );
  };

  const removeBlock = (id: string) => {
    setTextBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  const toggleBlockSettings = (id: string) => {
    setTextBlocks((prev) =>
      prev.map((block) =>
        block.id === id
          ? {
              ...block,
              settingsOpen: block.text.trim().length > 0 ? !block.settingsOpen : false,
            }
          : block
      )
    );
  };

  const toggleBlockAdvanced = (id: string) => {
    setTextBlocks((prev) =>
      prev.map((block) =>
        block.id === id
          ? {
              ...block,
              advancedOpen: !block.advancedOpen,
            }
          : block
      )
    );
  };

  const toggleBlockCollapsed = (id: string) => {
    setTextBlocks((prev) =>
      prev.map((block) =>
        block.id === id
          ? {
              ...block,
              collapsed: !block.collapsed,
            }
          : block
      )
    );
  };

  const computeFitZoom = () => {
    if (!previewRef.current) return 1;
    const container = previewRef.current;
    const padding = 32;
    const availableWidth = Math.max(0, container.clientWidth - padding);
    const availableHeight = Math.max(0, container.clientHeight - padding);
    const scaleX = availableWidth / settings.width;
    const scaleY = availableHeight / settings.height;
    return Number(Math.min(scaleX, scaleY, 1).toFixed(2));
  };

  useEffect(() => {
    if (!imageDataUrl) return;
    const updateFit = () => {
      if (!autoFit) return;
      setZoom(computeFitZoom());
    };
    updateFit();
    if (!previewRef.current) return;
    const observer = new ResizeObserver(updateFit);
    observer.observe(previewRef.current);
    return () => observer.disconnect();
  }, [autoFit, imageDataUrl, settings.height, settings.width]);

  useEffect(() => {
    if (settings.fitMode !== 'crop') return;
    if (!imageSize.width || !imageSize.height) return;
    const scaleX = settings.width / imageSize.width;
    const scaleY = settings.height / imageSize.height;
    const coverScale = Math.max(scaleX, scaleY);
    setSettings((prev) => ({
      ...prev,
      imageScale: coverScale,
      imageOffsetX: 0,
      imageOffsetY: 0,
    }));
  }, [imageSize.height, imageSize.width, settings.fitMode, settings.height, settings.width]);

  const handleClearBlocks = () => {
    setTextBlocks([
      {
        id: `${Date.now()}`,
        text: '',
        settings: { ...defaultTextSettings },
        collapsed: false,
        settingsOpen: false,
        advancedOpen: false,
      },
    ]);
  };
  return (
    <div className="p-6 md:p-8 h-full min-h-0 grid grid-cols-1 xl:grid-cols-[340px_1fr_320px] gap-6 animate-fade-in-up">
      <LeftColumn
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        onDrop={handleDrop}
        onImageFile={handleImageFile}
        onChatFile={handleChatFile}
        overlays={overlays}
        onOverlayFile={handleOverlayFile}
        onUpdateOverlay={updateOverlay}
        onRemoveOverlay={removeOverlay}
        rpName={rpName}
        onRpNameChange={setRpName}
        onAppendToBlock={appendToBlock}
        textBlocks={textBlocks}
        onUpdateBlock={updateBlock}
        onUpdateBlockSettings={updateBlockSettings}
        onAddBlock={addBlock}
        onRemoveBlock={removeBlock}
        onToggleBlockSettings={toggleBlockSettings}
        onToggleBlockCollapsed={toggleBlockCollapsed}
        onToggleBlockAdvanced={toggleBlockAdvanced}
        onSetActiveBlockId={setActiveBlockId}
        width={settings.width}
        height={settings.height}
        filterText={filterText}
        onFilterTextChange={setFilterText}
        onParseChat={handleParseChat}
        onClearBlocks={handleClearBlocks}
      />
      <CenterColumn
        previewMode={previewMode}
        imageDataUrl={imageDataUrl}
        canvasRef={canvasRef}
        previewRef={previewRef}
        settings={settings}
        fitMode={settings.fitMode}
        zoom={zoom}
        autoFit={autoFit}
        onZoomOut={() => {
          setAutoFit(false);
          setZoom((value) => Math.max(0.1, Number((value - 0.1).toFixed(2))));
        }}
        onZoomIn={() => {
          setAutoFit(false);
          setZoom((value) => Math.min(3, Number((value + 0.1).toFixed(2))));
        }}
        onFit={() => {
          setAutoFit(true);
          setZoom(computeFitZoom());
        }}
        spaceDown={spaceDown}
        isPanning={isPanning}
        onPreviewEnter={() => setIsPreviewHover(true)}
        onPreviewLeave={() => {
          setIsPreviewHover(false);
          setIsPanning(false);
          panStateRef.current = null;
        }}
        onPanStart={(event) => {
          if (!spaceDown || !previewRef.current) return;
          event.preventDefault();
          panStateRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            startScrollLeft: previewRef.current.scrollLeft,
            startScrollTop: previewRef.current.scrollTop,
          };
          setIsPanning(true);
        }}
        onPanMove={(event) => {
          if (!spaceDown || !panStateRef.current || !previewRef.current) return;
          event.preventDefault();
          const deltaX = event.clientX - panStateRef.current.startX;
          const deltaY = event.clientY - panStateRef.current.startY;
          previewRef.current.scrollLeft = panStateRef.current.startScrollLeft - deltaX;
          previewRef.current.scrollTop = panStateRef.current.startScrollTop - deltaY;
        }}
        onPanEnd={() => {
          setIsPanning(false);
          panStateRef.current = null;
        }}
        activeBlockId={activeBlockId}
        getBlockSettings={getBlockSettings}
        dragState={dragState}
        setDragState={setDragState}
        onUpdateBlockSettings={updateBlockSettings}
        overlays={overlays}
        overlayDragState={overlayDragState}
        setOverlayDragState={setOverlayDragState}
        onUpdateOverlay={updateOverlay}
        imageDragState={imageDragState}
        setImageDragState={setImageDragState}
        onUpdateImagePosition={(update) =>
          setSettings((prev) => ({
            ...prev,
            imageOffsetX: update.imageOffsetX,
            imageOffsetY: update.imageOffsetY,
          }))
        }
        rawTextFile={rawTextFile}
        onRawTextChange={setRawTextFile}
        onRemoveTimestamps={() => setRawTextFile(sanitizeChatInput(rawTextFile))}
        onApplyChatLines={() => setLines(buildLinesFromBlocks(textBlocks))}
        onDownload={handleDownload}
        onCopy={handleCopy}
        onSaveCache={handleAddToCache}
      />
      <RightColumn
        settings={settings}
        onSettingsChange={(update) => setSettings((prev) => ({ ...prev, ...update }))}
        colorPicker={colorPicker}
        onColorPickerChange={setColorPicker}
        colorAlpha={colorAlpha}
        onColorAlphaChange={setColorAlpha}
        selectedTemplateColor={selectedTemplateColor}
        onSelectTemplateColor={setSelectedTemplateColor}
        lines={lines}
        onUpdateLine={updateLine}
        onRemoveLine={(id) => setLines((prev) => prev.filter((item) => item.id !== id))}
        cacheItems={cacheItems}
        onLoadCache={handleLoadCache}
        onRemoveCache={handleRemoveCache}
      />
    </div>
  );
}

