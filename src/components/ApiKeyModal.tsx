import React, { useState } from 'react';
import { X, Key, CheckCircle, AlertTriangle, RefreshCw, Eye, EyeOff, ShieldCheck, Zap, Trash2 } from 'lucide-react';
import { ApiKeySlot } from '../types/motion';
import { ApiClient } from '../services/apiClient';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: ApiKeySlot[];
  setSlots: React.Dispatch<React.SetStateAction<ApiKeySlot[]>>;
  activeSlotId: number;
  setActiveSlotId: (id: number) => void;
  autoRotate: boolean;
  setAutoRotate: (enabled: boolean) => void;
  onSelectModel: (m: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  slots,
  setSlots,
  activeSlotId,
  setActiveSlotId,
  autoRotate,
  setAutoRotate,
  onSelectModel,
}) => {
  const [showKeys, setShowKeys] = useState<{ [id: number]: boolean }>({});
  const [testingId, setTestingId] = useState<number | null>(null);

  if (!isOpen) return null;

  const toggleShowKey = (id: number) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleKeyChange = (id: number, val: string) => {
    const updated = slots.map((s) => (s.id === id ? { ...s, key: val, status: 'unconfigured' as const } : s));
    setSlots(updated);
    ApiClient.saveSlots(updated);
  };

  const handleLabelChange = (id: number, val: string) => {
    const updated = slots.map((s) => (s.id === id ? { ...s, label: val } : s));
    setSlots(updated);
    ApiClient.saveSlots(updated);
  };

  const handleClearSlot = (id: number) => {
    const updated = slots.map((s) =>
      s.id === id
        ? {
            ...s,
            key: '',
            status: 'unconfigured' as const,
            models: [],
            latencyMs: undefined,
            errorMsg: undefined,
          }
        : s
    );
    setSlots(updated);
    ApiClient.saveSlots(updated);
  };

  const handleTestKey = async (slot: ApiKeySlot) => {
    if (!slot.key || slot.key.trim() === '') {
      alert('Please enter an API key to test.');
      return;
    }

    setTestingId(slot.id);
    const result = await ApiClient.testKey(slot.id, slot.key);
    setTestingId(null);

    const updated = slots.map((s) => {
      if (s.id === slot.id) {
        return {
          ...s,
          status: result.valid
            ? ('valid' as const)
            : result.errorType === 'QUOTA_EXCEEDED'
            ? ('quota_exceeded' as const)
            : ('invalid' as const),
          models: result.models || [],
          latencyMs: result.latencyMs,
          lastTested: Date.now(),
          errorMsg: result.valid ? undefined : result.message,
        };
      }
      return s;
    });

    setSlots(updated);
    ApiClient.saveSlots(updated);
  };

  const handleTestAll = async () => {
    for (const slot of slots) {
      if (slot.key && slot.key.trim() !== '') {
        await handleTestKey(slot);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0E1524] border border-[#233550] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1C2B42] flex items-center justify-between bg-[#121B2C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#31AAA9]/15 border border-[#31AAA9]/30 flex items-center justify-center text-[#31AAA9]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">10 API Key Pool & Rotation Manager</h2>
              <p className="text-xs text-slate-400">
                Configure up to 10 Gemini API keys with automatic failover, quota rotation, and model discovery.
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

        {/* Global Controls */}
        <div className="px-6 py-3 bg-[#0B111D] border-b border-[#18253A] flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => {
                setAutoRotate(e.target.checked);
                ApiClient.setAutoRotateEnabled(e.target.checked);
              }}
              className="w-4 h-4 rounded border-[#2E4260] bg-[#142032] text-[#31AAA9] accent-[#31AAA9]"
            />
            <span className="font-medium text-slate-300">
              Auto-Rotate to next valid key on 429 / Rate Limit
            </span>
          </label>

          <button
            onClick={handleTestAll}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#152336] hover:bg-[#1E3048] border border-[#233550] text-[#31AAA9] font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Test All Configured Keys</span>
          </button>
        </div>

        {/* 10 Slots List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {slots.map((slot) => {
            const isShown = !!showKeys[slot.id];
            const isTesting = testingId === slot.id;
            const isActive = activeSlotId === slot.id;

            return (
              <div
                key={slot.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isActive
                    ? 'border-[#31AAA9] bg-[#121F32]'
                    : 'border-[#1C2C44] bg-[#0E1726] hover:border-[#263C5C]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      onClick={() => {
                        setActiveSlotId(slot.id);
                        ApiClient.setActiveSlotId(slot.id);
                      }}
                      className={`cursor-pointer px-2 py-0.5 rounded text-[11px] font-bold ${
                        isActive
                          ? 'bg-[#31AAA9] text-white shadow-sm'
                          : 'bg-[#18263B] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Slot #{slot.id} {isActive && '• Active'}
                    </span>

                    <input
                      type="text"
                      value={slot.label}
                      onChange={(e) => handleLabelChange(slot.id, e.target.value)}
                      placeholder="Label (e.g. Personal Project)"
                      className="bg-transparent text-xs font-medium text-slate-300 border-b border-transparent hover:border-slate-700 focus:border-[#31AAA9] focus:outline-none px-1"
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {slot.status === 'valid' && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Valid {slot.latencyMs ? `(${slot.latencyMs}ms)` : ''}
                      </span>
                    )}
                    {slot.status === 'quota_exceeded' && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Quota Exceeded
                      </span>
                    )}
                    {slot.status === 'invalid' && (
                      <span className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Invalid Key
                      </span>
                    )}
                    {slot.status === 'unconfigured' && (
                      <span className="text-[11px] text-slate-500 bg-[#162234] px-2 py-0.5 rounded-full">
                        {slot.key ? 'Untested' : 'Empty'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Input & Actions */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={isShown ? 'text' : 'password'}
                      value={slot.key}
                      onChange={(e) => handleKeyChange(slot.id, e.target.value)}
                      placeholder="Enter Gemini API Key (AIzaSy...)"
                      className="w-full bg-[#131D2E] border border-[#20324B] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#31AAA9] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(slot.id)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Test Button */}
                  <button
                    onClick={() => handleTestKey(slot)}
                    disabled={isTesting || !slot.key}
                    className="px-3 py-2 rounded-lg bg-[#18273E] hover:bg-[#203452] border border-[#253B5A] text-xs font-medium text-[#31AAA9] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isTesting ? (
                      <div className="w-3.5 h-3.5 border-2 border-[#31AAA9]/40 border-t-[#31AAA9] rounded-full animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    <span>Test</span>
                  </button>

                  {/* Clear Button */}
                  <button
                    onClick={() => handleClearSlot(slot.id)}
                    className="p-2 rounded-lg bg-[#18273E] hover:bg-rose-950/50 hover:text-rose-400 border border-[#253B5A] text-slate-400 transition-colors"
                    title="Clear slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Error diagnostics */}
                {slot.errorMsg && (
                  <p className="text-[11px] text-rose-400 mt-1.5 pl-1">⚠ {slot.errorMsg}</p>
                )}

                {/* Discovered Models */}
                {slot.models && slot.models.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#18263A] flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-400">Authorized Models:</span>
                    {slot.models.slice(0, 5).map((m) => (
                      <button
                        key={m}
                        onClick={() => onSelectModel(m)}
                        className="text-[10px] bg-[#16253B] hover:bg-[#1E324E] text-slate-300 px-2 py-0.5 rounded border border-[#223652] transition-colors"
                        title="Click to use this model"
                      >
                        {m}
                      </button>
                    ))}
                    {slot.models.length > 5 && (
                      <span className="text-[10px] text-slate-500">
                        +{slot.models.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#121B2C] border-t border-[#1C2B42] flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Keys are preserved locally in browser session and securely proxied via server endpoints.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#31AAA9] hover:bg-[#2A9594] text-white text-xs font-bold transition-all shadow-md shadow-[#31AAA9]/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
