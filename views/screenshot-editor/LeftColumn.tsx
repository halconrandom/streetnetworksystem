import React from 'react';
import { Image as ImageIcon, FileText, Trash2, Plus, Settings, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from '../../components/Icons';
import { defaultTextSettings } from './constants';
import type { OverlayImage, PreviewMode, TextBlock, TextBlockSettings, TextPosition } from './types';

type LeftColumnProps = {
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onImageFile: (file: File) => void;
  onChatFile: (file: File) => void;
  overlays: OverlayImage[];
  onOverlayFile: (file: File) => void;
  onUpdateOverlay: (id: string, update: Partial<OverlayImage>) => void;
  onRemoveOverlay: (id: string) => void;
  rpName: string;
  onRpNameChange: (value: string) => void;
  onAppendToBlock: (text: string) => void;
  textBlocks: TextBlock[];
  onUpdateBlock: (id: string, text: string) => void;
  onUpdateBlockSettings: (id: string, update: Partial<TextBlockSettings>) => void;
  onAddBlock: () => void;
  onRemoveBlock: (id: string) => void;
  onToggleBlockSettings: (id: string) => void;
  onToggleBlockCollapsed: (id: string) => void;
  onToggleBlockAdvanced: (id: string) => void;
  onSetActiveBlockId: (id: string) => void;
  width: number;
  height: number;
  filterText: string;
  onFilterTextChange: (value: string) => void;
  onParseChat: () => void;
  onClearBlocks: () => void;
};

export const LeftColumn: React.FC<LeftColumnProps> = ({
  previewMode,
  onPreviewModeChange,
  isDragging,
  setIsDragging,
  onDrop,
  onImageFile,
  onChatFile,
  overlays,
  onOverlayFile,
  onUpdateOverlay,
  onRemoveOverlay,
  rpName,
  onRpNameChange,
  onAppendToBlock,
  textBlocks,
  onUpdateBlock,
  onUpdateBlockSettings,
  onAddBlock,
  onRemoveBlock,
  onToggleBlockSettings,
  onToggleBlockCollapsed,
  onToggleBlockAdvanced,
  onSetActiveBlockId,
  width,
  height,
  filterText,
  onFilterTextChange,
  onParseChat,
  onClearBlocks,
}) => {
  return (
    <div className="space-y-6 min-h-0">
      <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <ImageIcon size={18} className="text-terminal-accent" />
          Screenshot Source
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => onPreviewModeChange('canvas')}
            className={`px-3 py-2 rounded-md border ${
              previewMode === 'canvas'
                ? 'bg-terminal-accent/15 text-terminal-accent border-terminal-accent/30'
                : 'bg-terminal-dark text-terminal-muted border-terminal-border'
            }`}
          >
            Canvas Preview
          </button>
          <button
            onClick={() => onPreviewModeChange('text')}
            className={`px-3 py-2 rounded-md border ${
              previewMode === 'text'
                ? 'bg-terminal-accent/15 text-terminal-accent border-terminal-accent/30'
                : 'bg-terminal-dark text-terminal-muted border-terminal-border'
            }`}
          >
            Text File Preview
          </button>
        </div>
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`border border-dashed rounded-lg p-4 text-sm text-terminal-muted transition-colors ${
            isDragging ? 'border-terminal-accent bg-terminal-accent/5 text-white' : 'border-terminal-border'
          }`}
        >
          Drag & drop an image here (or .txt for chat).
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-2 text-xs uppercase tracking-wide text-terminal-muted">
            Image
            <input
              type="file"
              accept="image/*"
              className="text-xs text-terminal-muted"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImageFile(file);
              }}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs uppercase tracking-wide text-terminal-muted">
            Chat .txt
            <input
              type="file"
              accept=".txt,text/plain"
              className="text-xs text-terminal-muted"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onChatFile(file);
              }}
            />
          </label>
        </div>
        <div className="text-xs text-terminal-muted">
          Prefix a line with <span className="text-white">(#RRGGBB)</span> or <span className="text-white">(#RRGGBBAA)</span> to set a custom color.
        </div>
      </div>

      <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <ImageIcon size={18} className="text-terminal-accent" />
          Image Overlays
        </div>
        <label className="flex flex-col gap-2 text-xs uppercase tracking-wide text-terminal-muted">
          Agregar imagen
          <input
            type="file"
            accept="image/*"
            className="text-xs text-terminal-muted"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onOverlayFile(file);
            }}
          />
        </label>
        {overlays.length === 0 ? (
          <div className="text-xs text-terminal-muted">No hay imagenes superpuestas.</div>
        ) : (
          <div className="space-y-3">
            {overlays.map((overlay) => (
              <div key={overlay.id} className="rounded-md border border-terminal-border bg-terminal-dark/40 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white truncate" title="Nombre del archivo de la superposicion.">
                    {overlay.name}
                  </span>
                  <button
                    onClick={() => onRemoveOverlay(overlay.id)}
                    className="text-terminal-muted hover:text-red-400"
                    title="Eliminar esta superposicion."
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    title="Escala de la imagen superpuesta."
                    className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                  >
                    Scale
                    <input
                      type="number"
                      min={0.05}
                      max={5}
                      step={0.05}
                      value={overlay.scale}
                      onChange={(event) =>
                        onUpdateOverlay(overlay.id, { scale: Number(event.target.value) })
                      }
                      className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                    />
                  </label>
                  <label
                    title="Rotacion de la imagen superpuesta."
                    className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                  >
                    Rotation
                    <input
                      type="number"
                      min={-180}
                      max={180}
                      step={1}
                      value={overlay.rotation}
                      onChange={(event) =>
                        onUpdateOverlay(overlay.id, { rotation: Number(event.target.value) })
                      }
                      className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                    />
                  </label>
                  <label
                    title="Opacidad de la imagen superpuesta."
                    className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2 col-span-2"
                  >
                    Opacity
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={overlay.opacity}
                      onChange={(event) =>
                        onUpdateOverlay(overlay.id, { opacity: Number(event.target.value) })
                      }
                      className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-xs text-terminal-muted">
          Arrastra la imagen en el canvas para moverla.
        </div>
      </div>

      <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold">
          <FileText size={18} className="text-terminal-accent" />
          Chat Input
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={rpName}
            onChange={(event) => onRpNameChange(event.target.value)}
            placeholder="Ingrese nombre apellido"
            className="flex-1 min-w-[160px] bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
          />
          <button
            onClick={() =>
              onAppendToBlock(`(#bd9dd4)* ${rpName || '[Nombre y Apellido]'} `)
            }
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-dark border border-terminal-border text-terminal-muted rounded-md"
          >
            /me
          </button>
          <button
            onClick={() =>
              onAppendToBlock(`(#8fbe2e)* (( ${rpName || '[Nombre y Apellido]'} )) `)
            }
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-dark border border-terminal-border text-terminal-muted rounded-md"
          >
            /do
          </button>
          <button
            onClick={() =>
              onAppendToBlock(`(#b4b401)${rpName || '[Nombre y Apellido]'} dice (phone): `)
            }
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-dark border border-terminal-border text-terminal-muted rounded-md"
          >
            Call
          </button>
        </div>
        <div className="space-y-3">
          {textBlocks.map((block, index) => {
            const blockSettings = { ...defaultTextSettings, ...(block.settings ?? {}) };
            return (
              <div key={block.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs text-terminal-muted">
                  <button
                    onClick={() => onToggleBlockCollapsed(block.id)}
                    className="uppercase tracking-wide text-left text-terminal-muted hover:text-white"
                    title="Collapse"
                  >
                    Text Block #{index + 1}
                  </button>
                  <div className="flex items-center gap-2">
                    {block.text.trim().length > 0 && (
                      <button
                        onClick={() => {
                          onSetActiveBlockId(block.id);
                          onToggleBlockSettings(block.id);
                        }}
                        className="text-terminal-muted hover:text-white"
                        title="Block Settings"
                      >
                        <Settings size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => onToggleBlockCollapsed(block.id)}
                      className="text-terminal-muted hover:text-white"
                      title="Collapse"
                    >
                      {block.collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                    {textBlocks.length > 1 && (
                      <button
                        onClick={() => onRemoveBlock(block.id)}
                        className="text-terminal-muted hover:text-red-400"
                        title="Delete Block"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {!block.collapsed && (
                  <>
                    <textarea
                      value={block.text}
                      onChange={(event) => onUpdateBlock(block.id, event.target.value)}
                      onFocus={() => onSetActiveBlockId(block.id)}
                      placeholder="Paste or edit chat lines here."
                      rows={6}
                      className="w-full bg-terminal-dark border border-terminal-border rounded-md p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-terminal-accent"
                    />
                    {block.text.trim().length > 0 && block.settingsOpen && (
                      <div className="space-y-3 rounded-md border border-terminal-border bg-terminal-dark/40 p-3">
                        <div className="grid grid-cols-2 gap-3">
                          <label
                            title="Define el ancho maximo del area de texto antes de hacer salto de linea."
                            className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2 col-span-2"
                          >
                            Text Box Width
                            <input
                              type="number"
                              value={blockSettings.textBoxWidth}
                              min={100}
                              max={width}
                              onChange={(event) =>
                                onUpdateBlockSettings(block.id, { textBoxWidth: Number(event.target.value) })
                              }
                              className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                            />
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <label
                            title="Tamano de la fuente del texto."
                            className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                          >
                            Size
                            <input
                              type="number"
                              value={blockSettings.fontSize}
                              min={8}
                              max={64}
                              onChange={(event) =>
                                onUpdateBlockSettings(block.id, { fontSize: Number(event.target.value) })
                              }
                              className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                            />
                          </label>
                          <label
                            title="Espaciado vertical entre lineas."
                            className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                          >
                            Line Height
                            <input
                              type="number"
                              value={blockSettings.lineHeight}
                              min={10}
                              max={80}
                              onChange={(event) =>
                                onUpdateBlockSettings(block.id, { lineHeight: Number(event.target.value) })
                              }
                              className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                            />
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <label
                            title="Giro del bloque de texto en grados."
                            className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2 col-span-2"
                          >
                            Text Rotation (deg)
                            <input
                              type="number"
                              value={blockSettings.textRotation}
                              min={-180}
                              max={180}
                              step={1}
                              onChange={(event) =>
                                onUpdateBlockSettings(block.id, { textRotation: Number(event.target.value) })
                              }
                              className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                            />
                          </label>
                        </div>
                        <div className="flex items-center justify-between text-xs text-terminal-muted border border-terminal-border rounded-md px-3 py-2 bg-terminal-dark">
                          <span className="uppercase tracking-wide" title="Activa un fondo negro detras del texto.">Black Backdrop</span>
                          <button
                            onClick={() =>
                              onUpdateBlockSettings(block.id, { backdropEnabled: !blockSettings.backdropEnabled })
                            }
                            className="flex items-center gap-2 text-xs text-terminal-muted"
                            title="Activa o desactiva el fondo negro del texto."
                          >
                            {blockSettings.backdropEnabled ? (
                              <>
                                <span className="text-terminal-accent">On</span>
                                <ToggleRight size={18} className="text-terminal-accent" />
                              </>
                            ) : (
                              <>
                                <span>Off</span>
                                <ToggleLeft size={18} />
                              </>
                            )}
                          </button>
                        </div>
                        {blockSettings.backdropEnabled && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 flex items-center gap-2 text-xs">
                              <button
                                onClick={() => onUpdateBlockSettings(block.id, { backdropMode: 'text' })}
                                className={`px-3 py-2 rounded-md border ${
                                  blockSettings.backdropMode === 'text'
                                    ? 'bg-terminal-accent/15 text-terminal-accent border-terminal-accent/30'
                                    : 'bg-terminal-dark text-terminal-muted border-terminal-border'
                                }`}
                                title="Fondo solo detras del texto de cada linea."
                              >
                                Just Text
                              </button>
                              <button
                                onClick={() => onUpdateBlockSettings(block.id, { backdropMode: 'all' })}
                                className={`px-3 py-2 rounded-md border ${
                                  blockSettings.backdropMode === 'all'
                                    ? 'bg-terminal-accent/15 text-terminal-accent border-terminal-accent/30'
                                    : 'bg-terminal-dark text-terminal-muted border-terminal-border'
                                }`}
                                title="Fondo que cubre todo el ancho del bloque."
                              >
                                All Width
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-terminal-muted border border-terminal-border rounded-md px-3 py-2 bg-terminal-dark">
                          <span className="uppercase tracking-wide" title="Muestra opciones adicionales para el texto.">Opciones Avanzadas</span>
                          <button
                            onClick={() => onToggleBlockAdvanced(block.id)}
                            className="flex items-center gap-2 text-xs text-terminal-muted"
                            title="Muestra u oculta opciones avanzadas."
                          >
                            {block.advancedOpen ? (
                              <>
                                <span className="text-terminal-accent">On</span>
                                <ToggleRight size={18} className="text-terminal-accent" />
                              </>
                            ) : (
                              <>
                                <span>Off</span>
                                <ToggleLeft size={18} />
                              </>
                            )}
                          </button>
                        </div>
                        {block.advancedOpen && (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <label
                                title="Mueve el texto horizontalmente."
                                className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                              >
                                Text X
                                <input
                                  type="number"
                                  value={blockSettings.textOffsetX}
                                  min={-width}
                                  max={width}
                                  onChange={(event) =>
                                    onUpdateBlockSettings(block.id, { textOffsetX: Number(event.target.value) })
                                  }
                                  className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                                />
                              </label>
                              <label
                                title="Mueve el texto verticalmente."
                                className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                              >
                                Text Y
                                <input
                                  type="number"
                                  value={blockSettings.textOffsetY}
                                  min={-height}
                                  max={height}
                                  onChange={(event) =>
                                    onUpdateBlockSettings(block.id, { textOffsetY: Number(event.target.value) })
                                  }
                                  className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                                />
                              </label>
                            </div>
                            <label
                              title="Selecciona la fuente del texto."
                              className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                            >
                              Font Family
                              <select
                                value={blockSettings.fontFamily}
                                onChange={(event) =>
                                  onUpdateBlockSettings(block.id, { fontFamily: event.target.value })
                                }
                                className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                              >
                                <option value="Arial, Helvetica, sans-serif">Arial, Helvetica, sans-serif</option>
                                <option value="Calibri, sans-serif">Calibri, sans-serif</option>
                                <option value="Raleway, san-serif">Raleway, san-serif</option>
                                <option value="Comic Sans MS, cursive, san-serif">Comic Sans MS, cursive, san-serif</option>
                              </select>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <label
                                title="Grosor de la fuente."
                                className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                              >
                                Weight
                                <input
                                  type="number"
                                  value={blockSettings.fontWeight}
                                  min={100}
                                  max={900}
                                  step={100}
                                  onChange={(event) =>
                                    onUpdateBlockSettings(block.id, { fontWeight: Number(event.target.value) })
                                  }
                                  className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                                />
                              </label>
                              <label
                                title="Grosor del contorno del texto."
                                className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                              >
                                Stroke
                                <input
                                  type="number"
                                  value={blockSettings.strokeWidth}
                                  min={0}
                                  max={10}
                                  onChange={(event) =>
                                    onUpdateBlockSettings(block.id, { strokeWidth: Number(event.target.value) })
                                  }
                                  className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                                />
                              </label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <label
                                title="Color del contorno del texto."
                                className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                              >
                                Stroke Color
                                <input
                                  value={blockSettings.strokeColor}
                                  onChange={(event) =>
                                    onUpdateBlockSettings(block.id, { strokeColor: event.target.value })
                                  }
                                  className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                                />
                              </label>
                              <label
                                title="Desenfoque de la sombra."
                                className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                              >
                                Shadow Blur
                                <input
                                  type="number"
                                  value={blockSettings.shadowBlur}
                                  min={0}
                                  max={20}
                                  onChange={(event) =>
                                    onUpdateBlockSettings(block.id, { shadowBlur: Number(event.target.value) })
                                  }
                                  className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                                />
                              </label>
                              <label
                                title="Desplazamiento horizontal de la sombra."
                                className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                              >
                                Shadow X
                                <input
                                  type="number"
                                  value={blockSettings.shadowOffsetX}
                                  min={-10}
                                  max={10}
                                  onChange={(event) =>
                                    onUpdateBlockSettings(block.id, { shadowOffsetX: Number(event.target.value) })
                                  }
                                  className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                                />
                              </label>
                              <label
                                title="Desplazamiento vertical de la sombra."
                                className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                              >
                                Shadow Y
                                <input
                                  type="number"
                                  value={blockSettings.shadowOffsetY}
                                  min={-10}
                                  max={10}
                                  onChange={(event) =>
                                    onUpdateBlockSettings(block.id, { shadowOffsetY: Number(event.target.value) })
                                  }
                                  className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                                />
                              </label>
                              <label
                                title="Color de la sombra."
                                className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2 col-span-2"
                              >
                                Shadow Color
                                <input
                                  value={blockSettings.shadowColor}
                                  onChange={(event) =>
                                    onUpdateBlockSettings(block.id, { shadowColor: event.target.value })
                                  }
                                  className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                                />
                              </label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <label
                                title="Margen horizontal interno del bloque."
                                className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                              >
                                Padding X
                                <input
                                  type="number"
                                  value={blockSettings.paddingX}
                                  min={0}
                                  max={200}
                                  onChange={(event) =>
                                    onUpdateBlockSettings(block.id, { paddingX: Number(event.target.value) })
                                  }
                                  className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                                />
                              </label>
                              <label
                                title="Margen vertical interno del bloque."
                                className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                              >
                                Padding Y
                                <input
                                  type="number"
                                  value={blockSettings.paddingY}
                                  min={0}
                                  max={200}
                                  onChange={(event) =>
                                    onUpdateBlockSettings(block.id, { paddingY: Number(event.target.value) })
                                  }
                                  className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                                />
                              </label>
                              <label
                                title="Ubicacion base del texto dentro del canvas."
                                className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                              >
                                Text Position
                                <select
                                  value={blockSettings.textPosition}
                                  onChange={(event) =>
                                    onUpdateBlockSettings(block.id, { textPosition: event.target.value as TextPosition })
                                  }
                                  className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                                >
                                  <option value="bottom-left">Bottom Left</option>
                                  <option value="top-left">Top Left</option>
                                </select>
                              </label>
                            </div>
                            {blockSettings.backdropEnabled && (
                              <div className="grid grid-cols-2 gap-3">
                                <label
                                  title="Separacion entre el texto y el fondo."
                                  className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                                >
                                  Backdrop Padding
                                  <input
                                    type="number"
                                    value={blockSettings.backdropPadding}
                                    min={0}
                                    max={20}
                                    onChange={(event) =>
                                      onUpdateBlockSettings(block.id, { backdropPadding: Number(event.target.value) })
                                    }
                                    className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                                  />
                                </label>
                                <label
                                  title="Opacidad del fondo negro (0 a 1)."
                                  className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2"
                                >
                                  Backdrop Opacity
                                  <input
                                    type="number"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={blockSettings.backdropOpacity}
                                    onChange={(event) =>
                                      onUpdateBlockSettings(block.id, { backdropOpacity: Number(event.target.value) })
                                    }
                                    className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                                  />
                                </label>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
          <button
            onClick={onAddBlock}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-dark border border-terminal-border text-terminal-muted rounded-md"
          >
            <Plus size={14} />
            Add Block
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onParseChat}
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-accent/15 text-terminal-accent border border-terminal-accent/30 rounded-md"
          >
            Parse Lines
          </button>
          <button
            onClick={onClearBlocks}
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-dark border border-terminal-border text-terminal-muted rounded-md"
          >
            Clear
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-terminal-muted">
          <span>Filter</span>
          <input
            value={filterText}
            onChange={(event) => onFilterTextChange(event.target.value)}
            placeholder="Search lines"
            className="flex-1 bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
          />
        </div>
      </div>
    </div>
  );
};
