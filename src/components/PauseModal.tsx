import React from 'react';
import { Home, Music, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { TRANSLATIONS } from '../game/i18n';
import { Lang } from '../game/types';

interface PauseModalProps {
  lang: Lang;
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  onChangeLang: (lang: Lang) => void;
  onToggleSfx: () => void;
  onToggleBgm: () => void;
  onResume: () => void;
  onRestart: () => void;
  onBackToTitle: () => void;
}

const LANGS: Array<{ code: Lang; label: string }> = [
  { code: 'th', label: 'ไทย' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
];

export const PauseModal: React.FC<PauseModalProps> = ({
  lang,
  sfxEnabled,
  bgmEnabled,
  onChangeLang,
  onToggleSfx,
  onToggleBgm,
  onResume,
  onRestart,
  onBackToTitle,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#020912]/82"
      role="dialog"
      aria-modal="true"
      aria-label={t.pause.title}
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#041622] border border-[#2d8896]/70 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.75)] flex flex-col gap-5">
        <div className="text-center">
          <h2 className="font-display font-bold text-2xl text-[#e6fffc]">{t.pause.title}</h2>
          <p className="text-xs text-[#89c4ca] mt-1">{t.pause.saveNotice}</p>
        </div>

        {/* Immediate 3-Language Switcher */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-[#9ad4d9]">{t.pause.language}</div>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#031019] border border-[#194b5c]/70">
            {LANGS.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => onChangeLang(item.code)}
                className={`py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  lang === item.code
                    ? 'bg-[#22e0cf] text-[#02151e]'
                    : 'text-[#a3d8d5] hover:bg-[#0c2d3f] hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Separate BGM and SFX Controls */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-[#9ad4d9]">{t.pause.audio}</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onToggleBgm}
              className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                bgmEnabled
                  ? 'bg-[#0a2c3c] border-[#33c7be]/70 text-[#d9fffc]'
                  : 'bg-[#081620] border-[#263f4d] text-[#6d8f9c]'
              }`}
            >
              <Music className="w-4 h-4" aria-hidden="true" />
              <span>{t.hud.bgm}: {bgmEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleSfx}
              className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                sfxEnabled
                  ? 'bg-[#0a2c3c] border-[#33c7be]/70 text-[#d9fffc]'
                  : 'bg-[#081620] border-[#263f4d] text-[#6d8f9c]'
              }`}
            >
              {sfxEnabled ? (
                <Volume2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <VolumeX className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{t.hud.sfx}: {sfxEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={onResume}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#22e0cf] hover:bg-[#5ef7e9] text-[#02151e] font-display font-bold text-base cursor-pointer transition-colors"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            <span>{t.pause.resume}</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0a2b3d] hover:bg-[#113d54] border border-[#24667a] text-[#e6fffc] font-semibold text-sm cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>{t.pause.restart}</span>
          </button>

          <button
            type="button"
            onClick={onBackToTitle}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-transparent hover:bg-[#092230] text-[#98cdd1] hover:text-white font-semibold text-sm cursor-pointer transition-colors"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>{t.pause.backToTitle}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
