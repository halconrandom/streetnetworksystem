import React, { useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CenterColumn } from './screenshot-editor/CenterColumn';
import { LeftColumn } from './screenshot-editor/LeftColumn';
import { RightColumn } from './screenshot-editor/RightColumn';
import { CropEditor } from './screenshot-editor/CropEditor';
import { TopBar } from './screenshot-editor/TopBar';
import { SidebarToolbar } from './screenshot-editor/SidebarToolbar';
import { StripBuilder } from './screenshot-editor/StripBuilder';
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
    overlays,
    textBlocks,
    lines, setLines,
    filterText, setFilterText,
    settings,
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
    nameInputs, setNameInputs,
    panStateRef,
    dragState, setDragState,
    overlayDragState, setOverlayDragState,
    imageDragState, setImageDragState,
    layerOrder,
    activeCropOverlayId,
    setActiveCropOverlayId,
    canUndo,
    canRedo,
    visiblePanels,
    redactionAreas,
    activeTool
  } = state;

  const { visibleLines } = computed;
  const {
    addToCache, loadCache, removeCache,
    addOverlay, removeOverlay, updateOverlay,
    addTextBlock, removeTextBlock, updateTextBlock, updateTextBlockSettings,
    addNameInput, removeNameInput, updateNameInput,
    undo, redo, commitHistory, togglePanel, clearAll,
    addRedactionArea, removeRedactionArea, setActiveTool,
    updateSettings
  } = actions;

  const { invalidateCache } = useCanvasPainter({
    canvasRef,
    imageDataUrl,
    settings,
    textBlocks,
    visibleLines,
    overlays,
    layerOrder,
    redactionAreas,
  });


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Undo/Redo
      if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      }
      if ((event.ctrlKey && event.key.toLowerCase() === 'y') || (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z')) {
        event.preventDefault();
        redo();
      }

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
      updateSettings(defaultSettings);
      const img = new window.Image();
      img.onload = () => {
        setImageSize({ width: img.width || 0, height: img.height || 0 });
        updateSettings({
          width: img.width || settings.width,
          height: img.height || settings.height,
        });
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

        addOverlay({
          id: `${Date.now()}-${overlays.length}`,
          name: file.name,
          dataUrl: result,
          width: img.width || 1,
          height: img.height || 1,
          x: settings.width / 2,
          y: settings.height / 2,
          scale: Number.isFinite(scale) ? Number(scale.toFixed(2)) : 1,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false
        });
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
    // We need to check if we should close settings based on trim length?
    // Original logic: settingsOpen: trimmed.length === 0 ? false : block.settingsOpen
    // We can fetch the block or just pass the logic.
    // For simplicity, let's just update text.
    // To replicate exact logic:
    const block = textBlocks.find(b => b.id === id);
    const settingsOpen = block ? (trimmed.length === 0 ? false : block.settingsOpen) : false;

    updateTextBlock(id, { text, settingsOpen });
  };

  const updateBlockSettingsWrapper = (id: string, update: any) => {
    updateTextBlockSettings(id, update);
  };

  const getBlockSettings = (blockId: string) => {
    const block = textBlocks.find((item) => item.id === blockId);
    if (!block) return defaultTextSettings;
    return { ...defaultTextSettings, ...(block.settings ?? {}) };
  };

  // addBlock, appendToBlock, removeBlock, etc. need to use actions

  const handleAddBlock = () => {
    addTextBlock();
  };

  const appendToBlock = (text: string) => {
    const targetId = activeBlockId ?? textBlocks[0]?.id;
    if (!targetId) return;
    const block = textBlocks.find(b => b.id === targetId);
    if (!block) return;

    updateTextBlock(targetId, {
      text: block.text.length > 0 ? `${block.text}\n${text}` : text,
      settingsOpen: true,
      collapsed: false
    });
  };

  const toggleBlockSettings = (id: string) => {
    const block = textBlocks.find(b => b.id === id);
    if (!block) return;
    updateTextBlock(id, { settingsOpen: block.text.trim().length > 0 ? !block.settingsOpen : false });
  };

  const toggleBlockAdvanced = (id: string) => {
    const block = textBlocks.find(b => b.id === id);
    if (!block) return;
    updateTextBlock(id, { advancedOpen: !block.advancedOpen });
  };

  const toggleBlockCollapsed = (id: string) => {
    const block = textBlocks.find(b => b.id === id);
    if (!block) return;
    updateTextBlock(id, { collapsed: !block.collapsed });
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
    actions.clearAll();
  };
  // Calculate Column Visibility
  const showLeftSidebar = visiblePanels.source || visiblePanels.textEditor;
  const showRightSidebar = visiblePanels.layers || visiblePanels.canvas || visiblePanels.colors || visiblePanels.content || visiblePanels.history;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 md:p-8 h-full min-h-0 flex flex-col gap-6 animate-fade-in-up">
        {!activeCropOverlayId && (
          <TopBar
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onSave={addToCache}
            onClear={handleClearBlocks}
          />
        )}

        <div className="flex-1 min-h-0 flex gap-6 relative">
          {/* Main Toolbar */}
          <SidebarToolbar
            visiblePanels={visiblePanels}
            onTogglePanel={togglePanel}
            activeTool={activeTool}
            onSetTool={setActiveTool}
          />

          <div
            className="flex-1 min-h-0 grid gap-6"
            style={{
              gridTemplateColumns: `
                    ${showLeftSidebar ? 'minmax(300px, 340px)' : '0px'} 
                    minmax(0, 1fr) 
                    ${showRightSidebar ? 'minmax(300px, 320px)' : '0px'}
                `,
              transition: 'grid-template-columns 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* LEFT SIDEBAR */}
            <div className={`flex flex-col gap-6 overflow-hidden transition-all duration-500 ${showLeftSidebar ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                {(visiblePanels.source || visiblePanels.textEditor) && (
                  <div className="bg-terminal-panel/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4">
                    <LeftColumn
                      onImageFile={handleImageFile}
                      onChatFile={handleChatFile}
                      overlays={overlays}
                      onOverlayFile={handleOverlayFile}
                      onUpdateOverlay={(id, update) => updateOverlay(id, update)}
                      onRemoveOverlay={(id) => { removeOverlay(id); invalidateCache(id); }}
                      nameInputs={nameInputs}
                      onAddNameInput={addNameInput}
                      onRemoveNameInput={removeNameInput}
                      onUpdateNameInput={updateNameInput}
                      onAppendToBlock={appendToBlock}
                      textBlocks={textBlocks}
                      onUpdateBlock={updateBlock}
                      onUpdateBlockSettings={updateBlockSettingsWrapper}
                      onAddBlock={() => { handleAddBlock(); }}
                      onRemoveBlock={(id) => { removeTextBlock(id); }}
                      onToggleBlockSettings={toggleBlockSettings}
                      onToggleBlockCollapsed={toggleBlockCollapsed}
                      onToggleBlockAdvanced={toggleBlockAdvanced}
                      onSetActiveBlockId={setActiveBlockId}
                      width={settings.width}
                      height={settings.height}
                      filterText={filterText}
                      onFilterTextChange={setFilterText}
                      onParseChat={handleParseChat}
                      onClearBlocks={() => { handleClearBlocks(); }}
                      onCommitHistory={commitHistory}
                      activeCropOverlayId={activeCropOverlayId}
                      onSetActiveCropOverlayId={setActiveCropOverlayId}
                      mode={visiblePanels.source && visiblePanels.textEditor ? 'full' : visiblePanels.source ? 'source' : 'text'}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* CENTER CANVAS */}
            <div className="min-h-0 flex flex-col">
              {activeCropOverlayId ? (
                (() => {
                  const overlay = overlays.find(o => o.id === activeCropOverlayId);
                  if (!overlay) {
                    setActiveCropOverlayId(null);
                    return null;
                  }
                  return (
                    <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-white/5 bg-terminal-black shadow-2xl">
                      <CropEditor
                        overlay={overlay}
                        width={1200} // Estimate or use ref to measure
                        height={800}
                        onApply={(crop) => {
                          updateOverlay(overlay.id, { crop });
                          setActiveCropOverlayId(null);
                        }}
                        onSaveAsCopy={(crop) => {
                          const newOverlay = {
                            ...overlay,
                            id: `${Date.now()}-copy`,
                            name: `${overlay.name} (Crop)`,
                            crop,
                            // Reset position for the new copy to center or slight offset
                            x: settings.width / 2 + 20,
                            y: settings.height / 2 + 20
                          };
                          addOverlay(newOverlay);
                          setActiveCropOverlayId(null);
                        }}
                        onCancel={() => setActiveCropOverlayId(null)}
                      />
                    </div>
                  );
                })()
              ) : (
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
                  onUpdateBlockSettings={updateBlockSettingsWrapper}
                  overlays={overlays}
                  overlayDragState={overlayDragState}
                  setOverlayDragState={setOverlayDragState}
                  onUpdateOverlay={(id, update) => updateOverlay(id, update)}
                  imageDragState={imageDragState}
                  setImageDragState={setImageDragState}
                  onUpdateImagePosition={(update) =>
                    updateSettings({
                      imageOffsetX: update.imageOffsetX,
                      imageOffsetY: update.imageOffsetY,
                    })
                  }
                  onDownload={handleDownload}
                  onCopy={handleCopy}
                  onSaveCache={() => {
                    const canvas = canvasRef.current;
                    if (canvas) {
                      addToCache(canvas.toDataURL('image/png'));
                    } else {
                      addToCache();
                    }
                  }}
                  onCommitHistory={commitHistory}
                  activeTool={activeTool}
                  onAddRedactionArea={addRedactionArea}
                  onRemoveRedactionArea={removeRedactionArea}
                  redactionAreas={redactionAreas}
                />
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className={`flex flex-col gap-6 overflow-hidden transition-all duration-500 ${showRightSidebar ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                <RightColumn
                  settings={settings}
                  onSettingsChange={(update) => updateSettings(update)}
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
                    }
                  }}
                  onMoveLayer={(dragIndex, hoverIndex) => { actions.reorderLayers(dragIndex, hoverIndex); }}
                  onToggleVisible={(id, type) => { actions.toggleLayerVisibility(id, type); }}
                  onToggleLock={(id, type) => { actions.toggleLayerLock(id, type); }}
                  onCommitHistory={commitHistory}
                  // Visible Panels Control
                  visiblePanels={visiblePanels}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <StripBuilder
        isOpen={visiblePanels.stripBuilder}
        onClose={() => togglePanel('stripBuilder')}
        cacheItems={cacheItems}
      />
    </DndProvider>
  );
};
