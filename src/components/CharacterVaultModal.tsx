import React, { useState } from 'react';
import { Check, Lock, Sparkles, Unlock, X, Zap } from 'lucide-react';
import {
  CHARACTER_LIST,
  LEGENDARY_CHARACTERS,
  MONSTER_CHARACTERS,
  POST_GAME_CHARACTERS,
} from '../game/data';
import { TRANSLATIONS } from '../game/i18n';
import { canUnlockCharacter } from '../game/rules';
import { CharacterDef, CharacterId, Lang, PersistentSave } from '../game/types';
import { OrganismPreviewSvg } from './BioIcons';

interface CharacterVaultModalProps {
  lang: Lang;
  save: PersistentSave;
  onSelect: (id: CharacterId) => void;
  onUnlock: (id: CharacterId) => void;
  onClose: () => void;
}

type VaultFilter = 'all' | 'legendary' | 'monster';

const CharacterCellPreviewSvg: React.FC<{ def: CharacterDef; locked: boolean }> = ({
  def,
  locked,
}) => {
  // Playable Monsters & Bosses use their authentic organism emblem preview
  if (def.organismKind) {
    return (
      <div className={`shrink-0 ${locked ? 'opacity-65' : 'opacity-100'}`}>
        <OrganismPreviewSvg kind={def.organismKind} size={60} />
      </div>
    );
  }

  const { id, primaryColor, accentColor, coreColor } = def;
  return (
    <svg
      viewBox="-36 -36 72 72"
      className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 ${locked ? 'opacity-65' : 'opacity-100'}`}
      aria-hidden="true"
    >
      {/* Ambient glow halo */}
      <circle cx="0" cy="0" r="30" fill={accentColor} fillOpacity="0.14" />

      {/* Unique silhouette ornaments per strain */}
      {id === 'pyro_phage' && (
        <g stroke={accentColor} strokeWidth="2.2" fill={primaryColor} fillOpacity="0.45">
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const x1 = Math.cos(a - 0.16) * 20;
            const y1 = Math.sin(a - 0.16) * 20;
            const xt = Math.cos(a) * 31;
            const yt = Math.sin(a) * 31;
            const x2 = Math.cos(a + 0.16) * 20;
            const y2 = Math.sin(a + 0.16) * 20;
            return <polygon key={i} points={`${x1},${y1} ${xt},${yt} ${x2},${y2}`} />;
          })}
        </g>
      )}

      {id === 'cryo_diatom' && (
        <polygon
          points="0,-31 27,-15.5 27,15.5 0,31 -27,15.5 -27,-15.5"
          fill={primaryColor}
          fillOpacity="0.22"
          stroke={accentColor}
          strokeWidth="2.2"
        />
      )}

      {id === 'chrono_cilia' && (
        <g fill="none" stroke={accentColor}>
          <circle cx="0" cy="0" r="29" strokeWidth="1.5" strokeDasharray="5 4" />
          <circle cx="0" cy="0" r="24" strokeWidth="1" strokeOpacity="0.6" />
          <line x1="0" y1="0" x2="0" y2="-15" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="0" y1="0" x2="11" y2="5" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {id === 'void_amoeba' && (
        <g fill="none">
          <circle cx="0" cy="0" r="29" stroke={accentColor} strokeWidth="2" strokeDasharray="9 4" />
          <circle cx="0" cy="0" r="24" stroke={primaryColor} strokeWidth="2.4" strokeOpacity="0.7" />
        </g>
      )}

      {id === 'tesla_medusa' && (
        <g fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round">
          <polyline points="-26,-10 -18,-4 -24,3 -16,9" />
          <polyline points="26,-10 18,-4 24,3 16,9" />
          <polyline points="-10,-26 -3,-18 4,-24 10,-16" />
          <polyline points="-10,26 -3,18 4,24 10,16" />
        </g>
      )}

      {id === 'venom_hydra' && (
        <g fill={primaryColor} fillOpacity="0.4" stroke={accentColor} strokeWidth="1.6">
          <circle cx="-18" cy="-16" r="8" />
          <circle cx="18" cy="-16" r="8" />
          <circle cx="-18" cy="16" r="8" />
          <circle cx="18" cy="16" r="8" />
        </g>
      )}

      {id === 'aegis_titan' && (
        <polygon
          points="-12,-29 12,-29 29,-12 29,12 12,29 -12,29 -29,12 -29,-12"
          fill={primaryColor}
          fillOpacity="0.28"
          stroke={accentColor}
          strokeWidth="2.6"
        />
      )}

      {id === 'crimson_vamp' && (
        <g fill={accentColor} stroke="#fff0f4" strokeWidth="1">
          <polygon points="-14,-16 -7,-31 -2,-17" />
          <polygon points="14,-16 7,-31 2,-17" />
          <polygon points="-24,4 -32,14 -16,13" />
          <polygon points="24,4 32,14 16,13" />
        </g>
      )}

      {id === 'prism_phantom' && (
        <g>
          <polygon
            points="0,-31 28,0 0,31 -28,0"
            fill={primaryColor}
            fillOpacity="0.24"
            stroke={accentColor}
            strokeWidth="2"
          />
          <polygon
            points="0,-22 20,0 0,22 -20,0"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.65"
            strokeWidth="1.2"
          />
        </g>
      )}

      {id === 'omega_prime' && (
        <g>
          <circle cx="0" cy="0" r="30" fill="none" stroke={accentColor} strokeWidth="2.2" />
          <circle
            cx="0"
            cy="0"
            r="25"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.6"
            strokeDasharray="6 3"
          />
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            return (
              <circle
                key={i}
                cx={Math.cos(a) * 28}
                cy={Math.sin(a) * 28}
                r="3.2"
                fill={i % 2 === 0 ? accentColor : primaryColor}
              />
            );
          })}
        </g>
      )}

      {/* Main Cell Membrane */}
      <circle
        cx="0"
        cy="0"
        r={id === 'void_amoeba' ? '18' : '20'}
        fill={id === 'void_amoeba' ? '#090314' : primaryColor}
        fillOpacity={id === 'void_amoeba' ? '0.95' : '0.42'}
        stroke={accentColor}
        strokeWidth="2.4"
      />

      {/* Inner Organelle Ring */}
      <circle
        cx="0"
        cy="0"
        r="12"
        fill="none"
        stroke={coreColor}
        strokeOpacity="0.55"
        strokeWidth="1.3"
      />

      {/* Glowing Nucleus */}
      <circle cx="0" cy="0" r="7" fill={coreColor} />
      <circle cx="-2.2" cy="-2.2" r="2.2" fill="#ffffff" fillOpacity="0.85" />
    </svg>
  );
};

export const CharacterVaultModal: React.FC<CharacterVaultModalProps> = ({
  lang,
  save,
  onSelect,
  onUnlock,
  onClose,
}) => {
  const t = TRANSLATIONS[lang];
  const [filter, setFilter] = useState<VaultFilter>('all');

  const unlockedPostGameCount = POST_GAME_CHARACTERS.filter((c) =>
    save.unlockedCharacters.includes(c.id)
  ).length;

  const visibleCharacters =
    filter === 'legendary'
      ? LEGENDARY_CHARACTERS
      : filter === 'monster'
      ? MONSTER_CHARACTERS
      : CHARACTER_LIST;

  return (
    <div
      data-testid="character-vault-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#020912]/90"
      role="dialog"
      aria-modal="true"
      aria-label={t.characterVault.title}
    >
      <div className="w-full max-w-5xl max-h-[92vh] rounded-2xl bg-[#041521] border border-[#2d8896]/75 shadow-[0_20px_64px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-4 sm:p-5 border-b border-[#184c5c]/75 bg-[#03101a]">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg sm:text-2xl text-[#e6fffc] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ffe875] shrink-0" aria-hidden="true" />
              <span className="truncate">{t.characterVault.title}</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#95ccd1] mt-1">{t.characterVault.subtitle}</p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#061e2e] border border-[#24667a]/70 text-xs">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#ffe875]" aria-hidden="true" />
                <span className="text-[#95ccd1]">{t.characterVault.mutagenBalance}:</span>
                <strong
                  data-testid="vault-mutagen-balance"
                  className="font-mono-num text-[#ffe875] text-sm"
                >
                  {save.mutagen.toLocaleString()}
                </strong>
              </div>
              <span className="text-[#2f6373]" aria-hidden="true">
                |
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#95ccd1]">{t.characterVault.unlockedCount}:</span>
                <strong
                  data-testid="vault-unlocked-count"
                  className="font-mono-num text-[#7efcf0] text-sm"
                >
                  {unlockedPostGameCount}/{POST_GAME_CHARACTERS.length}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t.characterVault.close}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#082536] hover:bg-[#0e3952] border border-[#2b7487]/65 text-[#d7f7f5] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mobile Balance Strip */}
        <div className="sm:hidden flex items-center justify-between px-4 py-2 bg-[#051a27] border-b border-[#184c5c]/60 text-xs">
          <span className="inline-flex items-center gap-1.5 text-[#ffe875] font-mono-num font-bold">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            {t.characterVault.mutagenBalance}: {save.mutagen.toLocaleString()}
          </span>
          <span className="font-mono-num text-[#7efcf0] font-bold">
            {t.characterVault.unlockedCount}: {unlockedPostGameCount}/{POST_GAME_CHARACTERS.length}
          </span>
        </div>

        {/* Post-Game Gate Status Banner */}
        <div
          data-testid="vault-lock-banner"
          className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b ${
            save.hasClearedGame
              ? 'bg-[#07261f] border-[#268c6e]/60 text-[#7ff7c4]'
              : 'bg-[#2a1707] border-[#b87118]/65 text-[#ffd166]'
          }`}
        >
          {save.hasClearedGame ? (
            <Unlock className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          <span>
            {save.hasClearedGame
              ? t.characterVault.postGameReadyBanner
              : t.characterVault.postGameLockedBanner}
          </span>
        </div>

        {/* Category Filter Bar: All / 10 Legendary / 10 Monsters & Bosses */}
        <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#031019] border-b border-[#164252]/70 overflow-x-auto">
          {(
            [
              { id: 'all', label: `${t.characterVault.tabAll} (${CHARACTER_LIST.length})` },
              {
                id: 'legendary',
                label: `${t.characterVault.tabLegendary} (${LEGENDARY_CHARACTERS.length})`,
              },
              {
                id: 'monster',
                label: `${t.characterVault.tabMonsters} (${MONSTER_CHARACTERS.length})`,
              },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={`vault-tab-${item.id}`}
              onClick={() => setFilter(item.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === item.id
                  ? 'bg-[#22e0cf] text-[#02151e]'
                  : 'bg-[#092332] text-[#a2d9dc] hover:text-white hover:bg-[#0f3448]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Character Grid */}
        <div className="overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {visibleCharacters.map((def) => {
            const copy = t.characters[def.id];
            const isUnlocked = !def.isPostGame || save.unlockedCharacters.includes(def.id);
            const isSelected = save.selectedCharacter === def.id;
            const check = canUnlockCharacter(def.id, save);

            return (
              <div
                key={def.id}
                data-testid={`character-card-${def.id}`}
                className={`rounded-xl p-3.5 sm:p-4 border transition-colors flex flex-col gap-3 ${
                  isSelected
                    ? 'bg-[#072434] border-[#2de8da] shadow-[0_0_20px_rgba(34,224,207,0.22)]'
                    : isUnlocked
                    ? 'bg-[#061c2a] border-[#1f5c6e]/75 hover:border-[#3794a8]'
                    : 'bg-[#04121d] border-[#173c4a]/70'
                }`}
              >
                {/* Top Row: Visual Preview + Identity + Category/Cost */}
                <div className="flex items-start gap-3">
                  <CharacterCellPreviewSvg def={def} locked={!isUnlocked} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3
                        className="font-display font-bold text-base sm:text-lg leading-tight"
                        style={{ color: isUnlocked ? def.accentColor : '#94b5bf' }}
                      >
                        {copy.name}
                      </h3>

                      <div className="flex items-center gap-1.5">
                        {def.category === 'starter' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#0a2f40] border border-[#2a7b8c]/60 text-[#7efcf0]">
                            {t.characterVault.starterBadge}
                          </span>
                        )}
                        {def.category === 'monster' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#2a1226] border border-[#b5488f]/65 text-[#ffb0e3]">
                            {t.characterVault.monsterBadge}
                          </span>
                        )}
                        {def.category === 'legendary' && isUnlocked && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#0b2a38] border border-[#3594a8]/60 text-[#9ceef5]">
                            {t.characterVault.legendaryBadge}
                          </span>
                        )}
                        {def.isPostGame && !isUnlocked && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono-num font-bold px-2 py-0.5 rounded-md bg-[#261e06] border border-[#c79522]/65 text-[#ffe875]">
                            <Sparkles className="w-3 h-3" aria-hidden="true" />
                            {def.mutagenCost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-[#9fd7db] mt-0.5">
                      {copy.archetype}
                    </div>

                    <p className="text-xs text-[#cde9eb] leading-relaxed mt-1.5">
                      <span className="text-[#7ec6cc] font-semibold">
                        {t.characterVault.passiveLabel}:{' '}
                      </span>
                      {copy.passive}
                    </p>
                  </div>
                </div>

                {/* Special Skill Panel */}
                <div
                  className="rounded-lg p-2.5 border bg-[#031019]/90"
                  style={{
                    borderColor: isUnlocked ? `${def.accentColor}55` : 'rgba(38, 86, 102, 0.45)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-bold text-white">
                      <Zap
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: def.accentColor }}
                        aria-hidden="true"
                      />
                      <span>
                        {t.characterVault.specialLabel}: {copy.specialName}
                      </span>
                    </span>
                    {def.specialCooldown > 0 && (
                      <span className="font-mono-num text-[11px] text-[#8dc7cc] shrink-0">
                        {t.characterVault.cooldownLabel} {def.specialCooldown}s
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#a9d4d9] mt-1 leading-snug">
                    {copy.specialDesc}
                  </p>
                </div>

                {/* Action Footer */}
                <div className="mt-auto pt-0.5">
                  {isUnlocked ? (
                    isSelected ? (
                      <div
                        data-testid={`character-action-${def.id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#164b54] border border-[#2de8da] text-[#9afff6] font-bold text-xs sm:text-sm"
                      >
                        <Check className="w-4 h-4" aria-hidden="true" />
                        <span>{t.characterVault.selectedBadge}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-testid={`character-action-${def.id}`}
                        onClick={() => onSelect(def.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#22e0cf] hover:bg-[#5ef7e9] text-[#03151e] font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                      >
                        <span>{t.characterVault.selectBtn}</span>
                      </button>
                    )
                  ) : check.ok ? (
                    <button
                      type="button"
                      data-testid={`character-action-${def.id}`}
                      onClick={() => onUnlock(def.id)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#ffe875] hover:bg-[#fff2a6] text-[#171202] font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-[0_0_16px_rgba(255,232,117,0.3)]"
                    >
                      <Unlock className="w-4 h-4" aria-hidden="true" />
                      <span>
                        {t.characterVault.unlockBtn} · {def.mutagenCost.toLocaleString()} Mutagen
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      data-testid={`character-action-${def.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#0b212e] border border-[#1d4554] text-[#6d94a1] font-semibold text-xs sm:text-sm cursor-not-allowed"
                    >
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {check.reason === 'need_clear'
                          ? `${t.characterVault.needClearBtn} · ${def.mutagenCost.toLocaleString()} Mutagen`
                          : `${t.characterVault.needMutagenBtn} (${def.mutagenCost.toLocaleString()})`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
