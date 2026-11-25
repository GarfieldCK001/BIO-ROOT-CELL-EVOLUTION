import React from 'react';
import { Award, Trophy, X } from 'lucide-react';
import { DIFFICULTIES, MAX_ZONE } from '../game/data';
import { TRANSLATIONS } from '../game/i18n';
import { Lang, LeaderboardEntry } from '../game/types';

interface LeaderboardModalProps {
  lang: Lang;
  entries: LeaderboardEntry[];
  highlightId?: string | null;
  onClose: () => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  lang,
  entries,
  highlightId,
  onClose,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#020912]/88"
      role="dialog"
      aria-modal="true"
      aria-label={t.leaderboard.title}
    >
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-[#04141f] border border-[#2a8694]/70 shadow-[0_20px_64px_rgba(0,0,0,0.82)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#1c5566]/65 bg-[#061c2a]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#ffe875]/15 border border-[#ffe875]/50 shrink-0">
              <Trophy className="w-5 h-5 text-[#ffe875]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-lg sm:text-xl text-[#e6fffc] truncate">
                {t.leaderboard.title}
              </h2>
              <p className="text-xs text-[#89c9cc] hidden sm:block">{t.leaderboard.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0d3344] hover:bg-[#154b63] text-sm font-semibold text-[#d9fffc] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            <span>{t.leaderboard.close}</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {entries.length === 0 ? (
            <div
              data-testid="leaderboard-empty"
              className="py-14 text-center flex flex-col items-center gap-3 text-[#8bc2c9]"
            >
              <Award className="w-10 h-10 text-[#3c7b88]" aria-hidden="true" />
              <p className="text-sm max-w-sm">{t.leaderboard.empty}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                data-testid="leaderboard-table"
                className="w-full text-left border-collapse text-xs sm:text-sm"
              >
                <thead>
                  <tr className="border-b border-[#194c5c]/75 text-[#88c5cc] text-[11px] sm:text-xs uppercase tracking-wide">
                    <th className="py-2.5 px-2.5 font-semibold">{t.leaderboard.rankCol}</th>
                    <th className="py-2.5 px-2.5 font-semibold">{t.leaderboard.playerCol}</th>
                    <th className="py-2.5 px-2.5 font-semibold">{t.leaderboard.scoreCol}</th>
                    <th className="py-2.5 px-2.5 font-semibold">{t.leaderboard.resultCol}</th>
                    <th className="py-2.5 px-2.5 font-semibold">{t.leaderboard.zoneCol}</th>
                    <th className="py-2.5 px-2.5 font-semibold">{t.leaderboard.biomassCol}</th>
                    <th className="py-2.5 px-2.5 font-semibold hidden sm:table-cell">{t.leaderboard.killsCol}</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">{t.leaderboard.timeCol}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#123847]/65">
                  {entries.map((entry, idx) => {
                    const rank = idx + 1;
                    const isHighlighted = Boolean(highlightId && entry.id === highlightId);
                    const rankColor =
                      rank === 1
                        ? 'text-[#ffe875]'
                        : rank === 2
                        ? 'text-[#d9ecff]'
                        : rank === 3
                        ? 'text-[#ffad66]'
                        : 'text-[#89bcc4]';
                    const diffAccent = DIFFICULTIES[entry.difficulty].accentColor;
                    return (
                      <tr
                        key={entry.id}
                        data-testid={`leaderboard-row-${rank}`}
                        className={
                          isHighlighted
                            ? 'bg-[#0c3547]/90'
                            : 'hover:bg-[#072130]/60 transition-colors'
                        }
                      >
                        <td className={`py-2.5 px-2.5 font-mono-num font-bold ${rankColor}`}>
                          #{rank}
                        </td>
                        <td
                          data-testid={`leaderboard-player-${rank}`}
                          className="py-2.5 px-2.5 font-display font-semibold text-[#e6fffc] max-w-[140px] truncate"
                        >
                          {entry.playerName}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono-num font-bold text-white">
                          {entry.score.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-[11px] font-bold ${
                                entry.victory ? 'text-[#5ef59b]' : 'text-[#ff758f]'
                              }`}
                            >
                              {entry.victory ? t.leaderboard.victoryTag : t.leaderboard.defeatTag}
                            </span>
                            <span className="text-[#406d7a]">·</span>
                            <span className="text-[11px] font-semibold" style={{ color: diffAccent }}>
                              {t.difficulties[entry.difficulty].name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5 font-mono-num text-[#7efcf0]">
                          {entry.zoneReached}/{MAX_ZONE}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono-num text-[#d8f3f5]">
                          {entry.finalBiomass}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono-num text-[#9be8be] hidden sm:table-cell">
                          {entry.kills}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono-num text-[#b5d6dc] text-right">
                          {formatDuration(entry.elapsedSec)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
