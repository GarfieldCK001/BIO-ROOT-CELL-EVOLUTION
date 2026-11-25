import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Check,
  Dna,
  Info,
  Pencil,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { CHARACTERS, DIFFICULTIES, DIFFICULTY_ORDER, MAX_ZONE, POST_GAME_CHARACTERS } from '../game/data';
import { TRANSLATIONS } from '../game/i18n';
import { MAX_PLAYER_NAME_LENGTH } from '../game/rules';
import { CharacterId, DifficultyId, Lang } from '../game/types';
import { TitleEmblemSvg } from './BioIcons';

interface TitleScreenProps {
  lang: Lang;
  playerName: string;
  difficulty: DifficultyId;
  dailyChallenge: boolean;
  dailySeedCode: string;
  selectedCharacter: CharacterId;
  unlockedPostGameCount: number;
  hasSavedRun: boolean;
  mutagen: number;
  bestBiomass: number;
  bestZone: number;
  onChangeLang: (lang: Lang) => void;
  onChangePlayerName: (name: string) => void;
  onChangeDifficulty: (difficulty: DifficultyId) => void;
  onToggleDailyChallenge: () => void;
  onStartNew: () => void;
  onContinue: () => void;
  onOpenCharacters: () => void;
  onOpenCodex: () => void;
  onOpenLeaderboard: () => void;
  onOpenCredits: () => void;
  modalOpen: boolean;
}

const LANGS: Array<{ code: Lang; label: string }> = [
  { code: 'th', label: 'ไทย' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  lang,
  playerName,
  difficulty,
  dailyChallenge,
  dailySeedCode,
  selectedCharacter,
  unlockedPostGameCount,
  hasSavedRun,
  mutagen,
  bestBiomass,
  bestZone,
  onChangeLang,
  onChangePlayerName,
  onChangeDifficulty,
  onToggleDailyChallenge,
  onStartNew,
  onContinue,
  onOpenCharacters,
  onOpenCodex,
  onOpenLeaderboard,
  onOpenCredits,
  modalOpen,
}) => {
  const t = TRANSLATIONS[lang];
  const activeStrainDef = CHARACTERS[selectedCharacter];
  const activeStrainCopy = t.characters[selectedCharacter];

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(playerName);

  useEffect(() => {
    if (!editingName) {
      setNameDraft(playerName);
    }
  }, [playerName, editingName]);

  const handleSaveName = () => {
    onChangePlayerName(nameDraft);
    setEditingName(false);
  };

  const handleCancelName = () => {
    setNameDraft(playerName);
    setEditingName(false);
  };

  // Enter / Space starts gameplay directly from Title screen (suppressed when modal or name editor is active)
  useEffect(() => {
    if (modalOpen || editingName) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartNew();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, editingName, onStartNew]);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-5 sm:p-10">
      {/* Subtle left-side scrim for crisp typography legibility without blurring live canvas */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background:
            'linear-gradient(100deg, rgba(2, 11, 19, 0.88) 0%, rgba(3, 15, 24, 0.62) 46%, rgba(3, 15, 24, 0.14) 100%)',
        }}
      />

      {/* Top Row: Compact Language Switcher & Stored Mutagen */}
      <div className="flex items-center justify-between gap-4 pointer-events-auto flex-wrap">
        <div className="flex items-center gap-3 text-xs sm:text-sm text-[#9ce8e1] hud-text-stroke flex-wrap">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Sparkles className="w-4 h-4 text-[#ffe875]" aria-hidden="true" />
            <span>{t.menu.mutagenBank}:</span>
            <strong className="font-mono-num text-[#ffe875] text-sm sm:text-base">{mutagen}</strong>
          </span>
          {bestBiomass > 0 && (
            <>
              <span aria-hidden="true" className="text-[#4a7f8a]">·</span>
              <span className="font-mono-num text-[#cbeee9]">
                {t.hud.zone} {bestZone}/{MAX_ZONE} · {bestBiomass}
              </span>
            </>
          )}
        </div>

        {/* 3-Language Segmented Switcher */}
        <div
          className="inline-flex items-center gap-1 p-1 rounded-lg border border-[#2c7a88]/60 bg-[#051824]/90"
          role="group"
          aria-label="Language selector"
        >
          {LANGS.map((item) => {
            const active = lang === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => onChangeLang(item.code)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#19c7bd] text-[#02121a]'
                    : 'text-[#a3d8d5] hover:text-white hover:bg-[#0c2d3f]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Left-Third Focal Lockup & Primary Actions */}
      <main className="my-auto max-w-lg flex flex-col items-start gap-4 sm:gap-5 pointer-events-auto">
        <TitleEmblemSvg subtitle={t.gameSubtitle} />

        <p className="text-sm sm:text-base leading-relaxed text-[#ccebe8] max-w-md hud-text-stroke">
          {t.storyHook}
        </p>

        {/* Player Identity / Inline Rename Strip */}
        <div className="flex flex-wrap items-center gap-2 w-full max-w-md">
          {editingName ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveName();
              }}
              className="flex items-center gap-1.5 w-full sm:w-auto p-1.5 rounded-xl bg-[#051a27]/95 border border-[#2de8da]/75"
            >
              <User className="w-4 h-4 text-[#7efcf0] ml-1 shrink-0" aria-hidden="true" />
              <input
                type="text"
                data-testid="player-name-input"
                value={nameDraft}
                maxLength={MAX_PLAYER_NAME_LENGTH}
                placeholder={t.menu.playerNamePlaceholder}
                autoFocus
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    handleCancelName();
                  }
                }}
                className="flex-1 min-w-[140px] sm:w-44 bg-[#031019] text-white text-xs sm:text-sm font-semibold px-2.5 py-1.5 rounded-lg border border-[#24667a] focus:outline-none focus:border-[#2de8da]"
              />
              <button
                type="submit"
                data-testid="player-name-save-btn"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#22e0cf] hover:bg-[#52f5e6] text-[#03151e] text-xs font-bold cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.menu.saveNameBtn}</span>
              </button>
              <button
                type="button"
                data-testid="player-name-cancel-btn"
                onClick={handleCancelName}
                aria-label={t.menu.cancelNameBtn}
                className="inline-flex items-center justify-center p-1.5 rounded-lg bg-[#0d2a3a] hover:bg-[#174157] text-[#a5d7dc] cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </form>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#051824]/90 border border-[#276d7d]/65 text-xs sm:text-sm">
              <User className="w-4 h-4 text-[#7efcf0] shrink-0" aria-hidden="true" />
              <span className="text-[#8fc8ce]">{t.menu.playerNameLabel}:</span>
              <strong
                data-testid="player-name-display"
                className="font-display font-bold text-[#e6fffc] max-w-[180px] truncate"
              >
                {playerName}
              </strong>
              <button
                type="button"
                data-testid="player-name-edit-btn"
                onClick={() => {
                  setNameDraft(playerName);
                  setEditingName(true);
                }}
                className="inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-md bg-[#0b2e40] hover:bg-[#144761] border border-[#2c8194]/60 text-[11px] font-semibold text-[#7efcf0] cursor-pointer transition-colors"
              >
                <Pencil className="w-3 h-3" aria-hidden="true" />
                <span>{t.menu.renameBtn}</span>
              </button>
            </div>
          )}
          <button
            type="button"
            data-testid="daily-seed-toggle"
            aria-pressed={dailyChallenge}
            onClick={onToggleDailyChallenge}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              dailyChallenge
                ? 'bg-[#2a1d47]/95 border-[#d88cff] text-[#f5d0fe] shadow-[0_0_14px_rgba(216,140,255,0.28)]'
                : 'bg-[#051824]/90 border-[#276d7d]/65 text-[#9bc8ce] hover:text-white hover:border-[#4fa7b8]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{t.menu.dailySeedLabel}</span>
            <span className="font-mono-num text-[11px] opacity-90">{dailySeedCode}</span>
            <span
              className={`ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                dailyChallenge ? 'bg-[#d88cff] text-[#170524]' : 'bg-[#0c2d3f] text-[#7cb2b8]'
              }`}
            >
              {dailyChallenge ? t.menu.dailySeedOn : t.menu.dailySeedOff}
            </span>
          </button>
        </div>

        {/* Difficulty Preset Selector (Novice / Normal / Hell) */}
        <div className="flex flex-col gap-1.5 w-full max-w-md">
          <span className="text-xs font-semibold tracking-wide text-[#88c8ce] hud-text-stroke">
            {t.menu.difficultyLabel}
          </span>
          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl border border-[#276d7d]/65 bg-[#051824]/90 w-full sm:w-auto sm:self-start"
            role="radiogroup"
            aria-label={t.menu.difficultyLabel}
          >
            {DIFFICULTY_ORDER.map((diffId) => {
              const active = difficulty === diffId;
              const accent = DIFFICULTIES[diffId].accentColor;
              return (
                <button
                  key={diffId}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  data-difficulty={diffId}
                  onClick={() => onChangeDifficulty(diffId)}
                  className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    active ? 'text-[#04111a]' : 'text-[#a9d7da] hover:text-white hover:bg-[#0c2d3f]'
                  }`}
                  style={
                    active
                      ? { backgroundColor: accent, boxShadow: `0 0 14px ${accent}55` }
                      : undefined
                  }
                >
                  {t.difficulties[diffId].name}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-[#a5d7dc] hud-text-stroke">
            {t.difficulties[difficulty].summary}
          </div>
        </div>

        {/* Primary & Secondary Menu Actions */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStartNew();
            }}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#22e0cf] hover:bg-[#52f5e6] active:scale-[0.98] text-[#03151e] font-display font-bold text-base sm:text-lg shadow-[0_0_24px_rgba(34,224,207,0.38)] transition-transform transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[48px]"
          >
            <Play className="w-5 h-5 fill-current" aria-hidden="true" />
            <span>{t.menu.startNew}</span>
          </button>

          {hasSavedRun && (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onContinue();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#0a293a]/95 hover:bg-[#103b52] border border-[#32c5bd]/65 text-[#e6fffc] font-semibold text-sm sm:text-base transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[48px]"
            >
              <RotateCcw className="w-4 h-4 text-[#5ef59b]" aria-hidden="true" />
              <span>{t.menu.continueRun}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="open-character-vault-btn"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenCharacters();
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#102236]/95 hover:bg-[#183552] border border-[#ffd866]/70 text-[#ffe875] font-semibold text-sm sm:text-base transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[48px]"
          >
            <Dna className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t.menu.characters}</span>
            <span className="font-mono-num text-xs text-[#9dece5]">
              {unlockedPostGameCount}/{POST_GAME_CHARACTERS.length}
            </span>
          </button>
        </div>

        {/* Equipped Strain Summary Line */}
        <div
          data-testid="title-selected-strain"
          className="text-xs sm:text-sm text-[#b9e6e8] hud-text-stroke flex items-center gap-2 flex-wrap"
        >
          <span>{t.menu.selectedStrain}:</span>
          <strong className="font-display" style={{ color: activeStrainDef.accentColor }}>
            {activeStrainCopy.name}
          </strong>
          <span className="text-[#5a8f99]" aria-hidden="true">·</span>
          <span className="text-[#9ad1d6]">{activeStrainCopy.archetype}</span>
        </div>

        {/* Utility Links (Codex, Top 10 Records & Credits) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
          <button
            type="button"
            onClick={onOpenCodex}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#8fe4dd] hover:text-white underline-offset-4 hover:underline transition-colors cursor-pointer py-1.5"
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span>{t.menu.codex}</span>
          </button>

          <span aria-hidden="true" className="text-[#3e7582]">·</span>

          <button
            type="button"
            data-testid="open-leaderboard-btn"
            onClick={onOpenLeaderboard}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#ffe875] hover:text-white underline-offset-4 hover:underline transition-colors cursor-pointer py-1.5"
          >
            <Trophy className="w-4 h-4" aria-hidden="true" />
            <span>{t.menu.leaderboard}</span>
          </button>

          <span aria-hidden="true" className="text-[#3e7582]">·</span>

          <button
            type="button"
            onClick={onOpenCredits}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#8fe4dd] hover:text-white underline-offset-4 hover:underline transition-colors cursor-pointer py-1.5"
          >
            <Info className="w-4 h-4" aria-hidden="true" />
            <span>{t.menu.credits}</span>
          </button>
        </div>
      </main>

      {/* Bottom Safe Margin: Flat Single-Line Control Hint */}
      <div className="text-xs sm:text-sm text-[#89c4c2] hud-text-stroke truncate">
        <span className="hidden md:inline">{t.menu.controlHintDesktop}</span>
        <span className="md:hidden">{t.menu.controlHintMobile}</span>
      </div>
    </div>
  );
};
