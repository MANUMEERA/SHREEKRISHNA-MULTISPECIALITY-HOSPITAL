import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type?: 'success' | 'warning' | 'info';
  timestamp: string;
}

export function playNotificationChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.45);
  } catch (err) {
    console.log('Audio Context chime play prevented by browser policy:', err);
  }
}

export const AudioNotificationToast: React.FC<{
  toast: ToastMessage | null;
  onClose: () => void;
}> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      playNotificationChime();
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 max-w-sm flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">{toast.title}</h4>
            <span className="text-[10px] text-slate-400 font-mono">{toast.timestamp}</span>
          </div>
          <p className="text-xs text-slate-200 mt-1 font-medium">{toast.description}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
