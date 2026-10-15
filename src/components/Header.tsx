import React from 'react';
import { Film, Key, CheckCircle, ShieldCheck, Sparkles, Layers } from 'lucide-react';
import { ApiKeySlot } from '../types/motion';

interface HeaderProps {
  activeSlot: ApiKeySlot;
  onOpenKeyModal: () => void;
  onOpenTestSuite: () => void;
  onOpenPresets: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSlot,
  onOpenKeyModal,
  onOpenTestSuite,
  onOpenPresets,
}) => {
  const isKeyConfigured = activeSlot.key && activeSlot.key.trim().length > 0;

  return (
    <header className="h-16 bg-[#0E1522] border-b border-[#1E293B] px-6 flex items-center justify-between select-none z-30">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#31AAA9] to-[#1E7675] flex items-center justify-center shadow-lg shadow-[#31AAA9]/20 border border-[#48C3C2]/40">
          <Film className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-wide">SS ICON MOTION STUDIO</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#31AAA9]/15 text-[#31AAA9] border border-[#31AAA9]/30">
              PRO ENGINE v2.5
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Reference Image to Motion Graphics Video • Direct MP4 & Alpha Export
          </p>
        </div>
      </div>

      {/* Action buttons & 10 Keys status */}
      <div className="flex items-center gap-3">
        {/* Sample Presets Quick Button */}
        <button
          onClick={onOpenPresets}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#162032] hover:bg-[#1E2C44] text-slate-300 hover:text-white border border-[#233550] text-xs font-medium transition-all"
        >
          <Layers className="w-3.5 h-3.5 text-[#31AAA9]" />
          <span>Reference Presets</span>
        </button>

        {/* Test Suite Button */}
        <button
          onClick={onOpenTestSuite}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#162032] hover:bg-[#1E2C44] text-slate-300 hover:text-white border border-[#233550] text-xs font-medium transition-all"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Test Suite (A–F)</span>
        </button>

        {/* 10 API Keys Manager button */}
        <button
          onClick={onOpenKeyModal}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-[#142636] hover:bg-[#1A344A] border border-[#31AAA9]/40 text-xs font-medium transition-all shadow-sm"
        >
          <div className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[#31AAA9]" />
            <span className="text-slate-200">10 API Keys</span>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-[#31AAA9]/30">
            <span
              className={`w-2 h-2 rounded-full ${
                isKeyConfigured
                  ? activeSlot.status === 'valid'
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                    : 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-[11px] text-slate-400 font-mono">
              Slot #{activeSlot.id}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
