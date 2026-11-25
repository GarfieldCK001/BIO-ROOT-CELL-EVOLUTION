import { CharacterId, DnaInventory, DnaType, OrganismKind, SkillLevels, ZoneId } from './types';

export interface PlayerSim {
  characterId: CharacterId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  biomass: number;
  hp: number;
  maxHp: number;
  ghostHp: number;
  energy: number;
  maxEnergy: number;
  dna: DnaInventory;
  skills: SkillLevels;
  hitFlash: number;
  squash: number;
  dashTimer: number;
  dashCooldown: number;
  dashMaxCooldown: number;
  skill1Cooldown: number;
  skill1MaxCooldown: number;
  skill2Cooldown: number;
  skill2MaxCooldown: number;
  specialCooldown: number;
  specialMaxCooldown: number;
  chronoTimer: number;
  aegisTimer: number;
  omegaSurgeTimer: number;
  flagellaSurgeTimer: number;
  singularityTimer: number;
  stealthTimer: number;
  ambushCritReady: boolean;
  juggernautTimer: number;
  autoVoltTimer: number;
  siphonTimer: number;
  hurtInvuln: number;
  trailAngle: number;
}

export type FoodKind = 'glucose_orb' | 'atp_spark' | 'hp_micro' | 'energy_micro';

export interface FoodSim {
  id: number;
  kind: FoodKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
}

export interface EnemySim {
  id: number;
  kind: OrganismKind;
  isBoss: boolean;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  territoryRadius: number;
  bossEngaged: boolean;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  hp: number;
  maxHp: number;
  hitFlash: number;
  freezeTimer: number;
  phase: number;
  aiTimer: number;
  aiState: 'wander' | 'chase' | 'flee' | 'telegraph' | 'attack' | 'latched';
  telegraphTimer: number;
  telegraphMax: number;
  chargeDirX: number;
  chargeDirY: number;
  cloakAlpha: number;
  dyingTimer: number; // > 0 means playing KO dissolve animation
  bossPhase: number;
}

export interface DnaChunkSim {
  id: number;
  dnaType: DnaType;
  amount: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  phase: number;
}

export interface ProjectileSim {
  id: number;
  fromPlayer: boolean;
  kind: 'acid' | 'plasmic' | 'boss_spore' | 'boss_acid' | 'ember' | 'omega_ray';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  color: string;
}

export interface AcidPoolSim {
  id: number;
  fromPlayer: boolean;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  dps: number;
  permanent: boolean;
}

export interface MinionSim {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  orbitAngle: number;
  attackCooldown: number;
}

export interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  ring: boolean;
}

export interface FloatingTextSim {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface LightningArcSim {
  points: Array<{ x: number; y: number }>;
  color: string;
  life: number;
  maxLife: number;
  width: number;
}

export interface AmbientMote {
  x: number;
  y: number;
  size: number;
  depth: number; // 0.2..0.75 parallax factor
  phase: number;
  hue: string;
}

export interface VortexField {
  x: number;
  y: number;
  radius: number;
  strength: number;
  clockwise: boolean;
}

export interface BiomeHazardZone {
  id: number;
  kind: 'cryo' | 'thermal' | 'shock';
  x: number;
  y: number;
  radius: number;
  timer: number;
  period: number;
}

export interface RenderWorldState {
  time: number;
  zone: ZoneId;
  cameraX: number;
  cameraY: number;
  cameraZoom: number;
  shakeX: number;
  shakeY: number;
  isTitleDemo: boolean;
  player: PlayerSim;
  foods: FoodSim[];
  enemies: EnemySim[];
  dnaChunks: DnaChunkSim[];
  projectiles: ProjectileSim[];
  acidPools: AcidPoolSim[];
  minions: MinionSim[];
  particles: ParticleSlot[];
  floatingTexts: FloatingTextSim[];
  lightningArcs: LightningArcSim[];
  ambientMotes: AmbientMote[];
  vortices: VortexField[];
  hazardZones: BiomeHazardZone[];
  siphonTargets: Array<{ x: number; y: number }>;
  portalUnlocked: boolean;
  portalX: number;
  portalY: number;
}
