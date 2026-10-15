import React from 'react';
import { X, Layers, Check, Sparkles } from 'lucide-react';
import { SAMPLE_PRESETS, SamplePreset } from '../data/samplePresets';
import { AnimationPlan } from '../types/motion';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: AnimationPlan) => void;
  currentPlanTitle: string;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  currentPlanTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0E1524] border border-[#233550] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1C2B42] flex items-center justify-between bg-[#121B2C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#31AAA9]/15 border border-[#31AAA9]/30 flex items-center justify-center text-[#31AAA9]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Reference Motion Styles</h2>
              <p className="text-xs text-slate-400">
                Pre-calibrated scenes modelled on Reference Video #1 and Reference Video #2.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#182438] hover:bg-[#20304A] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Presets */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {SAMPLE_PRESETS.map((preset) => {
            const isSelected = currentPlanTitle === preset.plan.title;

            return (
              <div
                key={preset.id}
                onClick={() => {
                  onSelectPlan(preset.plan);
                  onClose();
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#31AAA9] bg-[#142338]'
                    : 'border-[#1C2C44] bg-[#0E1726] hover:border-[#2D4568] hover:bg-[#121E32]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#31AAA9]/20 text-[#31AAA9] border border-[#31AAA9]/30">
                        {preset.badge}
                      </span>
                      <h3 className="text-sm font-bold text-white">{preset.name}</h3>
                    </div>
                    <p className="text-xs text-slate-400 max-w-md">{preset.description}</p>
                  </div>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs text-[#31AAA9] font-semibold bg-[#31AAA9]/15 px-2.5 py-1 rounded-full border border-[#31AAA9]/30">
                      <Check className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 border-t border-[#18263A] pt-2">
                  <span>Layers: <strong className="text-slate-200">{preset.plan.layers.length}</strong></span>
                  <span>•</span>
                  <span>Category: <strong className="text-slate-200 capitalize">{preset.plan.category.replace('_', ' ')}</strong></span>
                  <span>•</span>
                  <span>Duration: <strong className="text-slate-200">{preset.plan.recommendedDuration}s</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#121B2C] border-t border-[#1C2B42] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1C2A3E] hover:bg-[#253954] text-white text-xs font-semibold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
