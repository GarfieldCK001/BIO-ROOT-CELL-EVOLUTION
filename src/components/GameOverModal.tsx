import React from 'react';
import { Award, Dna, Home, Infinity as InfinityIcon, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { DIFFICULTIES, MAX_ZONE } from '../game/data';
import { formatTemplate, TRANSLATIONS } from '../game/i18n';
import { getMutagenUpgradeCost } from '../game/rules';
import { Lang, MutagenUpgrades, RunSummary } from '../game/types';

interface GameOverModalProps {
  lang: Lang;
  playerName: string;
  summary: RunSummary;
  newRank: number | null;
  totalMutagen: number;
  upgrades: MutagenUpgrades;
  onBuyUpgrade: (key: keyof MutagenUpgrades) => void;
  onOpenCharacters: () => void;
  onOpenLeaderboard: () => void;
  onContinueEndless: () => void;
  onPlayAgain: () => void;
  onBackToTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  lang,
  playerName,
  summary,
  newRank,
  totalMutagen,
  upgrades,
  onBuyUpgrade,
  onOpenCharacters,
  onOpenLeaderboard,
  onContinueEndless,
  onPlayAgain,
  onBackToTitle,
}) => {
  const t = TRANSLATIONS[lang];
  const m = Math.floor(summary.elapsedSec / 60);
  const s = summary.elapsedSec % 60;
  const timeStr = `${m}:${s < 10 ? '0' : ''}${s}`;

  const upgradeRows: Array<{
    key: keyof MutagenUpgrades;
    title: string;
    desc: string;
    level: number;
  }> = [
    {
      key: 'vitality',
      title: t.gameover.labVitality,
      desc: t.gameover.labVitalityDesc,
      level: upgrades.vitality,
    },
    {
      key: 'metabolism',
      title: t.gameover.labMetabolism,
      desc: t.gameover.labMetabolismDesc,
      level: upgrades.metabolism,
    },
    {
      key: 'dnaMagnet',
      title: t.gameover.labMagnet,
      desc: t.gameover.labMagnetDesc,
      level: upgrades.dnaMagnet,
    },
    {
      key: 'mobility',
      title: t.gameover.labMobility,
      desc: t.gameover.labMobilityDesc,
      level: upgrades.mobility,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-[#020912]/88"
      role="dialog"
      aria-modal="true"
      aria-label={summary.victory ? t.gameover.victoryTitle : t.gameover.defeatTitle}
    >
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#041521] border border-[#2d8896]/70 p-5 sm:p-6 shadow-[0_20px_64px_rgba(0,0,0,0.8)] flex flex-col gap-4">
        {/* Outcome Heading */}
        <div className="text-center space-y-1.5">
          {summary.victory && (
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ffe875]/15 border border-[#ffe875]/60 mb-1">
              <Trophy className="w-6 h-6 text-[#ffe875]" aria-hidden="true" />
            </div>
          )}
          <h2
            className={`font-display font-bold text-2xl sm:text-3xl ${
              summary.victory ? 'text-[#ffe875]' : 'text-[#ff6b8b]'
            }`}
          >
            {summary.victory ? t.gameover.victoryTitle : t.gameover.defeatTitle}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold tracking-wide">
            <span className="text-[#7efcf0]">
              {t.gameover.playerLabel}: {summary.playerName || playerName}
            </span>
            <span className="text-[#3e7280]">·</span>
            <span style={{ color: DIFFICULTIES[summary.difficulty].accentColor }}>
              {t.difficulties[summary.difficulty].name}
            </span>
            <span className="text-[#3e7280]">·</span>
            <span className="text-[#e6fffc] font-mono-num">
              {t.gameover.runScore}: {summary.score.toLocaleString()}
            </span>
          </div>
          {newRank !== null && (
            <div
              data-testid="gameover-new-rank"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#292007] border border-[#d4a226]/70 text-xs font-bold text-[#ffe875]"
            >
              <Award className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{formatTemplate(t.gameover.newRankBadge, { rank: newRank })}</span>
            </div>
          )}
          <p className="text-xs sm:text-sm text-[#b9dddf] max-w-md mx-auto">
            {summary.victory ? t.gameover.victoryDesc : t.gameover.defeatDesc}
          </p>
          {summary.victory && (
            <div
              data-testid="gameover-postgame-unlocked"
              className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#082a22] border border-[#2cd99b]/70 text-xs font-bold text-[#88ffd1]"
            >
              <Dna className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.gameover.postGameUnlockedNotice}</span>
            </div>
          )}
        </div>

        {/* Run Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-[#061e2e] border border-[#194c5c]/65 text-center">
            <div className="text-[11px] text-[#8bc5cb]">{t.gameover.zoneReached}</div>
            <div className="font-mono-num font-bold text-lg text-[#7efcf0] mt-0.5">
              {t.hud.zone} {summary.zoneReached}/{MAX_ZONE}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#061e2e] border border-[#194c5c]/65 text-center">
            <div className="text-[11px] text-[#8bc5cb]">{t.gameover.finalBiomass}</div>
            <div className="font-mono-num font-bold text-lg text-white mt-0.5">
              {summary.finalBiomass}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#061e2e] border border-[#194c5c]/65 text-center">
            <div className="text-[11px] text-[#8bc5cb]">{t.gameover.absorbed}</div>
            <div className="font-mono-num font-bold text-lg text-[#5ef59b] mt-0.5">
              {summary.kills}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#061e2e] border border-[#194c5c]/65 text-center">
            <div className="text-[11px] text-[#8bc5cb]">{t.gameover.timeSurvived}</div>
            <div className="font-mono-num font-bold text-lg text-white mt-0.5">{timeStr}</div>
          </div>
        </div>

        {/* Mutagen Earned & Permanent Lab Upgrades */}
        <div className="p-4 rounded-xl bg-[#031019] border border-[#236575]/65 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-display font-bold text-sm text-[#e6fffc] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#ffe875]" aria-hidden="true" />
              <span>{t.gameover.labTitle}</span>
            </div>
            <div className="text-xs font-mono-num text-[#ffe875]">
              +{summary.mutagenEarned} · {t.gameover.mutagenTotal}: <strong>{totalMutagen}</strong>
            </div>
          </div>

          <div className="space-y-2">
            {upgradeRows.map((row) => {
              const cost = getMutagenUpgradeCost(row.level);
              const affordable = totalMutagen >= cost && row.level < 6;
              return (
                <div
                  key={row.key}
                  data-testid={`lab-upgrade-${row.key}`}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#061c2a] border border-[#184859]/60"
                >
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-white">
                      {row.title}{' '}
                      <span className="font-mono-num text-[#7efcf0]">Lv.{row.level}</span>
                    </div>
                    <div className="text-[11px] text-[#98c8cd]">{row.desc}</div>
                  </div>
                  <button
                    type="button"
                    disabled={!affordable}
                    onClick={() => onBuyUpgrade(row.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono-num whitespace-nowrap shrink-0 transition-colors ${
                      affordable
                        ? 'bg-[#ffe875] hover:bg-[#fff2a6] text-[#171202] cursor-pointer'
                        : 'bg-[#0c2330] text-[#5e8591] cursor-not-allowed'
                    }`}
                  >
                    {row.level >= 6 ? 'MAX' : `${t.gameover.upgradeBtn} (${cost})`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outcome CTAs */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
          {summary.victory && !summary.endlessMode && (
            <button
              type="button"
              onClick={onContinueEndless}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ffe875] hover:bg-[#fff2a6] text-[#171202] font-display font-bold text-sm sm:text-base cursor-pointer transition-colors"
            >
              <InfinityIcon className="w-4 h-4" aria-hidden="true" />
              <span>{t.gameover.continueEndless}</span>
            </button>
          )}

          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#22e0cf] hover:bg-[#5ef7e9] text-[#02151e] font-display font-bold text-sm sm:text-base cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>{t.gameover.playAgain}</span>
          </button>

          <button
            type="button"
            data-testid="gameover-character-vault-btn"
            onClick={onOpenCharacters}
            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#10243a] hover:bg-[#173654] border border-[#ffd866]/70 text-[#ffe875] font-semibold text-sm cursor-pointer transition-colors"
          >
            <Dna className="w-4 h-4" aria-hidden="true" />
            <span>{t.gameover.characterVault}</span>
          </button>

          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0a2b3d] hover:bg-[#113d54] border border-[#d4a226]/65 text-[#ffe875] font-semibold text-sm cursor-pointer transition-colors"
          >
            <Trophy className="w-4 h-4" aria-hidden="true" />
            <span>{t.gameover.viewLeaderboard}</span>
          </button>

          <button
            type="button"
            onClick={onBackToTitle}
            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0a2b3d] hover:bg-[#113d54] border border-[#24667a] text-[#e6fffc] font-semibold text-sm cursor-pointer transition-colors"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>{t.gameover.backToTitle}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
