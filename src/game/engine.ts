import { BioAudioEngine } from './audio';
import {
  CHARACTERS,
  createEmptyDna,
  createEmptySkills,
  DIFFICULTIES,
  DNA_COLORS,
  MAX_STANDARD_RADIUS,
  MAX_ZONE,
  ORGANISMS,
  SKILL_NODES,
  ZONES,
} from './data';
import { renderBioWorld } from './renderer';
import { normalizeSeed, SeededRng } from './rng';
import {
  applySkillUpgrade,
  calculateMutagenEarned,
  calculateRunScore,
  canSwallowDirectly,
  computeIncomingPlayerDamage,
  computeSpikeReflectDamage,
  computeTargetCameraZoom,
  computeZoneEnemyDamage,
  computeZoneEnemySpeed,
  getEffectiveZoneEvoCap,
  getMaxConcurrentChasers,
  getTotalEvolutionPointsUsed,
  hasAnyAffordableSkill,
  isEvolutionCappedInZone,
  isGrowthCappedInZone,
  isNextZoneUnlocked,
  isPlayerInBossTerritory,
  sanitizeSavedRun,
} from './rules';
import {
  AcidPoolSim,
  AmbientMote,
  BiomeHazardZone,
  DnaChunkSim,
  EnemySim,
  FloatingTextSim,
  FoodKind,
  FoodSim,
  LightningArcSim,
  MinionSim,
  ParticleSlot,
  PlayerSim,
  ProjectileSim,
  VortexField,
} from './simTypes';
import {
  CharacterId,
  DifficultyId,
  DnaType,
  GameState,
  HudSnapshot,
  MinimapBlip,
  MutagenUpgrades,
  OrganismKind,
  RunSummary,
  SavedRunSnapshot,
  SkillId,
  ToastNotice,
  VirtualJoystickInput,
  ZoneId,
} from './types';

const MAX_PARTICLES = 420;
const MAX_FLOATING_TEXTS = 48;

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onGameOver: (summary: RunSummary) => void;
  onAutoSave: (snapshot: SavedRunSnapshot | null) => void;
  onRequestToggleSkillTree: () => void;
  onRequestTogglePause: () => void;
}

export class BioRootEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audio: BioAudioEngine;
  private callbacks: EngineCallbacks;
  private rafId: number | null = null;
  private lastTimestamp = 0;

  private width = 1280;
  private height = 720;
  private dpr = 1;
  private resizeObserver: ResizeObserver | null = null;

  private gameState: GameState = 'title';
  private overlayPaused = false;
  private time = 0;
  private elapsedSec = 0;
  private hitstopTimer = 0;
  private trauma = 0;
  private hudEmitTimer = 0;
  private autoSaveTimer = 0;
  private nextEntityId = 1;
  private toastIdCounter = 1;
  private activeToast: ToastNotice | null = null;
  private toastTimer = 0;
  private warnedSkillReady = false;
  private defeatDelayTimer = -1;
  private pendingVictory = false;

  // Progression & Zone State
  private zone: ZoneId = 1;
  private difficulty: DifficultyId = 'normal';
  private selectedCharacter: CharacterId = 'specimen_0';
  private endlessMode = false;
  private defeatedBosses: ZoneId[] = [];
  private kills = 0;
  private mutagenUpgrades: MutagenUpgrades = { vitality: 0, metabolism: 0, dnaMagnet: 0, mobility: 0 };
  private runSeed = 0x9e3779b9;
  private isDailyChallenge = false;
  private rng = new SeededRng(0x9e3779b9);

  // Camera
  private cameraX = 0;
  private cameraY = 0;
  private cameraZoom = 1.0;

  // Entities
  private player: PlayerSim;
  private foods: FoodSim[] = [];
  private enemies: EnemySim[] = [];
  private dnaChunks: DnaChunkSim[] = [];
  private projectiles: ProjectileSim[] = [];
  private acidPools: AcidPoolSim[] = [];
  private minions: MinionSim[] = [];
  private particles: ParticleSlot[] = [];
  private particleCursor = 0;
  private floatingTexts: FloatingTextSim[] = [];
  private floatingTextCursor = 0;
  private lightningArcs: LightningArcSim[] = [];
  private ambientMotes: AmbientMote[] = [];
  private vortices: VortexField[] = [];
  private hazardZones: BiomeHazardZone[] = [];
  private siphonTargets: Array<{ x: number; y: number }> = [];
  private portalX = 0;
  private portalY = 0;
  private portalNotified = false;
  private growthCapWarned = false;
  private evoZoneCapWarned = false;

  // Unified Input State (Continuous held + Edge-triggered buffered actions)
  private keysHeld = new Set<string>();
  private mouseActive = false;
  private mouseClientX = 0;
  private mouseClientY = 0;
  private mouseButtonDown = false;
  private joystick: VirtualJoystickInput = { active: false, dx: 0, dy: 0 };
  private dashBuffer = 0;
  private skill1Buffer = 0;
  private skill2Buffer = 0;
  private specialBuffer = 0;

  // Bound DOM listeners for clean teardown
  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;
  private onMouseMoveBound: (e: MouseEvent) => void;
  private onMouseDownBound: (e: MouseEvent) => void;
  private onMouseUpBound: (e: MouseEvent) => void;
  private onContextMenuBound: (e: MouseEvent) => void;
  private onBlurBound: () => void;
  private onVisibilityChangeBound: () => void;

  constructor(canvas: HTMLCanvasElement, audio: BioAudioEngine, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not acquire 2D canvas context');
    }
    this.ctx = context;
    this.audio = audio;
    this.callbacks = callbacks;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        color: '#fff',
        life: 0,
        maxLife: 1,
        ring: false,
      });
    }
    for (let i = 0; i < MAX_FLOATING_TEXTS; i++) {
      this.floatingTexts.push({
        active: false,
        x: 0,
        y: 0,
        vy: -30,
        text: '',
        color: '#fff',
        life: 0,
        maxLife: 1,
        scale: 1,
      });
    }

    this.player = this.createFreshPlayer();
    this.player.radius = 28;
    this.player.skills.jet_flagella = 1;
    this.player.skills.siphon_tentacles = 1;
    this.populateAmbientMotes();
    this.setupZone(1, true);

    this.onKeyDownBound = this.handleKeyDown.bind(this);
    this.onKeyUpBound = this.handleKeyUp.bind(this);
    this.onMouseMoveBound = this.handleMouseMove.bind(this);
    this.onMouseDownBound = this.handleMouseDown.bind(this);
    this.onMouseUpBound = this.handleMouseUp.bind(this);
    this.onContextMenuBound = (e: MouseEvent) => {
      if (this.gameState === 'playing') e.preventDefault();
    };
    this.onBlurBound = this.clearHeldInputs.bind(this);
    this.onVisibilityChangeBound = () => {
      if (document.hidden) this.clearHeldInputs();
    };

    this.attachEvents();
    this.handleResize();
    this.startLoop();
  }

  private createFreshPlayer(characterId: CharacterId = this.selectedCharacter): PlayerSim {
    const charDef = CHARACTERS[characterId];
    const maxHp = 120 + this.mutagenUpgrades.vitality * 20 + charDef.bonusMaxHp;
    return {
      characterId,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: 22,
      biomass: 100,
      hp: maxHp,
      maxHp,
      ghostHp: maxHp,
      energy: 100,
      maxEnergy: 100,
      dna: createEmptyDna(),
      skills: createEmptySkills(),
      hitFlash: 0,
      squash: 0,
      dashTimer: 0,
      dashCooldown: 0,
      dashMaxCooldown: 2.1,
      skill1Cooldown: 0,
      skill1MaxCooldown: 2.2,
      skill2Cooldown: 0,
      skill2MaxCooldown: 4.5,
      specialCooldown: 0,
      specialMaxCooldown: charDef.specialCooldown,
      chronoTimer: 0,
      aegisTimer: 0,
      omegaSurgeTimer: 0,
      flagellaSurgeTimer: 0,
      singularityTimer: 2.2,
      stealthTimer: 0,
      ambushCritReady: false,
      juggernautTimer: 0,
      autoVoltTimer: 1.5,
      siphonTimer: 0.4,
      hurtInvuln: 0,
      trailAngle: 0,
    };
  }

  private populateAmbientMotes(): void {
    this.ambientMotes = [];
    const hues = ['#72f7ff', '#6effb8', '#a0c4ff', '#ffe885', '#ff99cc'];
    for (let i = 0; i < 72; i++) {
      this.ambientMotes.push({
        x: (Math.random() - 0.5) * 2600,
        y: (Math.random() - 0.5) * 2600,
        size: 3 + Math.random() * 14,
        depth: 0.22 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        hue: hues[i % hues.length],
      });
    }
  }

  private attachEvents(): void {
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    window.addEventListener('mousemove', this.onMouseMoveBound);
    this.canvas.addEventListener('mousedown', this.onMouseDownBound);
    window.addEventListener('mouseup', this.onMouseUpBound);
    this.canvas.addEventListener('contextmenu', this.onContextMenuBound);
    window.addEventListener('blur', this.onBlurBound);
    document.addEventListener('visibilitychange', this.onVisibilityChangeBound);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      if (this.canvas.parentElement) {
        this.resizeObserver.observe(this.canvas.parentElement);
      }
    }
    window.addEventListener('resize', this.handleResize);
  }

  public dispose(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    window.removeEventListener('mousemove', this.onMouseMoveBound);
    this.canvas.removeEventListener('mousedown', this.onMouseDownBound);
    window.removeEventListener('mouseup', this.onMouseUpBound);
    this.canvas.removeEventListener('contextmenu', this.onContextMenuBound);
    window.removeEventListener('blur', this.onBlurBound);
    document.removeEventListener('visibilitychange', this.onVisibilityChangeBound);
    window.removeEventListener('resize', this.handleResize);
    this.resizeObserver?.disconnect();
  }

  private handleResize = (): void => {
    const parent = this.canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    this.width = Math.max(320, Math.floor(rect.width));
    this.height = Math.max(320, Math.floor(rect.height));
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.render();
  };

  public clearHeldInputs(): void {
    this.keysHeld.clear();
    this.mouseButtonDown = false;
    this.joystick = { active: false, dx: 0, dy: 0 };
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const code = e.code;
    if (this.gameState !== 'playing' || this.overlayPaused) return;
    if (e.repeat) return;

    if (code === 'Escape' || code === 'KeyP') {
      e.preventDefault();
      this.callbacks.onRequestTogglePause();
      return;
    }
    if (code === 'KeyT' || code === 'Tab') {
      e.preventDefault();
      this.callbacks.onRequestToggleSkillTree();
      return;
    }

    this.audio.unlock();
    this.keysHeld.add(code);
    if (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') {
      e.preventDefault();
      this.dashBuffer = 0.14;
    } else if (code === 'KeyQ' || code === 'Digit1') {
      this.skill1Buffer = 0.14;
    } else if (code === 'KeyE' || code === 'Digit2') {
      this.skill2Buffer = 0.14;
    } else if (code === 'KeyR' || code === 'KeyF' || code === 'Digit3') {
      this.specialBuffer = 0.14;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keysHeld.delete(e.code);
  }

  private handleMouseMove(e: MouseEvent): void {
    this.mouseClientX = e.clientX;
    this.mouseClientY = e.clientY;
    this.mouseActive = true;
  }

  private handleMouseDown(e: MouseEvent): void {
    if (this.gameState !== 'playing' || this.overlayPaused) return;
    this.audio.unlock();
    this.mouseClientX = e.clientX;
    this.mouseClientY = e.clientY;
    this.mouseActive = true;
    if (e.button === 0) {
      this.mouseButtonDown = true;
      if (this.player.skills.corrosive_spit > 0 || this.player.skills.plasmic_nova > 0) {
        this.skill1Buffer = 0.14;
      }
    } else if (e.button === 2) {
      this.skill2Buffer = 0.14;
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.mouseButtonDown = false;
    }
  }

  public setVirtualJoystick(input: VirtualJoystickInput): void {
    this.joystick = input;
    if (input.active) {
      this.mouseActive = false;
    }
  }

  public triggerDash(): void {
    if (this.gameState !== 'playing' || this.overlayPaused) return;
    this.audio.unlock();
    this.dashBuffer = 0.14;
  }

  public triggerSkill1(): void {
    if (this.gameState !== 'playing' || this.overlayPaused) return;
    this.audio.unlock();
    this.skill1Buffer = 0.14;
  }

  public triggerSkill2(): void {
    if (this.gameState !== 'playing' || this.overlayPaused) return;
    this.audio.unlock();
    this.skill2Buffer = 0.14;
  }

  public triggerCharacterSpecial(): void {
    if (this.gameState !== 'playing' || this.overlayPaused) return;
    this.audio.unlock();
    this.specialBuffer = 0.14;
  }

  public setSelectedCharacter(characterId: CharacterId): void {
    this.selectedCharacter = characterId;
    if (this.gameState === 'title') {
      this.player.characterId = characterId;
    }
  }

  public setMutagenUpgrades(upgrades: MutagenUpgrades): void {
    this.mutagenUpgrades = { ...upgrades };
  }

  /**
   * Hard-freeze simulation time whenever an upgrade or overlay modal is open so
   * bosses, enemies, projectiles, and timers can NEVER harm the player while upgrading.
   */
  public setOverlayPaused(paused: boolean): void {
    if (this.overlayPaused === paused) return;
    this.overlayPaused = paused;
    if (paused) {
      this.clearHeldInputs();
      this.dashBuffer = 0;
      this.skill1Buffer = 0;
      this.skill2Buffer = 0;
      this.specialBuffer = 0;
    } else {
      // Prevent dt spike and grant a short safe grace window right after closing upgrades
      this.lastTimestamp = performance.now();
      if (this.gameState === 'playing') {
        this.player.hurtInvuln = Math.max(this.player.hurtInvuln, 0.65);
        this.emitHudSnapshot();
      }
    }
  }

  public setGameState(next: GameState): void {
    this.gameState = next;
    if (next !== 'playing') {
      this.clearHeldInputs();
    }
    if (next === 'playing') {
      this.lastTimestamp = performance.now();
      this.audio.startBgm();
      this.emitHudSnapshot();
    } else {
      this.audio.pauseBgm();
    }
  }

  public startNewRun(
    upgrades: MutagenUpgrades,
    fromUserGesture = true,
    difficulty: DifficultyId = 'normal',
    characterId: CharacterId = this.selectedCharacter,
    seed?: number,
    isDailyChallenge = false
  ): void {
    this.difficulty = difficulty;
    this.selectedCharacter = characterId;
    this.mutagenUpgrades = { ...upgrades };
    this.runSeed = normalizeSeed(seed);
    this.isDailyChallenge = isDailyChallenge;
    this.rng = new SeededRng(this.runSeed);
    this.elapsedSec = 0;
    this.kills = 0;
    this.defeatedBosses = [];
    this.endlessMode = false;
    this.defeatDelayTimer = -1;
    this.pendingVictory = false;
    this.warnedSkillReady = false;
    this.activeToast = null;
    this.player = this.createFreshPlayer(characterId);
    this.setupZone(1, false);
    this.clearHeldInputs();
    this.gameState = 'playing';
    if (fromUserGesture) {
      this.audio.unlock();
    }
    this.audio.startBgm();
    this.emitHudSnapshot();
    this.saveCurrentRun();
  }

  public continueFromSave(saved: SavedRunSnapshot, upgrades: MutagenUpgrades): void {
    const safe = sanitizeSavedRun(saved, this.selectedCharacter);
    if (!safe) {
      this.startNewRun(upgrades, true, this.difficulty, this.selectedCharacter);
      return;
    }
    this.difficulty = safe.difficulty;
    this.selectedCharacter = safe.characterId ?? this.selectedCharacter;
    this.mutagenUpgrades = { ...upgrades };
    this.runSeed = normalizeSeed(safe.rngSeed);
    this.isDailyChallenge = Boolean(safe.isDailyChallenge);
    this.rng = new SeededRng(this.runSeed ^ (safe.zone * 2654435761));
    this.elapsedSec = safe.elapsedSec;
    this.kills = safe.kills;
    this.defeatedBosses = [...safe.defeatedBosses];
    this.endlessMode = safe.endlessMode;
    this.defeatDelayTimer = -1;
    this.pendingVictory = false;
    this.player = this.createFreshPlayer(this.selectedCharacter);
    this.player.maxHp = safe.maxHp;
    this.player.hp = Math.max(1, Math.min(safe.maxHp, safe.hp));
    this.player.ghostHp = this.player.hp;
    this.player.maxEnergy = safe.maxEnergy;
    this.player.energy = Math.max(0, Math.min(safe.maxEnergy, safe.energy));
    this.player.radius = safe.radius;
    this.player.biomass = safe.biomass;
    this.player.dna = { ...createEmptyDna(), ...safe.dna };
    this.player.skills = { ...createEmptySkills(), ...safe.skills };
    this.setupZone(safe.zone, false);
    this.syncMinionCount();
    this.clearHeldInputs();
    this.gameState = 'playing';
    this.audio.unlock();
    this.audio.startBgm();
    this.emitHudSnapshot();
  }

  public continueEndlessMode(): void {
    this.endlessMode = true;
    this.defeatDelayTimer = -1;
    this.pendingVictory = false;
    this.player.hp = this.player.maxHp;
    this.player.ghostHp = this.player.maxHp;
    this.player.energy = this.player.maxEnergy;
    this.setupZone(MAX_ZONE, false);
    this.gameState = 'playing';
    this.audio.startBgm();
    this.emitHudSnapshot();
  }

  public returnToTitleDemo(): void {
    this.gameState = 'title';
    this.clearHeldInputs();
    this.audio.pauseBgm();
    this.player = this.createFreshPlayer();
    this.player.radius = 28;
    // Showcase a few evolved traits subtly on title preview
    this.player.skills.jet_flagella = 1;
    this.player.skills.siphon_tentacles = 1;
    this.setupZone(1, true);
  }

  public upgradeSkill(skillId: SkillId): boolean {
    const res = applySkillUpgrade(
      skillId,
      this.player.skills,
      this.player.dna,
      this.difficulty,
      this.zone,
      this.endlessMode
    );
    if (!res) return false;
    this.player.skills = res.skills;
    this.player.dna = res.dna;

    // Immediate mechanical bonuses
    if (skillId === 'hexa_carapace') {
      this.player.maxHp += 30;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
    }
    if (skillId === 'mitosis_minions') {
      this.syncMinionCount();
    }

    // Evolution shockwave VFX & SFX
    const accent = SKILL_NODES[skillId].accent;
    this.spawnRing(this.player.x, this.player.y, this.player.radius * 1.15, accent, 0.55);
    this.spawnBurst(this.player.x, this.player.y, accent, 24, 240);
    this.trauma = Math.min(1, this.trauma + 0.35);
    this.audio.playEvolve();

    if (
      !this.evoZoneCapWarned &&
      isEvolutionCappedInZone(this.zone, this.player.skills, this.difficulty, this.endlessMode)
    ) {
      this.evoZoneCapWarned = true;
      const cap = getEffectiveZoneEvoCap(this.zone, this.difficulty, this.endlessMode);
      this.showToast('evoZoneCapped', { zone: this.zone, cap }, '#ff9e4a');
    } else {
      this.showToast('evolved', { name: skillId }, accent);
    }
    this.emitHudSnapshot();
    this.saveCurrentRun();
    return true;
  }

  public advanceToNextZone(): boolean {
    if (this.zone >= MAX_ZONE) return false;
    if (!isNextZoneUnlocked(this.zone, this.player.radius, this.defeatedBosses)) return false;
    const nextZone = (this.zone + 1) as ZoneId;
    this.setupZone(nextZone, false);
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.35);
    this.spawnRing(this.player.x, this.player.y, this.player.radius * 1.4, ZONES[nextZone].accentColor, 0.7);
    this.audio.playEvolve();
    this.showToast('enteredZone', { zone: nextZone }, ZONES[nextZone].accentColor);
    this.emitHudSnapshot();
    this.saveCurrentRun();
    return true;
  }

  private setupZone(zoneId: ZoneId, isTitleDemo: boolean): void {
    this.zone = zoneId;
    const cfg = ZONES[zoneId];
    const diff = DIFFICULTIES[this.difficulty];
    this.foods = [];
    this.enemies = [];
    this.dnaChunks = [];
    this.projectiles = [];
    this.acidPools = [];
    this.vortices = [];
    this.hazardZones = [];
    this.lightningArcs = [];
    this.portalNotified = false;
    this.growthCapWarned = false;
    this.evoZoneCapWarned = false;

    this.player.x = 0;
    this.player.y = 0;
    this.player.vx = 0;
    this.player.vy = 0;
    this.cameraX = 0;
    this.cameraY = 0;
    this.cameraZoom = computeTargetCameraZoom(this.player.radius);

    // Portal placed safely in upper-right quadrant
    this.portalX = cfg.worldRadius * 0.48;
    this.portalY = -cfg.worldRadius * 0.38;

    // Permanent acid pools (Zones 2, 7, 8, 10)
    if (cfg.hasAcidPools) {
      const poolCount = zoneId === 8 ? 9 : 6;
      for (let i = 0; i < poolCount; i++) {
        const a = (i / poolCount) * Math.PI * 2 + 0.4;
        const dist = 360 + this.rng.next() * (cfg.worldRadius - 560);
        this.acidPools.push({
          id: this.nextEntityId++,
          fromPlayer: false,
          x: Math.cos(a) * dist,
          y: Math.sin(a) * dist,
          radius: 78 + this.rng.next() * 58,
          life: 9999,
          maxLife: 9999,
          dps: Math.round((13 + zoneId * 1.4) * diff.enemyDamageMult),
          permanent: true,
        });
      }
    }

    // Vortex currents (Zones 9 & 10)
    if (cfg.hasVortex) {
      const count = zoneId === 9 ? 4 : 3;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + 0.5;
        const dist = 580;
        this.vortices.push({
          x: Math.cos(a) * dist,
          y: Math.sin(a) * dist,
          radius: 270,
          strength: zoneId === 9 ? 225 : 195,
          clockwise: i % 2 === 0,
        });
      }
    }

    // Cryo Preservation frost fields (Zone 4)
    if (cfg.hasCryoZones) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.25;
        const dist = 420 + (i % 2) * 380;
        this.hazardZones.push({
          id: this.nextEntityId++,
          kind: 'cryo',
          x: Math.cos(a) * dist,
          y: Math.sin(a) * dist,
          radius: 155,
          timer: 0,
          period: 1,
        });
      }
    }

    // Thermal Hydro-Vents (Zone 5)
    if (cfg.hasThermalVents) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.6;
        const dist = 460 + (i % 2) * 340;
        this.hazardZones.push({
          id: this.nextEntityId++,
          kind: 'thermal',
          x: Math.cos(a) * dist,
          y: Math.sin(a) * dist,
          radius: 120,
          timer: 0,
          period: 1,
        });
      }
    }

    // Bio-Electric Shock Nodes (Zones 6 & 9)
    if (cfg.hasShockNodes) {
      const nodes = zoneId === 6 ? 6 : 4;
      for (let i = 0; i < nodes; i++) {
        const a = (i / nodes) * Math.PI * 2;
        const dist = 540 + (i % 2) * 350;
        const period = 3.6;
        this.hazardZones.push({
          id: this.nextEntityId++,
          kind: 'shock',
          x: Math.cos(a) * dist,
          y: Math.sin(a) * dist,
          radius: 145,
          timer: (i / nodes) * period,
          period,
        });
      }
    }

    // Spawn initial food & active enemies scaled by difficulty
    const targetFood = Math.round(cfg.maxFood * (isTitleDemo ? 1 : diff.foodCountMult));
    for (let i = 0; i < targetFood; i++) {
      this.spawnFood(110);
    }
    const initEnemies = isTitleDemo
      ? 18
      : Math.max(12, Math.round(cfg.maxEnemies * diff.spawnCountMult));
    for (let i = 0; i < initEnemies; i++) {
      // Spread enemies cleanly across territories (only 25% in outer visible ring, safely away from spawn)
      const nearRing = i < Math.floor(initEnemies * 0.25);
      this.spawnEnemy(isTitleDemo ? 240 : 370, undefined, undefined, undefined, nearRing);
    }

    // Spawn Zone Boss if applicable and not yet defeated (or always in endless mode)
    if (!isTitleDemo && cfg.bossKind && (!this.defeatedBosses.includes(zoneId) || this.endlessMode)) {
      this.spawnBoss(cfg.bossKind);
    }
  }

  private spawnFood(
    minDistFromPlayer: number,
    forceKind?: FoodKind,
    nearX?: number,
    nearY?: number
  ): void {
    const cfg = ZONES[this.zone];
    let x = 0;
    let y = 0;
    if (nearX !== undefined && nearY !== undefined) {
      const a = this.rng.next() * Math.PI * 2;
      const d = 18 + this.rng.next() * 44;
      x = nearX + Math.cos(a) * d;
      y = nearY + Math.sin(a) * d;
    } else {
      const angle = this.rng.next() * Math.PI * 2;
      const dist = minDistFromPlayer + this.rng.next() * (cfg.worldRadius - minDistFromPlayer - 80);
      x = Math.cos(angle) * dist;
      y = Math.sin(angle) * dist;
    }

    let kind: FoodKind;
    if (forceKind) {
      kind = forceKind;
    } else {
      const roll = this.rng.next();
      if (roll < 0.64) kind = 'glucose_orb';
      else if (roll < 0.82) kind = 'atp_spark';
      else if (roll < 0.92) kind = 'hp_micro';
      else kind = 'energy_micro';
    }

    const baseSpeed =
      kind === 'glucose_orb' ? 18 : kind === 'atp_spark' ? 36 : 14;
    const radius =
      kind === 'glucose_orb'
        ? 8.5 + this.rng.next() * 2.2
        : kind === 'atp_spark'
        ? 7.5 + this.rng.next() * 1.8
        : 6.5;

    this.foods.push({
      id: this.nextEntityId++,
      kind,
      x,
      y,
      vx: (this.rng.next() - 0.5) * baseSpeed,
      vy: (this.rng.next() - 0.5) * baseSpeed,
      radius,
      phase: this.rng.next() * Math.PI * 2,
    });
  }

  private pickWeightedEnemyKind(): OrganismKind {
    const weights = ZONES[this.zone].spawnWeights;
    const entries = Object.entries(weights) as Array<[OrganismKind, number]>;
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = this.rng.next() * total;
    for (const [kind, w] of entries) {
      roll -= w;
      if (roll <= 0) return kind;
    }
    return 'flagella_dart';
  }

  private spawnEnemy(
    minDistFromPlayer: number,
    forceKind?: OrganismKind,
    nearX?: number,
    nearY?: number,
    preferNearPlayer = false
  ): void {
    const cfg = ZONES[this.zone];
    const kind = forceKind ?? this.pickWeightedEnemyKind();
    const def = ORGANISMS[kind];

    let x = 0;
    let y = 0;
    if (nearX !== undefined && nearY !== undefined) {
      const a = this.rng.next() * Math.PI * 2;
      x = nearX + Math.cos(a) * 105;
      y = nearY + Math.sin(a) * 105;
    } else if (preferNearPlayer) {
      // Spawn inside an active encounter ring around the player so the field is always lively
      for (let attempt = 0; attempt < 10; attempt++) {
        const a = this.rng.next() * Math.PI * 2;
        const d = minDistFromPlayer + this.rng.next() * 460;
        const cx = this.player.x + Math.cos(a) * d;
        const cy = this.player.y + Math.sin(a) * d;
        if (Math.hypot(cx, cy) < cfg.worldRadius - 100) {
          x = cx;
          y = cy;
          break;
        }
      }
      if (x === 0 && y === 0) {
        const a = this.rng.next() * Math.PI * 2;
        const d = minDistFromPlayer + this.rng.next() * Math.max(120, cfg.worldRadius - minDistFromPlayer - 140);
        x = Math.cos(a) * d;
        y = Math.sin(a) * d;
      }
    } else {
      for (let attempt = 0; attempt < 12; attempt++) {
        const a = this.rng.next() * Math.PI * 2;
        const d = Math.sqrt(this.rng.next()) * (cfg.worldRadius - 110);
        const cx = Math.cos(a) * d;
        const cy = Math.sin(a) * d;
        if (Math.hypot(cx - this.player.x, cy - this.player.y) >= minDistFromPlayer) {
          x = cx;
          y = cy;
          break;
        }
      }
    }

    const diff = DIFFICULTIES[this.difficulty];
    // Mix of smaller swallowable prey (35%) and dangerous equal/larger predators (65%)
    const predatorRoll =
      this.rng.next() < 0.65 ? 1.06 + this.rng.next() * 0.34 : 0.78 + this.rng.next() * 0.24;
    const scale = predatorRoll + (this.zone - 1) * 0.085 + (this.endlessMode ? 0.25 : 0);
    const radius = def.baseRadius * Math.min(1.85, scale);
    const maxHp = Math.round(def.baseHp * scale * (1 + (this.zone - 1) * 0.16) * diff.enemyHpMult);

    this.enemies.push({
      id: this.nextEntityId++,
      kind,
      isBoss: false,
      x,
      y,
      homeX: x,
      homeY: y,
      territoryRadius: 270 + this.rng.next() * 110,
      bossEngaged: false,
      vx: 0,
      vy: 0,
      angle: this.rng.next() * Math.PI * 2,
      radius,
      hp: maxHp,
      maxHp,
      hitFlash: 0,
      freezeTimer: 0,
      phase: this.rng.next() * Math.PI * 2,
      aiTimer: 0.6 + this.rng.next() * 1.4,
      aiState: 'wander',
      telegraphTimer: 0,
      telegraphMax: 0.6,
      chargeDirX: 1,
      chargeDirY: 0,
      cloakAlpha: kind === 'camo_ghost' ? 0.24 : 1,
      dyingTimer: 0,
      bossPhase: 1,
    });
  }

  private spawnBoss(kind: OrganismKind): void {
    const def = ORGANISMS[kind];
    const cfg = ZONES[this.zone];
    const diff = DIFFICULTIES[this.difficulty];
    const angle = Math.PI * 0.78;
    const dist = cfg.worldRadius * 0.58;
    const endlessMult = this.endlessMode ? 1.4 : 1;
    const zoneBossScale = cfg.bossHpScale ?? 1;
    const maxHp = Math.round(def.baseHp * zoneBossScale * endlessMult * diff.enemyHpMult);
    const bx = Math.cos(angle) * dist;
    const by = Math.sin(angle) * dist;
    const territoryRadius =
      kind === 'omega_core'
        ? 560
        : kind === 'parasite_matriarch'
        ? 520
        : kind === 'iron_leviathan'
        ? 510
        : kind === 'thermo_kraken'
        ? 500
        : 460;

    this.enemies.push({
      id: this.nextEntityId++,
      kind,
      isBoss: true,
      x: bx,
      y: by,
      homeX: bx,
      homeY: by,
      territoryRadius,
      bossEngaged: false,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: def.baseRadius,
      hp: maxHp,
      maxHp,
      hitFlash: 0,
      freezeTimer: 0,
      phase: 0,
      aiTimer: 2.2,
      aiState: 'wander',
      telegraphTimer: 0,
      telegraphMax: 0.8,
      chargeDirX: 1,
      chargeDirY: 0,
      cloakAlpha: 1,
      dyingTimer: 0,
      bossPhase: 1,
    });

    this.audio.playBossWarning();
    this.showToast('bossSpawned', { name: kind }, def.color);
  }

  private syncMinionCount(): void {
    const target = this.player.skills.mitosis_minions * 2;
    while (this.minions.length < target) {
      const idx = this.minions.length;
      this.minions.push({
        id: this.nextEntityId++,
        x: this.player.x + Math.cos(idx) * 50,
        y: this.player.y + Math.sin(idx) * 50,
        vx: 0,
        vy: 0,
        radius: 10,
        orbitAngle: (idx / Math.max(1, target)) * Math.PI * 2,
        attackCooldown: 0,
      });
    }
  }

  private startLoop(): void {
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(rawDt, 0.05);

      if ((this.gameState === 'title' || this.gameState === 'playing') && !this.overlayPaused) {
        this.update(dt);
        this.render();
      }

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private update(dt: number): void {
    this.time += dt;

    // Camera shake decays in real time even during hitstop
    this.trauma = Math.max(0, this.trauma - dt * 1.9);

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.activeToast = null;
      }
    }

    if (this.gameState === 'title') {
      this.updateTitleDemo(dt);
      return;
    }

    if (this.gameState !== 'playing') {
      return;
    }

    // Brief dramatic beat on defeat/victory before freezing stats
    if (this.defeatDelayTimer > 0) {
      this.defeatDelayTimer -= dt;
      this.updateVfxOnly(dt);
      if (this.defeatDelayTimer <= 0) {
        this.finishRun(this.pendingVictory);
      }
      return;
    }

    // Hitstop freezes simulation physics while VFX & flashes continue
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateVfxOnly(dt);
      return;
    }

    this.elapsedSec += dt;
    this.updatePlayer(dt);
    this.updateFoods(dt);
    this.updateDnaChunks(dt);
    this.updateEnemies(dt);
    this.updateMinions(dt);
    this.updateProjectiles(dt);
    this.updateAcidPools(dt);
    this.updateHazardZones(dt);
    this.updateVfxOnly(dt);
    this.updateSpawning();
    this.updateCamera(dt);

    // Check Zone Unlock Notification
    if (!this.portalNotified && isNextZoneUnlocked(this.zone, this.player.radius, this.defeatedBosses)) {
      this.portalNotified = true;
      this.audio.playEvolve();
      this.showToast('zoneUnlocked', { zone: this.zone + 1 }, ZONES[this.zone].accentColor);
    }

    // Check Portal Collision
    if (this.portalNotified && this.zone < MAX_ZONE) {
      const distPortal = Math.hypot(this.player.x - this.portalX, this.player.y - this.portalY);
      if (distPortal < this.player.radius + 48) {
        this.advanceToNextZone();
      }
    }

    // Periodic Auto-Save & HUD Sync (~7 Hz for smooth compositor performance)
    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.14) {
      this.hudEmitTimer = 0;
      this.emitHudSnapshot();
    }

    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= 5) {
      this.autoSaveTimer = 0;
      this.saveCurrentRun();
    }
  }

  private updateTitleDemo(dt: number): void {
    // Smooth figure-8 microscope tour on Title Screen
    const targetX = Math.cos(this.time * 0.35) * 420;
    const targetY = Math.sin(this.time * 0.52) * 260;
    const dx = targetX - this.player.x;
    const dy = targetY - this.player.y;
    this.player.vx += (dx * 0.9 - this.player.vx) * Math.min(1, dt * 3);
    this.player.vy += (dy * 0.9 - this.player.vy) * Math.min(1, dt * 3);
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;
    this.player.angle = Math.atan2(this.player.vy, this.player.vx);

    // Gentle drift for ambient foods & enemies
    for (const f of this.foods) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
    }
    for (const e of this.enemies) {
      e.x += Math.cos(this.time * 0.6 + e.phase) * 32 * dt;
      e.y += Math.sin(this.time * 0.5 + e.phase) * 32 * dt;
      e.angle = Math.atan2(Math.sin(this.time * 0.5 + e.phase), Math.cos(this.time * 0.6 + e.phase));
    }

    // Keep hero slightly right-of-center on desktop so left negative space frames the SVG Title cleanly
    const offsetX = this.width >= 900 ? -150 : 0;
    this.cameraX += (this.player.x + offsetX - this.cameraX) * Math.min(1, dt * 3.5);
    this.cameraY += (this.player.y - this.cameraY) * Math.min(1, dt * 3.5);
    this.cameraZoom += (0.95 - this.cameraZoom) * Math.min(1, dt * 2);
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    const s = p.skills;
    const charDef = CHARACTERS[p.characterId];

    // Timers
    p.hitFlash = Math.max(0, p.hitFlash - dt);
    p.hurtInvuln = Math.max(0, p.hurtInvuln - dt);
    p.squash *= Math.exp(-9 * dt);
    p.dashTimer = Math.max(0, p.dashTimer - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.skill1Cooldown = Math.max(0, p.skill1Cooldown - dt);
    p.skill2Cooldown = Math.max(0, p.skill2Cooldown - dt);
    p.specialCooldown = Math.max(0, p.specialCooldown - dt);
    p.chronoTimer = Math.max(0, p.chronoTimer - dt);
    p.aegisTimer = Math.max(0, p.aegisTimer - dt);
    p.omegaSurgeTimer = Math.max(0, p.omegaSurgeTimer - dt);
    p.flagellaSurgeTimer = Math.max(0, p.flagellaSurgeTimer - dt);
    p.stealthTimer = Math.max(0, p.stealthTimer - dt);
    p.juggernautTimer = Math.max(0, p.juggernautTimer - dt);
    this.dashBuffer = Math.max(0, this.dashBuffer - dt);
    this.skill1Buffer = Math.max(0, this.skill1Buffer - dt);
    this.skill2Buffer = Math.max(0, this.skill2Buffer - dt);
    this.specialBuffer = Math.max(0, this.specialBuffer - dt);

    // Delayed ghost HP bar trail
    p.ghostHp += (p.hp - p.ghostHp) * Math.min(1, dt * 4.2);

    // Passive Energy Regen (boosted by Genome Catalyst)
    const regenRate =
      (13 + this.mutagenUpgrades.metabolism * 2.2) *
      (1 + s.jet_flagella * 0.08 + s.genome_catalyst * 0.15) *
      charDef.energyRegenMult;
    p.energy = Math.min(p.maxEnergy, p.energy + regenRate * dt);

    // Directional Input (WASD/Arrows > Virtual Joystick > Gentle Mouse Steering when moving cursor)
    let moveX = 0;
    let moveY = 0;
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) moveY -= 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) moveY += 1;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) moveX -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) moveX += 1;

    const keyboardDriving = moveX !== 0 || moveY !== 0;

    if (keyboardDriving) {
      const len = Math.hypot(moveX, moveY) || 1;
      moveX /= len;
      moveY /= len;
    } else if (this.joystick.active) {
      moveX = this.joystick.dx;
      moveY = this.joystick.dy;
    } else if (this.mouseActive && this.mouseButtonDown) {
      const worldMouse = this.screenToWorld(this.mouseClientX, this.mouseClientY);
      const dx = worldMouse.x - p.x;
      const dy = worldMouse.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 18) {
        moveX = dx / dist;
        moveY = dy / dist;
      }
    }

    // Aim angle (toward cursor if mouse active & keyboard idle, else movement vector)
    if (keyboardDriving || this.joystick.active) {
      const targetAngle = Math.atan2(moveY, moveX);
      p.angle = lerpAngle(p.angle, targetAngle, Math.min(1, dt * 13));
    } else if (this.mouseActive) {
      const worldMouse = this.screenToWorld(this.mouseClientX, this.mouseClientY);
      const dx = worldMouse.x - p.x;
      const dy = worldMouse.y - p.y;
      if (Math.hypot(dx, dy) > 10) {
        p.angle = lerpAngle(p.angle, Math.atan2(dy, dx), Math.min(1, dt * 12));
      }
    }

    // Movement Speed & Acceleration (with Cryo zone chill check + Cryo Membrane / character immunity)
    let cryoSlow = 1;
    if (charDef.immuneHazard !== 'cryo' && s.cryo_membrane <= 0) {
      for (const hz of this.hazardZones) {
        if (hz.kind === 'cryo' && Math.hypot(p.x - hz.x, p.y - hz.y) < hz.radius + p.radius * 0.4) {
          cryoSlow = p.juggernautTimer > 0 || p.aegisTimer > 0 ? 1 : 0.62;
          break;
        }
      }
    }
    const sizePenalty = Math.max(0.72, 1 - (p.radius - 22) * 0.0036);
    const mobilityMult = (1 + this.mutagenUpgrades.mobility * 0.08) * charDef.speedMult;
    const maxSpeed =
      (235 + s.jet_flagella * 44) *
      mobilityMult *
      sizePenalty *
      cryoSlow *
      (p.stealthTimer > 0 ? 1.28 : 1) *
      (p.juggernautTimer > 0 ? 1.45 : 1) *
      (p.chronoTimer > 0 ? 1.24 : 1) *
      (p.omegaSurgeTimer > 0 ? 1.32 : 1) *
      (p.flagellaSurgeTimer > 0 ? 1.48 : 1);

    const accel = p.dashTimer > 0 ? 14 : 7.5 + this.mutagenUpgrades.mobility * 0.35;
    const targetVx = p.dashTimer > 0 ? Math.cos(p.angle) * maxSpeed * 2.15 : moveX * maxSpeed;
    const targetVy = p.dashTimer > 0 ? Math.sin(p.angle) * maxSpeed * 2.15 : moveY * maxSpeed;
    p.vx += (targetVx - p.vx) * Math.min(1, dt * accel);
    p.vy += (targetVy - p.vy) * Math.min(1, dt * accel);

    // Vortex Pull Forces (Void-Amoeba & Omega Core immune; Gravity Cilia dampens pull)
    if (charDef.immuneHazard !== 'vortex') {
      const vortexDamp = Math.max(0.15, 1 - s.gravity_cilia * 0.28);
      for (const v of this.vortices) {
        const dx = v.x - p.x;
        const dy = v.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < v.radius && dist > 12) {
          const pull = (1 - dist / v.radius) * v.strength * vortexDamp;
          const nx = dx / dist;
          const ny = dy / dist;
          const tangent = v.clockwise ? 1 : -1;
          p.vx += (nx * pull * 0.55 - ny * tangent * pull * 0.85) * dt;
          p.vy += (ny * pull * 0.55 + nx * tangent * pull * 0.85) * dt;
        }
      }
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Clamp to Petri Dish Boundary
    const worldRadius = ZONES[this.zone].worldRadius - p.radius;
    const distOrigin = Math.hypot(p.x, p.y);
    if (distOrigin > worldRadius) {
      p.x = (p.x / distOrigin) * worldRadius;
      p.y = (p.y / distOrigin) * worldRadius;
      p.vx *= 0.4;
      p.vy *= 0.4;
    }

    // Consume Buffered Actions: Dash
    if (this.dashBuffer > 0 && p.dashCooldown <= 0 && p.energy >= 22) {
      this.dashBuffer = 0;
      p.energy -= 22;
      p.dashTimer = 0.22 + s.jet_flagella * 0.04;
      p.dashMaxCooldown = Math.max(
        0.7,
        (2.0 - s.jet_flagella * 0.32 - this.mutagenUpgrades.mobility * 0.06) * charDef.dashCooldownMult
      );
      p.dashCooldown = p.dashMaxCooldown;
      p.squash = 0.9;
      this.audio.playDash();
      this.spawnBurst(
        p.x - Math.cos(p.angle) * p.radius,
        p.y - Math.sin(p.angle) * p.radius,
        charDef.accentColor,
        10,
        170
      );

      // Shake off any latched Leech Parasites!
      for (const e of this.enemies) {
        if (e.aiState === 'latched') {
          e.aiState = 'wander';
          e.aiTimer = 1.4;
          const pushA = Math.random() * Math.PI * 2;
          e.vx = Math.cos(pushA) * 320;
          e.vy = Math.sin(pushA) * 320;
        }
      }

      if (s.frostfire_pulse > 0) {
        this.triggerFrostfirePulse(0.75);
      }
    }

    // Consume Buffered Action: Skill 1 (Corrosive Spit OR Hybrid Plasmic Nova)
    if (this.skill1Buffer > 0 && p.skill1Cooldown <= 0 && (s.corrosive_spit > 0 || s.plasmic_nova > 0)) {
      const isNova = s.plasmic_nova > 0;
      const energyCost = isNova ? 34 : 20;
      if (p.energy >= energyCost) {
        this.skill1Buffer = 0;
        p.energy -= energyCost;
        p.skill1MaxCooldown = isNova ? 3.2 : Math.max(1.2, 2.2 - s.corrosive_spit * 0.25);
        p.skill1Cooldown = p.skill1MaxCooldown;
        p.squash = -0.6;
        this.fireSkill1(isNova);
        if (s.frostfire_pulse > 0) this.triggerFrostfirePulse(0.9);
      }
    }

    // Consume Buffered Action: Skill 2 (Juggernaut > Phantom Ambush > Bio-Volt Pulse)
    if (
      this.skill2Buffer > 0 &&
      p.skill2Cooldown <= 0 &&
      (s.juggernaut_charge > 0 || s.phantom_ambush > 0 || s.bio_volt_pulse > 0)
    ) {
      const energyCost = 30;
      if (p.energy >= energyCost) {
        this.skill2Buffer = 0;
        p.energy -= energyCost;
        this.fireSkill2();
        if (s.frostfire_pulse > 0) this.triggerFrostfirePulse(1.0);
      }
    }

    // Consume Buffered Action: Post-Game Character Unique Special Skill [R]
    if (
      this.specialBuffer > 0 &&
      charDef.isPostGame &&
      p.specialCooldown <= 0 &&
      p.energy >= charDef.specialEnergyCost
    ) {
      this.specialBuffer = 0;
      p.energy -= charDef.specialEnergyCost;
      p.specialMaxCooldown = charDef.specialCooldown;
      p.specialCooldown = charDef.specialCooldown;
      p.squash = -0.75;
      this.fireCharacterSpecial();
      if (s.frostfire_pulse > 0) this.triggerFrostfirePulse(1.0);
    }

    // Passive Bio-Volt Auto-Zap
    if (s.bio_volt_pulse > 0) {
      p.autoVoltTimer -= dt;
      if (p.autoVoltTimer <= 0) {
        p.autoVoltTimer = Math.max(1.3, 2.7 - s.bio_volt_pulse * 0.4);
        this.triggerVoltShock(155 + s.bio_volt_pulse * 32, 16 + s.bio_volt_pulse * 10, false);
      }
    }

    // Passive Cryo Membrane Chill Aura (slows nearby predators)
    if (s.cryo_membrane > 0) {
      const chillRange = p.radius + 115 + s.cryo_membrane * 35;
      const damp = Math.exp(-(1.2 + s.cryo_membrane * 0.65) * dt);
      for (const e of this.enemies) {
        if (e.dyingTimer > 0) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) < chillRange + e.radius) {
          e.vx *= damp;
          e.vy *= damp;
        }
      }
    }

    // Passive Singularity Bloom Periodic Gravity Pulse (pulls smaller prey inward & pulses bosses)
    if (s.singularity_bloom > 0) {
      p.singularityTimer -= dt;
      if (p.singularityTimer <= 0) {
        p.singularityTimer = Math.max(1.6, 3.2 - s.singularity_bloom * 0.45);
        const singR = p.radius + 195 + s.singularity_bloom * 45;
        this.spawnRing(p.x, p.y, singR * 0.42, '#e879f9', 0.42);
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d <= singR + e.radius) {
            if (!e.isBoss && d > p.radius + e.radius + 14) {
              e.x += (p.x - e.x) * 0.28;
              e.y += (p.y - e.y) * 0.28;
            }
            this.damageEnemy(e, 14 + s.singularity_bloom * 10, false, '#e879f9');
          }
        }
      }
    }

    // Passive Siphon Tentacles Drain
    this.siphonTargets = [];
    if (s.siphon_tentacles > 0) {
      const siphonRange = p.radius + 95 + s.siphon_tentacles * 32;
      p.siphonTimer -= dt;
      let drained = false;
      for (const e of this.enemies) {
        if (e.dyingTimer > 0) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < siphonRange + e.radius) {
          this.siphonTargets.push({ x: e.x, y: e.y });
          if (p.siphonTimer <= 0) {
            const drainDmg = 5 + s.siphon_tentacles * 4;
            this.damageEnemy(e, drainDmg, false, '#f447a6');
            p.hp = Math.min(p.maxHp, p.hp + drainDmg * 0.45);
            drained = true;
          }
        }
      }
      if (drained) {
        p.siphonTimer = 0.45;
      }
    }
  }

  private triggerFrostfirePulse(scale = 1): void {
    const p = this.player;
    const lv = p.skills.frostfire_pulse;
    if (lv <= 0) return;
    const pulseR = p.radius + 150 + lv * 38;
    const dmg = Math.round((24 + lv * 14) * scale);
    this.spawnRing(p.x, p.y, pulseR * 0.48, '#ffa84c', 0.42);
    this.spawnRing(p.x, p.y, pulseR * 0.34, '#7ce8ff', 0.36);
    for (const e of this.enemies) {
      if (e.dyingTimer > 0) continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) <= pulseR + e.radius) {
        e.freezeTimer = Math.max(e.freezeTimer, e.isBoss ? 0.65 : 1.1 + lv * 0.3);
        this.damageEnemy(e, dmg, false, '#ffa84c');
      }
    }
  }

  private fireSkill1(isNova: boolean): void {
    const p = this.player;
    const s = p.skills;
    const aimAngle = this.getAimAngle();

    if (isNova) {
      // Hybrid Plasmic Nova: Acid-lightning burst wave + 5 directional plasma globs
      this.audio.playAcid();
      this.audio.playZap();
      this.trauma = Math.min(1, this.trauma + 0.45);
      const novaRange = p.radius + 210 + s.plasmic_nova * 35;
      this.spawnRing(p.x, p.y, p.radius * 2.2, '#3af7c8', 0.55);
      this.triggerVoltShock(novaRange, 36 + s.plasmic_nova * 18, true);

      for (let i = -2; i <= 2; i++) {
        const a = aimAngle + i * 0.22;
        this.projectiles.push({
          id: this.nextEntityId++,
          fromPlayer: true,
          kind: 'plasmic',
          x: p.x + Math.cos(a) * p.radius,
          y: p.y + Math.sin(a) * p.radius,
          vx: Math.cos(a) * 520,
          vy: Math.sin(a) * 520,
          radius: 10,
          damage: 34 + s.plasmic_nova * 16 + s.corrosive_spit * 8,
          life: 1.05,
          color: '#3af7c8',
        });
      }
    } else {
      // Corrosive Spit: fires acid glob that creates corrosive puddle
      this.audio.playAcid();
      const count = s.corrosive_spit >= 3 ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) * 0.5) * 0.2;
        const a = aimAngle + offset;
        this.projectiles.push({
          id: this.nextEntityId++,
          fromPlayer: true,
          kind: 'acid',
          x: p.x + Math.cos(a) * p.radius,
          y: p.y + Math.sin(a) * p.radius,
          vx: Math.cos(a) * 480,
          vy: Math.sin(a) * 480,
          radius: 9,
          damage: 26 + s.corrosive_spit * 12,
          life: 1.0,
          color: '#44f56b',
        });
      }
    }
  }

  private fireSkill2(): void {
    const p = this.player;
    const s = p.skills;

    if (s.juggernaut_charge > 0) {
      p.juggernautTimer = 2.4 + s.juggernaut_charge * 0.45;
      p.skill2MaxCooldown = 7.5;
      p.skill2Cooldown = 7.5;
      this.audio.playDash();
      this.spawnRing(p.x, p.y, p.radius * 1.4, '#ffbb33', 0.5);
      this.trauma = Math.min(1, this.trauma + 0.32);
    } else if (s.phantom_ambush > 0) {
      p.stealthTimer = 3.5 + s.phantom_ambush * 0.5;
      p.ambushCritReady = true;
      p.skill2MaxCooldown = 6.2;
      p.skill2Cooldown = 6.2;
      this.audio.playDash();
      this.spawnRing(p.x, p.y, p.radius * 1.3, '#b26bff', 0.45);
    } else if (s.bio_volt_pulse > 0) {
      p.skill2MaxCooldown = 4.2;
      p.skill2Cooldown = 4.2;
      this.triggerVoltShock(225 + s.bio_volt_pulse * 42, 34 + s.bio_volt_pulse * 18, true);
    }
  }

  private triggerVoltShock(range: number, damage: number, activeCast: boolean): void {
    const p = this.player;
    let hitAny = false;
    for (const e of this.enemies) {
      if (e.dyingTimer > 0) continue;
      const dist = Math.hypot(e.x - p.x, e.y - p.y);
      if (dist <= range + e.radius) {
        hitAny = true;
        this.spawnLightning(p.x, p.y, e.x, e.y, '#5ceeff', activeCast ? 2.8 : 1.8);
        this.damageEnemy(e, damage, activeCast, '#5ceeff');
      }
    }
    if (hitAny || activeCast) {
      this.audio.playZap();
      if (activeCast) {
        this.spawnRing(p.x, p.y, range * 0.36, '#35d8ff', 0.4);
        this.trauma = Math.min(1, this.trauma + 0.25);
      }
    }
  }

  /**
   * Execute the selected Post-Game Character's 1 unique signature Special Skill [R].
   */
  private fireCharacterSpecial(): void {
    const p = this.player;
    const charId = p.characterId;
    const aimAngle = this.getAimAngle();
    const powerScale = 1 + (this.zone - 1) * 0.14;

    switch (charId) {
      case 'pyro_phage': {
        // Solar Eruption: radial blast + 8 scorching ember projectiles
        this.audio.playAcid();
        this.trauma = Math.min(1, this.trauma + 0.48);
        const blastR = p.radius + 230;
        this.spawnRing(p.x, p.y, blastR * 0.55, '#ff7a2b', 0.52);
        this.spawnBurst(p.x, p.y, '#ffbe55', 28, 280);
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d <= blastR + e.radius) {
            this.damageEnemy(e, Math.round(62 * powerScale), true, '#ff8533');
            const nx = (e.x - p.x) / (d || 1);
            const ny = (e.y - p.y) / (d || 1);
            e.vx += nx * 320;
            e.vy += ny * 320;
          }
        }
        for (let i = 0; i < 8; i++) {
          const a = aimAngle + (i / 8) * Math.PI * 2;
          this.projectiles.push({
            id: this.nextEntityId++,
            fromPlayer: true,
            kind: 'ember',
            x: p.x + Math.cos(a) * p.radius,
            y: p.y + Math.sin(a) * p.radius,
            vx: Math.cos(a) * 520,
            vy: Math.sin(a) * 520,
            radius: 10,
            damage: Math.round(40 * powerScale),
            life: 0.95,
            color: '#ff8a33',
          });
        }
        break;
      }

      case 'cryo_diatom': {
        // Absolute Zero: deep freeze wave that damages & freezes nearby enemies for 3.2s
        this.audio.playZap();
        this.trauma = Math.min(1, this.trauma + 0.36);
        const freezeR = p.radius + 280;
        this.spawnRing(p.x, p.y, freezeR * 0.65, '#8ceeff', 0.6);
        this.spawnBurst(p.x, p.y, '#d9faff', 26, 230);
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) <= freezeR + e.radius) {
            e.freezeTimer = Math.max(e.freezeTimer, e.isBoss ? 1.8 : 3.2);
            e.vx *= 0.1;
            e.vy *= 0.1;
            this.damageEnemy(e, Math.round(48 * powerScale), true, '#8ceeff');
          }
        }
        break;
      }

      case 'chrono_cilia': {
        // Time Dilation: slows all enemies & hostile projectiles for 4.5s while accelerating player
        this.audio.playEvolve();
        p.chronoTimer = 4.5;
        this.spawnRing(p.x, p.y, p.radius * 3.4, '#fcd34d', 0.68);
        this.spawnBurst(p.x, p.y, '#fff2a6', 22, 210);
        break;
      }

      case 'void_amoeba': {
        // Singularity Rift: violently pulls nearby enemies, food & DNA inward then implodes
        this.audio.playAcid();
        this.trauma = Math.min(1, this.trauma + 0.45);
        const pullR = p.radius + 360;
        this.spawnRing(p.x, p.y, pullR * 0.55, '#b76cff', 0.58);
        this.spawnBurst(p.x, p.y, '#d8b4fe', 26, 240);
        for (const f of this.foods) {
          if (Math.hypot(f.x - p.x, f.y - p.y) < pullR) {
            f.x += (p.x - f.x) * 0.72;
            f.y += (p.y - f.y) * 0.72;
          }
        }
        for (const c of this.dnaChunks) {
          if (Math.hypot(c.x - p.x, c.y - p.y) < pullR) {
            c.x += (p.x - c.x) * 0.78;
            c.y += (p.y - c.y) * 0.78;
          }
        }
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d <= pullR + e.radius) {
            if (!e.isBoss && d > p.radius + e.radius + 18) {
              e.x += (p.x - e.x) * 0.48;
              e.y += (p.y - e.y) * 0.48;
            }
            this.damageEnemy(e, Math.round(66 * powerScale), true, '#c084fc');
          }
        }
        break;
      }

      case 'tesla_medusa': {
        // Storm Overdrive: strikes up to 8 enemies in huge radius with twin chain-lightning arcs
        this.audio.playZap();
        this.trauma = Math.min(1, this.trauma + 0.42);
        const stormR = p.radius + 350;
        this.spawnRing(p.x, p.y, stormR * 0.5, '#38e8ff', 0.52);
        const targets = this.enemies
          .filter((e) => e.dyingTimer <= 0 && Math.hypot(e.x - p.x, e.y - p.y) <= stormR + e.radius)
          .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))
          .slice(0, 8);
        for (const e of targets) {
          this.spawnLightning(p.x, p.y, e.x, e.y, '#6ef7ff', 3.4);
          this.damageEnemy(e, Math.round(74 * powerScale), true, '#38e8ff', true);
        }
        break;
      }

      case 'venom_hydra': {
        // Bio-Plague Bloom: drops 4 large acid pools + sprays 6 venomous darts
        this.audio.playAcid();
        this.trauma = Math.min(1, this.trauma + 0.34);
        for (let i = 0; i < 4; i++) {
          const a = aimAngle + (i / 4) * Math.PI * 2;
          this.acidPools.push({
            id: this.nextEntityId++,
            fromPlayer: true,
            x: p.x + Math.cos(a) * (p.radius + 68),
            y: p.y + Math.sin(a) * (p.radius + 68),
            radius: 74,
            life: 5.5,
            maxLife: 5.5,
            dps: Math.round(34 * powerScale),
            permanent: false,
          });
        }
        for (let i = 0; i < 6; i++) {
          const a = aimAngle + (i - 2.5) * 0.24;
          this.projectiles.push({
            id: this.nextEntityId++,
            fromPlayer: true,
            kind: 'acid',
            x: p.x + Math.cos(a) * p.radius,
            y: p.y + Math.sin(a) * p.radius,
            vx: Math.cos(a) * 510,
            vy: Math.sin(a) * 510,
            radius: 10,
            damage: Math.round(42 * powerScale),
            life: 1.05,
            color: '#4ade80',
          });
        }
        this.spawnRing(p.x, p.y, p.radius * 2.2, '#4ade80', 0.48);
        break;
      }

      case 'aegis_titan': {
        // Fortress Aegis: 4.0s full invulnerability dome + 25% heal + knockback shockwave
        this.audio.playEvolve();
        p.aegisTimer = 4.0;
        const healAmt = Math.round(p.maxHp * 0.25);
        p.hp = Math.min(p.maxHp, p.hp + healAmt);
        this.spawnFloatingText(p.x, p.y - p.radius - 12, `+${healAmt} HP`, '#facc15', 1.15);
        this.spawnRing(p.x, p.y, p.radius * 2.6, '#facc15', 0.55);
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < p.radius + 210 + e.radius) {
            this.damageEnemy(e, Math.round(45 * powerScale), true, '#facc15');
            e.vx += ((e.x - p.x) / (d || 1)) * 380;
            e.vy += ((e.y - p.y) / (d || 1)) * 380;
          }
        }
        break;
      }

      case 'crimson_vamp': {
        // Blood Feast: drains huge life from all nearby enemies & heals 65% of total damage dealt
        this.audio.playEat(0.85);
        this.trauma = Math.min(1, this.trauma + 0.35);
        const feastR = p.radius + 290;
        this.spawnRing(p.x, p.y, feastR * 0.55, '#fb4570', 0.55);
        let totalHealed = 0;
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) <= feastR + e.radius) {
            const hitDmg = Math.round(58 * powerScale);
            this.spawnLightning(p.x, p.y, e.x, e.y, '#fb4570', 2.6);
            this.damageEnemy(e, hitDmg, true, '#fb4570');
            totalHealed += hitDmg * 0.65;
          }
        }
        if (totalHealed > 0) {
          const cappedHeal = Math.min(Math.round(p.maxHp * 0.45), Math.round(totalHealed));
          p.hp = Math.min(p.maxHp, p.hp + cappedHeal);
          this.spawnFloatingText(p.x, p.y - p.radius - 10, `+${cappedHeal} HP`, '#fda4af', 1.12);
        }
        break;
      }

      case 'prism_phantom': {
        // Phase Blink: instant 280px teleport forward with prismatic blast at start & destination
        this.audio.playDash();
        this.trauma = Math.min(1, this.trauma + 0.38);
        const startX = p.x;
        const startY = p.y;
        this.spawnRing(startX, startY, p.radius * 2.1, '#e879f9', 0.45);
        this.spawnBurst(startX, startY, '#67e8f9', 18, 220);

        const blinkDist = 280;
        let nx = p.x + Math.cos(aimAngle) * blinkDist;
        let ny = p.y + Math.sin(aimAngle) * blinkDist;
        const maxR = ZONES[this.zone].worldRadius - p.radius - 12;
        const distFromCenter = Math.hypot(nx, ny);
        if (distFromCenter > maxR) {
          nx = (nx / distFromCenter) * maxR;
          ny = (ny / distFromCenter) * maxR;
        }
        p.x = nx;
        p.y = ny;
        p.hurtInvuln = Math.max(p.hurtInvuln, 0.75);
        p.ambushCritReady = true;

        this.spawnRing(p.x, p.y, p.radius * 2.4, '#67e8f9', 0.5);
        this.spawnBurst(p.x, p.y, '#e879f9', 22, 260);
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          const dStart = Math.hypot(e.x - startX, e.y - startY);
          const dEnd = Math.hypot(e.x - p.x, e.y - p.y);
          if (dStart < 170 + e.radius || dEnd < 185 + e.radius) {
            this.damageEnemy(e, Math.round(68 * powerScale), true, '#e879f9', true);
          }
        }
        break;
      }

      case 'omega_prime': {
        // Omega Annihilation: massive golden-magenta nova + 10 Omega Rays + 2.5s invincible surge
        this.audio.playVictory();
        this.trauma = Math.min(1, this.trauma + 0.65);
        p.omegaSurgeTimer = 2.5;
        const novaR = p.radius + 340;
        this.spawnRing(p.x, p.y, novaR * 0.65, '#ff4f93', 0.65);
        this.spawnRing(p.x, p.y, novaR * 0.45, '#7cf7ff', 0.5);
        this.spawnBurst(p.x, p.y, '#ffe875', 36, 320);

        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) <= novaR + e.radius) {
            this.spawnLightning(p.x, p.y, e.x, e.y, '#ff4f93', 3.4);
            this.damageEnemy(e, Math.round(92 * powerScale), true, '#ff70a6', true);
          }
        }
        for (let i = 0; i < 10; i++) {
          const a = aimAngle + (i / 10) * Math.PI * 2;
          this.projectiles.push({
            id: this.nextEntityId++,
            fromPlayer: true,
            kind: 'omega_ray',
            x: p.x + Math.cos(a) * p.radius,
            y: p.y + Math.sin(a) * p.radius,
            vx: Math.cos(a) * 590,
            vy: Math.sin(a) * 590,
            radius: 11,
            damage: Math.round(54 * powerScale),
            life: 1.15,
            color: i % 2 === 0 ? '#ff4f93' : '#7cf7ff',
          });
        }
        break;
      }

      case 'mob_flagella_dart': {
        // Hyper-Flagella Jet: supersonic lunge slicing foes + 2.6s speed surge
        this.audio.playDash();
        this.trauma = Math.min(1, this.trauma + 0.3);
        p.flagellaSurgeTimer = 2.6;
        p.dashTimer = 0.28;
        p.vx = Math.cos(aimAngle) * 760;
        p.vy = Math.sin(aimAngle) * 760;
        this.spawnRing(p.x, p.y, p.radius * 2.1, '#ff823d', 0.42);
        this.spawnBurst(p.x, p.y, '#ffd4a3', 20, 250);
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) <= p.radius + 210 + e.radius) {
            this.damageEnemy(e, Math.round(54 * powerScale), true, '#ff823d', true);
          }
        }
        break;
      }

      case 'mob_spike_urchin': {
        // Quill Nova: 12 piercing chitin spikes in 360° + knockback
        this.audio.playHit(true);
        this.trauma = Math.min(1, this.trauma + 0.36);
        this.spawnRing(p.x, p.y, p.radius * 2.4, '#ff385c', 0.48);
        for (let i = 0; i < 12; i++) {
          const a = aimAngle + (i / 12) * Math.PI * 2;
          this.projectiles.push({
            id: this.nextEntityId++,
            fromPlayer: true,
            kind: 'ember',
            x: p.x + Math.cos(a) * p.radius,
            y: p.y + Math.sin(a) * p.radius,
            vx: Math.cos(a) * 540,
            vy: Math.sin(a) * 540,
            radius: 8,
            damage: Math.round(38 * powerScale),
            life: 0.9,
            color: '#ff385c',
          });
        }
        break;
      }

      case 'mob_acid_amoeba': {
        // Corrosive Meltdown: huge boiling acid mire + 14% HP heal
        this.audio.playAcid();
        const healAmt = Math.round(p.maxHp * 0.14);
        p.hp = Math.min(p.maxHp, p.hp + healAmt);
        this.spawnFloatingText(p.x, p.y - p.radius - 10, `+${healAmt} HP`, '#8aff9e', 1.05);
        this.acidPools.push({
          id: this.nextEntityId++,
          fromPlayer: true,
          x: p.x,
          y: p.y,
          radius: p.radius + 145,
          life: 6.0,
          maxLife: 6.0,
          dps: Math.round(42 * powerScale),
          permanent: false,
        });
        this.spawnRing(p.x, p.y, p.radius + 135, '#3cf264', 0.52);
        break;
      }

      case 'mob_shell_diatom': {
        // Silica Bastion: 3.0s invulnerability dome + heavy knockback shockwave
        this.audio.playEvolve();
        p.aegisTimer = 3.0;
        this.spawnRing(p.x, p.y, p.radius * 2.6, '#f5c23b', 0.52);
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d <= p.radius + 220 + e.radius) {
            this.damageEnemy(e, Math.round(44 * powerScale), true, '#f5c23b');
            e.vx += ((e.x - p.x) / (d || 1)) * 360;
            e.vy += ((e.y - p.y) / (d || 1)) * 360;
          }
        }
        break;
      }

      case 'mob_volt_jelly': {
        // Arc Cascade: zaps up to 6 targets with high-voltage jellyfish lightning
        this.audio.playZap();
        this.trauma = Math.min(1, this.trauma + 0.35);
        const range = p.radius + 320;
        this.spawnRing(p.x, p.y, range * 0.45, '#2dd6ff', 0.48);
        const targets = this.enemies
          .filter((e) => e.dyingTimer <= 0 && Math.hypot(e.x - p.x, e.y - p.y) <= range + e.radius)
          .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))
          .slice(0, 6);
        for (const e of targets) {
          this.spawnLightning(p.x, p.y, e.x, e.y, '#8ceeff', 3.0);
          this.damageEnemy(e, Math.round(66 * powerScale), true, '#2dd6ff', true);
        }
        break;
      }

      case 'mob_leech_parasite': {
        // Parasitic Syphon: drains nearby enemies for HP and Energy
        this.audio.playEat(0.9);
        const syphonR = p.radius + 260;
        this.spawnRing(p.x, p.y, syphonR * 0.5, '#f244a4', 0.5);
        let hits = 0;
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) <= syphonR + e.radius) {
            hits++;
            this.spawnLightning(p.x, p.y, e.x, e.y, '#ff8fd0', 2.4);
            this.damageEnemy(e, Math.round(50 * powerScale), true, '#f244a4');
          }
        }
        if (hits > 0) {
          const heal = Math.min(Math.round(p.maxHp * 0.38), hits * 18);
          p.hp = Math.min(p.maxHp, p.hp + heal);
          p.energy = Math.min(p.maxEnergy, p.energy + Math.min(45, hits * 14));
          this.spawnFloatingText(p.x, p.y - p.radius - 10, `+${heal} HP`, '#ff8fd0', 1.1);
        }
        break;
      }

      case 'mob_camo_ghost': {
        // Spectral Ambush: 4.0s stealth cloak + guaranteed ambush crit + burst shock
        this.audio.playDash();
        p.stealthTimer = 4.0;
        p.ambushCritReady = true;
        this.spawnRing(p.x, p.y, p.radius * 2.5, '#b069ff', 0.5);
        this.spawnBurst(p.x, p.y, '#d9b8ff', 22, 230);
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) <= p.radius + 175 + e.radius) {
            this.damageEnemy(e, Math.round(52 * powerScale), true, '#b069ff', true);
          }
        }
        break;
      }

      case 'mob_colony_hydra': {
        // Hydra Brood Volley: 8 toxic spores + 18% HP heal
        this.audio.playAcid();
        this.trauma = Math.min(1, this.trauma + 0.42);
        const healAmt = Math.round(p.maxHp * 0.18);
        p.hp = Math.min(p.maxHp, p.hp + healAmt);
        this.spawnFloatingText(p.x, p.y - p.radius - 10, `+${healAmt} HP`, '#90ffb8', 1.1);
        this.spawnRing(p.x, p.y, p.radius * 2.6, '#4ef289', 0.52);
        for (let i = 0; i < 8; i++) {
          const a = aimAngle + (i / 8) * Math.PI * 2;
          this.projectiles.push({
            id: this.nextEntityId++,
            fromPlayer: true,
            kind: 'acid',
            x: p.x + Math.cos(a) * p.radius,
            y: p.y + Math.sin(a) * p.radius,
            vx: Math.cos(a) * 490,
            vy: Math.sin(a) * 490,
            radius: 11,
            damage: Math.round(46 * powerScale),
            life: 1.1,
            color: '#4ef289',
          });
        }
        break;
      }

      case 'mob_iron_leviathan': {
        // Leviathan Juggernaut: 3.2s unstoppable armored charge + iron slam shockwave
        this.audio.playHit(true);
        this.trauma = Math.min(1, this.trauma + 0.52);
        p.juggernautTimer = 3.2;
        p.vx = Math.cos(aimAngle) * 580;
        p.vy = Math.sin(aimAngle) * 580;
        const slamR = p.radius + 250;
        this.spawnRing(p.x, p.y, slamR * 0.58, '#f5b83b', 0.56);
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d <= slamR + e.radius) {
            this.damageEnemy(e, Math.round(74 * powerScale), true, '#f5b83b', true);
            e.vx += ((e.x - p.x) / (d || 1)) * 420;
            e.vy += ((e.y - p.y) / (d || 1)) * 420;
          }
        }
        break;
      }

      case 'mob_thermo_kraken': {
        // Magma Tentacle Nova: searing thermal blast + 10 blazing ember orbs
        this.audio.playHit(true);
        this.trauma = Math.min(1, this.trauma + 0.5);
        const blastR = p.radius + 245;
        this.spawnRing(p.x, p.y, blastR * 0.55, '#ff5e2b', 0.54);
        this.spawnBurst(p.x, p.y, '#ffe07d', 28, 280);
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d <= blastR + e.radius) {
            this.damageEnemy(e, Math.round(72 * powerScale), true, '#ff6a2b', true);
            e.vx += ((e.x - p.x) / (d || 1)) * 340;
            e.vy += ((e.y - p.y) / (d || 1)) * 340;
          }
        }
        for (let i = 0; i < 10; i++) {
          const a = aimAngle + (i / 10) * Math.PI * 2;
          this.projectiles.push({
            id: this.nextEntityId++,
            fromPlayer: true,
            kind: 'ember',
            x: p.x + Math.cos(a) * p.radius,
            y: p.y + Math.sin(a) * p.radius,
            vx: Math.cos(a) * 530,
            vy: Math.sin(a) * 530,
            radius: 10,
            damage: Math.round(48 * powerScale),
            life: 1.05,
            color: i % 2 === 0 ? '#ff5e2b' : '#ffe07d',
          });
        }
        break;
      }

      case 'mob_parasite_matriarch': {
        // Crimson Brood Siphon: drains all nearby foes for massive HP + Energy and launches 6 crimson bolts
        this.audio.playEat(0.85);
        this.trauma = Math.min(1, this.trauma + 0.48);
        const siphonR = p.radius + 310;
        this.spawnRing(p.x, p.y, siphonR * 0.55, '#e62e7b', 0.56);
        let hits = 0;
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) <= siphonR + e.radius) {
            hits++;
            this.spawnLightning(p.x, p.y, e.x, e.y, '#ff7ab3', 2.8);
            this.damageEnemy(e, Math.round(68 * powerScale), true, '#e62e7b', true);
          }
        }
        const healAmt = Math.min(Math.round(p.maxHp * 0.42), Math.max(Math.round(p.maxHp * 0.14), hits * 24));
        p.hp = Math.min(p.maxHp, p.hp + healAmt);
        p.energy = Math.min(p.maxEnergy, p.energy + Math.min(50, hits * 15));
        this.spawnFloatingText(p.x, p.y - p.radius - 10, `+${healAmt} HP`, '#ffafd2', 1.15);
        for (let i = 0; i < 6; i++) {
          const a = aimAngle + (i / 6) * Math.PI * 2;
          this.projectiles.push({
            id: this.nextEntityId++,
            fromPlayer: true,
            kind: 'acid',
            x: p.x + Math.cos(a) * p.radius,
            y: p.y + Math.sin(a) * p.radius,
            vx: Math.cos(a) * 480,
            vy: Math.sin(a) * 480,
            radius: 10,
            damage: Math.round(44 * powerScale),
            life: 1.05,
            color: '#e62e7b',
          });
        }
        break;
      }

      case 'mob_omega_core': {
        // Reactor Singularity: twin plasma rings + 12 Omega Rays + 2.0s surge
        this.audio.playVictory();
        this.trauma = Math.min(1, this.trauma + 0.6);
        p.omegaSurgeTimer = 2.0;
        const r = p.radius + 320;
        this.spawnRing(p.x, p.y, r * 0.62, '#ff3b7f', 0.6);
        this.spawnRing(p.x, p.y, r * 0.42, '#7cf7ff', 0.48);
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) <= r + e.radius) {
            this.damageEnemy(e, Math.round(86 * powerScale), true, '#ff3b7f', true);
          }
        }
        for (let i = 0; i < 12; i++) {
          const a = aimAngle + (i / 12) * Math.PI * 2;
          this.projectiles.push({
            id: this.nextEntityId++,
            fromPlayer: true,
            kind: 'omega_ray',
            x: p.x + Math.cos(a) * p.radius,
            y: p.y + Math.sin(a) * p.radius,
            vx: Math.cos(a) * 570,
            vy: Math.sin(a) * 570,
            radius: 10,
            damage: Math.round(50 * powerScale),
            life: 1.15,
            color: i % 2 === 0 ? '#ff3b7f' : '#7cf7ff',
          });
        }
        break;
      }

      default:
        break;
    }
  }

  private updateFoods(dt: number): void {
    const p = this.player;
    const charDef = CHARACTERS[p.characterId];
    const magnetRange =
      p.radius +
      54 +
      this.mutagenUpgrades.dnaMagnet * 22 +
      p.skills.siphon_tentacles * 48 +
      p.skills.gravity_cilia * 48 +
      charDef.magnetBonus;
    const catalystHealMult = 1 + p.skills.genome_catalyst * 0.22;

    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i];
      f.x += f.vx * dt;
      f.y += f.vy * dt;

      const dx = p.x - f.x;
      const dy = p.y - f.y;
      const dist = Math.hypot(dx, dy);

      if (dist < magnetRange && dist > 1) {
        const pull = (1 - dist / magnetRange) * 380;
        f.x += (dx / dist) * pull * dt;
        f.y += (dy / dist) * pull * dt;
      }

      if (dist < p.radius + f.radius * 0.85) {
        if (f.kind === 'glucose_orb') {
          p.hp = Math.min(p.maxHp, p.hp + 2 * catalystHealMult);
          this.addBiomass(8);
          this.spawnBurst(f.x, f.y, '#6effb8', 5, 95);
          this.audio.playEat(1.0);
        } else if (f.kind === 'atp_spark') {
          p.energy = Math.min(p.maxEnergy, p.energy + 14 * catalystHealMult);
          this.addBiomass(4);
          this.spawnBurst(f.x, f.y, '#ffe85c', 6, 110);
          this.audio.playEat(1.32);
        } else if (f.kind === 'hp_micro') {
          const baseHeal = this.difficulty === 'novice' ? 20 : this.difficulty === 'hell' ? 12 : 16;
          const healAmt = Math.round(baseHeal * catalystHealMult);
          p.hp = Math.min(p.maxHp, p.hp + healAmt);
          this.addBiomass(1);
          this.spawnBurst(f.x, f.y, '#ff5c8a', 7, 115);
          this.spawnFloatingText(f.x, f.y - 10, `+${healAmt} HP`, '#ff7aa2', 0.9);
          this.audio.playEat(1.15);
        } else {
          const enAmt = Math.round(24 * catalystHealMult);
          p.energy = Math.min(p.maxEnergy, p.energy + enAmt);
          this.addBiomass(1);
          this.spawnBurst(f.x, f.y, '#38e0ff', 7, 115);
          this.spawnFloatingText(f.x, f.y - 10, `+${enAmt} EN`, '#6ef0ff', 0.9);
          this.audio.playEat(1.42);
        }
        p.squash = 0.25;
        this.foods.splice(i, 1);
      }
    }
  }

  private updateDnaChunks(dt: number): void {
    const p = this.player;
    const charDef = CHARACTERS[p.characterId];
    const magnetRange =
      p.radius +
      95 +
      this.mutagenUpgrades.dnaMagnet * 28 +
      p.skills.siphon_tentacles * 58 +
      p.skills.gravity_cilia * 54 +
      charDef.magnetBonus;

    for (let i = this.dnaChunks.length - 1; i >= 0; i--) {
      const c = this.dnaChunks[i];
      c.life -= dt;
      c.vx *= Math.exp(-3.5 * dt);
      c.vy *= Math.exp(-3.5 * dt);
      c.x += c.vx * dt;
      c.y += c.vy * dt;

      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const dist = Math.hypot(dx, dy);

      if (dist < magnetRange && dist > 1) {
        const pull = 280 + (1 - dist / magnetRange) * 520;
        c.x += (dx / dist) * pull * dt;
        c.y += (dy / dist) * pull * dt;
      }

      if (dist < p.radius + c.radius + 4) {
        const labBonus = this.mutagenUpgrades.dnaMagnet >= 2 && this.rng.chance(0.25) ? 1 : 0;
        const charBonus = charDef.dnaGainBonus > 0 && this.rng.chance(charDef.dnaGainBonus) ? 1 : 0;
        const catalystBonus =
          p.skills.genome_catalyst > 0 && this.rng.chance(p.skills.genome_catalyst * 0.16) ? 1 : 0;
        const gained = c.amount + labBonus + charBonus + catalystBonus;
        p.dna[c.dnaType] += gained;
        this.addBiomass(10 * gained);
        p.hp = Math.min(p.maxHp, p.hp + 3);
        this.audio.playEat(1.18);
        this.spawnBurst(c.x, c.y, DNA_COLORS[c.dnaType], 8, 130);
        this.spawnFloatingText(c.x, c.y - 10, `+${gained} ${c.dnaType.toUpperCase()}`, DNA_COLORS[c.dnaType], 0.95);
        this.dnaChunks.splice(i, 1);

        if (
          !this.warnedSkillReady &&
          hasAnyAffordableSkill(p.skills, p.dna, this.difficulty, this.zone, this.endlessMode)
        ) {
          this.warnedSkillReady = true;
          this.showToast('skillReady', undefined, '#48f57b');
        }
        continue;
      }

      if (c.life <= 0) {
        this.dnaChunks.splice(i, 1);
      }
    }
  }

  private updateEnemies(dt: number): void {
    const p = this.player;
    const worldRadius = ZONES[this.zone].worldRadius;
    const playerHidden = p.stealthTimer > 0;

    // Determine at most 2–5 concurrent active attackers in this zone so enemies never swarm the player all at once
    const maxChasers = getMaxConcurrentChasers(this.zone, this.difficulty);
    const activeChaserIds = new Set<number>();
    if (!playerHidden) {
      const candidates: Array<{ id: number; priority: number; dist: number }> = [];
      for (const e of this.enemies) {
        if (e.dyingTimer > 0 || e.isBoss || e.kind === 'flagella_dart') continue;
        const distPlayer = Math.hypot(p.x - e.x, p.y - e.y);
        const distHome = Math.hypot(e.x - e.homeX, e.y - e.homeY);
        const alreadyEngaged =
          e.aiState === 'latched' || e.aiState === 'telegraph' || e.aiState === 'attack';
        if (alreadyEngaged) {
          candidates.push({ id: e.id, priority: 0, dist: distPlayer });
          continue;
        }
        if ((e.kind === 'spike_urchin' || e.kind === 'shell_diatom') && e.radius < p.radius * 0.82) {
          continue;
        }
        if (distPlayer <= e.territoryRadius && distHome <= e.territoryRadius * 1.45) {
          candidates.push({ id: e.id, priority: 1, dist: distPlayer });
        }
      }
      candidates.sort((a, b) => a.priority - b.priority || a.dist - b.dist);
      for (let c = 0; c < Math.min(maxChasers, candidates.length); c++) {
        activeChaserIds.add(candidates[c].id);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.freezeTimer = Math.max(0, e.freezeTimer - dt);

      // KO Dissolve Transition
      if (e.dyingTimer > 0) {
        e.dyingTimer -= dt;
        if (e.dyingTimer <= 0) {
          this.finalizeEnemyDeath(e);
          this.enemies.splice(i, 1);
        }
        continue;
      }

      // Frozen by Cryo-Diatom's Absolute Zero: stays immobilized & cannot attack
      if (e.freezeTimer > 0) {
        e.vx *= Math.exp(-8 * dt);
        e.vy *= Math.exp(-8 * dt);
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        continue;
      }

      const chronoScale = p.chronoTimer > 0 ? 0.3 : 1;
      const effDt = dt * chronoScale;
      const def = ORGANISMS[e.kind];
      const diff = DIFFICULTIES[this.difficulty];
      const enemySpeed = computeZoneEnemySpeed(def.speed, this.zone, diff.enemySpeedMult) * chronoScale;
      const enemyDamage = computeZoneEnemyDamage(def.damage, this.zone, diff.enemyDamageMult, e.isBoss);
      const zoneCadenceScale = Math.max(0.72, 1 - (this.zone - 1) * 0.025);
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      const dirX = dx / dist;
      const dirY = dy / dist;
      const canAggro = !playerHidden && activeChaserIds.has(e.id);

      // Distinct AI Behavior per Species (with territory bounds & active-attacker cap)
      e.aiTimer -= effDt;

      if (e.kind === 'flagella_dart') {
        // Swift Evader: flees rapidly when player gets close, otherwise patrols territory
        if (!playerHidden && dist < 300) {
          e.vx += (-dirX * enemySpeed * 1.2 - e.vx) * Math.min(1, dt * 6);
          e.vy += (-dirY * enemySpeed * 1.2 - e.vy) * Math.min(1, dt * 6);
        } else {
          this.steerTerritoryPatrol(e, enemySpeed * 0.72, dt);
        }
      } else if (e.kind === 'spike_urchin' || e.kind === 'shell_diatom') {
        if (canAggro) {
          e.vx += (dirX * enemySpeed * 1.04 - e.vx) * Math.min(1, dt * 3.5);
          e.vy += (dirY * enemySpeed * 1.04 - e.vy) * Math.min(1, dt * 3.5);
        } else {
          this.steerTerritoryPatrol(e, enemySpeed * 0.72, dt);
        }
      } else if (e.kind === 'acid_amoeba') {
        if (canAggro) {
          e.vx += (dirX * enemySpeed * 1.02 - e.vx) * Math.min(1, dt * 3.8);
          e.vy += (dirY * enemySpeed * 1.02 - e.vy) * Math.min(1, dt * 3.8);
          if (e.aiTimer <= 0) {
            e.aiTimer = 1.6 * zoneCadenceScale;
            if (this.acidPools.length < 34) {
              this.acidPools.push({
                id: this.nextEntityId++,
                fromPlayer: false,
                x: e.x,
                y: e.y,
                radius: 36,
                life: 4.5,
                maxLife: 4.5,
                dps: computeZoneEnemyDamage(14, this.zone, diff.enemyDamageMult),
                permanent: false,
              });
            }
          }
        } else {
          this.steerTerritoryPatrol(e, enemySpeed * 0.72, dt);
        }
      } else if (e.kind === 'volt_jelly') {
        if (e.aiState === 'telegraph') {
          e.vx *= 0.86;
          e.vy *= 0.86;
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            e.aiState = 'wander';
            e.aiTimer = 2.8 * zoneCadenceScale;
            const shockR = e.radius * 3.9;
            this.spawnRing(e.x, e.y, shockR * 0.35, '#35d8ff', 0.4);
            if (dist < shockR + p.radius) {
              this.spawnLightning(e.x, e.y, p.x, p.y, '#35d8ff', 2.4);
              this.damagePlayer(enemyDamage, e);
            }
          }
        } else if (canAggro) {
          if (dist < 280 && e.aiTimer <= 0) {
            e.aiState = 'telegraph';
            e.telegraphMax = Math.max(0.46, 0.62 * zoneCadenceScale);
            e.telegraphTimer = e.telegraphMax;
          } else {
            e.vx += (dirX * enemySpeed - e.vx) * Math.min(1, dt * 3.2);
            e.vy += (dirY * enemySpeed - e.vy) * Math.min(1, dt * 3.2);
          }
        } else {
          this.steerTerritoryPatrol(e, enemySpeed * 0.72, dt);
        }
      } else if (e.kind === 'leech_parasite') {
        if (e.aiState === 'latched') {
          const latchAngle = e.phase + this.time * 1.4;
          e.x = p.x + Math.cos(latchAngle) * (p.radius + e.radius * 0.55);
          e.y = p.y + Math.sin(latchAngle) * (p.radius + e.radius * 0.55);
          e.angle = Math.atan2(p.y - e.y, p.x - e.x);
          if (e.aiTimer <= 0) {
            e.aiTimer = 0.65;
            this.damagePlayer(computeZoneEnemyDamage(9, this.zone, diff.enemyDamageMult), e);
          }
          continue;
        } else if (canAggro) {
          e.vx += (dirX * enemySpeed * 1.04 - e.vx) * Math.min(1, dt * 5.0);
          e.vy += (dirY * enemySpeed * 1.04 - e.vy) * Math.min(1, dt * 5.0);
        } else {
          this.steerTerritoryPatrol(e, enemySpeed * 0.68, dt);
        }
      } else if (e.kind === 'camo_ghost') {
        if (e.aiState === 'telegraph') {
          e.cloakAlpha = Math.min(1, e.cloakAlpha + dt * 4);
          e.vx *= 0.85;
          e.vy *= 0.85;
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            e.aiState = 'attack';
            e.aiTimer = 0.48;
            e.vx = e.chargeDirX * enemySpeed * 2.8;
            e.vy = e.chargeDirY * enemySpeed * 2.8;
          }
        } else if (e.aiState === 'attack') {
          e.cloakAlpha = 1;
          if (e.aiTimer <= 0) {
            e.aiState = 'wander';
            e.aiTimer = 2.0 * zoneCadenceScale;
          }
        } else if (canAggro) {
          e.cloakAlpha = Math.max(0.22, e.cloakAlpha - dt * 1.5);
          if (dist < 320 && e.aiTimer <= 0) {
            e.aiState = 'telegraph';
            e.telegraphMax = Math.max(0.42, 0.54 * zoneCadenceScale);
            e.telegraphTimer = e.telegraphMax;
            e.chargeDirX = dirX;
            e.chargeDirY = dirY;
          } else {
            e.vx += (dirX * enemySpeed * 0.92 - e.vx) * Math.min(1, dt * 3.2);
            e.vy += (dirY * enemySpeed * 0.92 - e.vy) * Math.min(1, dt * 3.2);
          }
        } else {
          e.cloakAlpha = Math.max(0.26, e.cloakAlpha - dt * 1.2);
          this.steerTerritoryPatrol(e, enemySpeed * 0.72, dt);
        }
      } else if (e.isBoss) {
        this.updateBossAI(e, enemySpeed, enemyDamage, dirX, dirY, dist, dt, playerHidden);
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (Math.hypot(e.vx, e.vy) > 12) {
        e.angle = lerpAngle(e.angle, Math.atan2(e.vy, e.vx), Math.min(1, dt * 8));
      }

      // World boundary bounce
      const maxR = worldRadius - e.radius;
      const ed = Math.hypot(e.x, e.y);
      if (ed > maxR) {
        e.x = (e.x / ed) * maxR;
        e.y = (e.y / ed) * maxR;
        e.vx *= -0.6;
        e.vy *= -0.6;
      }

      // Collision with Player
      const hitDist = Math.hypot(p.x - e.x, p.y - e.y);
      if (hitDist < p.radius + e.radius * 0.9) {
        this.resolvePlayerEnemyCollision(e, enemyDamage, dirX, dirY);
      }
    }
  }

  private updateBossAI(
    boss: EnemySim,
    speed: number,
    damage: number,
    dirX: number,
    dirY: number,
    dist: number,
    dt: number,
    playerHidden: boolean
  ): void {
    const diff = DIFFICULTIES[this.difficulty];
    const inTerritory =
      !playerHidden &&
      isPlayerInBossTerritory(
        this.player.x,
        this.player.y,
        boss.homeX,
        boss.homeY,
        boss.territoryRadius,
        boss.bossEngaged
      );
    boss.bossEngaged = inTerritory;

    // Outside Boss Territory: Boss stays dormant/patrolling its own lair and will NOT attack!
    if (!boss.bossEngaged) {
      boss.aiState = 'wander';
      boss.telegraphTimer = 0;
      const orbitAngle = this.time * 0.45 + boss.phase;
      const patrolR = Math.min(140, boss.territoryRadius * 0.3);
      const targetX = boss.homeX + Math.cos(orbitAngle) * patrolR;
      const targetY = boss.homeY + Math.sin(orbitAngle) * patrolR;
      const hdx = targetX - boss.x;
      const hdy = targetY - boss.y;
      const hdist = Math.hypot(hdx, hdy) || 1;
      const returnSpd = Math.min(speed * 0.7, hdist * 1.4);
      boss.vx += ((hdx / hdist) * returnSpd - boss.vx) * Math.min(1, dt * 2.5);
      boss.vy += ((hdy / hdist) * returnSpd - boss.vy) * Math.min(1, dt * 2.5);
      return;
    }

    boss.bossPhase = boss.hp < boss.maxHp * diff.bossEnrageThreshold ? 2 : 1;
    const haste = boss.bossPhase === 2 ? 1.28 : 1;
    const bossBoltDamage = Math.max(12, Math.round(damage * 0.58));

    if (boss.kind === 'colony_hydra') {
      boss.vx += (dirX * speed * haste - boss.vx) * Math.min(1, dt * 2.5);
      boss.vy += (dirY * speed * haste - boss.vy) * Math.min(1, dt * 2.5);
      if (boss.aiTimer <= 0) {
        boss.aiTimer = boss.bossPhase === 2 ? 2.6 : 3.6;
        if (this.enemies.length < 28) {
          this.spawnEnemy(0, 'acid_amoeba', boss.x, boss.y);
          this.spawnEnemy(0, 'leech_parasite', boss.x, boss.y);
        }
        const shots = boss.bossPhase === 2 ? 6 : 4;
        const baseA = Math.atan2(dirY, dirX);
        for (let k = 0; k < shots; k++) {
          const a = baseA + (k / shots - 0.5) * 1.4;
          this.projectiles.push({
            id: this.nextEntityId++,
            fromPlayer: false,
            kind: 'boss_spore',
            x: boss.x + Math.cos(a) * boss.radius,
            y: boss.y + Math.sin(a) * boss.radius,
            vx: Math.cos(a) * 290,
            vy: Math.sin(a) * 290,
            radius: 10,
            damage: bossBoltDamage,
            life: 2.2,
            color: '#8eff85',
          });
        }
      }
    } else if (boss.kind === 'iron_leviathan') {
      if (boss.aiState === 'telegraph') {
        boss.vx *= 0.85;
        boss.vy *= 0.85;
        boss.telegraphTimer -= dt;
        if (boss.telegraphTimer <= 0) {
          boss.aiState = 'attack';
          boss.aiTimer = 0.72;
          boss.vx = boss.chargeDirX * speed * 4.4 * haste;
          boss.vy = boss.chargeDirY * speed * 4.4 * haste;
          this.audio.playDash();
          this.trauma = Math.min(1, this.trauma + 0.28);
        }
      } else if (boss.aiState === 'attack') {
        if (boss.aiTimer <= 0) {
          boss.aiState = 'chase';
          boss.aiTimer = boss.bossPhase === 2 ? 2.1 : 3.0;
        }
      } else {
        boss.vx += (dirX * speed * 0.9 - boss.vx) * Math.min(1, dt * 2.5);
        boss.vy += (dirY * speed * 0.9 - boss.vy) * Math.min(1, dt * 2.5);
        if (dist < 520 && boss.aiTimer <= 0) {
          boss.aiState = 'telegraph';
          boss.telegraphMax = 0.78;
          boss.telegraphTimer = 0.78;
          boss.chargeDirX = dirX;
          boss.chargeDirY = dirY;
        }
      }
    } else if (boss.kind === 'thermo_kraken') {
      // Zone 5 Unique Boss: Thermal Vent Blast + Blazing Spiral Ember Barrages
      if (boss.aiState === 'telegraph') {
        boss.vx *= 0.84;
        boss.vy *= 0.84;
        boss.telegraphTimer -= dt;
        if (boss.telegraphTimer <= 0) {
          boss.aiState = 'chase';
          boss.aiTimer = boss.bossPhase === 2 ? 2.1 : 3.0;
          const blastR = boss.radius * 3.0;
          this.spawnRing(boss.x, boss.y, blastR * 0.42, '#ff6a2b', 0.52);
          this.spawnBurst(boss.x, boss.y, '#ffe07d', 22, 260);
          this.audio.playHit(true);
          if (dist < blastR + this.player.radius) {
            this.damagePlayer(damage, boss);
          }
          if (boss.bossPhase === 2) {
            // Enraged Phase 2: 10-way spiral magma nova + thermal vent lunge!
            for (let b = 0; b < 10; b++) {
              const a = (b / 10) * Math.PI * 2 + this.time * 1.4;
              this.projectiles.push({
                id: this.nextEntityId++,
                fromPlayer: false,
                kind: 'boss_spore',
                x: boss.x + Math.cos(a) * boss.radius * 0.95,
                y: boss.y + Math.sin(a) * boss.radius * 0.95,
                vx: Math.cos(a) * 335,
                vy: Math.sin(a) * 335,
                radius: 10,
                damage: bossBoltDamage,
                life: 2.2,
                color: b % 2 === 0 ? '#ff5e2b' : '#ffe07d',
              });
            }
            boss.vx = dirX * speed * 2.9;
            boss.vy = dirY * speed * 2.9;
          } else {
            // Phase 1: Focused 5-orb molten fan toward the player
            const baseA = Math.atan2(dirY, dirX);
            for (let k = -2; k <= 2; k++) {
              const a = baseA + k * 0.24;
              this.projectiles.push({
                id: this.nextEntityId++,
                fromPlayer: false,
                kind: 'boss_spore',
                x: boss.x + Math.cos(a) * boss.radius * 0.95,
                y: boss.y + Math.sin(a) * boss.radius * 0.95,
                vx: Math.cos(a) * 320,
                vy: Math.sin(a) * 320,
                radius: 10,
                damage: bossBoltDamage,
                life: 2.1,
                color: '#ff7a33',
              });
            }
          }
        }
      } else {
        // Orbit-strafe pressure while closing distance
        const strafeX = -dirY * (boss.bossPhase === 2 ? 0.55 : 0.35);
        const strafeY = dirX * (boss.bossPhase === 2 ? 0.55 : 0.35);
        boss.vx += ((dirX + strafeX) * speed * haste - boss.vx) * Math.min(1, dt * 2.6);
        boss.vy += ((dirY + strafeY) * speed * haste - boss.vy) * Math.min(1, dt * 2.6);
        if (boss.aiTimer <= 0) {
          boss.aiState = 'telegraph';
          boss.telegraphMax = boss.bossPhase === 2 ? 0.68 : 0.8;
          boss.telegraphTimer = boss.telegraphMax;
        }
      }
    } else if (boss.kind === 'parasite_matriarch') {
      // Zone 7 Unique Boss: Homing Parasite Brood + Vampiric Siphon Beam + Blood Pulse Shockwave
      if (boss.aiState === 'telegraph') {
        boss.vx *= 0.85;
        boss.vy *= 0.85;
        boss.telegraphTimer -= dt;
        if (boss.telegraphTimer <= 0) {
          boss.aiState = 'chase';
          boss.aiTimer = boss.bossPhase === 2 ? 2.4 : 3.3;
          const pulseR = boss.radius * 3.2;
          this.spawnRing(boss.x, boss.y, pulseR * 0.42, '#e62e7b', 0.54);
          this.audio.playZap();
          if (dist < pulseR + this.player.radius) {
            this.spawnLightning(boss.x, boss.y, this.player.x, this.player.y, '#ff7ab3', 3.0);
            this.damagePlayer(damage, boss);
            // Vampiric life-siphon restores a slice of the Matriarch's HP on hit
            const vampHeal = Math.round(boss.maxHp * 0.045);
            boss.hp = Math.min(boss.maxHp, boss.hp + vampHeal);
            this.spawnFloatingText(boss.x, boss.y - boss.radius - 8, `+${vampHeal} HP`, '#ffafd2', 1.0);
          }
          if (this.enemies.length < 30) {
            this.spawnEnemy(0, 'leech_parasite', boss.x, boss.y);
            if (boss.bossPhase === 2) {
              this.spawnEnemy(0, 'leech_parasite', boss.x, boss.y);
            }
          }
          const bolts = boss.bossPhase === 2 ? 8 : 5;
          const baseA = Math.atan2(dirY, dirX);
          for (let b = 0; b < bolts; b++) {
            const a =
              boss.bossPhase === 2
                ? (b / bolts) * Math.PI * 2 + this.time * 0.9
                : baseA + (b - 2) * 0.3;
            this.projectiles.push({
              id: this.nextEntityId++,
              fromPlayer: false,
              kind: 'boss_acid',
              x: boss.x + Math.cos(a) * boss.radius * 0.9,
              y: boss.y + Math.sin(a) * boss.radius * 0.9,
              vx: Math.cos(a) * 310,
              vy: Math.sin(a) * 310,
              radius: 10,
              damage: bossBoltDamage,
              life: 2.3,
              color: '#ff5c9f',
            });
          }
        }
      } else {
        boss.vx += (dirX * speed * haste - boss.vx) * Math.min(1, dt * 2.5);
        boss.vy += (dirY * speed * haste - boss.vy) * Math.min(1, dt * 2.5);
        if (boss.aiTimer <= 0) {
          boss.aiState = 'telegraph';
          boss.telegraphMax = boss.bossPhase === 2 ? 0.68 : 0.82;
          boss.telegraphTimer = boss.telegraphMax;
        }
      }
    } else if (boss.kind === 'omega_core') {
      if (boss.aiState === 'telegraph') {
        boss.vx *= 0.85;
        boss.vy *= 0.85;
        boss.telegraphTimer -= dt;
        if (boss.telegraphTimer <= 0) {
          boss.aiState = 'chase';
          boss.aiTimer = boss.bossPhase === 2 ? 2.2 : 3.0;
          const shockR = boss.radius * 3.1;
          this.spawnRing(boss.x, boss.y, shockR * 0.35, '#ff4f93', 0.5);
          this.audio.playZap();
          if (dist < shockR + this.player.radius) {
            this.spawnLightning(boss.x, boss.y, this.player.x, this.player.y, '#ff55a3', 3.2);
            this.damagePlayer(damage, boss);
          }
          const bolts = boss.bossPhase === 2 ? 10 : 6;
          for (let b = 0; b < bolts; b++) {
            const a = (b / bolts) * Math.PI * 2 + this.time;
            this.projectiles.push({
              id: this.nextEntityId++,
              fromPlayer: false,
              kind: 'boss_acid',
              x: boss.x + Math.cos(a) * boss.radius * 0.9,
              y: boss.y + Math.sin(a) * boss.radius * 0.9,
              vx: Math.cos(a) * 320,
              vy: Math.sin(a) * 320,
              radius: 11,
              damage: bossBoltDamage,
              life: 2.3,
              color: '#52ff7d',
            });
          }
        }
      } else {
        boss.vx += (dirX * speed * haste - boss.vx) * Math.min(1, dt * 2.8);
        boss.vy += (dirY * speed * haste - boss.vy) * Math.min(1, dt * 2.8);
        if (boss.aiTimer <= 0) {
          boss.aiState = 'telegraph';
          boss.telegraphMax = 0.78;
          boss.telegraphTimer = 0.78;
        }
      }
    }
  }

  /**
   * Calm wandering patrol anchored softly to the microbe's home territory.
   */
  private steerTerritoryPatrol(e: EnemySim, speed: number, dt: number): void {
    const hdx = e.homeX - e.x;
    const hdy = e.homeY - e.y;
    const hdist = Math.hypot(hdx, hdy);
    if (hdist > e.territoryRadius * 0.85 && hdist > 1) {
      e.vx += ((hdx / hdist) * speed - e.vx) * Math.min(1, dt * 2.4);
      e.vy += ((hdy / hdist) * speed - e.vy) * Math.min(1, dt * 2.4);
      return;
    }
    const a = Math.sin(this.time * 0.55 + e.phase) * Math.PI * 2;
    e.vx += (Math.cos(a) * speed - e.vx) * Math.min(1, dt * 2.0);
    e.vy += (Math.sin(a) * speed - e.vy) * Math.min(1, dt * 2.0);
  }

  private resolvePlayerEnemyCollision(
    e: EnemySim,
    enemyRawDamage: number,
    dirX: number,
    dirY: number
  ): void {
    const p = this.player;
    const s = p.skills;

    // 1. Direct Swallow Check (smaller non-boss enemies eaten immediately!)
    if (canSwallowDirectly(p.radius, e.radius, e.isBoss)) {
      const def = ORGANISMS[e.kind];
      // Spike Urchin still pricks slightly on direct swallow unless Juggernaut/Armored
      if (e.kind === 'spike_urchin' && p.juggernautTimer <= 0) {
        this.damagePlayer(Math.round(enemyRawDamage * 0.45), e);
      }
      if (def.dnaDrop) {
        p.dna[def.dnaDrop] += def.dnaAmount;
        this.spawnFloatingText(e.x, e.y - 12, `+${def.dnaAmount} ${def.dnaDrop.toUpperCase()}`, DNA_COLORS[def.dnaDrop], 1.0);
      }
      this.addBiomass(Math.round(e.radius * 1.15));
      p.hp = Math.min(p.maxHp, p.hp + 10);
      this.kills++;
      this.audio.playEat(0.88);
      this.spawnBurst(e.x, e.y, def.color, 14, 180);
      p.squash = 0.45;
      e.hp = 0;
      e.dyingTimer = 0.01; // Instant consume
      if (
        !this.warnedSkillReady &&
        hasAnyAffordableSkill(p.skills, p.dna, this.difficulty, this.zone, this.endlessMode)
      ) {
        this.warnedSkillReady = true;
        this.showToast('skillReady', undefined, '#48f57b');
      }
      return;
    }

    // 2. Larger Enemy or Boss: Combat ram exchange!
    const isAttackingRam = p.dashTimer > 0 || p.juggernautTimer > 0 || p.ambushCritReady || s.chitin_spikes > 0;
    if (isAttackingRam) {
      let ramDmg = 20 + p.radius * 0.45 + s.chitin_spikes * 16;
      if (p.dashTimer > 0) ramDmg *= 1.45;
      if (p.juggernautTimer > 0) ramDmg *= 2.1;
      let isCrit = false;
      if (p.ambushCritReady) {
        ramDmg *= 2.4;
        p.ambushCritReady = false;
        p.stealthTimer = 0;
        isCrit = true;
      }
      this.damageEnemy(e, ramDmg, true, isCrit ? '#e2a6ff' : '#ff8a5c', isCrit);
    }

    // Knockback separation
    const sepForce = e.isBoss ? 220 : 280;
    e.vx -= dirX * sepForce;
    e.vy -= dirY * sepForce;
    p.vx += dirX * 210;
    p.vy += dirY * 210;

    // Leech Parasite latches if not Juggernaut/Dashing
    if (e.kind === 'leech_parasite' && p.dashTimer <= 0 && p.juggernautTimer <= 0) {
      e.aiState = 'latched';
      e.aiTimer = 0.5;
      this.showToast('leechAttached', undefined, '#f244a4');
      return;
    }

    // Enemy deals contact damage to player (Spike Urchin reflects extra)
    if (p.juggernautTimer <= 0) {
      const extraSpike = e.kind === 'spike_urchin' ? 7 : 0;
      this.damagePlayer(enemyRawDamage + extraSpike, e);
      if (!isAttackingRam && this.toastTimer <= 0) {
        this.showToast('tooLarge', undefined, '#ff6b8b');
      }
    }
  }

  private damageEnemy(
    e: EnemySim,
    rawDamage: number,
    heavy: boolean,
    color: string,
    isCrit = false
  ): void {
    if (e.dyingTimer > 0) return;

    // Armored enemies mitigate physical damage slightly; character, Thermal Core, & Singularity Bloom boost output
    const charDef = CHARACTERS[this.player.characterId];
    const thermalMult = 1 + this.player.skills.thermal_vent_core * 0.14;
    const bossBonusMult = e.isBoss ? 1 + this.player.skills.singularity_bloom * 0.15 : 1;
    const scaledRaw = rawDamage * charDef.damageMult * thermalMult * bossBonusMult;
    const armored = e.kind === 'shell_diatom' || e.kind === 'iron_leviathan';
    const dmg = Math.max(2, Math.round(armored ? scaledRaw * 0.72 : scaledRaw));
    e.hp -= dmg;
    e.hitFlash = 0.08;

    this.spawnFloatingText(
      e.x + (Math.random() - 0.5) * 18,
      e.y - e.radius * 0.7,
      isCrit ? `CRIT -${dmg}` : `-${dmg}`,
      color,
      isCrit ? 1.28 : heavy ? 1.08 : 0.88
    );

    if (heavy) {
      this.audio.playHit(e.isBoss);
      this.spawnBurst(e.x, e.y, color, e.isBoss ? 14 : 9, 175);
      this.trauma = Math.min(1, this.trauma + (e.isBoss ? 0.24 : 0.14));
      if (e.hp <= 0 || isCrit) {
        this.hitstopTimer = Math.max(this.hitstopTimer, e.isBoss ? 0.07 : 0.038);
      }
    }

    if (e.hp <= 0) {
      e.hp = 0;
      e.dyingTimer = 0.34;
      this.spawnRing(e.x, e.y, e.radius * 0.85, ORGANISMS[e.kind].color, 0.45);
      this.spawnBurst(e.x, e.y, ORGANISMS[e.kind].color, e.isBoss ? 34 : 18, 260);
      this.trauma = Math.min(1, this.trauma + (e.isBoss ? 0.65 : 0.22));
    }
  }

  private finalizeEnemyDeath(e: EnemySim): void {
    // If already instantly swallowed (dyingTimer started at 0.01), skip chunk drop
    if (e.dyingTimer < -0.02 && !e.isBoss) return;
    const def = ORGANISMS[e.kind];
    this.kills++;

    // Post-game character passive: on-kill heal & energy sustain (Crimson-Vamp, Omega-Prime, etc.)
    const charDef = CHARACTERS[this.player.characterId];
    if (charDef.killHealPct > 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * charDef.killHealPct);
      this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 12);
    }

    // Break into absorbable glowing DNA chunks whose sum equals def.dnaAmount exactly!
    if (def.dnaDrop && def.dnaAmount > 0) {
      const chunkCount = Math.min(def.dnaAmount, e.isBoss ? 5 : 2);
      const basePerChunk = Math.floor(def.dnaAmount / chunkCount);
      const remainder = def.dnaAmount % chunkCount;
      for (let c = 0; c < chunkCount; c++) {
        const chunkAmount = basePerChunk + (c < remainder ? 1 : 0);
        const a = (c / chunkCount) * Math.PI * 2 + this.rng.next() * 0.5;
        const spd = 90 + this.rng.next() * 110;
        this.dnaChunks.push({
          id: this.nextEntityId++,
          dnaType: def.dnaDrop,
          amount: chunkAmount,
          x: e.x,
          y: e.y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          radius: e.isBoss ? 13 : 9,
          life: 24,
          phase: this.rng.next() * Math.PI * 2,
        });
      }
    }

    // Combat micro-pickup drops (small HP / Energy recovery items)
    if (e.isBoss) {
      this.spawnFood(0, 'hp_micro', e.x, e.y);
      this.spawnFood(0, 'energy_micro', e.x, e.y);
    } else if (this.rng.chance(0.35)) {
      this.spawnFood(0, this.rng.chance(0.55) ? 'hp_micro' : 'energy_micro', e.x, e.y);
    }

    // Handle Zone Boss Defeat
    if (e.isBoss) {
      if (!this.defeatedBosses.includes(this.zone)) {
        this.defeatedBosses.push(this.zone);
      }
      this.audio.playVictory();
      this.showToast('bossDefeated', { name: e.kind }, '#ffe875');

      // Zone 10 Final Boss Omega Core -> Victory!
      if (e.kind === 'omega_core' && !this.endlessMode) {
        this.pendingVictory = true;
        this.defeatDelayTimer = 0.7;
      }
      this.saveCurrentRun();
    }
  }

  private damagePlayer(rawDamage: number, attacker?: EnemySim): void {
    const p = this.player;
    if (p.hurtInvuln > 0) return;

    const charDef = CHARACTERS[p.characterId];
    const invulnerable = p.juggernautTimer > 0 || p.aegisTimer > 0 || p.omegaSurgeTimer > 0;
    if (invulnerable) {
      // Fortress Aegis reflects a golden counter-shockwave when blocking hits!
      if (p.aegisTimer > 0 && attacker && attacker.dyingTimer <= 0) {
        this.damageEnemy(attacker, Math.round(rawDamage * 1.4), true, '#facc15');
        this.spawnRing(p.x, p.y, p.radius * 1.6, '#facc15', 0.3);
      }
      return;
    }

    const dmg = computeIncomingPlayerDamage(rawDamage, p.skills.hexa_carapace, false, charDef.armorBonus);
    if (dmg <= 0) return;

    p.hp = Math.max(0, p.hp - dmg);
    p.hitFlash = 0.1;
    p.hurtInvuln = 0.42;
    p.squash = -0.5;
    this.trauma = Math.min(1, this.trauma + 0.34);
    this.hitstopTimer = Math.max(this.hitstopTimer, 0.04);
    this.audio.playHit(true);
    this.spawnFloatingText(p.x, p.y - p.radius - 8, `-${dmg}`, '#ff4d6d', 1.12);
    this.spawnBurst(p.x, p.y, '#ff4d6d', 12, 190);

    // Chitin Spikes Thorns Reflection
    if (attacker && p.skills.chitin_spikes > 0) {
      const reflected = computeSpikeReflectDamage(rawDamage, p.skills.chitin_spikes);
      if (reflected > 0) {
        this.damageEnemy(attacker, reflected, false, '#ff6b8b');
      }
    }

    if (p.hp <= 0 && this.defeatDelayTimer < 0) {
      this.audio.playDefeat();
      this.spawnBurst(p.x, p.y, '#7efcf0', 32, 260);
      this.pendingVictory = false;
      this.defeatDelayTimer = 0.55;
    }
  }

  private updateMinions(dt: number): void {
    const p = this.player;
    for (const m of this.minions) {
      m.attackCooldown = Math.max(0, m.attackCooldown - dt);
      m.orbitAngle += dt * 1.9;

      // Find nearest enemy within 320px
      let nearest: EnemySim | null = null;
      let bestDist = 320;
      for (const e of this.enemies) {
        if (e.dyingTimer > 0) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < bestDist) {
          bestDist = d;
          nearest = e;
        }
      }

      let tx = p.x + Math.cos(m.orbitAngle) * (p.radius + 36);
      let ty = p.y + Math.sin(m.orbitAngle) * (p.radius + 36);
      if (nearest) {
        tx = nearest.x;
        ty = nearest.y;
      }

      const dx = tx - m.x;
      const dy = ty - m.y;
      const d = Math.hypot(dx, dy) || 1;
      m.vx += ((dx / d) * 310 - m.vx) * Math.min(1, dt * 6);
      m.vy += ((dy / d) * 310 - m.vy) * Math.min(1, dt * 6);
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      if (nearest && m.attackCooldown <= 0 && Math.hypot(nearest.x - m.x, nearest.y - m.y) < nearest.radius + m.radius + 4) {
        m.attackCooldown = 0.55;
        this.damageEnemy(nearest, 12 + p.skills.mitosis_minions * 6, false, '#ffe875');
      }
    }
  }

  private updateProjectiles(dt: number): void {
    const p = this.player;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const projDt = !proj.fromPlayer && p.chronoTimer > 0 ? dt * 0.3 : dt;
      proj.life -= projDt;
      proj.x += proj.vx * projDt;
      proj.y += proj.vy * projDt;

      let expired = proj.life <= 0;

      if (proj.fromPlayer) {
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          if (Math.hypot(e.x - proj.x, e.y - proj.y) < e.radius + proj.radius) {
            this.damageEnemy(
              e,
              proj.damage,
              proj.kind === 'plasmic' || proj.kind === 'omega_ray' || proj.kind === 'ember',
              proj.color
            );
            if (proj.kind === 'acid' || proj.kind === 'plasmic') {
              this.acidPools.push({
                id: this.nextEntityId++,
                fromPlayer: true,
                x: proj.x,
                y: proj.y,
                radius: proj.kind === 'plasmic' ? 62 : 46,
                life: 3.8,
                maxLife: 3.8,
                dps: proj.kind === 'plasmic' ? 28 : 18,
                permanent: false,
              });
            }
            expired = true;
            break;
          }
        }
      } else {
        if (Math.hypot(p.x - proj.x, p.y - proj.y) < p.radius + proj.radius) {
          this.damagePlayer(proj.damage);
          expired = true;
        }
      }

      if (expired) {
        this.spawnBurst(proj.x, proj.y, proj.color, 6, 110);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateAcidPools(dt: number): void {
    const p = this.player;
    const charDef = CHARACTERS[p.characterId];
    for (let i = this.acidPools.length - 1; i >= 0; i--) {
      const pool = this.acidPools[i];
      if (!pool.permanent) {
        pool.life -= dt;
        if (pool.life <= 0) {
          this.acidPools.splice(i, 1);
          continue;
        }
      }

      if (pool.fromPlayer) {
        for (const e of this.enemies) {
          if (e.dyingTimer > 0) continue;
          if (Math.hypot(e.x - pool.x, e.y - pool.y) < pool.radius + e.radius * 0.6) {
            e.hp -= pool.dps * dt;
            if (e.hp <= 0) {
              this.damageEnemy(e, 1, false, '#44f56b');
            }
          }
        }
      } else if (charDef.immuneHazard !== 'acid') {
        // Biome acid pool or Acid Amoeba trail hurts player unless immune/resistant
        if (Math.hypot(p.x - pool.x, p.y - pool.y) < pool.radius + p.radius * 0.5) {
          const acidResist = Math.min(0.65, p.skills.corrosive_spit * 0.22);
          const dmgTick = pool.dps * (1 - acidResist) * dt;
          if (p.juggernautTimer <= 0 && p.aegisTimer <= 0 && p.omegaSurgeTimer <= 0) {
            p.hp = Math.max(0, p.hp - dmgTick);
            if (p.hp <= 0 && this.defeatDelayTimer < 0) {
              this.audio.playDefeat();
              this.pendingVictory = false;
              this.defeatDelayTimer = 0.55;
            }
          }
        }
      }
    }
  }

  private updateHazardZones(dt: number): void {
    const p = this.player;
    const charDef = CHARACTERS[p.characterId];
    const diff = DIFFICULTIES[this.difficulty];
    for (const hz of this.hazardZones) {
      const dx = p.x - hz.x;
      const dy = p.y - hz.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (hz.kind === 'thermal') {
        if (
          dist < hz.radius + p.radius * 0.45 &&
          charDef.immuneHazard !== 'thermal' &&
          p.skills.thermal_vent_core <= 0
        ) {
          // Superheated vent pushes outward and deals continuous thermal burn
          const push = (1 - dist / (hz.radius + p.radius)) * 420;
          p.vx += (dx / dist) * push * dt;
          p.vy += (dy / dist) * push * dt;
          if (p.juggernautTimer <= 0 && p.aegisTimer <= 0 && p.omegaSurgeTimer <= 0) {
            const burnDps = 18 * diff.enemyDamageMult;
            p.hp = Math.max(0, p.hp - burnDps * dt);
            if (p.hp <= 0 && this.defeatDelayTimer < 0) {
              this.audio.playDefeat();
              this.pendingVictory = false;
              this.defeatDelayTimer = 0.55;
            }
          }
        }
      } else if (hz.kind === 'shock') {
        hz.timer -= dt;
        if (hz.timer <= 0) {
          hz.timer = hz.period || 4.2;
          this.spawnRing(hz.x, hz.y, hz.radius * 0.35, '#4ae2ff', 0.42);
          if (dist < hz.radius + p.radius && charDef.immuneHazard !== 'shock') {
            this.spawnLightning(hz.x, hz.y, p.x, p.y, '#6ef0ff', 2.8);
            this.audio.playZap();
            this.damagePlayer(Math.round(18 * diff.enemyDamageMult));
          }
        }
      }
    }
  }

  private updateSpawning(): void {
    const cfg = ZONES[this.zone];
    const diff = DIFFICULTIES[this.difficulty];
    const targetFood = Math.max(28, Math.round(cfg.maxFood * diff.foodCountMult));
    const targetEnemies = Math.max(12, Math.round(cfg.maxEnemies * diff.spawnCountMult));
    if (this.foods.length < targetFood) {
      this.spawnFood(200);
    }
    const livingNonBoss = this.enemies.filter((e) => !e.isBoss && e.dyingTimer <= 0).length;
    if (livingNonBoss < targetEnemies) {
      this.spawnEnemy(440, undefined, undefined, undefined, this.rng.chance(0.35));
    }
  }

  private updateCamera(dt: number): void {
    const targetZoom = computeTargetCameraZoom(this.player.radius);
    this.cameraZoom += (targetZoom - this.cameraZoom) * Math.min(1, dt * 2.4);
    this.cameraX += (this.player.x - this.cameraX) * Math.min(1, dt * 7.5);
    this.cameraY += (this.player.y - this.cameraY) * Math.min(1, dt * 7.5);
  }

  private updateVfxOnly(dt: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const pt = this.particles[i];
      if (!pt.active) continue;
      pt.life -= dt;
      if (pt.life <= 0) {
        pt.active = false;
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= Math.exp(-3.2 * dt);
      pt.vy *= Math.exp(-3.2 * dt);
    }

    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (!ft.active) continue;
      ft.life -= dt;
      if (ft.life <= 0) {
        ft.active = false;
        continue;
      }
      ft.y += ft.vy * dt;
    }

    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      this.lightningArcs[i].life -= dt;
      if (this.lightningArcs[i].life <= 0) {
        this.lightningArcs.splice(i, 1);
      }
    }
  }

  private addBiomass(amount: number): void {
    const p = this.player;
    const zoneMaxRadius = this.endlessMode ? MAX_STANDARD_RADIUS : ZONES[this.zone].maxRadiusInZone;

    // Always count absorbed biomass toward Score & Mutagen even when physical radius is zone-capped!
    p.biomass += amount;

    // Enforce per-zone physical radius cap to prevent Zone-1 over-sizing!
    if (isGrowthCappedInZone(this.zone, p.radius, this.endlessMode)) {
      if (!this.growthCapWarned) {
        this.growthCapWarned = true;
        this.audio.playBossWarning();
        this.showToast('growthCapped', { zone: this.zone }, '#ffb703');
      }
      return;
    }

    const rawTargetRadius = Math.min(
      MAX_STANDARD_RADIUS,
      22 + Math.sqrt(Math.max(0, p.biomass - 100)) * 1.15
    );
    p.radius = Math.max(p.radius, Math.min(zoneMaxRadius, rawTargetRadius));

    if (!this.growthCapWarned && isGrowthCappedInZone(this.zone, p.radius, this.endlessMode)) {
      this.growthCapWarned = true;
      this.audio.playBossWarning();
      this.showToast('growthCapped', { zone: this.zone }, '#ffb703');
    }
  }

  private finishRun(victory: boolean): void {
    this.gameState = 'gameover';
    this.overlayPaused = false;
    this.audio.pauseBgm();
    this.clearHeldInputs();
    const finalBiomass = Math.round(this.player.biomass);
    const mutagenEarned = calculateMutagenEarned({
      biomass: finalBiomass,
      kills: this.kills,
      zoneReached: this.zone,
      bossesDefeated: this.defeatedBosses.length,
      victory,
      difficulty: this.difficulty,
    });
    const score = calculateRunScore({
      finalBiomass,
      kills: this.kills,
      zoneReached: this.zone,
      bossesDefeated: this.defeatedBosses.length,
      victory,
      difficulty: this.difficulty,
    });
    if (!victory) {
      this.callbacks.onAutoSave(null);
    }
    this.callbacks.onGameOver({
      victory,
      endlessMode: this.endlessMode,
      difficulty: this.difficulty,
      zoneReached: this.zone,
      finalBiomass,
      kills: this.kills,
      elapsedSec: Math.round(this.elapsedSec),
      mutagenEarned,
      bossesDefeated: this.defeatedBosses.length,
      score,
      rngSeed: this.runSeed,
      isDailyChallenge: this.isDailyChallenge,
    });
  }

  public getCurrentRunSnapshot(): SavedRunSnapshot {
    const p = this.player;
    return {
      zone: this.zone,
      difficulty: this.difficulty,
      characterId: p.characterId,
      hp: Math.round(p.hp),
      maxHp: Math.round(p.maxHp),
      energy: Math.round(p.energy),
      maxEnergy: Math.round(p.maxEnergy),
      radius: Number(p.radius.toFixed(1)),
      biomass: Math.round(p.biomass),
      dna: { ...p.dna },
      skills: { ...p.skills },
      kills: this.kills,
      elapsedSec: Math.round(this.elapsedSec),
      defeatedBosses: [...this.defeatedBosses],
      endlessMode: this.endlessMode,
      rngSeed: this.runSeed,
      isDailyChallenge: this.isDailyChallenge,
    };
  }

  private saveCurrentRun(): void {
    if (this.gameState === 'playing' && this.player.hp > 0) {
      this.callbacks.onAutoSave(this.getCurrentRunSnapshot());
    }
  }

  private emitHudSnapshot(): void {
    const p = this.player;
    const cfg = ZONES[this.zone];
    const boss = this.enemies.find((e) => e.isBoss && e.dyingTimer <= 0) ?? null;

    // Build Minimap Blips
    const blips: MinimapBlip[] = [];
    const invR = 1 / cfg.worldRadius;
    blips.push({
      nx: p.x * invR,
      ny: p.y * invR,
      kind: 'player',
      color: '#7efcf0',
      size: 3.5,
    });
    if (this.portalNotified && this.zone < MAX_ZONE) {
      blips.push({
        nx: this.portalX * invR,
        ny: this.portalY * invR,
        kind: 'portal',
        color: '#ffffff',
        size: 4,
      });
    }
    for (const e of this.enemies) {
      if (e.dyingTimer > 0) continue;
      blips.push({
        nx: e.x * invR,
        ny: e.y * invR,
        kind: e.isBoss ? 'boss' : 'enemy',
        color: e.isBoss ? '#ff3b7f' : ORGANISMS[e.kind].color,
        size: e.isBoss ? 5 : 2,
      });
    }

    const skill1Name =
      p.skills.plasmic_nova > 0 ? 'nova' : p.skills.corrosive_spit > 0 ? 'spit' : null;
    const skill2Name =
      p.skills.juggernaut_charge > 0
        ? 'juggernaut'
        : p.skills.phantom_ambush > 0
        ? 'stealth'
        : p.skills.bio_volt_pulse > 0
        ? 'volt'
        : null;

    const nextUnlocked = isNextZoneUnlocked(this.zone, p.radius, this.defeatedBosses);
    const reqKey =
      this.zone === MAX_ZONE
        ? 'zoneGoalFinal'
        : cfg.bossKind && !this.defeatedBosses.includes(this.zone)
        ? 'zoneGoalBoss'
        : 'zoneGoalGrow';

    const charDef = CHARACTERS[p.characterId];
    this.callbacks.onHudUpdate({
      characterId: p.characterId,
      hp: Math.round(p.hp),
      maxHp: Math.round(p.maxHp),
      ghostHp: Math.round(p.ghostHp),
      energy: Math.round(p.energy),
      maxEnergy: Math.round(p.maxEnergy),
      radius: Math.round(p.radius),
      biomass: Math.round(p.biomass),
      zone: this.zone,
      difficulty: this.difficulty,
      endlessMode: this.endlessMode,
      dna: { ...p.dna },
      skills: { ...p.skills },
      canAffordAnySkill: hasAnyAffordableSkill(p.skills, p.dna, this.difficulty, this.zone, this.endlessMode),
      nextZoneUnlocked: nextUnlocked,
      nextZoneRequirementText: `${reqKey}:${cfg.requiredRadiusToAdvance}`,
      growthCapped: isGrowthCappedInZone(this.zone, p.radius, this.endlessMode),
      evoZoneCapped: isEvolutionCappedInZone(this.zone, p.skills, this.difficulty, this.endlessMode),
      zoneEvoUsed: getTotalEvolutionPointsUsed(p.skills),
      zoneEvoCap: getEffectiveZoneEvoCap(this.zone, this.difficulty, this.endlessMode),
      maxRadiusInZone: cfg.maxRadiusInZone,
      boss:
        boss && (boss.bossEngaged || Math.hypot(p.x - boss.homeX, p.y - boss.homeY) <= boss.territoryRadius * 1.15)
          ? {
              kind: boss.kind,
              hp: Math.round(boss.hp),
              maxHp: Math.round(boss.maxHp),
              phase: boss.bossPhase,
            }
          : null,
      cooldowns: {
        dash: p.dashCooldown,
        dashMax: p.dashMaxCooldown,
        skill1: p.skill1Cooldown,
        skill1Max: p.skill1MaxCooldown,
        skill2: p.skill2Cooldown,
        skill2Max: p.skill2MaxCooldown,
        special: p.specialCooldown,
        specialMax: p.specialMaxCooldown,
      },
      unlockedActives: {
        skill1Name,
        skill2Name,
        hasCharacterSpecial: charDef.isPostGame,
      },
      stealthActive: p.stealthTimer > 0,
      juggernautActive: p.juggernautTimer > 0,
      specialActive: p.chronoTimer > 0 || p.aegisTimer > 0 || p.omegaSurgeTimer > 0,
      kills: this.kills,
      elapsedSec: Math.round(this.elapsedSec),
      minimap: blips,
      toast: this.activeToast,
    });
  }

  private render(): void {
    const shakeMag = this.trauma * this.trauma * 15;
    const shakeX = shakeMag > 0.1 ? (Math.random() * 2 - 1) * shakeMag : 0;
    const shakeY = shakeMag > 0.1 ? (Math.random() * 2 - 1) * shakeMag : 0;

    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);
    renderBioWorld(this.ctx, this.width, this.height, {
      time: this.time,
      zone: this.zone,
      cameraX: this.cameraX,
      cameraY: this.cameraY,
      cameraZoom: this.cameraZoom,
      shakeX,
      shakeY,
      isTitleDemo: this.gameState === 'title',
      player: this.player,
      foods: this.foods,
      enemies: this.enemies,
      dnaChunks: this.dnaChunks,
      projectiles: this.projectiles,
      acidPools: this.acidPools,
      hazardZones: this.hazardZones,
      minions: this.minions,
      particles: this.particles,
      floatingTexts: this.floatingTexts,
      lightningArcs: this.lightningArcs,
      ambientMotes: this.ambientMotes,
      vortices: this.vortices,
      siphonTargets: this.siphonTargets,
      portalUnlocked: this.portalNotified,
      portalX: this.portalX,
      portalY: this.portalY,
    });
    this.ctx.restore();
  }

  private screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const sx = clientX - rect.left - this.width * 0.5;
    const sy = clientY - rect.top - this.height * 0.5;
    return {
      x: this.cameraX + sx / this.cameraZoom,
      y: this.cameraY + sy / this.cameraZoom,
    };
  }

  private getAimAngle(): number {
    if (this.mouseActive && !this.joystick.active) {
      const wm = this.screenToWorld(this.mouseClientX, this.mouseClientY);
      return Math.atan2(wm.y - this.player.y, wm.x - this.player.x);
    }
    return this.player.angle;
  }

  private spawnBurst(x: number, y: number, color: string, count: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const slot = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % MAX_PARTICLES;
      const a = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.85) * speed;
      slot.active = true;
      slot.ring = false;
      slot.x = x;
      slot.y = y;
      slot.vx = Math.cos(a) * spd;
      slot.vy = Math.sin(a) * spd;
      slot.size = 2.4 + Math.random() * 3.8;
      slot.color = color;
      slot.maxLife = 0.35 + Math.random() * 0.35;
      slot.life = slot.maxLife;
    }
  }

  private spawnRing(x: number, y: number, radius: number, color: string, duration: number): void {
    const slot = this.particles[this.particleCursor];
    this.particleCursor = (this.particleCursor + 1) % MAX_PARTICLES;
    slot.active = true;
    slot.ring = true;
    slot.x = x;
    slot.y = y;
    slot.vx = 0;
    slot.vy = 0;
    slot.size = radius;
    slot.color = color;
    slot.maxLife = duration;
    slot.life = duration;
  }

  private spawnFloatingText(
    x: number,
    y: number,
    text: string,
    color: string,
    scale = 1
  ): void {
    const slot = this.floatingTexts[this.floatingTextCursor];
    this.floatingTextCursor = (this.floatingTextCursor + 1) % MAX_FLOATING_TEXTS;
    slot.active = true;
    slot.x = x;
    slot.y = y;
    slot.vy = -42;
    slot.text = text;
    slot.color = color;
    slot.maxLife = 0.85;
    slot.life = 0.85;
    slot.scale = scale;
  }

  private spawnLightning(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    width: number
  ): void {
    const steps = 6;
    const pts: Array<{ x: number; y: number }> = [{ x: x1, y: y1 }];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const perpX = -dy;
    const perpY = dx;
    const len = Math.hypot(dx, dy) || 1;
    for (let i = 1; i < steps; i++) {
      const f = i / steps;
      const jitter = (Math.random() - 0.5) * Math.min(36, len * 0.16);
      pts.push({
        x: x1 + dx * f + (perpX / len) * jitter,
        y: y1 + dy * f + (perpY / len) * jitter,
      });
    }
    pts.push({ x: x2, y: y2 });
    this.lightningArcs.push({
      points: pts,
      color,
      life: 0.18,
      maxLife: 0.18,
      width,
    });
  }

  private showToast(key: string, params: Record<string, string | number> | undefined, accent: string): void {
    this.activeToast = {
      id: this.toastIdCounter++,
      key,
      params,
      accent,
    };
    this.toastTimer = 3.2;
  }
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
