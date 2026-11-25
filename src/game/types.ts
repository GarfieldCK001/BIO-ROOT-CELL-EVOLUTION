export type Lang = 'th' | 'en' | 'zh';

export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export type DifficultyId = 'novice' | 'normal' | 'hell';

export type ZoneId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type DnaType =
  | 'speed'
  | 'spike'
  | 'acid'
  | 'armor'
  | 'electric'
  | 'vampire'
  | 'stealth'
  | 'boss';

export type DnaInventory = Record<DnaType, number>;

export type SkillId =
  | 'jet_flagella'
  | 'chitin_spikes'
  | 'phantom_ambush'
  | 'corrosive_spit'
  | 'bio_volt_pulse'
  | 'plasmic_nova'
  | 'hexa_carapace'
  | 'siphon_tentacles'
  | 'mitosis_minions'
  | 'juggernaut_charge'
  | 'cryo_membrane'
  | 'thermal_vent_core'
  | 'frostfire_pulse'
  | 'gravity_cilia'
  | 'genome_catalyst'
  | 'singularity_bloom';

export type SkillBranch = 'predator' | 'biochem' | 'immortal' | 'elemental' | 'symbiont';

export type SkillLevels = Record<SkillId, number>;

export type OrganismKind =
  | 'glucose_orb'
  | 'atp_spark'
  | 'flagella_dart'
  | 'spike_urchin'
  | 'acid_amoeba'
  | 'shell_diatom'
  | 'volt_jelly'
  | 'leech_parasite'
  | 'camo_ghost'
  | 'colony_hydra'
  | 'iron_leviathan'
  | 'thermo_kraken'
  | 'parasite_matriarch'
  | 'omega_core';

export interface DifficultyConfig {
  id: DifficultyId;
  enemyHpMult: number;
  enemyDamageMult: number;
  enemySpeedMult: number;
  spawnCountMult: number;
  foodCountMult: number;
  maxEvolutionPoints: number;
  maxBranches: number;
  mutagenMult: number;
  bossEnrageThreshold: number;
  accentColor: string;
}

export interface ZoneConfig {
  id: ZoneId;
  worldRadius: number;
  bgInner: string;
  bgOuter: string;
  gridColor: string;
  accentColor: string;
  isLightBiome: boolean;
  hasAcidPools: boolean;
  hasAbyssalDarkness: boolean;
  hasVortex: boolean;
  hasCryoZones?: boolean;
  hasThermalVents?: boolean;
  hasShockNodes?: boolean;
  bossKind: OrganismKind | null;
  bossHpScale?: number;
  requiredRadiusToAdvance: number;
  maxRadiusInZone: number;
  maxEvoPointsInZone: number;
  spawnWeights: Partial<Record<OrganismKind, number>>;
  maxEnemies: number;
  maxFood: number;
}

export interface OrganismDef {
  kind: OrganismKind;
  category: 'food' | 'enemy' | 'boss';
  dnaDrop: DnaType | null;
  dnaAmount: number;
  baseRadius: number;
  baseHp: number;
  speed: number;
  damage: number;
  color: string;
  coreColor: string;
  zoneMin: ZoneId;
}

export interface SkillNodeDef {
  id: SkillId;
  branch: SkillBranch;
  parentIds: SkillId[];
  costDna: Partial<Record<DnaType, number>>;
  maxLevel: number;
  /** Normalized SVG coordinates on 0..800 x 0..560 tree canvas */
  x: number;
  y: number;
  accent: string;
  isActiveSkill?: boolean;
  activeSlot?: 'dash' | 'skill1' | 'skill2';
}

export type CharacterId =
  | 'specimen_0'
  | 'pyro_phage'
  | 'cryo_diatom'
  | 'chrono_cilia'
  | 'void_amoeba'
  | 'tesla_medusa'
  | 'venom_hydra'
  | 'aegis_titan'
  | 'crimson_vamp'
  | 'prism_phantom'
  | 'omega_prime'
  | 'mob_flagella_dart'
  | 'mob_spike_urchin'
  | 'mob_acid_amoeba'
  | 'mob_shell_diatom'
  | 'mob_volt_jelly'
  | 'mob_leech_parasite'
  | 'mob_camo_ghost'
  | 'mob_colony_hydra'
  | 'mob_iron_leviathan'
  | 'mob_thermo_kraken'
  | 'mob_parasite_matriarch'
  | 'mob_omega_core';

export type CharacterCategory = 'starter' | 'legendary' | 'monster';

export interface CharacterDef {
  id: CharacterId;
  category: CharacterCategory;
  organismKind?: OrganismKind;
  isPostGame: boolean;
  mutagenCost: number;
  primaryColor: string;
  secondaryColor: string;
  coreColor: string;
  accentColor: string;
  specialCooldown: number;
  specialEnergyCost: number;
  bonusMaxHp: number;
  speedMult: number;
  damageMult: number;
  energyRegenMult: number;
  magnetBonus: number;
  dnaGainBonus: number;
  armorBonus: number;
  dashCooldownMult: number;
  killHealPct: number;
  immuneHazard?: 'thermal' | 'cryo' | 'vortex' | 'shock' | 'acid';
}

export interface MutagenUpgrades {
  vitality: number; // +20 max HP per level
  metabolism: number; // +15% energy regen per level
  dnaMagnet: number; // +20% absorb radius & DNA bonus per level
  mobility: number; // +8% movement speed & dash agility per level
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  victory: boolean;
  difficulty: DifficultyId;
  zoneReached: ZoneId;
  finalBiomass: number;
  kills: number;
  elapsedSec: number;
  bossesDefeated: number;
  playedAt: number;
}

export interface PersistentSave {
  saveVersion?: number;
  playerName: string;
  mutagen: number;
  bestBiomass: number;
  bestZone: ZoneId;
  totalKills: number;
  hasClearedGame: boolean;
  unlockedCharacters: CharacterId[];
  selectedCharacter: CharacterId;
  upgrades: MutagenUpgrades;
  leaderboard: LeaderboardEntry[];
  savedRun: SavedRunSnapshot | null;
  lang: Lang;
  difficulty: DifficultyId;
  sfxEnabled: boolean;
  bgmEnabled: boolean;
}

export interface SavedRunSnapshot {
  zone: ZoneId;
  difficulty: DifficultyId;
  characterId?: CharacterId;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  radius: number;
  biomass: number;
  dna: DnaInventory;
  skills: SkillLevels;
  kills: number;
  elapsedSec: number;
  defeatedBosses: ZoneId[];
  endlessMode: boolean;
  rngSeed?: number;
  isDailyChallenge?: boolean;
}

export interface RunSummary {
  playerName?: string;
  victory: boolean;
  endlessMode: boolean;
  difficulty: DifficultyId;
  zoneReached: ZoneId;
  finalBiomass: number;
  kills: number;
  elapsedSec: number;
  mutagenEarned: number;
  bossesDefeated: number;
  score: number;
  rngSeed?: number;
  isDailyChallenge?: boolean;
}

export interface MinimapBlip {
  nx: number; // -1..1 normalized to worldRadius
  ny: number;
  kind: 'player' | 'enemy' | 'boss' | 'portal' | 'hazard';
  color: string;
  size: number;
}

export interface ToastNotice {
  id: number;
  key: string;
  params?: Record<string, string | number>;
  accent: string;
}

export interface HudSnapshot {
  characterId: CharacterId;
  hp: number;
  maxHp: number;
  ghostHp: number;
  energy: number;
  maxEnergy: number;
  radius: number;
  biomass: number;
  zone: ZoneId;
  difficulty: DifficultyId;
  endlessMode: boolean;
  dna: DnaInventory;
  skills: SkillLevels;
  canAffordAnySkill: boolean;
  nextZoneUnlocked: boolean;
  nextZoneRequirementText: string;
  growthCapped: boolean;
  evoZoneCapped: boolean;
  zoneEvoUsed: number;
  zoneEvoCap: number;
  maxRadiusInZone: number;
  boss: {
    kind: OrganismKind;
    hp: number;
    maxHp: number;
    phase: number;
  } | null;
  cooldowns: {
    dash: number;
    dashMax: number;
    skill1: number;
    skill1Max: number;
    skill2: number;
    skill2Max: number;
    special: number;
    specialMax: number;
  };
  unlockedActives: {
    skill1Name: 'spit' | 'nova' | null;
    skill2Name: 'volt' | 'stealth' | 'juggernaut' | null;
    hasCharacterSpecial: boolean;
  };
  stealthActive: boolean;
  juggernautActive: boolean;
  specialActive: boolean;
  kills: number;
  elapsedSec: number;
  minimap: MinimapBlip[];
  toast: ToastNotice | null;
}

export interface VirtualJoystickInput {
  active: boolean;
  dx: number; // -1..1
  dy: number; // -1..1
}
