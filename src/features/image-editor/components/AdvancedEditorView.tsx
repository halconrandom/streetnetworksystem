'use client';

import React, { useCallback, useRef } from 'react';
import { useAdvancedEditorState } from '../editor/hooks/useAdvancedEditorState';
import { ToolBar } from '../editor/ToolBar';
import { OptionsBar } from '../editor/OptionsBar';
import { CanvasArea } from '../editor/CanvasArea';
import { RightPanel } from '../editor/RightPanel';
import type { ImageLayerData } from '../types';

export const AdvancedEditorView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editor = useAdvancedEditorState();

  const handleMoveActiveLayer = useCallback(
    (newX: number, newY: number) => {
      if (!editor.activeLayerId) return;
      editor.updateLayerData(editor.activeLayerId, { x: newX, y: newY } as Partial<ImageLayerData>);
    },
    [editor]
  );

  const handleCropToSelection = useCallback(() => {
    if (!canvasRef.current) return;
    editor.cropToSelection(canvasRef.current);
  }, [editor]);

  const handleCopySelection = useCallback(() => {
    if (!canvasRef.current) return;
    editor.copySelectionAsLayer(canvasRef.current);
  }, [editor]);

  const handleExport = useCallback(() => {
    if (!canvasRef.current) return;
    editor.exportCanvas(canvasRef.current);
  }, [editor]);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Top action bar */}
      <div className="h-10 bg-[#0d0d0d] border-b border-white/5 flex items-center px-4 gap-3 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={editor.undo}
            disabled={!editor.canUndo}
            title="Undo (Ctrl+Z)"
            className="px-2 py-1 text-[11px] font-mono text-terminal-muted hover:text-white disabled:opacity-25 disabled:cursor-not-allowed border border-transparent hover:border-white/10 rounded transition-all"
          >
            ↩ Undo
          </button>
          <button
            onClick={editor.redo}
            disabled={!editor.canRedo}
            title="Redo (Ctrl+Y)"
            className="px-2 py-1 text-[11px] font-mono text-terminal-muted hover:text-white disabled:opacity-25 disabled:cursor-not-allowed border border-transparent hover:border-white/10 rounded transition-all"
          >
            ↪ Redo
          </button>
        </div>

        <div className="w-px h-5 bg-white/10" />

        <button
          onClick={handleExport}
          className="px-3 py-1 text-[11px] font-mono bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/30 rounded hover:bg-terminal-accent/20 transition-all"
        >
          ↓ Export PNG
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-3 text-[10px] font-mono text-terminal-muted/30">
          <span>{editor.layers.length} layer{editor.layers.length !== 1 ? 's' : ''}</span>
          <span>{editor.canvasWidth} × {editor.canvasHeight}</span>
        </div>

        <button
          onClick={editor.clearAll}
          className="px-2 py-1 text-[11px] font-mono text-terminal-muted/40 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded transition-all"
        >
          Clear All
        </button>
      </div>

      {/* Options bar */}
      <OptionsBar
        activeTool={editor.activeTool}
        toolOptions={editor.toolOptions}
        selection={editor.selection}
        onUpdateOptions={editor.updateToolOptions}
        onCropToSelection={handleCropToSelection}
        onCopySelection={handleCopySelection}
        onClearSelection={editor.clearSelection}
      />

      {/* Main area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ToolBar activeTool={editor.activeTool} onSetTool={editor.setActiveTool} />

        <CanvasArea
          canvasRef={canvasRef}
          layers={editor.layers}
          canvasWidth={editor.canvasWidth}
          canvasHeight={editor.canvasHeight}
          zoom={editor.zoom}
          activeTool={editor.activeTool}
          activeLayerId={editor.activeLayerId}
          activeDrawLayer={editor.activeDrawLayer}
          toolOptions={editor.toolOptions}
          selection={editor.selection}
          isDragging={editor.isDragging}
          onSetZoom={editor.setZoom}
          onSetActiveLayerId={editor.setActiveLayerId}
          onSetSelection={editor.setSelection}
          onCreateImageLayer={editor.createImageLayer}
          onCreateTextLayer={editor.createTextLayer}
          onAddItemToActiveLayer={editor.addItemToActiveLayer}
          onMoveActiveLayer={handleMoveActiveLayer}
          onSetIsDragging={editor.setIsDragging}
        />

        <RightPanel
          layers={editor.layers}
          activeLayerId={editor.activeLayerId}
          onSelectLayer={editor.setActiveLayerId}
          onRemoveLayer={editor.removeLayer}
          onDuplicateLayer={editor.duplicateLayer}
          onToggleVisible={editor.toggleVisible}
          onToggleLocked={editor.toggleLocked}
          onMoveUp={editor.moveLayerUp}
          onMoveDown={editor.moveLayerDown}
          onUpdateLayer={editor.updateLayer}
          onCreateDrawLayer={editor.createDrawLayer}
          onCreateImageLayer={editor.createImageLayer}
        />
      </div>
    </div>
  );
};
