import React, { useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CenterColumn } from '../editor/CenterColumn';
import { UnifiedSidebar } from '../editor/UnifiedSidebar';
import { CropEditor } from '../editor/CropEditor';
import { TopBar } from '../editor/TopBar';
import { StripBuilder } from '../editor/StripBuilder';
import { defaultSettings, defaultTextSettings } from '../editor/constants';
import { buildLinesFromBlocks, sanitizeChatInput } from '../editor/utils';
import { useCanvasPainter } from '../editor/hooks/useCanvasPainter';
import { useEditorState } from '../editor/hooks/useEditorState';
import { RightSidebar } from '../editor/RightSidebar';

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
    cacheItems,
    isDragging, setIsDragging,
    activeBlockId, setActiveBlockId,
    lastSelection, setLastSelection,
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
    activeTool,
    redactIntensity,
    setRedactIntensity
  } = state;

  const { visibleLines } = computed;
  const {
    addToCache, loadCache, removeCache,
    addOverlay, removeOverlay, updateOverlay,
    addTextBlock, duplicateTextBlock, applyColorToSelection, clearColorsInBlock, removeTextBlock, updateTextBlock, updateTextBlockSettings,
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

  const handleClearBlocks = () => {
    if (window.confirm('¿Limpiar todo el espacio de trabajo?')) {
      clearAll();
    }
  };

  const handleSaveToCache = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    addToCache(dataUrl);
  };

  const handleSaveToFile = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `street-network-${imageName}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleCopyScreenshot = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
    } catch (err) {
      console.error('Failed to copy image: ', err);
    }
  };

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
  }, [isPreviewHover, setSpaceDown, setIsPanning, panStateRef, undo, redo]);

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
  };

  const handleParseChat = () => {
    setLines(buildLinesFromBlocks(textBlocks));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
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

  const handlePanStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!spaceDown || !previewRef.current) return;
    event.preventDefault();
    panStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: previewRef.current.scrollLeft,
      startScrollTop: previewRef.current.scrollTop,
    };
    setIsPanning(true);
  };

  const handlePanMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!spaceDown || !panStateRef.current || !previewRef.current) return;
    event.preventDefault();
    const deltaX = event.clientX - panStateRef.current.startX;
    const deltaY = event.clientY - panStateRef.current.startY;
    previewRef.current.scrollLeft = panStateRef.current.startScrollLeft - deltaX;
    previewRef.current.scrollTop = panStateRef.current.startScrollTop - deltaY;
  };

  const handlePanEnd = () => {
    setIsPanning(false);
    panStateRef.current = null;
  };

  const updateBlock = (id: string, text: string) => {
    const block = textBlocks.find(b => b.id === id);
    const settingsOpen = block ? (text.trim().length === 0 ? false : block.settingsOpen) : false;
    updateTextBlock(id, { text, settingsOpen });
  };

  const updateBlockSettingsWrapper = (id: string, updateValue: any) => {
    updateTextBlockSettings(id, updateValue);
  };

  const getBlockSettings = (blockId: string) => {
    const block = textBlocks.find((item) => item.id === blockId);
    if (!block) return defaultTextSettings;
    return { ...defaultTextSettings, ...(block.settings ?? {}) };
  };

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
    const padding = 64;
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

    if (settings.imageScale === 1 && settings.imageOffsetX === 0 && settings.imageOffsetY === 0) {
      const scaleX = settings.width / imageSize.width;
      const scaleY = settings.height / imageSize.height;
      const coverScale = Math.max(scaleX, scaleY);
      updateSettings({
        imageScale: coverScale,
        imageOffsetX: 0,
        imageOffsetY: 0,
      });
    }
  }, [imageSize.height, imageSize.width, settings.fitMode, settings.height, settings.width]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-0 h-full min-h-0 flex flex-col bg-[#0a0a0c] animate-fade-in overflow-hidden">
        {/* GLOBAL TOP BAR */}
        {!activeCropOverlayId && (
          <TopBar
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onSaveToCache={handleSaveToCache}
            onSaveToFile={handleSaveToFile}
            onCopyScreenshot={handleCopyScreenshot}
            onClear={handleClearBlocks}
          />
        )}

        <div className="flex-1 min-h-0 flex relative overflow-hidden">
          {/* LEFT SIDEBAR (Drafting) */}
          {!activeCropOverlayId && (
            <div className="w-[430px] h-full flex-shrink-0 p-6 pr-0">
              <UnifiedSidebar
                onImageFile={handleImageFile}
                onChatFile={handleChatFile}
                overlays={overlays}
                onOverlayFile={handleOverlayFile}
                onUpdateOverlay={updateOverlay}
                onRemoveOverlay={(id) => { removeOverlay(id); invalidateCache(id); }}
                nameInputs={nameInputs}
                onAddNameInput={addNameInput}
                onRemoveNameInput={removeNameInput}
                onUpdateNameInput={updateNameInput}
                onAppendToBlock={appendToBlock}
                textBlocks={textBlocks}
                onUpdateBlock={updateBlock}
                onUpdateBlockSettings={updateBlockSettingsWrapper}
                onAddBlock={handleAddBlock}
                onDuplicateBlock={duplicateTextBlock}
                onClearColors={clearColorsInBlock}
                onRemoveBlock={removeTextBlock}
                onToggleBlockSettings={toggleBlockSettings}
                onToggleBlockCollapsed={toggleBlockCollapsed}
                onToggleBlockAdvanced={toggleBlockAdvanced}
                onSetActiveBlockId={setActiveBlockId}
                onSetSelection={setLastSelection}
                activeBlockId={activeBlockId}
                // Global Settings & Canvas
                settings={settings}
                onSettingsChange={updateSettings}
                // Colors
                colorPicker={colorPicker}
                onColorPickerChange={setColorPicker}
                colorAlpha={colorAlpha}
                onColorAlphaChange={setColorAlpha}
                selectedTemplateColor={selectedTemplateColor}
                onSelectTemplateColor={setSelectedTemplateColor}
                // Log Analysis
                rawTextFile={rawTextFile}
                onRawTextChange={setRawTextFile}
                onRemoveTimestamps={() => setRawTextFile(sanitizeChatInput(rawTextFile))}
                onApplyChatLines={handleParseChat}
                lines={lines}
                onUpdateLine={(id, updateValue) => setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...updateValue } : l)))}
                onRemoveLine={(id) => setLines((prev) => prev.filter((l) => l.id !== id))}
                // History/Cache
                cacheItems={cacheItems}
                onLoadCache={handleLoadCache}
                onRemoveCache={removeCache}
                // Layer Management
                layerOrder={layerOrder || []}
                onSelectLayer={(id, type) => { if (type === 'text') setActiveBlockId(id); }}
                onMoveLayer={(dragIndex, hoverIndex) => actions.reorderLayers(dragIndex, hoverIndex)}
                onToggleVisible={(id, type) => actions.toggleLayerVisibility(id, type)}
                onToggleLock={(id, type) => actions.toggleLayerLock(id, type)}
                // Global Actions
                width={settings.width}
                height={settings.height}
                onParseChat={handleParseChat}
                onClearBlocks={handleClearBlocks}
                onCommitHistory={commitHistory}
                activeTool={activeTool}
                onSetTool={setActiveTool}
                visiblePanels={visiblePanels}
                onTogglePanel={togglePanel}
                activeCropOverlayId={activeCropOverlayId}
                onSetActiveCropOverlayId={setActiveCropOverlayId}
                redactIntensity={redactIntensity}
                onRedactIntensityChange={setRedactIntensity}
              />
            </div>
          )}

          {/* MAIN VIEWPORT */}
          <div className="flex-1 min-h-0 flex flex-col relative bg-[#0a0a0c]">
            {activeCropOverlayId ? (
              <div className="flex-1 min-h-0 p-6 flex flex-col">
                <CropEditor
                  overlay={overlays.find((o) => o.id === activeCropOverlayId)!}
                  onCancel={() => setActiveCropOverlayId(null)}
                  onApply={(updateValue) => {
                    updateOverlay(activeCropOverlayId, { crop: updateValue });
                    setActiveCropOverlayId(null);
                    invalidateCache(activeCropOverlayId);
                    commitHistory();
                  }}
                  onSaveAsCopy={(crop) => {
                    const overlay = overlays.find(o => o.id === activeCropOverlayId);
                    if (overlay) {
                      addOverlay({
                        ...overlay,
                        id: `${Date.now()}-copy`,
                        name: `${overlay.name} (Crop)`,
                        crop,
                        x: settings.width / 2 + 20,
                        y: settings.height / 2 + 20
                      });
                      setActiveCropOverlayId(null);
                      commitHistory();
                    }
                  }}
                  width={settings.width}
                  height={settings.height}
                />
              </div>
            ) : (
              <CenterColumn
                imageDataUrl={imageDataUrl}
                canvasRef={canvasRef}
                previewRef={previewRef}
                settings={settings}
                fitMode={settings.fitMode}
                zoom={zoom}
                autoFit={autoFit}
                onZoomOut={() => { setZoom((z) => Math.max(0.1, z - 0.1)); setAutoFit(false); }}
                onZoomIn={() => { setZoom((z) => Math.min(5, z + 0.1)); setAutoFit(false); }}
                onFit={() => setAutoFit(true)}
                spaceDown={spaceDown}
                isPanning={isPanning}
                isDragging={isDragging}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPreviewEnter={() => setIsPreviewHover(true)}
                onPreviewLeave={() => setIsPreviewHover(false)}
                onPanStart={handlePanStart}
                onPanMove={handlePanMove}
                onPanEnd={handlePanEnd}
                activeBlockId={activeBlockId}
                getBlockSettings={getBlockSettings}
                dragState={dragState}
                setDragState={setDragState}
                onUpdateBlockSettings={updateBlockSettingsWrapper}
                overlays={overlays}
                overlayDragState={overlayDragState}
                setOverlayDragState={setOverlayDragState}
                onUpdateOverlay={updateOverlay}
                imageDragState={imageDragState}
                setImageDragState={setImageDragState}
                onUpdateImagePosition={(updateValue) => updateSettings(updateValue)}
                onDownload={handleDownload}
                onCopy={handleCopy}
                onSaveCache={() => addToCache()}
                onCommitHistory={commitHistory}
                activeTool={activeTool}
                onAddRedactionArea={addRedactionArea}
                onRemoveRedactionArea={removeRedactionArea}
                redactionAreas={redactionAreas}
              />
            )}
          </div>

          {/* RIGHT SIDEBAR (Configuration) */}
          {!activeCropOverlayId && (
            <RightSidebar
              settings={settings}
              onSettingsChange={updateSettings}
              colorPicker={colorPicker}
              onColorPickerChange={setColorPicker}
              colorAlpha={colorAlpha}
              onColorAlphaChange={setColorAlpha}
              selectedTemplateColor={selectedTemplateColor}
              onSelectTemplateColor={setSelectedTemplateColor}
              rawTextFile={rawTextFile}
              onRawTextChange={setRawTextFile}
              onRemoveTimestamps={() => setRawTextFile(sanitizeChatInput(rawTextFile))}
              onApplyChatLines={handleParseChat}
              onApplyColor={applyColorToSelection}
              lines={lines}
              onUpdateLine={(id, updateValue) => setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...updateValue } : l)))}
              onRemoveLine={(id) => setLines((prev) => prev.filter((l) => l.id !== id))}
              cacheItems={cacheItems}
              onLoadCache={handleLoadCache}
              onRemoveCache={removeCache}
              textBlocks={textBlocks}
              overlays={overlays}
              layerOrder={layerOrder || []}
              activeBlockId={activeBlockId}
              onSelectLayer={(id, type) => { if (type === 'text') setActiveBlockId(id); }}
              onMoveLayer={(dragIndex, hoverIndex) => actions.reorderLayers(dragIndex, hoverIndex)}
              onToggleVisible={(id, type) => actions.toggleLayerVisibility(id, type)}
              onToggleLock={(id, type) => actions.toggleLayerLock(id, type)}
              onCommitHistory={commitHistory}
              visiblePanels={visiblePanels}
            />
          )}
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
