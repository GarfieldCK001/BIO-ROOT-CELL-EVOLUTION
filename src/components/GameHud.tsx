import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  Gamepad2,
  Music,
  Pause,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { CHARACTERS, DIFFICULTIES, DNA_COLORS, DNA_ORDER, MAX_ZONE, ZONES } from '../game/data';
import { formatTemplate, TRANSLATIONS } from '../game/i18n';
import { HudSnapshot, Lang, OrganismKind, SkillId, VirtualJoystickInput, ZoneId } from '../game/types';
import { DnaIconSvg, RootTreeIconSvg } from './BioIcons';

interface GameHudProps {
  lang: Lang;
  hud: HudSnapshot;
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  touchMode: boolean;
  onToggleTouchMode: () => void;
  onToggleSfx: () => void;
  onToggleBgm: () => void;
  onOpenSkillTree: () => void;
  onPause: () => void;
  onAdvanceZone: () => void;
  onJoystickChange: (input: VirtualJoystickInput) => void;
  onDash: () => void;
  onSkill1: () => void;
  onSkill2: () => void;
  onCharacterSpecial: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  lang,
  hud,
  sfxEnabled,
  bgmEnabled,
  touchMode,
  onToggleTouchMode,
  onToggleSfx,
  onToggleBgm,
  onOpenSkillTree,
  onPause,
  onAdvanceZone,
  onJoystickChange,
  onDash,
  onSkill1,
  onSkill2,
  onCharacterSpecial,
}) => {
  const t = TRANSLATIONS[lang];
  const zoneInfo = t.zones[hud.zone];
  const zoneCfg = ZONES[hud.zone];

  // Virtual Joystick Touch/Pointer tracking
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const joyPointerId = useRef<number | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  const updateJoystickFromPointer = (clientX: number, clientY: number) => {
    const el = joyBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const maxDist = rect.width * 0.36;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }
    setKnobPos({ x: dx, y: dy });
    onJoystickChange({
      active: true,
      dx: dx / maxDist,
      dy: dy / maxDist,
    });
  };

  const handleJoyDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    joyPointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateJoystickFromPointer(e.clientX, e.clientY);
  };

  const handleJoyMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== e.pointerId) return;
    e.stopPropagation();
    updateJoystickFromPointer(e.clientX, e.clientY);
  };

  const handleJoyUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== e.pointerId) return;
    e.stopPropagation();
    joyPointerId.current = null;
    setKnobPos({ x: 0, y: 0 });
    onJoystickChange({ active: false, dx: 0, dy: 0 });
  };

  // Resolve localized zone goal hint
  const [goalKey, goalTarget] = hud.nextZoneRequirementText.split(':');
  const zoneGoalText =
    goalKey === 'zoneGoalFinal'
      ? t.hud.zoneGoalFinal
      : goalKey === 'zoneGoalBoss'
      ? t.hud.zoneGoalBoss
      : formatTemplate(t.hud.zoneGoalGrow, { target: goalTarget ?? '' });

  // Resolve localized toast text
  let toastText = '';
  if (hud.toast) {
    const raw = (t.toasts as Record<string, string>)[hud.toast.key] ?? '';
    const resolvedParams: Record<string, string | number> = { ...(hud.toast.params ?? {}) };
    if (hud.toast.key === 'evolved' && typeof resolvedParams.name === 'string') {
      const sk = t.skills[resolvedParams.name as SkillId];
      if (sk) resolvedParams.name = sk.name;
    } else if (
      (hud.toast.key === 'bossSpawned' || hud.toast.key === 'bossDefeated') &&
      typeof resolvedParams.name === 'string'
    ) {
      const org = t.organisms[resolvedParams.name as OrganismKind];
      if (org) resolvedParams.name = org.name;
    } else if (hud.toast.key === 'enteredZone' && resolvedParams.zone) {
      const zn = t.zones[Number(resolvedParams.zone) as ZoneId];
      if (zn) resolvedParams.name = zn.name;
    }
    toastText = formatTemplate(raw, resolvedParams);
  }

  const hpPct = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
  const ghostPct = Math.max(hpPct, Math.min(100, (hud.ghostHp / Math.max(1, hud.maxHp)) * 100));
  const enPct = Math.max(0, Math.min(100, (hud.energy / Math.max(1, hud.maxEnergy)) * 100));

  const skill1Label =
    hud.unlockedActives.skill1Name === 'nova'
      ? t.hud.nova
      : hud.unlockedActives.skill1Name === 'spit'
      ? t.hud.spit
      : t.hud.locked;

  const skill2Label =
    hud.unlockedActives.skill2Name === 'juggernaut'
      ? t.hud.juggernaut
      : hud.unlockedActives.skill2Name === 'stealth'
      ? t.hud.stealth
      : hud.unlockedActives.skill2Name === 'volt'
      ? t.hud.volt
      : t.hud.locked;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
      {/* TOP BAR: Compact Perimeter Clusters */}
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        {/* TOP-LEFT: Vitals, Biomass & Zone Progress */}
        <div className="pointer-events-auto flex flex-col gap-1.5 w-[176px] sm:w-[270px] p-2 sm:p-3 rounded-xl bg-[#04141f]/88 border border-[#246f7d]/55 shadow-[0_6px_22px_rgba(0,0,0,0.45)]">
          {/* HP Bar with delayed ghost trail */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline justify-between text-[11px] sm:text-xs">
              <span className="font-semibold text-[#ff9bb0] tracking-wide">{t.hud.hp}</span>
              <span className="font-mono-num font-bold text-white">
                {hud.hp}/{hud.maxHp}
              </span>
            </div>
            <div className="relative h-2.5 rounded-full bg-[#091e2b] overflow-hidden border border-[#274b5e]/70">
              <div
                className="absolute inset-0 bg-[#ffb3c1]/65 origin-left"
                style={{ transform: `scaleX(${ghostPct / 100})` }}
              />
              <div
                className="absolute inset-0 bg-[#ff3b6b] origin-left"
                style={{ transform: `scaleX(${hpPct / 100})` }}
              />
            </div>
          </div>

          {/* Energy Bar */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline justify-between text-[11px] sm:text-xs">
              <span className="font-semibold text-[#ffe875] tracking-wide">{t.hud.energy}</span>
              <span className="font-mono-num font-bold text-[#fff5b8]">
                {hud.energy}/{hud.maxEnergy}
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-[#091e2b] overflow-hidden border border-[#274b5e]/70">
              <div
                className="absolute inset-0 bg-[#ffd93b] origin-left"
                style={{ transform: `scaleX(${enPct / 100})` }}
              />
            </div>
          </div>

          {/* Biomass / Zone & Difficulty Metadata Line */}
          <div className="flex items-center justify-between pt-1 border-t border-[#1c4b5c]/60 text-[11px] sm:text-xs gap-1">
            <div className="truncate min-w-0">
              <span className="font-bold" style={{ color: zoneCfg.accentColor }}>
                {hud.endlessMode ? t.hud.endless : `${t.hud.zone} ${hud.zone}/${MAX_ZONE}`}
              </span>
              <span className="text-[#4a7f8a] mx-1 hidden sm:inline" aria-hidden="true">·</span>
              <span className="text-[#8fc2c4] hidden sm:inline truncate">{zoneInfo.name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="font-bold text-[10px] sm:text-[11px]"
                style={{ color: DIFFICULTIES[hud.difficulty].accentColor }}
              >
                {t.difficulties[hud.difficulty].name}
              </span>
              <span className="font-mono-num font-bold text-[#7efcf0]">
                {hud.biomass}
              </span>
            </div>
          </div>

          {/* Active Post-Game Strain Indicator */}
          {hud.characterId !== 'specimen_0' && (
            <div
              data-testid="hud-active-character"
              className="flex items-center justify-between gap-1.5 px-2 py-0.5 rounded-md bg-[#061d2b] border text-[10px] sm:text-[11px] font-bold"
              style={{
                borderColor: `${CHARACTERS[hud.characterId].accentColor}75`,
                color: CHARACTERS[hud.characterId].accentColor,
              }}
            >
              <span className="inline-flex items-center gap-1 truncate">
                <Sparkles className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{t.characters[hud.characterId].name}</span>
              </span>
              <span className="font-mono-num text-[10px] text-[#bfeef2] shrink-0">[R]</span>
            </div>
          )}

          {/* Per-Zone Growth / Evolution Halt Alert */}
          {(hud.growthCapped || hud.evoZoneCapped) && (
            <div
              data-testid="zone-cap-warning"
              className="mt-0.5 px-2 py-1 rounded-md bg-[#331d05]/95 border border-[#ffb703]/80 text-[10px] sm:text-[11px] font-bold text-[#ffd166] leading-snug"
            >
              {t.hud.growthCappedBanner}
            </div>
          )}

          {/* Zone Goal or Advance Gateway Button */}
          {hud.nextZoneUnlocked ? (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onAdvanceZone();
              }}
              className="mt-0.5 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22e0cf] hover:bg-[#5ef7e9] text-[#02151f] font-bold text-xs shadow-[0_0_16px_rgba(34,224,207,0.45)] transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>{t.hud.nextZoneBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          ) : (
            <div className="text-[10px] sm:text-[11px] text-[#8ec1c7] leading-tight truncate">
              {zoneGoalText}
            </div>
          )}
        </div>

        {/* TOP-CENTER: Boss HP Bar + Toast Alert */}
        <div className="hidden md:flex flex-col items-center gap-2 flex-1 max-w-md px-2">
          {hud.boss && (
            <div className="w-full p-2.5 rounded-xl bg-[#180614]/92 border border-[#ff3b7f]/70 shadow-[0_6px_24px_rgba(255,40,110,0.3)]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-display font-bold text-[#ff82ac] tracking-wide">
                  {t.organisms[hud.boss.kind].name}
                </span>
                <span className="font-mono-num font-bold text-white">
                  {hud.boss.hp} / {hud.boss.maxHp}
                </span>
              </div>
              <div className="h-3 rounded-full bg-[#2e091b] overflow-hidden border border-[#ff4d8a]/50">
                <div
                  className="h-full w-full bg-[#ff3b7f] origin-left"
                  style={{
                    transform: `scaleX(${Math.max(0, hud.boss.hp / Math.max(1, hud.boss.maxHp))})`,
                  }}
                />
              </div>
            </div>
          )}

          {toastText && hud.toast && (
            <div
              className="px-4 py-1.5 rounded-lg bg-[#051824]/92 border text-xs sm:text-sm font-semibold text-white shadow-lg"
              style={{ borderColor: hud.toast.accent }}
            >
              {toastText}
            </div>
          )}
        </div>

        {/* TOP-RIGHT: Utility Buttons + Root Tree CTA + Minimap Radar */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            {/* Root Skill Tree Button with Red Notification Dot */}
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenSkillTree();
              }}
              aria-label={t.hud.skills}
              className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#062430]/92 hover:bg-[#0c3c4f] border border-[#3ae8d9]/65 text-[#e6fffc] font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <RootTreeIconSvg size={18} />
              <span className="hidden sm:inline">{t.hud.skills}</span>
              <span className="hidden lg:inline font-mono-num text-[10px] text-[#7efcf0]/80">[T]</span>
              {hud.canAffordAnySkill && (
                <span
                  aria-label="Upgrade available"
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#ff3355] border-2 border-[#03111a]"
                />
              )}
            </button>

            {/* Touch Pad Toggle (desktop/tablet quick toggle; auto-on for mobile) */}
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleTouchMode();
              }}
              aria-label={t.hud.touchControls}
              title={t.hud.touchControls}
              className={`hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                touchMode
                  ? 'bg-[#19c7bd]/25 border-[#2de8da] text-[#7efcf0]'
                  : 'bg-[#041622]/90 border-[#246273]/60 text-[#8dc2c9] hover:text-white'
              }`}
            >
              <Gamepad2 className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* BGM Toggle (hidden on narrow mobile; always available in Pause menu) */}
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleBgm();
              }}
              aria-label={t.hud.bgm}
              title={t.hud.bgm}
              className={`hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                bgmEnabled
                  ? 'bg-[#041622]/90 border-[#246273]/60 text-[#7efcf0] hover:text-white'
                  : 'bg-[#041622]/90 border-[#3c4b59]/60 text-[#5d7a85]'
              }`}
            >
              <Music className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* SFX Toggle (hidden on narrow mobile; always available in Pause menu) */}
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleSfx();
              }}
              aria-label={t.hud.sfx}
              title={t.hud.sfx}
              className={`hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                sfxEnabled
                  ? 'bg-[#041622]/90 border-[#246273]/60 text-[#7efcf0] hover:text-white'
                  : 'bg-[#041622]/90 border-[#3c4b59]/60 text-[#5d7a85]'
              }`}
            >
              {sfxEnabled ? (
                <Volume2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <VolumeX className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {/* Pause Button */}
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              aria-label={t.hud.pause}
              title={`${t.hud.pause} [Esc]`}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#041622]/90 hover:bg-[#0b2c3d] border border-[#246273]/60 text-[#d8f7f5] transition-colors cursor-pointer shrink-0"
            >
              <Pause className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Minimap Radar + Compact Run Stats */}
          <div className="flex flex-col items-end gap-1">
            <div
              className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#03111c]/88 border border-[#2a7f8e]/65 shadow-[0_4px_16px_rgba(0,0,0,0.45)] overflow-hidden"
              aria-label="Minimap radar"
            >
              <svg viewBox="-52 -52 104 104" className="w-full h-full">
                <circle cx="0" cy="0" r="46" fill="none" stroke="rgba(90, 210, 230, 0.22)" strokeWidth="1" />
                <circle cx="0" cy="0" r="24" fill="none" stroke="rgba(90, 210, 230, 0.16)" strokeWidth="1" />
                <line x1="-48" y1="0" x2="48" y2="0" stroke="rgba(90, 210, 230, 0.14)" strokeWidth="0.8" />
                <line x1="0" y1="-48" x2="0" y2="48" stroke="rgba(90, 210, 230, 0.14)" strokeWidth="0.8" />
                {hud.minimap.map((blip, idx) => (
                  <circle
                    key={idx}
                    cx={blip.nx * 44}
                    cy={blip.ny * 44}
                    r={blip.size}
                    fill={blip.color}
                    stroke={blip.kind === 'player' || blip.kind === 'boss' ? '#ffffff' : 'none'}
                    strokeWidth={blip.kind === 'boss' ? 1.2 : 0.8}
                  />
                ))}
              </svg>
            </div>
            <div className="text-[10px] sm:text-[11px] font-mono-num text-[#95ccd1] hud-text-stroke flex items-center gap-2">
              <span>{t.hud.kills}: {hud.kills}</span>
              <span aria-hidden="true">·</span>
              <span>{formatTime(hud.elapsedSec)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE BOSS BAR & TOAST */}
      <div className="md:hidden flex flex-col items-center gap-1.5 mt-1 mb-auto px-2">
        {hud.boss && (
          <div className="w-full max-w-xs p-2 rounded-lg bg-[#180614]/92 border border-[#ff3b7f]/70">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold text-[#ff82ac] truncate">{t.organisms[hud.boss.kind].name}</span>
              <span className="font-mono-num text-white ml-2">{hud.boss.hp}/{hud.boss.maxHp}</span>
            </div>
            <div className="h-2 rounded-full bg-[#2e091b] overflow-hidden">
              <div
                className="h-full bg-[#ff3b7f]"
                style={{ width: `${Math.max(0, (hud.boss.hp / Math.max(1, hud.boss.maxHp)) * 100)}%` }}
              />
            </div>
          </div>
        )}
        {toastText && hud.toast && (
          <div
            className="px-3 py-1 rounded-lg bg-[#051824]/92 border text-xs font-semibold text-white text-center"
            style={{ borderColor: hud.toast.accent }}
          >
            {toastText}
          </div>
        )}
      </div>

      {/* BOTTOM ROW: DNA Strip + Touch Joystick (Left) & Active Skill Buttons (Right) */}
      <div className="flex items-end justify-between gap-3">
        {/* Bottom-Left: Virtual Joystick (when touchMode enabled) + DNA Counters */}
        <div className="flex flex-col items-start gap-2.5">
          {touchMode && (
            <div
              ref={joyBaseRef}
              onPointerDown={handleJoyDown}
              onPointerMove={handleJoyMove}
              onPointerUp={handleJoyUp}
              onPointerCancel={handleJoyUp}
              role="application"
              aria-label="Virtual movement joystick"
              className="pointer-events-auto relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#041a26]/72 border-2 border-[#39d8cf]/55 flex items-center justify-center touch-none select-none"
            >
              <div className="w-10 h-10 rounded-full border border-[#39d8cf]/35" />
              <div
                className="absolute w-12 h-12 rounded-full bg-[#22e0cf]/85 border-2 border-white shadow-[0_0_16px_rgba(34,224,207,0.55)] pointer-events-none"
                style={{
                  transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                }}
              />
            </div>
          )}

          {/* Compact Color-Coded DNA Strip */}
          <div className="pointer-events-auto flex flex-wrap items-center gap-x-2.5 gap-y-1 px-2.5 py-1.5 rounded-xl bg-[#04141f]/86 border border-[#205d6b]/55 max-w-[230px] sm:max-w-[520px]">
            {DNA_ORDER.map((dnaType) => {
              const count = hud.dna[dnaType];
              return (
                <div
                  key={dnaType}
                  title={t.dna[dnaType]}
                  className={`inline-flex items-center gap-1 text-xs font-mono-num ${
                    count > 0 ? 'opacity-100' : 'opacity-45'
                  }`}
                >
                  <DnaIconSvg type={dnaType} size={13} />
                  <span className="font-bold" style={{ color: DNA_COLORS[dnaType] }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom-Right: Active Ability Buttons (Character Special, Skill 1, Skill 2, Dash) */}
        <div className="pointer-events-auto flex items-end gap-2 sm:gap-2.5">
          {/* Character Special Skill [R] */}
          {hud.unlockedActives.hasCharacterSpecial && (
            <ActionSkillButton
              testId="hud-special-btn"
              label={t.characters[hud.characterId].specialName}
              hotkey="R"
              cooldown={hud.cooldowns.special}
              maxCooldown={hud.cooldowns.specialMax}
              locked={false}
              accent={CHARACTERS[hud.characterId].accentColor}
              activeGlow={hud.specialActive}
              isSpecial
              onTrigger={onCharacterSpecial}
            />
          )}

          {/* Skill 1 */}
          <ActionSkillButton
            label={skill1Label}
            hotkey="Q"
            cooldown={hud.cooldowns.skill1}
            maxCooldown={hud.cooldowns.skill1Max}
            locked={!hud.unlockedActives.skill1Name}
            accent="#44f56b"
            onTrigger={onSkill1}
          />

          {/* Skill 2 */}
          <ActionSkillButton
            label={skill2Label}
            hotkey="E"
            cooldown={hud.cooldowns.skill2}
            maxCooldown={hud.cooldowns.skill2Max}
            locked={!hud.unlockedActives.skill2Name}
            accent={
              hud.unlockedActives.skill2Name === 'juggernaut'
                ? '#ffad42'
                : hud.unlockedActives.skill2Name === 'stealth'
                ? '#b26bff'
                : '#35d8ff'
            }
            activeGlow={hud.stealthActive || hud.juggernautActive}
            onTrigger={onSkill2}
          />

          {/* Dash (Always Unlocked) */}
          <ActionSkillButton
            label={t.hud.dash}
            hotkey="SPC"
            cooldown={hud.cooldowns.dash}
            maxCooldown={hud.cooldowns.dashMax}
            locked={false}
            accent="#22e0cf"
            large
            onTrigger={onDash}
          />
        </div>
      </div>
    </div>
  );
};

interface ActionSkillButtonProps {
  testId?: string;
  label: string;
  hotkey: string;
  cooldown: number;
  maxCooldown: number;
  locked: boolean;
  accent: string;
  large?: boolean;
  activeGlow?: boolean;
  isSpecial?: boolean;
  onTrigger: () => void;
}

const ActionSkillButton: React.FC<ActionSkillButtonProps> = ({
  testId,
  label,
  hotkey,
  cooldown,
  maxCooldown,
  locked,
  accent,
  large,
  activeGlow,
  isSpecial,
  onTrigger,
}) => {
  const ready = !locked && cooldown <= 0.02;
  const pct = maxCooldown > 0 ? Math.min(1, Math.max(0, cooldown / maxCooldown)) : 0;

  return (
    <button
      type="button"
      data-testid={testId}
      tabIndex={-1}
      disabled={locked}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (!locked) onTrigger();
      }}
      onClick={(e) => e.currentTarget.blur()}
      aria-label={label}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 transition-transform active:scale-95 select-none overflow-hidden ${
        large ? 'w-16 h-16 sm:w-[74px] sm:h-[74px]' : 'w-14 h-14 sm:w-16 sm:h-16'
      } ${locked ? 'opacity-45 cursor-not-allowed bg-[#06131c]/85 border-[#2c4654]' : 'cursor-pointer bg-[#051c29]/92'}`}
      style={{
        borderColor: locked ? undefined : activeGlow ? '#ffffff' : ready ? accent : '#2f5869',
        boxShadow: activeGlow ? `0 0 18px ${accent}` : isSpecial && ready ? `0 0 12px ${accent}55` : undefined,
      }}
    >
      {/* Cooldown fill curtain */}
      {!locked && cooldown > 0 && (
        <div
          className="absolute inset-0 bg-black/65 pointer-events-none origin-bottom"
          style={{ transform: `scaleY(${pct})` }}
        />
      )}

      {isSpecial ? (
        <Sparkles
          className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 relative z-10"
          style={{ color: locked ? '#5e7c8a' : accent }}
          aria-hidden="true"
        />
      ) : (
        <Zap
          className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 relative z-10"
          style={{ color: locked ? '#5e7c8a' : accent }}
          aria-hidden="true"
        />
      )}
      <span className="relative z-10 text-[10px] sm:text-[11px] font-bold text-white leading-none truncate max-w-[92%] px-1">
        {cooldown > 0.05 ? `${cooldown.toFixed(1)}s` : label}
      </span>
      <span className="hidden sm:block absolute top-1 right-1.5 text-[9px] font-mono-num text-[#98cfd4]/80 z-10">
        {hotkey}
      </span>
    </button>
  );
};
