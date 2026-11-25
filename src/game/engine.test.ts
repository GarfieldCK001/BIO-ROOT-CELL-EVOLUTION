import test from 'node:test';
import assert from 'node:assert/strict';
import { BioAudioEngine } from './audio';
import { createEmptyDna, createEmptySkills, ZONES } from './data';
import { BioRootEngine } from './engine';
import { formatSeedCode, getDailyChallengeSeed, normalizeSeed, SeededRng } from './rng';
import { HudSnapshot, MutagenUpgrades, SavedRunSnapshot } from './types';

function createNoopCtx(): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => undefined };
  return new Proxy(
    {
      canvas: { width: 1280, height: 720 },
      createRadialGradient: () => gradient,
      createLinearGradient: () => gradient,
      measureText: () => ({ width: 20 }),
      save: () => undefined,
      restore: () => undefined,
      translate: () => undefined,
      rotate: () => undefined,
      scale: () => undefined,
      setTransform: () => undefined,
      clearRect: () => undefined,
      fillRect: () => undefined,
      strokeRect: () => undefined,
      beginPath: () => undefined,
      closePath: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      quadraticCurveTo: () => undefined,
      bezierCurveTo: () => undefined,
      arc: () => undefined,
      ellipse: () => undefined,
      fill: () => undefined,
      stroke: () => undefined,
      clip: () => undefined,
      fillText: () => undefined,
      strokeText: () => undefined,
      setLineDash: () => undefined,
    },
    {
      get(target, prop) {
        if (prop in target) return (target as Record<PropertyKey, unknown>)[prop];
        return () => undefined;
      },
      set() {
        return true;
      },
    }
  ) as unknown as CanvasRenderingContext2D;
}

function createMockAudio(): BioAudioEngine {
  return new Proxy(
    {},
    {
      get() {
        return () => undefined;
      },
    }
  ) as unknown as BioAudioEngine;
}

function withHeadlessDom<T>(fn: () => T): T {
  const g = globalThis as Record<string, unknown>;
  const prevWindow = g.window;
  const prevDocument = g.document;
  const prevRaf = g.requestAnimationFrame;
  const prevCancelRaf = g.cancelAnimationFrame;

  const noop = () => undefined;
  g.window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    addEventListener: noop,
    removeEventListener: noop,
  };
  g.document = {
    hidden: false,
    addEventListener: noop,
    removeEventListener: noop,
  };
  g.requestAnimationFrame = () => 1;
  g.cancelAnimationFrame = noop;

  try {
    return fn();
  } finally {
    if (prevWindow === undefined) delete g.window;
    else g.window = prevWindow;
    if (prevDocument === undefined) delete g.document;
    else g.document = prevDocument;
    if (prevRaf === undefined) delete g.requestAnimationFrame;
    else g.requestAnimationFrame = prevRaf;
    if (prevCancelRaf === undefined) delete g.cancelAnimationFrame;
    else g.cancelAnimationFrame = prevCancelRaf;
  }
}

function createHeadlessEngine() {
  const ctx = createNoopCtx();
  const canvas = {
    width: 1280,
    height: 720,
    style: { width: '', height: '' },
    parentElement: null,
    getContext: () => ctx,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
  } as unknown as HTMLCanvasElement;

  let lastHud: HudSnapshot | null = null;
  let lastAutoSave: SavedRunSnapshot | null = null;

  const engine = new BioRootEngine(canvas, createMockAudio(), {
    onHudUpdate: (snap) => {
      lastHud = snap;
    },
    onGameOver: () => undefined,
    onAutoSave: (snap) => {
      lastAutoSave = snap;
    },
    onRequestToggleSkillTree: () => undefined,
    onRequestTogglePause: () => undefined,
  });

  return {
    engine,
    getLastHud: () => lastHud,
    getLastAutoSave: () => lastAutoSave,
  };
}

const ZERO_UPGRADES: MutagenUpgrades = { vitality: 0, metabolism: 0, dnaMagnet: 0, mobility: 0 };

test('SeededRng produces strictly deterministic sequences and Daily Challenge seed format', () => {
  const rngA = new SeededRng(20261125);
  const rngB = new SeededRng(20261125);
  const seqA = Array.from({ length: 12 }, () => rngA.next());
  const seqB = Array.from({ length: 12 }, () => rngB.next());
  assert.deepEqual(seqA, seqB);

  for (const v of seqA) {
    assert.ok(v >= 0 && v < 1, `Expected [0, 1), got ${v}`);
  }

  for (let i = 0; i < 40; i++) {
    const n = rngA.int(3, 7);
    assert.ok(Number.isInteger(n) && n >= 3 && n <= 7);
    const f = rngA.range(-10, 10);
    assert.ok(f >= -10 && f < 10);
  }

  assert.equal(normalizeSeed(0), 0x9e3779b9);
  assert.equal(normalizeSeed('BIO-DAILY'), normalizeSeed('BIO-DAILY'));
  assert.equal(getDailyChallengeSeed(new Date(Date.UTC(2026, 10, 25))), 20261125);
  assert.equal(formatSeedCode(20261125), '#20261125');
});

test('BioRootEngine seeded runs generate identical initial enemy & food coordinates', () => {
  withHeadlessDom(() => {
    const h1 = createHeadlessEngine();
    const h2 = createHeadlessEngine();
    try {
      h1.engine.startNewRun(ZERO_UPGRADES, false, 'normal', 'specimen_0', 424242, true);
      h2.engine.startNewRun(ZERO_UPGRADES, false, 'normal', 'specimen_0', 424242, true);

      const e1 = (h1.engine as unknown as { enemies: Array<{ kind: string; x: number; y: number }> }).enemies;
      const e2 = (h2.engine as unknown as { enemies: Array<{ kind: string; x: number; y: number }> }).enemies;
      const f1 = (h1.engine as unknown as { foods: Array<{ kind: string; x: number; y: number }> }).foods;
      const f2 = (h2.engine as unknown as { foods: Array<{ kind: string; x: number; y: number }> }).foods;

      assert.ok(e1.length > 0 && f1.length > 0);
      assert.deepEqual(
        e1.map((e) => [e.kind, Math.round(e.x), Math.round(e.y)]),
        e2.map((e) => [e.kind, Math.round(e.x), Math.round(e.y)])
      );
      assert.deepEqual(
        f1.map((f) => [f.kind, Math.round(f.x), Math.round(f.y)]),
        f2.map((f) => [f.kind, Math.round(f.x), Math.round(f.y)])
      );
      assert.equal(h1.getLastAutoSave()?.rngSeed, 424242);
      assert.equal(h1.getLastAutoSave()?.isDailyChallenge, true);
    } finally {
      h1.engine.dispose();
      h2.engine.dispose();
    }
  });
});

test('continueFromSave preserves low HP (no free 20 HP heal) and survives corrupted snapshots without throwing', () => {
  withHeadlessDom(() => {
    const { engine, getLastHud } = createHeadlessEngine();
    try {
      // Low HP snapshot must stay at 5 HP, not jump to 20 HP
      engine.continueFromSave(
        {
          zone: 2,
          difficulty: 'normal',
          characterId: 'specimen_0',
          hp: 5,
          maxHp: 140,
          energy: 40,
          maxEnergy: 100,
          radius: 34,
          biomass: 320,
          dna: { ...createEmptyDna(), speed: 2 },
          skills: { ...createEmptySkills(), jet_flagella: 1 },
          kills: 8,
          elapsedSec: 55,
          defeatedBosses: [],
          endlessMode: false,
          rngSeed: 12345,
        },
        ZERO_UPGRADES
      );
      assert.equal(getLastHud()?.hp, 5);

      // Corrupted snapshot with missing defeatedBosses, NaN HP, negative radius must NOT throw
      assert.doesNotThrow(() => {
        engine.continueFromSave(
          {
            zone: 5,
            hp: Number.NaN,
            maxHp: 150,
            radius: -99,
            biomass: Number.NaN,
          } as unknown as SavedRunSnapshot,
          ZERO_UPGRADES
        );
      });
      const hud = getLastHud()!;
      assert.equal(hud.zone, 5);
      assert.ok(Number.isFinite(hud.hp) && hud.hp >= 1);
      assert.ok(Number.isFinite(hud.radius) && hud.radius >= 18);
    } finally {
      engine.dispose();
    }
  });
});

test('addBiomass keeps counting biomass score even when Zone 1 physical radius hits its cap', () => {
  withHeadlessDom(() => {
    const { engine } = createHeadlessEngine();
    try {
      engine.startNewRun(ZERO_UPGRADES, false, 'normal', 'specimen_0', 777);
      const internal = engine as unknown as {
        player: { radius: number; biomass: number };
        addBiomass: (amount: number) => void;
      };
      internal.player.radius = ZONES[1].maxRadiusInZone;
      const beforeBiomass = internal.player.biomass;
      internal.addBiomass(120);
      assert.equal(internal.player.radius, ZONES[1].maxRadiusInZone, 'Radius must remain capped in Zone 1');
      assert.equal(
        internal.player.biomass,
        beforeBiomass + 120,
        'Biomass counter must continue accumulating when radius is zone-capped'
      );
    } finally {
      engine.dispose();
    }
  });
});

test('Zone 5 spawns Thermo-Kraken and Zone 7 spawns Parasite Matriarch as unique bosses', () => {
  withHeadlessDom(() => {
    const { engine } = createHeadlessEngine();
    try {
      const internal = engine as unknown as {
        enemies: Array<{ kind: string; isBoss: boolean }>;
      };

      engine.continueFromSave(
        { zone: 5, hp: 150, maxHp: 150, radius: 48, biomass: 500, defeatedBosses: [2, 3] } as SavedRunSnapshot,
        ZERO_UPGRADES
      );
      const z5Boss = internal.enemies.find((e) => e.isBoss);
      assert.equal(z5Boss?.kind, 'thermo_kraken');

      engine.continueFromSave(
        { zone: 7, hp: 180, maxHp: 180, radius: 56, biomass: 750, defeatedBosses: [2, 3, 5] } as SavedRunSnapshot,
        ZERO_UPGRADES
      );
      const z7Boss = internal.enemies.find((e) => e.isBoss);
      assert.equal(z7Boss?.kind, 'parasite_matriarch');
    } finally {
      engine.dispose();
    }
  });
});
