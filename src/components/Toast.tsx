import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  isSuccess?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, isSuccess = true }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/95 px-4 py-3 text-xs font-medium text-white shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-4"
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
      ) : (
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-400" />
      )}
      <span className="leading-snug text-zinc-200">{message}</span>
    </div>
  );
};
