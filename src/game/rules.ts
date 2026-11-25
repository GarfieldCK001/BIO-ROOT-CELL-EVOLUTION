import {
  CHARACTER_ORDER,
  CHARACTERS,
  createEmptyDna,
  createEmptySkills,
  DIFFICULTIES,
  DNA_ORDER,
  MAX_STANDARD_RADIUS,
  MAX_ZONE,
  SKILL_LIST,
  SKILL_NODES,
  ZONES,
} from './data';
import { normalizeSeed } from './rng';
import {
  CharacterId,
  DifficultyId,
  DnaInventory,
  DnaType,
  LeaderboardEntry,
  MutagenUpgrades,
  PersistentSave,
  RunSummary,
  SavedRunSnapshot,
  SkillBranch,
  SkillId,
  SkillLevels,
  ZoneId,
} from './types';

export const SAVE_STORAGE_KEY = 'bio_root_cell_evolution_v1';
export const CURRENT_SAVE_VERSION = 2;
export const MAX_TOTAL_SKILL_POINTS = SKILL_LIST.reduce((sum, n) => sum + n.maxLevel, 0);
export const MAX_LEADERBOARD_ENTRIES = 10;
export const DEFAULT_PLAYER_NAME = 'Specimen-0';
export const MAX_PLAYER_NAME_LENGTH = 20;
/** End-of-run Mutagen reward multiplier (-8% tuning within the 5-10% reduction range) */
export const MUTAGEN_REWARD_TUNING = 0.92;

export function sanitizePlayerName(raw: unknown): string {
  if (typeof raw !== 'string') return DEFAULT_PLAYER_NAME;
  const cleaned = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_PLAYER_NAME_LENGTH);
  return cleaned.length > 0 ? cleaned : DEFAULT_PLAYER_NAME;
}

/**
 * Determine if the player can immediately swallow a target entity.
 */
export function canSwallowDirectly(
  playerRadius: number,
  targetRadius: number,
  isBoss: boolean
): boolean {
  if (isBoss) return false;
  return playerRadius >= targetRadius * 1.08;
}

/**
 * Compute dynamic camera zoom based on player cell radius.
 */
export function computeTargetCameraZoom(playerRadius: number): number {
  const baseline = 22;
  const ratio = Math.max(0.5, playerRadius / baseline);
  const rawZoom = 1.12 / Math.pow(ratio, 0.44);
  return Math.max(0.44, Math.min(1.18, rawZoom));
}

/**
 * Count total evolution upgrades invested in the current run.
 */
export function getTotalEvolutionPointsUsed(skills: SkillLevels): number {
  return Object.values(skills).reduce((sum, lv) => sum + (lv || 0), 0);
}

/**
 * Return the set of taproot branches that currently have at least 1 evolved node.
 */
export function getActiveSkillBranches(skills: SkillLevels): SkillBranch[] {
  const branches = new Set<SkillBranch>();
  for (const node of SKILL_LIST) {
    if ((skills[node.id] ?? 0) > 0) {
      branches.add(node.branch);
    }
  }
  return Array.from(branches);
}

/**
 * Return the maximum total evolution points allowed in a run.
 * In Endless Mode (post-victory sandbox), ALL 48 skill points across all 5 branches are unlocked!
 */
export function getEffectiveRunEvoCap(
  difficulty: DifficultyId = 'normal',
  endlessMode = false
): number {
  if (endlessMode) return MAX_TOTAL_SKILL_POINTS;
  return DIFFICULTIES[difficulty].maxEvolutionPoints;
}

/**
 * Determine whether a branch is sealed for the rest of the run because
 * the player already specialized in maxBranches other branches.
 * Endless Mode unseals all 5 taproot branches so players can experiment freely.
 */
export function isBranchSealed(
  branch: SkillBranch,
  skills: SkillLevels,
  difficulty: DifficultyId = 'normal',
  endlessMode = false
): boolean {
  if (endlessMode) return false;
  const maxBranches = DIFFICULTIES[difficulty].maxBranches;
  const active = getActiveSkillBranches(skills);
  return active.length >= maxBranches && !active.includes(branch);
}

/**
 * Return the maximum cumulative evolution upgrades permitted up to the given zone
 * under the chosen difficulty. Prevents farming & maxing out in Zone 1,
 * while Endless Mode unlocks all 48 points across every branch.
 */
export function getEffectiveZoneEvoCap(
  zone: ZoneId,
  difficulty: DifficultyId = 'normal',
  endlessMode = false
): number {
  const runCap = getEffectiveRunEvoCap(difficulty, endlessMode);
  if (endlessMode || zone >= MAX_ZONE) return runCap;
  return Math.min(ZONES[zone].maxEvoPointsInZone, runCap);
}

/**
 * Determine whether cell physical growth (radius/biomass) has reached the ceiling
 * of the current zone and requires advancing to the next zone.
 */
export function isGrowthCappedInZone(
  zone: ZoneId,
  playerRadius: number,
  endlessMode = false
): boolean {
  if (endlessMode || zone >= MAX_ZONE) return false;
  return playerRadius >= ZONES[zone].maxRadiusInZone;
}

/**
 * Determine whether the player has used all evolution points allowed in the current zone
 * while still having remaining run genome budget in higher zones.
 */
export function isEvolutionCappedInZone(
  zone: ZoneId,
  skills: SkillLevels,
  difficulty: DifficultyId = 'normal',
  endlessMode = false
): boolean {
  if (endlessMode || zone >= MAX_ZONE) return false;
  const used = getTotalEvolutionPointsUsed(skills);
  const zoneCap = getEffectiveZoneEvoCap(zone, difficulty, endlessMode);
  const runCap = getEffectiveRunEvoCap(difficulty, endlessMode);
  return used >= zoneCap && zoneCap < runCap;
}

/**
 * Limit how many non-boss hostile microbes may actively pursue/attack the player simultaneously
 * in a zone (strictly 2 to 5) so the player is never overwhelmed by an entire dish swarm.
 */
export function getMaxConcurrentChasers(
  zone: ZoneId,
  difficulty: DifficultyId = 'normal'
): number {
  const base = zone <= 2 ? 2 : zone <= 5 ? 3 : zone <= 8 ? 4 : 5;
  const diffOffset = difficulty === 'novice' ? -1 : difficulty === 'hell' ? 1 : 0;
  return Math.max(2, Math.min(5, base + diffOffset));
}

/**
 * Determine whether the player is inside a Boss's territorial aggro boundary.
 * Uses subtle hysteresis when already engaged so boundary edges feel smooth.
 */
export function isPlayerInBossTerritory(
  playerX: number,
  playerY: number,
  bossHomeX: number,
  bossHomeY: number,
  territoryRadius: number,
  currentlyEngaged = false
): boolean {
  const dist = Math.hypot(playerX - bossHomeX, playerY - bossHomeY);
  const effectiveRadius = currentlyEngaged ? territoryRadius * 1.12 : territoryRadius;
  return dist <= effectiveRadius;
}

/**
 * Compute scaled DNA cost for upgrading a skill node to the next level.
 */
export function getSkillUpgradeCost(
  skillId: SkillId,
  currentLevel: number
): Partial<Record<DnaType, number>> {
  const node = SKILL_NODES[skillId];
  const scaled: Partial<Record<DnaType, number>> = {};
  for (const [dnaKey, baseVal] of Object.entries(node.costDna)) {
    if (typeof baseVal === 'number' && baseVal > 0) {
      scaled[dnaKey as DnaType] = baseVal + currentLevel * Math.max(2, Math.ceil(baseVal * 0.6));
    }
  }
  return scaled;
}

export type SkillBlockReason =
  | 'maxed'
  | 'evo_cap'
  | 'zone_evo_cap'
  | 'branch_limit'
  | 'parents'
  | 'dna';

/**
 * Check whether parent nodes, total evolution cap, per-zone evolution cap,
 * 2-branch specialization limit, and DNA are satisfied to upgrade a skill.
 */
export function canUnlockSkill(
  skillId: SkillId,
  skills: SkillLevels,
  dna: DnaInventory,
  difficulty: DifficultyId = 'normal',
  zone: ZoneId = MAX_ZONE,
  endlessMode = false
): { ok: boolean; reason?: SkillBlockReason } {
  const node = SKILL_NODES[skillId];
  const currentLevel = skills[skillId] ?? 0;
  if (currentLevel >= node.maxLevel) {
    return { ok: false, reason: 'maxed' };
  }

  // Constraint 1: Total Genome Evolution Cap per run (lifted to all 48 points in Endless Mode)
  const usedPoints = getTotalEvolutionPointsUsed(skills);
  const maxPoints = getEffectiveRunEvoCap(difficulty, endlessMode);
  if (usedPoints >= maxPoints) {
    return { ok: false, reason: 'evo_cap' };
  }

  // Constraint 2: Per-Zone Evolution Cap (prevents maxing out in early zones!)
  const zoneCap = getEffectiveZoneEvoCap(zone, difficulty, endlessMode);
  if (usedPoints >= zoneCap) {
    return { ok: false, reason: 'zone_evo_cap' };
  }

  // Constraint 3: Branch Specialization Limit (lifted in Endless Mode)
  if (isBranchSealed(node.branch, skills, difficulty, endlessMode)) {
    return { ok: false, reason: 'branch_limit' };
  }

  // Parent dependency check
  for (const parentId of node.parentIds) {
    if ((skills[parentId] ?? 0) <= 0) {
      return { ok: false, reason: 'parents' };
    }
  }

  // DNA cost check
  const cost = getSkillUpgradeCost(skillId, currentLevel);
  for (const [dnaKey, amount] of Object.entries(cost)) {
    if ((dna[dnaKey as DnaType] ?? 0) < (amount ?? 0)) {
      return { ok: false, reason: 'dna' };
    }
  }
  return { ok: true };
}

/**
 * Check if any skill in the root tree is currently affordable & unlockable under run & zone constraints.
 */
export function hasAnyAffordableSkill(
  skills: SkillLevels,
  dna: DnaInventory,
  difficulty: DifficultyId = 'normal',
  zone: ZoneId = MAX_ZONE,
  endlessMode = false
): boolean {
  return SKILL_LIST.some((node) => canUnlockSkill(node.id, skills, dna, difficulty, zone, endlessMode).ok);
}

/**
 * Pure state transition to spend DNA and increment a skill level.
 */
export function applySkillUpgrade(
  skillId: SkillId,
  skills: SkillLevels,
  dna: DnaInventory,
  difficulty: DifficultyId = 'normal',
  zone: ZoneId = MAX_ZONE,
  endlessMode = false
): { skills: SkillLevels; dna: DnaInventory } | null {
  const check = canUnlockSkill(skillId, skills, dna, difficulty, zone, endlessMode);
  if (!check.ok) return null;

  const currentLevel = skills[skillId] ?? 0;
  const cost = getSkillUpgradeCost(skillId, currentLevel);
  const nextDna: DnaInventory = { ...dna };
  for (const [dnaKey, amount] of Object.entries(cost)) {
    nextDna[dnaKey as DnaType] -= amount ?? 0;
  }
  const nextSkills: SkillLevels = {
    ...skills,
    [skillId]: currentLevel + 1,
  };
  return { skills: nextSkills, dna: nextDna };
}

/**
 * Scale enemy and boss attack damage progressively across Zones 1..10 so late zones stay lethal.
 * Zone 1 = 1.0x, Zone 5 = 1.4x, Zone 10 = 1.9x before difficulty multiplier.
 */
export function computeZoneEnemyDamage(
  baseDamage: number,
  zone: ZoneId,
  difficultyDamageMult = 1.0,
  isBoss = false
): number {
  if (baseDamage <= 0) return 0;
  const zoneSlope = isBoss ? 0.11 : 0.1;
  const zoneMult = 1 + Math.max(0, zone - 1) * zoneSlope;
  return Math.max(1, Math.round(baseDamage * zoneMult * difficultyDamageMult));
}

/**
 * Scale enemy movement agility subtly across Zones 1..10 (+2.5% per zone).
 */
export function computeZoneEnemySpeed(
  baseSpeed: number,
  zone: ZoneId,
  difficultySpeedMult = 1.0
): number {
  const zoneMult = 1 + Math.max(0, zone - 1) * 0.025;
  return baseSpeed * zoneMult * difficultySpeedMult;
}

/**
 * Compute player incoming damage after Hexa-Carapace armor, character armor bonus, and invulnerability.
 * Rebalanced: 12% per carapace level (36% at Lv3), 55% total cap, minimum floor 2 HP.
 */
export function computeIncomingPlayerDamage(
  rawDamage: number,
  carapaceLevel: number,
  invulnerableActive: boolean,
  extraArmorReduction = 0
): number {
  if (invulnerableActive) return 0;
  const reduction = Math.min(0.55, Math.max(0, carapaceLevel) * 0.12 + Math.max(0, extraArmorReduction));
  return Math.max(2, Math.round(rawDamage * (1 - reduction)));
}

/**
 * Compute reflected thorns damage from Chitin Spikes.
 */
export function computeSpikeReflectDamage(incomingRawDamage: number, spikesLevel: number): number {
  if (spikesLevel <= 0) return 0;
  return Math.round(incomingRawDamage * (0.25 * spikesLevel));
}

/**
 * Check if the gateway to the next zone is unlocked (Zones 1..9 advance to 2..10).
 */
export function isNextZoneUnlocked(
  currentZone: ZoneId,
  playerRadius: number,
  defeatedBosses: ZoneId[]
): boolean {
  if (currentZone >= MAX_ZONE) return false;
  const cfg = ZONES[currentZone];
  if (playerRadius < cfg.requiredRadiusToAdvance) return false;
  if (cfg.bossKind && !defeatedBosses.includes(currentZone)) return false;
  return true;
}

/**
 * Calculate permanent Mutagen earned at end of a run (scaled by Difficulty and -8% reward tuning).
 */
export function calculateMutagenEarned(params: {
  biomass: number;
  kills: number;
  zoneReached: ZoneId;
  bossesDefeated: number;
  victory: boolean;
  difficulty?: DifficultyId;
}): number {
  const diffMult = DIFFICULTIES[params.difficulty ?? 'normal'].mutagenMult;
  const base =
    Math.floor(params.biomass * 0.08) + params.kills * 2 + (params.zoneReached - 1) * 16;
  const bossBonus = params.bossesDefeated * 35;
  const victoryBonus = params.victory ? 160 : 0;
  return Math.max(4, Math.round((base + bossBonus + victoryBonus) * diffMult * MUTAGEN_REWARD_TUNING));
}

/**
 * Calculate Mutagen cost for permanent lab upgrade levels.
 */
export function getMutagenUpgradeCost(currentLevel: number): number {
  return 25 + currentLevel * 30;
}

/**
 * Compute player soft-body wobble radius at a given vertex angle.
 */
export function computeSoftBodyRadius(
  baseRadius: number,
  angle: number,
  timeSec: number,
  speedRatio: number,
  phaseSeed: number
): number {
  const amp = 0.055 + Math.min(0.06, speedRatio * 0.045);
  const wave1 = Math.sin(angle * 4 + timeSec * 4.2 + phaseSeed) * amp;
  const wave2 = Math.cos(angle * 7 - timeSec * 5.8 + phaseSeed * 1.7) * (amp * 0.45);
  return baseRadius * (1 + wave1 + wave2);
}

/**
 * Calculate overall run score for the Top 10 Personal Leaderboard.
 */
export function calculateRunScore(params: {
  finalBiomass: number;
  kills: number;
  zoneReached: ZoneId;
  bossesDefeated: number;
  victory: boolean;
  difficulty: DifficultyId;
}): number {
  const diffScoreMult =
    params.difficulty === 'hell' ? 1.5 : params.difficulty === 'novice' ? 0.85 : 1.0;
  const raw =
    params.finalBiomass +
    params.kills * 25 +
    params.zoneReached * 350 +
    params.bossesDefeated * 600 +
    (params.victory ? 2500 : 0);
  return Math.max(0, Math.round(raw * diffScoreMult));
}

/**
 * Record a completed run into the Top 10 personal leaderboard, sorted by score desc.
 */
export function recordLeaderboardEntry(
  existing: LeaderboardEntry[],
  summary: RunSummary,
  nowMs = Date.now(),
  playerName?: string
): { entries: LeaderboardEntry[]; rank: number | null; entryId: string } {
  const entryId = `${nowMs}-${Math.floor(Math.random() * 100000)}`;
  const resolvedName = sanitizePlayerName(playerName ?? summary.playerName);
  const entry: LeaderboardEntry = {
    id: entryId,
    playerName: resolvedName,
    score: summary.score,
    victory: summary.victory,
    difficulty: summary.difficulty,
    zoneReached: summary.zoneReached,
    finalBiomass: summary.finalBiomass,
    kills: summary.kills,
    elapsedSec: summary.elapsedSec,
    bossesDefeated: summary.bossesDefeated,
    playedAt: nowMs,
  };

  const merged = [...existing, entry].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.zoneReached !== a.zoneReached) return b.zoneReached - a.zoneReached;
    if (b.finalBiomass !== a.finalBiomass) return b.finalBiomass - a.finalBiomass;
    return a.elapsedSec - b.elapsedSec;
  });

  const top = merged.slice(0, MAX_LEADERBOARD_ENTRIES);
  const idx = top.findIndex((item) => item.id === entryId);
  return {
    entries: top,
    rank: idx >= 0 ? idx + 1 : null,
    entryId,
  };
}

export type CharacterUnlockReason = 'already_unlocked' | 'need_clear' | 'need_mutagen';

/**
 * Check whether a post-game character can be unlocked with Mutagen.
 * Requires clearing the final zone at least once AND having enough Mutagen.
 */
export function canUnlockCharacter(
  characterId: CharacterId,
  save: Pick<PersistentSave, 'hasClearedGame' | 'mutagen' | 'unlockedCharacters'>
): { ok: boolean; reason?: CharacterUnlockReason } {
  const def = CHARACTERS[characterId];
  if (!def.isPostGame || save.unlockedCharacters.includes(characterId)) {
    return { ok: false, reason: 'already_unlocked' };
  }
  if (!save.hasClearedGame) {
    return { ok: false, reason: 'need_clear' };
  }
  if (save.mutagen < def.mutagenCost) {
    return { ok: false, reason: 'need_mutagen' };
  }
  return { ok: true };
}

/**
 * Pure state transition to purchase & auto-equip a post-game character using Mutagen.
 */
export function unlockCharacter(save: PersistentSave, characterId: CharacterId): PersistentSave | null {
  const check = canUnlockCharacter(characterId, save);
  if (!check.ok) return null;
  const def = CHARACTERS[characterId];
  return {
    ...save,
    mutagen: save.mutagen - def.mutagenCost,
    unlockedCharacters: [...save.unlockedCharacters, characterId],
    selectedCharacter: characterId,
  };
}

export function createDefaultSave(): PersistentSave {
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    playerName: DEFAULT_PLAYER_NAME,
    mutagen: 0,
    bestBiomass: 0,
    bestZone: 1,
    totalKills: 0,
    hasClearedGame: false,
    unlockedCharacters: ['specimen_0'],
    selectedCharacter: 'specimen_0',
    upgrades: {
      vitality: 0,
      metabolism: 0,
      dnaMagnet: 0,
      mobility: 0,
    },
    leaderboard: [],
    savedRun: null,
    lang: 'th',
    difficulty: 'normal',
    sfxEnabled: true,
    bgmEnabled: true,
  };
}

function clampFiniteInt(raw: unknown, min: number, max: number, fallback: number): number {
  if (raw === null || raw === undefined || typeof raw === 'boolean' || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function clampFiniteFloat(raw: unknown, min: number, max: number, fallback: number): number {
  if (raw === null || raw === undefined || typeof raw === 'boolean' || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function clampZoneId(raw: unknown): ZoneId {
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 1 && n <= MAX_ZONE) {
    return n as ZoneId;
  }
  return 1;
}

function parseDifficulty(raw: unknown): DifficultyId {
  if (raw === 'novice' || raw === 'normal' || raw === 'hell') return raw;
  return 'normal';
}

function isValidCharacterId(raw: unknown): raw is CharacterId {
  return typeof raw === 'string' && CHARACTER_ORDER.includes(raw as CharacterId);
}

function sanitizeUnlockedCharacters(raw: unknown): CharacterId[] {
  const set = new Set<CharacterId>(['specimen_0']);
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (isValidCharacterId(item)) {
        set.add(item);
      }
    }
  }
  return Array.from(set);
}

/**
 * Strictly validate and sanitize a persisted mid-run snapshot so corrupted localStorage
 * payloads (NaN HP, missing defeatedBosses, invalid DNA/skills) can never crash continueFromSave.
 */
export function sanitizeSavedRun(
  raw: unknown,
  fallbackCharacter: CharacterId = 'specimen_0'
): SavedRunSnapshot | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const rec = raw as Partial<SavedRunSnapshot>;

  const zone = clampZoneId(rec.zone);
  const difficulty = parseDifficulty(rec.difficulty);
  const characterId = isValidCharacterId(rec.characterId) ? rec.characterId : fallbackCharacter;
  const endlessMode = Boolean(rec.endlessMode);

  const maxHp = clampFiniteInt(rec.maxHp, 60, 2000, 120);
  const hp = clampFiniteInt(rec.hp, 1, maxHp, maxHp);
  const maxEnergy = clampFiniteInt(rec.maxEnergy, 50, 1000, 100);
  const energy = clampFiniteInt(rec.energy, 0, maxEnergy, maxEnergy);
  const maxAllowedRadius = endlessMode ? MAX_STANDARD_RADIUS : ZONES[zone].maxRadiusInZone;
  const radius = Number(clampFiniteFloat(rec.radius, 18, maxAllowedRadius, 22).toFixed(1));
  const biomass = clampFiniteInt(rec.biomass, 100, 10_000_000, 100);
  const kills = clampFiniteInt(rec.kills, 0, 1_000_000, 0);
  const elapsedSec = clampFiniteInt(rec.elapsedSec, 0, 10_000_000, 0);

  const dna = createEmptyDna();
  if (rec.dna && typeof rec.dna === 'object') {
    for (const key of DNA_ORDER) {
      dna[key] = clampFiniteInt((rec.dna as Record<string, unknown>)[key], 0, 99_999, 0);
    }
  }

  const skills = createEmptySkills();
  if (rec.skills && typeof rec.skills === 'object') {
    for (const node of SKILL_LIST) {
      skills[node.id] = clampFiniteInt(
        (rec.skills as Record<string, unknown>)[node.id],
        0,
        node.maxLevel,
        0
      );
    }
  }

  const defeatedSet = new Set<ZoneId>();
  if (Array.isArray(rec.defeatedBosses)) {
    for (const z of rec.defeatedBosses) {
      const n = Number(z);
      if (Number.isInteger(n) && n >= 1 && n <= MAX_ZONE) {
        defeatedSet.add(n as ZoneId);
      }
    }
  }

  const rngSeed =
    rec.rngSeed !== undefined && Number.isFinite(Number(rec.rngSeed))
      ? normalizeSeed(Number(rec.rngSeed))
      : undefined;

  return {
    zone,
    difficulty,
    characterId,
    hp,
    maxHp,
    energy,
    maxEnergy,
    radius,
    biomass,
    dna,
    skills,
    kills,
    elapsedSec,
    defeatedBosses: Array.from(defeatedSet),
    endlessMode,
    rngSeed,
    isDailyChallenge: Boolean(rec.isDailyChallenge),
  };
}

function sanitizeLeaderboard(raw: unknown): LeaderboardEntry[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: LeaderboardEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Partial<LeaderboardEntry>;
    cleaned.push({
      id: typeof rec.id === 'string' && rec.id.length > 0 ? rec.id : `rec-${cleaned.length + 1}`,
      playerName: sanitizePlayerName(rec.playerName),
      score: Math.max(0, Number(rec.score) || 0),
      victory: Boolean(rec.victory),
      difficulty: parseDifficulty(rec.difficulty),
      zoneReached: clampZoneId(rec.zoneReached),
      finalBiomass: Math.max(0, Number(rec.finalBiomass) || 0),
      kills: Math.max(0, Number(rec.kills) || 0),
      elapsedSec: Math.max(0, Number(rec.elapsedSec) || 0),
      bossesDefeated: Math.max(0, Number(rec.bossesDefeated) || 0),
      playedAt: Math.max(0, Number(rec.playedAt) || 0),
    });
  }
  return cleaned
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_LEADERBOARD_ENTRIES);
}

export function loadPersistentSave(storage?: Pick<Storage, 'getItem'>): PersistentSave {
  const fallback = createDefaultSave();
  try {
    const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return fallback;
    const raw = store.getItem(SAVE_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistentSave>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;
    const upgrades: MutagenUpgrades = {
      vitality: clampFiniteInt(parsed.upgrades?.vitality, 0, 6, 0),
      metabolism: clampFiniteInt(parsed.upgrades?.metabolism, 0, 6, 0),
      dnaMagnet: clampFiniteInt(parsed.upgrades?.dnaMagnet, 0, 6, 0),
      mobility: clampFiniteInt(parsed.upgrades?.mobility, 0, 6, 0),
    };
    const leaderboard = sanitizeLeaderboard(parsed.leaderboard);
    const unlockedCharacters = sanitizeUnlockedCharacters(parsed.unlockedCharacters);
    const selectedCharacter =
      isValidCharacterId(parsed.selectedCharacter) && unlockedCharacters.includes(parsed.selectedCharacter)
        ? parsed.selectedCharacter
        : 'specimen_0';
    const hasClearedGame =
      Boolean(parsed.hasClearedGame) ||
      leaderboard.some((entry) => entry.victory) ||
      unlockedCharacters.some((id) => id !== 'specimen_0');
    const savedRun = sanitizeSavedRun(parsed.savedRun, selectedCharacter);
    return {
      saveVersion: CURRENT_SAVE_VERSION,
      playerName: sanitizePlayerName(parsed.playerName),
      mutagen: clampFiniteInt(parsed.mutagen, 0, 99_999_999, 0),
      bestBiomass: clampFiniteInt(parsed.bestBiomass, 0, 99_999_999, 0),
      bestZone: clampZoneId(parsed.bestZone),
      totalKills: clampFiniteInt(parsed.totalKills, 0, 99_999_999, 0),
      hasClearedGame,
      unlockedCharacters,
      selectedCharacter,
      upgrades,
      leaderboard,
      savedRun,
      lang: parsed.lang === 'en' || parsed.lang === 'zh' || parsed.lang === 'th' ? parsed.lang : 'th',
      difficulty: parseDifficulty(parsed.difficulty),
      sfxEnabled: parsed.sfxEnabled !== undefined ? Boolean(parsed.sfxEnabled) : true,
      bgmEnabled: parsed.bgmEnabled !== undefined ? Boolean(parsed.bgmEnabled) : true,
    };
  } catch {
    return fallback;
  }
}

export function writePersistentSave(
  save: PersistentSave,
  storage?: Pick<Storage, 'setItem'>
): void {
  try {
    const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return;
    store.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Ignore quota/private-browsing errors cleanly
  }
}
