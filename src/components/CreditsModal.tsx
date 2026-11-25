import React from 'react';
import { X } from 'lucide-react';
import { TRANSLATIONS } from '../game/i18n';
import { Lang } from '../game/types';

interface CreditsModalProps {
  lang: Lang;
  onClose: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ lang, onClose }) => {
  const t = TRANSLATIONS[lang];
  const rows = [
    { role: t.credits.devRole, value: t.credits.devName },
    { role: t.credits.artRole, value: t.credits.artDesc },
    { role: t.credits.audioRole, value: t.credits.audioDesc },
    { role: t.credits.techRole, value: t.credits.techDesc },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020912]/86"
      role="dialog"
      aria-modal="true"
      aria-label={t.credits.title}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#041521] border border-[#2a8694]/70 p-6 shadow-[0_18px_56px_rgba(0,0,0,0.75)] flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 border-b border-[#1b5263]/65 pb-3">
          <h2 className="font-display font-bold text-xl text-[#e6fffc]">{t.credits.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.credits.close}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d3344] hover:bg-[#154b63] text-sm font-semibold text-[#d9fffc] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            <span>{t.credits.close}</span>
          </button>
        </div>

        <div className="space-y-3.5">
          {rows.map((r) => (
            <div key={r.role} className="space-y-0.5">
              <div className="text-xs font-bold text-[#7efcf0]">{r.role}</div>
              <div className="text-sm text-[#cdeae9] leading-relaxed">{r.value}</div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#1b5263]/65 text-xs text-[#89c4ca]">
          {t.credits.licenseNote}
        </div>
      </div>
    </div>
  );
};
