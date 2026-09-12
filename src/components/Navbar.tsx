'use client';

import React from 'react';
import { Cloud, HardDrive, Plus, Database } from 'lucide-react';

interface NavbarProps {
  onOpenUpload: () => void;
}

export default function Navbar({ onOpenUpload }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black font-extrabold shadow-lg shadow-white/10">
            <Cloud className="h-5 w-5 fill-current text-black" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-xl font-black tracking-tight text-white uppercase">
              Cloud<span className="text-zinc-500 font-light">mar</span>
            </span>
            <span className="hidden sm:inline-block rounded-full bg-zinc-900 px-2.5 py-0.5 text-[10px] font-mono font-semibold tracking-wider text-zinc-400 border border-zinc-800">
              ATLAS STORAGE
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-xl bg-zinc-950 px-3 py-1.5 text-xs text-zinc-400 border border-zinc-800">
            <Database className="h-3.5 w-3.5 text-white" />
            <span className="font-mono text-[11px]">MongoDB Atlas</span>
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
          </div>

          <button
            onClick={onOpenUpload}
            className="bw-btn-primary flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-xl transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Upload File</span>
          </button>
        </div>
      </div>
    </header>
  );
}
