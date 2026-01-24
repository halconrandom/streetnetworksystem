import React, { useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CenterColumn } from './screenshot-editor/CenterColumn';
import { LeftColumn } from './screenshot-editor/LeftColumn';
import { RightColumn } from './screenshot-editor/RightColumn';
import { defaultSettings, defaultTextSettings } from './screenshot-editor/constants';
// import type { ChatLine, CacheItem, OverlayImage, TextBlock, TextBlockSettings } from './screenshot-editor/types'; // No longer needed directly here
import { buildLinesFromBlocks, sanitizeChatInput } from './screenshot-editor/utils';
import { useCanvasPainter } from './screenshot-editor/hooks/useCanvasPainter';
import { useEditorState } from './screenshot-editor/hooks/useEditorState';

export const ScreenshotEditorView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const {
    state,
    computed,
    actions
  } = useEditorState();

  const {
    imageDataUrl, setImageDataUrl,
    imageName, setImageName,
    imageSize, setImageSize,
    rawTextFile, setRawTextFile,
    overlays, setOverlays,
    textBlocks, setTextBlocks,
    lines, setLines,
    filterText, setFilterText,
    settings, setSettings,
    zoom, setZoom,
    autoFit, setAutoFit,
    colorPicker, setColorPicker,
    colorAlpha, setColorAlpha,
    selectedTemplateColor, setSelectedTemplateColor,
    cacheItems, // setCacheItems, // Not used directly in render
    isDragging, setIsDragging,
    activeBlockId, setActiveBlockId,
    spaceDown, setSpaceDown,
    isPanning, setIsPanning,
    isPreviewHover, setIsPreviewHover,
    rpName, setRpName,
    panStateRef,
    dragState, setDragState,
    overlayDragState, setOverlayDragState,
    imageDragState, setImageDragState,
    layerOrder
  } = state;

  const { visibleLines } = computed;
  const { addToCache, loadCache, removeCache } = actions;

  const { invalidateCache } = useCanvasPainter({
    canvasRef,
    imageDataUrl,
    settings,
    textBlocks,
    visibleLines,
    overlays,
    layerOrder,
  });


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
  }, [isPreviewHover, setSpaceDown, setIsPanning, panStateRef]);


  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString();
      if (!result) return;
      setImageDataUrl(result);
      setImageName(file.name);
      setAutoFit(true);
      setSettings(prev => ({ ...prev, ...defaultSettings }));
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

  const handleLoadCache = (item: any) => {
    loadCache(item);
    // Invalidate overlay cache when loading new state
    // This is a bit of a hack, but safe enough since we re-render anyway
    // Ideally useCanvasPainter would handle this internally via a version/key
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

  const updateLine = (id: string, update: any) => {
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

  const updateBlockSettings = (id: string, update: any) => {
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

  const updateOverlay = (id: string, update: any) => {
    setOverlays((prev) => prev.map((item) => (item.id === id ? { ...item, ...update } : item)));
  };

  const removeOverlay = (id: string) => {
    setOverlays((prev) => prev.filter((item) => item.id !== id));
    invalidateCache(id);
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
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 md:p-8 h-full min-h-0 grid grid-cols-1 xl:grid-cols-[340px_1fr_320px] gap-6 animate-fade-in-up">
        <LeftColumn
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
          isDragging={isDragging}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
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
          onDownload={handleDownload}
          onCopy={handleCopy}
          onSaveCache={addToCache}
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
          rawTextFile={rawTextFile}
          onRawTextChange={setRawTextFile}
          onRemoveTimestamps={() => setRawTextFile(sanitizeChatInput(rawTextFile))}
          onApplyChatLines={() => setLines(buildLinesFromBlocks(textBlocks))}
          lines={lines}
          onUpdateLine={updateLine}
          onRemoveLine={(id) => setLines((prev) => prev.filter((item) => item.id !== id))}
          cacheItems={cacheItems}
          onLoadCache={handleLoadCache}
          onRemoveCache={removeCache}
          // Layers Panel Props
          textBlocks={textBlocks}
          overlays={overlays}
          layerOrder={layerOrder || []}
          activeBlockId={activeBlockId}
          onSelectLayer={(id, type) => {
            if (type === 'text') {
              setActiveBlockId(id);
            } else {
              // Select overlay logic if we have one? 
              // Currently we just have activeBlockId. 
              // We might want to add activeOverlayId or just a general Selection state.
              // For now, doing nothing for overlays besides maybe highlighting it in the panel?
              // But the panel highlights based on isActive prop.
            }
          }}
          onMoveLayer={(dragIndex, hoverIndex) => actions.reorderLayers(dragIndex, hoverIndex)}
          onToggleVisible={(id, type) => actions.toggleLayerVisibility(id, type)}
          onToggleLock={(id, type) => actions.toggleLayerLock(id, type)}
        />
      </div>
    </DndProvider>
  );
}

