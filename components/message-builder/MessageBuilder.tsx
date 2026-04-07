import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  Pencil,
  Plus,
  AlignLeft,
  Box,
  Image as ImageIcon,
  FileUp,
  Minus,
  MousePointerClick,
  Link as LinkIcon,
  List,
  Lock,
  Type,
  X
} from "lucide-react";

export function MessageBuilder() {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setIsAddMenuOpen(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setIsContextMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-black">Message Builder</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">Show JSON</Button>
          <Button variant="outline" size="sm">Color</Button>
          <Button variant="outline" size="sm">Incognito</Button>
          <Button variant="outline" size="sm">Share</Button>
          <Button variant="outline" size="sm">Mentions</Button>
          <Button variant="outline" size="sm">Saved Containers</Button>
          <Button variant="outline" size="sm">Saved Webhooks</Button>
          <Button variant="default" size="sm">Send</Button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="neo-panel p-6 md:p-8 min-h-[600px] bg-white relative">

        {/* Container Component */}
        <div className="flex gap-2 mb-4 group relative">
          {/* Drag Handle */}
          <div className="mt-2 cursor-grab text-slate-400 hover:text-black transition-colors">
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Container Content */}
          <div className="flex-1 neo-panel bg-[#fdfbf7] p-4 relative">
            <button className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 transition-colors">
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-3 mt-2">
              {/* Global Settings Row */}
              <div className="relative" ref={contextMenuRef}>
                <div
                  className="flex items-center justify-between bg-[#f4f1ea] border-2 border-slate-200 p-3 cursor-pointer hover:border-violet-500 transition-colors"
                  onClick={() => setIsContextMenuOpen(!isContextMenuOpen)}
                >
                  <div className="flex items-center gap-3">
                    <Pencil className="w-4 h-4 text-slate-400" />
                    <span className="font-sans font-medium text-slate-400">Global settings</span>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                    1
                  </div>
                </div>

                {/* Context Menu Dropdown */}
                {isContextMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 neo-panel bg-white z-20 p-2 flex flex-col gap-1">
                    <button className="flex items-center gap-3 w-full p-2 text-left hover:bg-[#f4f1ea] transition-colors font-sans font-bold text-sm text-slate-800">
                      <Lock className="w-4 h-4 text-slate-500" />
                      Mark everything as disabled
                    </button>
                    <button className="flex items-center gap-3 w-full p-2 text-left hover:bg-[#f4f1ea] transition-colors font-sans font-bold text-sm text-slate-800">
                      <Type className="w-4 h-4 text-slate-500" />
                      Add placeholder
                    </button>
                    <button className="flex items-center gap-3 w-full p-2 text-left hover:bg-[#f4f1ea] transition-colors font-sans font-bold text-sm text-slate-800">
                      <Minus className="w-4 h-4 text-slate-500" />
                      Set number of minimum options to be selected
                    </button>
                    <button className="flex items-center gap-3 w-full p-2 text-left hover:bg-[#f4f1ea] transition-colors font-sans font-bold text-sm text-slate-800">
                      <Plus className="w-4 h-4 text-slate-500" />
                      Set number of maximum options to be selected
                    </button>
                  </div>
                )}
              </div>

              {/* Option Row */}
              <div className="bg-[#f4f1ea] border-2 border-slate-200 p-3 cursor-text hover:border-black transition-colors">
                <span className="font-sans font-bold text-slate-800">Picky Oryx</span>
              </div>

              {/* Option Row */}
              <div className="bg-[#f4f1ea] border-2 border-slate-200 p-3 cursor-text hover:border-black transition-colors">
                <span className="font-sans font-bold text-slate-800">Dominant Walrus</span>
              </div>

              {/* New Option Row */}
              <div className="bg-[#f4f1ea] border-2 border-dashed border-slate-300 p-3 cursor-pointer hover:border-violet-500 hover:text-violet-600 transition-colors flex items-center gap-3 text-slate-400">
                <Plus className="w-4 h-4" />
                <span className="font-sans font-bold">New option</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Component Button & Dropdown */}
        <div className="relative ml-7" ref={addMenuRef}>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-[#fdfbf7]"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          >
            <Plus className="w-4 h-4" />
            Add component
          </Button>

          {isAddMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 neo-panel bg-white z-10 p-2 flex flex-col gap-1">
              <button className="flex items-center gap-3 w-full p-2 text-left hover:bg-[#f4f1ea] transition-colors font-sans font-bold text-sm text-slate-800">
                <AlignLeft className="w-4 h-4 text-slate-500" /> Content
              </button>
              <button className="flex items-center gap-3 w-full p-2 text-left hover:bg-[#f4f1ea] transition-colors font-sans font-bold text-sm text-slate-800">
                <Box className="w-4 h-4 text-slate-500" /> Container
              </button>
              <button className="flex items-center gap-3 w-full p-2 text-left hover:bg-[#f4f1ea] transition-colors font-sans font-bold text-sm text-slate-800">
                <ImageIcon className="w-4 h-4 text-slate-500" /> Image
              </button>
              <button className="flex items-center gap-3 w-full p-2 text-left hover:bg-[#f4f1ea] transition-colors font-sans font-bold text-sm text-slate-800">
                <FileUp className="w-4 h-4 text-slate-500" /> File
              </button>
              <button className="flex items-center gap-3 w-full p-2 text-left hover:bg-[#f4f1ea] transition-colors font-sans font-bold text-sm text-slate-800">
                <Minus className="w-4 h-4 text-slate-500" /> Separator
              </button>
              <button className="flex items-center gap-3 w-full p-2 text-left hover:bg-[#f4f1ea] transition-colors font-sans font-bold text-sm text-slate-800">
                <MousePointerClick className="w-4 h-4 text-slate-500" /> Button
              </button>
              <button className="flex items-center gap-3 w-full p-2 text-left hover:bg-[#f4f1ea] transition-colors font-sans font-bold text-sm text-slate-800">
                <LinkIcon className="w-4 h-4 text-slate-500" /> Button link
              </button>
              <button className="flex items-center gap-3 w-full p-2 text-left hover:bg-[#f4f1ea] transition-colors font-sans font-bold text-sm text-slate-800">
                <List className="w-4 h-4 text-slate-500" /> Select menu
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
