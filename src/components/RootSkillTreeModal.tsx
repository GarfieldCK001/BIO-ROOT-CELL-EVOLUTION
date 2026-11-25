import React, { useState } from 'react';
import { Check, Lock, PauseCircle, Sparkles, X } from 'lucide-react';
import {
  DIFFICULTIES,
  DNA_COLORS,
  DNA_ORDER,
  SKILL_BRANCH_ORDER,
  SKILL_LIST,
  SKILL_NODES,
} from '../game/data';
import { TRANSLATIONS } from '../game/i18n';
import {
  canUnlockSkill,
  getActiveSkillBranches,
  getEffectiveRunEvoCap,
  getEffectiveZoneEvoCap,
  getSkillUpgradeCost,
  getTotalEvolutionPointsUsed,
  isBranchSealed,
} from '../game/rules';
import {
  DifficultyId,
  DnaInventory,
  DnaType,
  Lang,
  SkillBranch,
  SkillId,
  SkillLevels,
  ZoneId,
} from '../game/types';
import {
  BRANCH_COLORS,
  BranchRootIconSvg,
  DnaIconSvg,
  renderBranchRootGlyph,
  renderSkillGlyph,
  SkillIconSvg,
} from './BioIcons';

interface RootSkillTreeModalProps {
  lang: Lang;
  difficulty: DifficultyId;
  zone: ZoneId;
  endlessMode: boolean;
  dna: DnaInventory;
  skills: SkillLevels;
  onUpgrade: (skillId: SkillId) => void;
  onClose: () => void;
}

const NUCLEUS_X = 520;
const NUCLEUS_Y = 54;

const BRANCH_HEADER_POS: Record<SkillBranch, { x: number; y: number }> = {
  predator: { x: 112, y: 126 },
  biochem: { x: 316, y: 126 },
  immortal: { x: 520, y: 126 },
  elemental: { x: 726, y: 126 },
  symbiont: { x: 928, y: 126 },
};

/**
 * Generate an organic cubic Bezier root curve between two points.
 */
function buildRootPath(x1: number, y1: number, x2: number, y2: number): string {
  const midY = (y1 + y2) * 0.52;
  const bend = (x2 - x1) * 0.14;
  return `M ${x1} ${y1} C ${x1 + bend} ${midY}, ${x2 - bend} ${midY}, ${x2} ${y2}`;
}

export const RootSkillTreeModal: React.FC<RootSkillTreeModalProps> = ({
  lang,
  difficulty,
  zone,
  endlessMode,
  dna,
  skills,
  onUpgrade,
  onClose,
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedId, setSelectedId] = useState<SkillId>('jet_flagella');

  const diffCfg = DIFFICULTIES[difficulty];
  const usedEvoPoints = getTotalEvolutionPointsUsed(skills);
  const maxEvoPoints = getEffectiveRunEvoCap(difficulty, endlessMode);
  const zoneEvoCap = getEffectiveZoneEvoCap(zone, difficulty, endlessMode);
  const activeBranches = getActiveSkillBranches(skills);
  const maxBranches = endlessMode ? SKILL_BRANCH_ORDER.length : diffCfg.maxBranches;

  const selectedNode = SKILL_NODES[selectedId];
  const selectedText = t.skills[selectedId];
  const currentLevel = skills[selectedId] ?? 0;
  const upgradeCost = getSkillUpgradeCost(selectedId, currentLevel);
  const check = canUnlockSkill(selectedId, skills, dna, difficulty, zone, endlessMode);

  // Build root vessel connections from Nucleus -> Tier 1 and Parent -> Child
  const edges: Array<{
    key: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    unlocked: boolean;
    available: boolean;
    sealed: boolean;
  }> = [];

  for (const node of SKILL_LIST) {
    const nodeUnlocked = (skills[node.id] ?? 0) > 0;
    const nodeAvailable = canUnlockSkill(node.id, skills, dna, difficulty, zone, endlessMode).ok;
    const nodeSealed = isBranchSealed(node.branch, skills, difficulty, endlessMode);

    if (node.parentIds.length === 0) {
      edges.push({
        key: `nucleus-${node.id}`,
        x1: NUCLEUS_X,
        y1: NUCLEUS_Y + 26,
        x2: node.x,
        y2: node.y - 28,
        color: node.accent,
        unlocked: nodeUnlocked,
        available: nodeAvailable,
        sealed: nodeSealed,
      });
    } else {
      for (const pid of node.parentIds) {
        const parent = SKILL_NODES[pid];
        const parentUnlocked = (skills[pid] ?? 0) > 0;
        edges.push({
          key: `${pid}-${node.id}`,
          x1: parent.x,
          y1: parent.y + 28,
          x2: node.x,
          y2: node.y - 28,
          color: node.accent,
          unlocked: nodeUnlocked && parentUnlocked,
          available: nodeAvailable && parentUnlocked,
          sealed: nodeSealed,
        });
      }
    }
  }

  const blockReasonNotice =
    check.reason === 'evo_cap'
      ? t.skillTree.evoCapReached
      : check.reason === 'zone_evo_cap'
      ? t.skillTree.zoneEvoCapReached
      : check.reason === 'branch_limit'
      ? t.skillTree.branchSealedReason
      : null;

  return (
    <div
      data-testid="root-skill-tree-modal"
      className="fixed inset-0 z-40 flex items-center justify-center p-2.5 sm:p-5 bg-[#020912]/88"
      role="dialog"
      aria-modal="true"
      aria-label={t.skillTree.title}
    >
      <div className="w-full max-w-6xl max-h-[93vh] flex flex-col rounded-2xl bg-[#04141f] border border-[#2a8694]/70 shadow-[0_18px_60px_rgba(0,0,0,0.78)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 border-b border-[#1c5566]/65 bg-[#061c2a]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display font-bold text-lg sm:text-xl text-[#e6fffc]">
                {t.skillTree.title}
              </h2>
              <span
                data-testid="skill-tree-time-paused"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0a2f3d] border border-[#2c8a96]/70 text-[11px] font-semibold text-[#7efcf0]"
              >
                <PauseCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.skillTree.timePausedBadge}</span>
              </span>
            </div>
            <p className="text-xs text-[#89c9cc] hidden sm:block mt-0.5">{t.skillTree.constraintHint}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0d3344] hover:bg-[#154b63] text-sm font-semibold text-[#d9fffc] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            <span>{t.skillTree.close}</span>
          </button>
        </div>

        {/* Evolution Constraint Counters + DNA Wallet Bar */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 sm:px-6 py-2.5 bg-[#031019] border-b border-[#143d4d]/70">
          {/* Replayability & Per-Zone Constraint Counters */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {endlessMode ? (
              <div
                data-testid="endless-sandbox-badge"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#292007] border border-[#b58b1f]/80 text-[#ffe875] font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.skillTree.endlessSandboxBadge}</span>
                <strong data-testid="evo-cap-counter" className="font-mono-num">
                  {usedEvoPoints}/{maxEvoPoints}
                </strong>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#072130] border border-[#24667a]/70">
                  <span className="text-[#8fc8ce]">{t.skillTree.zoneEvoCapLabel} ({t.hud.zone} {zone}):</span>
                  <strong
                    data-testid="zone-evo-cap-counter"
                    className={`font-mono-num font-bold ${
                      usedEvoPoints >= zoneEvoCap ? 'text-[#ffd166]' : 'text-[#5ef59b]'
                    }`}
                  >
                    {usedEvoPoints}/{zoneEvoCap}
                  </strong>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#072130] border border-[#24667a]/70">
                  <span className="text-[#8fc8ce]">{t.skillTree.evoCapLabel}:</span>
                  <strong
                    data-testid="evo-cap-counter"
                    className={`font-mono-num font-bold ${
                      usedEvoPoints >= maxEvoPoints ? 'text-[#ff758f]' : 'text-[#7efcf0]'
                    }`}
                  >
                    {usedEvoPoints}/{maxEvoPoints}
                  </strong>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#072130] border border-[#24667a]/70">
                  <span className="text-[#8fc8ce]">{t.skillTree.branchLimitLabel}:</span>
                  <strong
                    data-testid="branch-limit-counter"
                    className={`font-mono-num font-bold ${
                      activeBranches.length >= maxBranches ? 'text-[#ffd166]' : 'text-[#5ef59b]'
                    }`}
                  >
                    {activeBranches.length}/{maxBranches}
                  </strong>
                </div>
              </>
            )}
          </div>

          {/* DNA Inventory */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {DNA_ORDER.map((dnaType) => (
              <div key={dnaType} className="inline-flex items-center gap-1 text-xs">
                <DnaIconSvg type={dnaType} size={13} />
                <span className="text-[#9cc7cc] hidden xl:inline">{t.dna[dnaType]}:</span>
                <span className="font-mono-num font-bold" style={{ color: DNA_COLORS[dnaType] }}>
                  {dna[dnaType]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content: 5-Taproot Interactive SVG Tree (Left/Top) + Detail Inspector (Right/Bottom) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto">
          {/* Organic SVG Root Tree Canvas */}
          <div className="flex-1 relative bg-[#030e17] p-2.5 sm:p-4 flex items-center justify-center min-h-[340px] overflow-x-auto">
            <svg
              viewBox="0 0 1040 585"
              className="w-full min-w-[640px] lg:min-w-0 h-auto max-h-[56vh] lg:max-h-[66vh] select-none"
              role="img"
              aria-label={t.skillTree.title}
            >
              <defs>
                <filter id="rootGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Connecting Organic Bezier Roots */}
              {edges.map((edge) => {
                const d = buildRootPath(edge.x1, edge.y1, edge.x2, edge.y2);
                return (
                  <g key={edge.key} opacity={edge.sealed ? 0.24 : 1}>
                    <path
                      d={d}
                      fill="none"
                      stroke={edge.unlocked ? edge.color : '#1b4152'}
                      strokeOpacity={edge.unlocked ? 0.45 : 0.72}
                      strokeWidth={edge.unlocked ? 7 : 4}
                      strokeDasharray={edge.sealed ? '4 6' : undefined}
                      strokeLinecap="round"
                    />
                    {(edge.unlocked || edge.available) && !edge.sealed && (
                      <path
                        d={d}
                        fill="none"
                        stroke={edge.unlocked ? edge.color : '#9ef7ee'}
                        strokeWidth={edge.unlocked ? 3.2 : 2}
                        strokeDasharray="10 14"
                        strokeLinecap="round"
                        filter="url(#rootGlow)"
                        className="animate-root-flow"
                      />
                    )}
                  </g>
                );
              })}

              {/* 5 Taproot Column Headers with Bespoke Root Emblems */}
              {SKILL_BRANCH_ORDER.map((branch) => {
                const pos = BRANCH_HEADER_POS[branch];
                const sealed = isBranchSealed(branch, skills, difficulty, endlessMode);
                const color = BRANCH_COLORS[branch];
                return (
                  <g
                    key={branch}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    opacity={sealed ? 0.42 : 1}
                    data-testid={`branch-header-${branch}`}
                  >
                    <circle
                      cx="0"
                      cy="-20"
                      r="17"
                      fill="#061f2e"
                      stroke={sealed ? '#465466' : color}
                      strokeWidth="1.8"
                    />
                    <g transform="translate(0, -20)">{renderBranchRootGlyph(branch)}</g>
                    <text
                      x="0"
                      y="12"
                      textAnchor="middle"
                      fill={sealed ? '#7d93a1' : color}
                      fontSize="13.5"
                      fontWeight="700"
                    >
                      {t.branches[branch].name}
                    </text>
                    {sealed && (
                      <text x="0" y="27" textAnchor="middle" fill="#ff9eb2" fontSize="10.5" fontWeight="700">
                        {t.skillTree.branchSealedBadge}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Top Central Nucleus */}
              <g transform={`translate(${NUCLEUS_X}, ${NUCLEUS_Y})`}>
                <circle r="30" fill="#083847" stroke="#5ef7ea" strokeWidth="2.8" filter="url(#rootGlow)" />
                <circle r="17" fill="#c9fff9" />
                <circle r="7.5" fill="#0d9488" />
                <text y="-36" textAnchor="middle" fill="#a8f5ee" fontSize="13" fontWeight="700">
                  {t.skillTree.nucleus}
                </text>
              </g>

              {/* 16 Interactive Skill Nodes with Bespoke Vector Skill Illustrations */}
              {SKILL_LIST.map((node) => {
                const lv = skills[node.id] ?? 0;
                const nodeCheck = canUnlockSkill(node.id, skills, dna, difficulty, zone, endlessMode);
                const nodeSealed = isBranchSealed(node.branch, skills, difficulty, endlessMode);
                const isSelected = selectedId === node.id;
                const isUnlocked = lv > 0;
                const isMaxed = lv >= node.maxLevel;
                const labelText = t.skills[node.id].name.split('(')[0].trim();

                return (
                  <g
                    key={node.id}
                    data-testid={`skill-node-${node.id}`}
                    transform={`translate(${node.x}, ${node.y})`}
                    opacity={nodeSealed ? 0.42 : 1}
                    onClick={() => setSelectedId(node.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${t.skills[node.id].name} (${lv}/${node.maxLevel})`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(node.id);
                      }
                    }}
                    className="cursor-pointer focus:outline-none"
                  >
                    {/* Selection halo */}
                    {isSelected && (
                      <circle
                        r="35"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.2"
                        strokeDasharray="6 4"
                      />
                    )}

                    {/* Affordable ready pulse ring */}
                    {nodeCheck.ok && (
                      <circle
                        r="35"
                        fill={node.accent}
                        fillOpacity="0.22"
                        className="animate-bio-pulse"
                      />
                    )}

                    {/* Node Vessel Circle */}
                    <circle
                      r="28"
                      fill={isUnlocked ? '#072b38' : '#081924'}
                      stroke={nodeSealed ? '#3c4352' : isUnlocked || nodeCheck.ok ? node.accent : '#2a5163'}
                      strokeWidth={isSelected ? 3.5 : 2.5}
                      filter={isUnlocked ? 'url(#rootGlow)' : undefined}
                    />

                    {/* Subtle inner tint */}
                    <circle
                      r="23"
                      fill={nodeSealed ? '#252d3a' : node.accent}
                      fillOpacity={isUnlocked ? 0.22 : nodeCheck.ok ? 0.14 : 0.06}
                    />

                    {/* Bespoke Vector Skill Emblem */}
                    <g transform="translate(0, -2) scale(1.05)" opacity={nodeSealed ? 0.45 : isUnlocked || nodeCheck.ok ? 1 : 0.78}>
                      {renderSkillGlyph(node.id)}
                    </g>

                    {/* Crisp Level Pill anchored cleanly at bottom rim of node */}
                    <rect
                      x="-20"
                      y="17"
                      width="40"
                      height="16"
                      rx="8"
                      fill={isMaxed ? '#1a3820' : '#04141f'}
                      stroke={nodeSealed ? '#465466' : isUnlocked ? node.accent : '#2c586b'}
                      strokeWidth="1.4"
                    />
                    <text
                      y="28.5"
                      textAnchor="middle"
                      fill={isMaxed ? '#8affb0' : '#ffffff'}
                      fontSize="10.5"
                      fontWeight="800"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {nodeSealed ? '✕' : isMaxed ? 'MAX' : `${lv}/${node.maxLevel}`}
                    </text>

                    {/* Node Label Below */}
                    <text
                      y="51"
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : isUnlocked ? '#dcfcf8' : '#8eb3bd'}
                      fontSize="12"
                      fontWeight={isSelected ? '700' : '600'}
                    >
                      {labelText}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right/Bottom Inspector Panel */}
          <aside className="w-full lg:w-[330px] shrink-0 p-4 sm:p-5 bg-[#061b28] border-t lg:border-t-0 lg:border-l border-[#1c5566]/65 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              {/* Illustrated Skill & Root Header */}
              <div className="flex items-start gap-3">
                <SkillIconSvg skillId={selectedId} size={54} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide"
                      style={{ color: selectedNode.accent }}
                    >
                      <BranchRootIconSvg branch={selectedNode.branch} size={18} />
                      <span>{t.branches[selectedNode.branch].name}</span>
                    </div>
                    <span className="font-mono-num text-xs font-bold text-[#9dece5] shrink-0">
                      {t.skillTree.level} {currentLevel}/{selectedNode.maxLevel}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-white mt-1 leading-tight">
                    {selectedText.name}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-[#c6e5e6] leading-relaxed">{selectedText.desc}</p>

              {/* Physical Organ Mutation Preview */}
              <div className="p-3 rounded-xl bg-[#04121c] border border-[#1d5466]/70">
                <div className="text-[11px] font-semibold text-[#7ec4ca] mb-1">
                  {t.skillTree.organPreview}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#e6fffc]">
                  {selectedText.organ}
                </div>
                <div className="text-xs text-[#6bf0c6] mt-1">{selectedText.effect}</div>
              </div>

              {/* Parent Prerequisites (if any) */}
              {selectedNode.parentIds.length > 0 && (
                <div className="text-xs text-[#9ac2c9]">
                  <span className="font-semibold text-[#cbe9eb]">{t.skillTree.requires}: </span>
                  {selectedNode.parentIds
                    .map((pid) => t.skills[pid].name.split('(')[0].trim())
                    .join(' + ')}
                </div>
              )}

              {/* Explicit Constraint Warning when Blocked by Cap or Branch Lock */}
              {blockReasonNotice && (
                <div className="p-2.5 rounded-lg bg-[#2a0d19] border border-[#a13054] text-xs font-semibold text-[#ffb3c6]">
                  {blockReasonNotice}
                </div>
              )}

              {/* DNA Upgrade Cost */}
              {currentLevel < selectedNode.maxLevel && (
                <div>
                  <div className="text-xs font-semibold text-[#89c4ca] mb-1.5">
                    {t.skillTree.cost}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(upgradeCost) as Array<[DnaType, number]>).map(([dnaType, amt]) => {
                      const have = dna[dnaType] ?? 0;
                      const enough = have >= amt;
                      return (
                        <div
                          key={dnaType}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono-num ${
                            enough
                              ? 'bg-[#082433] border-[#2d8a7e] text-white'
                              : 'bg-[#1a0d16] border-[#7a2e45] text-[#ff9bb0]'
                          }`}
                        >
                          <DnaIconSvg type={dnaType} size={14} />
                          <span>{t.dna[dnaType]}</span>
                          <strong style={{ color: DNA_COLORS[dnaType] }}>
                            {have}/{amt}
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Evolve Primary CTA */}
            <button
              type="button"
              disabled={!check.ok}
              onClick={() => onUpgrade(selectedId)}
              className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-display font-bold text-sm sm:text-base transition-colors min-h-[48px] ${
                check.ok
                  ? 'bg-[#22e0cf] hover:bg-[#5ef7e9] text-[#02151e] shadow-[0_0_20px_rgba(34,224,207,0.38)] cursor-pointer'
                  : 'bg-[#0d2433] text-[#6d94a1] border border-[#1d4354] cursor-not-allowed'
              }`}
            >
              {check.reason === 'maxed' ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>{t.skillTree.maxed}</span>
                </>
              ) : check.ok ? (
                <>
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span>{t.skillTree.evolve}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  <span>{t.skillTree.evolve}</span>
                </>
              )}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};
