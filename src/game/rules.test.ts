import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applySkillUpgrade,
  calculateMutagenEarned,
  calculateRunScore,
  canSwallowDirectly,
  canUnlockCharacter,
  canUnlockSkill,
  computeIncomingPlayerDamage,
  computeSoftBodyRadius,
  computeSpikeReflectDamage,
  computeTargetCameraZoom,
  computeZoneEnemyDamage,
  computeZoneEnemySpeed,
  createDefaultSave,
  CURRENT_SAVE_VERSION,
  DEFAULT_PLAYER_NAME,
  getActiveSkillBranches,
  getEffectiveRunEvoCap,
  getEffectiveZoneEvoCap,
  getMaxConcurrentChasers,
  getSkillUpgradeCost,
  getTotalEvolutionPointsUsed,
  hasAnyAffordableSkill,
  isBranchSealed,
  isEvolutionCappedInZone,
  isGrowthCappedInZone,
  isNextZoneUnlocked,
  isPlayerInBossTerritory,
  loadPersistentSave,
  MAX_LEADERBOARD_ENTRIES,
  MAX_PLAYER_NAME_LENGTH,
  MAX_TOTAL_SKILL_POINTS,
  MUTAGEN_REWARD_TUNING,
  recordLeaderboardEntry,
  sanitizePlayerName,
  sanitizeSavedRun,
  unlockCharacter,
  writePersistentSave,
} from './rules';
import {
  CHARACTER_ORDER,
  createEmptyDna,
  createEmptySkills,
  DIFFICULTY_ORDER,
  LEGENDARY_CHARACTERS,
  MAX_STANDARD_RADIUS,
  MONSTER_CHARACTERS,
  ORGANISM_LIST,
  ORGANISMS,
  POST_GAME_CHARACTERS,
  SKILL_BRANCH_ORDER,
  SKILL_LIST,
  ZONE_LIST,
  ZONES,
} from './data';
import { formatTemplate, TRANSLATIONS } from './i18n';
import { Lang, LeaderboardEntry, RunSummary } from './types';

test('swallow rule requires player to be larger and forbids swallowing bosses directly', () => {
  assert.equal(canSwallowDirectly(30, 20, false), true);
  assert.equal(canSwallowDirectly(20, 20, false), false);
  assert.equal(canSwallowDirectly(20, 25, false), false);
  assert.equal(canSwallowDirectly(150, 60, true), false);
});

test('dynamic camera zoom smoothly zooms out as cell grows and stays clamped', () => {
  const smallZoom = computeTargetCameraZoom(20);
  const midZoom = computeTargetCameraZoom(45);
  const hugeZoom = computeTargetCameraZoom(140);
  assert.ok(smallZoom > midZoom, 'Zoom should decrease as radius grows');
  assert.ok(midZoom > hugeZoom, 'Zoom should continue decreasing at larger radius');
  assert.ok(hugeZoom >= 0.44 && smallZoom <= 1.18, 'Zoom stays within safe bounds');
});

test('5-taproot (16-skill) tree enforces difficulty branch/slot caps and unlocks all 48 points in Endless Mode', () => {
  assert.equal(SKILL_BRANCH_ORDER.length, 5);
  assert.equal(SKILL_LIST.length, 16);
  assert.equal(MAX_TOTAL_SKILL_POINTS, 48);

  const skills = createEmptySkills();
  const dna = createEmptyDna();

  // Root node blocked without DNA
  assert.deepEqual(canUnlockSkill('jet_flagella', skills, dna, 'normal'), { ok: false, reason: 'dna' });
  assert.equal(hasAnyAffordableSkill(skills, dna, 'normal'), false);

  // Child node blocked by parent even with DNA
  dna.spike = 10;
  assert.deepEqual(canUnlockSkill('chitin_spikes', skills, dna, 'normal'), { ok: false, reason: 'parents' });

  // Unlock Predator (jet_flagella) + Biochem (corrosive_spit)
  dna.speed = 30;
  dna.acid = 30;
  dna.electric = 30;
  dna.armor = 30;
  dna.vampire = 30;
  dna.stealth = 30;
  const res1 = applySkillUpgrade('jet_flagella', skills, dna, 'normal')!;
  assert.equal(res1.skills.jet_flagella, 1);

  const res2 = applySkillUpgrade('corrosive_spit', res1.skills, res1.dna, 'normal')!;
  assert.deepEqual(getActiveSkillBranches(res2.skills).sort(), ['biochem', 'predator']);

  // Normal allows 3 of 5 roots -> 3rd root (elemental) is open, then 4th root (symbiont) is sealed
  assert.equal(isBranchSealed('elemental', res2.skills, 'normal'), false);
  const res3 = applySkillUpgrade('cryo_membrane', res2.skills, res2.dna, 'normal')!;
  assert.equal(isBranchSealed('symbiont', res3.skills, 'normal'), true);
  assert.deepEqual(canUnlockSkill('gravity_cilia', res3.skills, res3.dna, 'normal'), {
    ok: false,
    reason: 'branch_limit',
  });

  // Novice allows 4 of 5 roots -> symbiont is still open on Novice
  assert.equal(isBranchSealed('symbiont', res3.skills, 'novice'), false);
  assert.deepEqual(canUnlockSkill('gravity_cilia', res3.skills, res3.dna, 'novice'), { ok: true });

  // Hell mode strictly locks to 2 of 5 roots -> 3rd root (immortal / elemental) is sealed
  assert.equal(isBranchSealed('immortal', res2.skills, 'hell'), true);
  assert.deepEqual(canUnlockSkill('hexa_carapace', res2.skills, res2.dna, 'hell'), {
    ok: false,
    reason: 'branch_limit',
  });

  // Endless Mode unseals all 5 roots even on Hell difficulty and unlocks full 48/48 skill points!
  assert.equal(isBranchSealed('immortal', res2.skills, 'hell', true), false);
  assert.equal(isBranchSealed('symbiont', res3.skills, 'hell', true), false);
  assert.equal(getEffectiveRunEvoCap('hell', true), MAX_TOTAL_SKILL_POINTS);
  assert.deepEqual(canUnlockSkill('gravity_cilia', res3.skills, res3.dna, 'hell', 10, true), { ok: true });

  // Hybrid Plasmic Nova requires both corrosive_spit and bio_volt_pulse
  assert.deepEqual(canUnlockSkill('plasmic_nova', res2.skills, res2.dna, 'normal'), {
    ok: false,
    reason: 'parents',
  });
  const resVolt = applySkillUpgrade('bio_volt_pulse', res2.skills, res2.dna, 'normal')!;
  assert.deepEqual(canUnlockSkill('plasmic_nova', resVolt.skills, resVolt.dna, 'normal'), { ok: true });

  // Evolution Cap enforcement: Hell (18), Normal (21), Novice (24), Endless (48)
  const capTestSkills = createEmptySkills();
  capTestSkills.jet_flagella = 3;
  capTestSkills.chitin_spikes = 3;
  capTestSkills.phantom_ambush = 3; // Predator full = 9
  capTestSkills.corrosive_spit = 3;
  capTestSkills.bio_volt_pulse = 3;
  capTestSkills.plasmic_nova = 3; // Biochem full = 9 -> Total = 18
  assert.equal(getTotalEvolutionPointsUsed(capTestSkills), 18);
  assert.deepEqual(canUnlockSkill('cryo_membrane', capTestSkills, resVolt.dna, 'hell'), {
    ok: false,
    reason: 'evo_cap',
  });
  assert.deepEqual(canUnlockSkill('cryo_membrane', capTestSkills, resVolt.dna, 'normal'), { ok: true });
  assert.deepEqual(canUnlockSkill('cryo_membrane', capTestSkills, resVolt.dna, 'novice'), { ok: true });
  assert.deepEqual(canUnlockSkill('cryo_membrane', capTestSkills, resVolt.dna, 'hell', 10, true), { ok: true });

  // Cost scales for level 2
  const lv1Cost = getSkillUpgradeCost('jet_flagella', 0);
  const lv2Cost = getSkillUpgradeCost('jet_flagella', 1);
  assert.ok((lv1Cost.speed ?? 0) >= 5, 'Early common DNA skill should require substantial hunting');
  assert.ok((lv2Cost.speed ?? 0) > (lv1Cost.speed ?? 0));

  // Per-Zone Evolution Cap prevents maxing out in Zone 1 (Zone 1 = 3, lifts to 5 in Zone 2)
  const z1Skills = createEmptySkills();
  const richDna = createEmptyDna();
  richDna.speed = 60;
  richDna.acid = 60;
  assert.equal(getEffectiveZoneEvoCap(1, 'normal'), 3);
  const z1r1 = applySkillUpgrade('jet_flagella', z1Skills, richDna, 'normal', 1)!;
  const z1r2 = applySkillUpgrade('jet_flagella', z1r1.skills, z1r1.dna, 'normal', 1)!;
  const z1r3 = applySkillUpgrade('jet_flagella', z1r2.skills, z1r2.dna, 'normal', 1)!;
  assert.equal(isEvolutionCappedInZone(1, z1r3.skills, 'normal'), true);
  assert.deepEqual(canUnlockSkill('corrosive_spit', z1r3.skills, z1r3.dna, 'normal', 1), {
    ok: false,
    reason: 'zone_evo_cap',
  });
  assert.equal(isEvolutionCappedInZone(2, z1r3.skills, 'normal'), false);
  assert.deepEqual(canUnlockSkill('corrosive_spit', z1r3.skills, z1r3.dna, 'normal', 2), { ok: true });

  // Per-Zone Growth Cap prevents over-growing in Zone 1 (cap 35), lifts in Zone 2 & Endless
  assert.equal(isGrowthCappedInZone(1, 33, false), false);
  assert.equal(isGrowthCappedInZone(1, 35, false), true);
  assert.equal(isGrowthCappedInZone(2, 35, false), false);
  assert.equal(isGrowthCappedInZone(10, MAX_STANDARD_RADIUS, false), false);
});

test('concurrent chaser cap stays strictly between 2 and 5, and boss territory respects boundary', () => {
  for (const z of ZONE_LIST) {
    for (const d of DIFFICULTY_ORDER) {
      const chasers = getMaxConcurrentChasers(z, d);
      assert.ok(chasers >= 2 && chasers <= 5, `Chasers in zone ${z} (${d}) must be 2..5, got ${chasers}`);
    }
  }

  assert.equal(isPlayerInBossTerritory(0, 0, 700, 0, 480, false), false);
  assert.equal(isPlayerInBossTerritory(300, 0, 700, 0, 480, false), true);
  assert.equal(isPlayerInBossTerritory(190, 0, 700, 0, 480, true), true);
  assert.equal(isPlayerInBossTerritory(100, 0, 700, 0, 480, true), false);
});

test('armor mitigation (12%/lv, 55% cap, floor 2), enemy zone scaling, juggernaut invulnerability, and spike reflection', () => {
  assert.equal(computeIncomingPlayerDamage(20, 0, false), 20);
  // Lv2 Hexa-Carapace = 24% reduction -> round(20 * 0.76) = 15
  assert.equal(computeIncomingPlayerDamage(20, 2, false), 15);
  // Armor cap strictly clamped at 55% even with Lv3 + huge character bonus
  assert.equal(computeIncomingPlayerDamage(100, 3, false, 0.5), 45);
  // Minimum floor is 2 HP when not invulnerable
  assert.equal(computeIncomingPlayerDamage(3, 3, false, 0.3), 2);
  assert.equal(computeIncomingPlayerDamage(50, 0, true), 0);
  assert.equal(computeSpikeReflectDamage(20, 0), 0);
  assert.equal(computeSpikeReflectDamage(20, 2), 10);

  // Zone enemy damage & speed progression across Zones 1..10
  assert.equal(computeZoneEnemyDamage(10, 1, 1.0, false), 10);
  assert.equal(computeZoneEnemyDamage(10, 5, 1.0, false), 14);
  assert.equal(computeZoneEnemyDamage(10, 10, 1.0, false), 19);
  assert.equal(computeZoneEnemyDamage(20, 10, 1.0, true), 40);
  assert.equal(computeZoneEnemySpeed(100, 1, 1.0), 100);
  assert.equal(computeZoneEnemySpeed(100, 9, 1.0), 120);
});

test('5 boss zones feature 5 distinct unique bosses and pre-Zone-10 Boss DNA covers Boss capstones cleanly', () => {
  const bossZones = ZONE_LIST.filter((z) => ZONES[z].bossKind !== null);
  assert.deepEqual(bossZones, [2, 3, 5, 7, 10]);

  const bossKinds = bossZones.map((z) => ZONES[z].bossKind!);
  assert.equal(new Set(bossKinds).size, 5, 'All 5 boss zones must have 5 unique boss species');
  assert.equal(ZONES[5].bossKind, 'thermo_kraken');
  assert.equal(ZONES[7].bossKind, 'parasite_matriarch');

  const preZone10BossDna = [2, 3, 5, 7].reduce((sum, z) => {
    const kind = ZONES[z as keyof typeof ZONES].bossKind!;
    return sum + ORGANISMS[kind].dnaAmount;
  }, 0);
  assert.equal(preZone10BossDna, 26);

  // Maxing a Boss-DNA capstone (Lv1..Lv3): 2 + 4 + 6 = 12 Boss DNA, so 2 capstones (24) fit cleanly before Zone 10
  for (const capstone of ['mitosis_minions', 'juggernaut_charge', 'singularity_bloom'] as const) {
    const totalBossDna =
      (getSkillUpgradeCost(capstone, 0).boss ?? 0) +
      (getSkillUpgradeCost(capstone, 1).boss ?? 0) +
      (getSkillUpgradeCost(capstone, 2).boss ?? 0);
    assert.equal(totalBossDna, 12, `${capstone} should require 12 Boss DNA to max`);
  }
});

test('10-zone advancement checks updated size thresholds and boss defeat requirements', () => {
  assert.equal(isNextZoneUnlocked(1, 31, []), false);
  assert.equal(isNextZoneUnlocked(1, 33, []), true);
  assert.equal(isNextZoneUnlocked(2, 40, []), false);
  assert.equal(isNextZoneUnlocked(2, 36, [2]), false);
  assert.equal(isNextZoneUnlocked(2, 38, [2]), true);
  assert.equal(isNextZoneUnlocked(5, 53, []), false);
  assert.equal(isNextZoneUnlocked(5, 53, [5]), true);
  assert.equal(isNextZoneUnlocked(9, 69, []), true);
  assert.equal(isNextZoneUnlocked(10, 100, [2, 3, 5, 7, 10]), false);
});

test('end-of-run Mutagen tuning applies 5-10% reduction (0.92 = -8%) and scales across difficulties', () => {
  assert.ok(
    MUTAGEN_REWARD_TUNING >= 0.9 && MUTAGEN_REWARD_TUNING <= 0.95,
    `Expected Mutagen tuning in 0.90..0.95 (-5% to -10%), got ${MUTAGEN_REWARD_TUNING}`
  );
  // Raw formula for normal: floor(500*0.08) + 20*2 + (5-1)*16 + 2*35 = 40 + 40 + 64 + 70 = 214
  // With 0.92 tuning (-8%): round(214 * 0.92) = 197
  const mNormal = calculateMutagenEarned({
    biomass: 500,
    kills: 20,
    zoneReached: 5,
    bossesDefeated: 2,
    victory: false,
    difficulty: 'normal',
  });
  assert.equal(mNormal, Math.round(214 * MUTAGEN_REWARD_TUNING));

  const mNovice = calculateMutagenEarned({
    biomass: 500,
    kills: 20,
    zoneReached: 5,
    bossesDefeated: 2,
    victory: false,
    difficulty: 'novice',
  });
  const mHell = calculateMutagenEarned({
    biomass: 500,
    kills: 20,
    zoneReached: 5,
    bossesDefeated: 2,
    victory: false,
    difficulty: 'hell',
  });
  assert.ok(mHell > mNormal && mNormal > mNovice);
});

test('player name sanitization, renaming, historical leaderboard name snapshots, and persistence work cleanly', () => {
  assert.equal(sanitizePlayerName(''), DEFAULT_PLAYER_NAME);
  assert.equal(sanitizePlayerName('   '), DEFAULT_PLAYER_NAME);
  assert.equal(sanitizePlayerName('  Bio   King  '), 'Bio King');
  assert.equal(sanitizePlayerName('A'.repeat(40)).length, MAX_PLAYER_NAME_LENGTH);

  // Record a run as "OldHunter", then rename to "NewApex" and record another run:
  // Historical entry MUST keep "OldHunter" while the new entry records "NewApex".
  let board: LeaderboardEntry[] = [];
  const runA: RunSummary = {
    victory: false,
    endlessMode: false,
    difficulty: 'normal',
    zoneReached: 4,
    finalBiomass: 420,
    kills: 15,
    elapsedSec: 120,
    mutagenEarned: 90,
    bossesDefeated: 1,
    score: 2500,
    playerName: 'OldHunter',
  };
  board = recordLeaderboardEntry(board, runA, 1001, 'OldHunter').entries;

  const runB: RunSummary = {
    victory: true,
    endlessMode: false,
    difficulty: 'hell',
    zoneReached: 10,
    finalBiomass: 950,
    kills: 45,
    elapsedSec: 360,
    mutagenEarned: 400,
    bossesDefeated: 5,
    score: 12000,
    playerName: 'NewApex',
  };
  board = recordLeaderboardEntry(board, runB, 2002, 'NewApex').entries;

  assert.equal(board[0].playerName, 'NewApex');
  assert.equal(board[1].playerName, 'OldHunter');

  // Fill past 10 entries to verify Top 10 cap
  for (let i = 1; i <= 11; i++) {
    const summary: RunSummary = {
      victory: false,
      endlessMode: false,
      difficulty: 'normal',
      zoneReached: Math.min(10, i) as RunSummary['zoneReached'],
      finalBiomass: 200 * i,
      kills: i * 3,
      elapsedSec: 90 + i * 10,
      mutagenEarned: 50,
      bossesDefeated: Math.floor(i / 3),
      score: calculateRunScore({
        finalBiomass: 200 * i,
        kills: i * 3,
        zoneReached: Math.min(10, i) as RunSummary['zoneReached'],
        bossesDefeated: Math.floor(i / 3),
        victory: false,
        difficulty: 'normal',
      }),
    };
    board = recordLeaderboardEntry(board, summary, 3000 + i, `Player-${i}`).entries;
  }
  assert.equal(board.length, MAX_LEADERBOARD_ENTRIES);
  assert.equal(board[0].playerName, 'NewApex');

  // Persistence round-trip for playerName + leaderboard historical names
  const memoryStore = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => memoryStore.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memoryStore.set(k, v);
    },
  };
  const initial = createDefaultSave();
  initial.playerName = 'BioLegend';
  initial.mutagen = 145;
  initial.lang = 'zh';
  initial.difficulty = 'hell';
  initial.bestZone = 8;
  initial.upgrades.vitality = 2;
  initial.upgrades.mobility = 3;
  initial.leaderboard = board;
  writePersistentSave(initial, mockStorage);

  const loaded = loadPersistentSave(mockStorage);
  assert.equal(loaded.playerName, 'BioLegend');
  assert.equal(loaded.leaderboard.length, 10);
  assert.equal(loaded.leaderboard[0].playerName, 'NewApex');
  assert.equal(loaded.upgrades.mobility, 3);
});

test('soft-body wobble stays bounded around base radius', () => {
  for (let i = 0; i < 16; i++) {
    const r = computeSoftBodyRadius(30, (i / 16) * Math.PI * 2, 1.25, 0.8, 0.4);
    assert.ok(r > 24 && r < 36, `Expected bounded wobble radius, got ${r}`);
  }
});

test('save schema versioning and strict sanitizeSavedRun recover cleanly from corrupt payloads', () => {
  const def = createDefaultSave();
  assert.equal(def.saveVersion, CURRENT_SAVE_VERSION);

  assert.equal(sanitizeSavedRun(null), null);
  assert.equal(sanitizeSavedRun('corrupt'), null);
  assert.equal(sanitizeSavedRun([]), null);

  const sanitized = sanitizeSavedRun({
    zone: 99,
    difficulty: 'unknown',
    characterId: 'fake_cell',
    hp: Number.NaN,
    maxHp: -10,
    energy: -5,
    maxEnergy: 999999,
    radius: -50,
    biomass: Number.NaN,
    dna: { speed: -5, boss: 12 },
    skills: { hexa_carapace: 99, jet_flagella: -2 },
    kills: -3,
    elapsedSec: -10,
    // deliberately omit defeatedBosses to simulate corrupted payload
  } as unknown as Record<string, unknown>)!;

  assert.ok(sanitized);
  assert.equal(sanitized.zone, 1);
  assert.equal(sanitized.difficulty, 'normal');
  assert.equal(sanitized.characterId, 'specimen_0');
  assert.equal(sanitized.maxHp, 60);
  assert.equal(sanitized.hp, 60);
  assert.equal(sanitized.energy, 0);
  assert.equal(sanitized.radius, 18);
  assert.equal(sanitized.biomass, 100);
  assert.equal(sanitized.dna.speed, 0);
  assert.equal(sanitized.dna.boss, 12);
  assert.equal(sanitized.skills.hexa_carapace, 3);
  assert.equal(sanitized.skills.jet_flagella, 0);
  assert.deepEqual(sanitized.defeatedBosses, []);

  // Low HP (e.g. 5 HP) must NOT be boosted to 20 HP on reload, while null HP falls back to maxHp
  const lowHp = sanitizeSavedRun({ zone: 2, hp: 5, maxHp: 140, defeatedBosses: [2] })!;
  assert.equal(lowHp.hp, 5);
  assert.deepEqual(lowHp.defeatedBosses, [2]);

  const nullHp = sanitizeSavedRun({ zone: 5, hp: null, maxHp: 180 })!;
  assert.equal(nullHp.hp, 180);
});

test('22 unlockable strains include 10 legendary characters AND all 12 non-food monsters/bosses with rebalanced Mutagen costs', () => {
  assert.equal(LEGENDARY_CHARACTERS.length, 10);
  assert.equal(MONSTER_CHARACTERS.length, 12);
  assert.equal(POST_GAME_CHARACTERS.length, 22);
  assert.equal(CHARACTER_ORDER.length, 23);
  const uniqueIds = new Set(POST_GAME_CHARACTERS.map((c) => c.id));
  assert.equal(uniqueIds.size, 22);

  // Every single non-food organism in the game (including Thermo-Kraken & Parasite Matriarch) must be playable
  const allHostileOrganisms = ORGANISM_LIST.filter((k) => ORGANISMS[k].category !== 'food');
  const playableMonsterKinds = new Set(MONSTER_CHARACTERS.map((m) => m.organismKind));
  assert.equal(allHostileOrganisms.length, 12);
  for (const kind of allHostileOrganisms) {
    assert.ok(playableMonsterKinds.has(kind), `Missing playable monster strain for organism ${kind}`);
  }

  let totalMutagenToUnlockAll = 0;
  for (const ch of POST_GAME_CHARACTERS) {
    assert.equal(ch.isPostGame, true);
    assert.ok(
      ch.mutagenCost >= 350 && ch.mutagenCost <= 2500,
      `${ch.id} rebalanced cost should be 350..2500, got ${ch.mutagenCost}`
    );
    totalMutagenToUnlockAll += ch.mutagenCost;
    assert.ok(ch.specialCooldown > 0, `${ch.id} must have an active special skill cooldown`);
  }
  assert.ok(
    totalMutagenToUnlockAll >= 20000 && totalMutagenToUnlockAll <= 28000,
    `Total unlock economy should be ~23.6k Mutagen, got ${totalMutagenToUnlockAll}`
  );

  // Starter character is already unlocked
  const save = createDefaultSave();
  assert.deepEqual(canUnlockCharacter('specimen_0', save), { ok: false, reason: 'already_unlocked' });

  // Before clearing Zone 10, even huge Mutagen cannot unlock post-game strains or playable monsters
  save.mutagen = 25000;
  assert.deepEqual(canUnlockCharacter('pyro_phage', save), { ok: false, reason: 'need_clear' });
  assert.deepEqual(canUnlockCharacter('mob_volt_jelly', save), { ok: false, reason: 'need_clear' });
  assert.equal(unlockCharacter(save, 'mob_volt_jelly'), null);

  // After clearing Zone 10, insufficient Mutagen is blocked (mob_flagella_dart = 350)
  save.hasClearedGame = true;
  save.mutagen = 349;
  assert.deepEqual(canUnlockCharacter('mob_flagella_dart', save), { ok: false, reason: 'need_mutagen' });

  // Sufficient Mutagen unlocks & equips a playable monster and deducts exact cost (mob_volt_jelly = 750)
  save.mutagen = 3500;
  const afterJelly = unlockCharacter(save, 'mob_volt_jelly')!;
  assert.ok(afterJelly);
  assert.equal(afterJelly.mutagen, 2750);
  assert.equal(afterJelly.selectedCharacter, 'mob_volt_jelly');
  assert.ok(afterJelly.unlockedCharacters.includes('mob_volt_jelly'));

  // Unlocking 2,200-Mutagen Omega Core Boss strain leaves 550 Mutagen
  const afterOmegaBoss = unlockCharacter(afterJelly, 'mob_omega_core')!;
  assert.ok(afterOmegaBoss);
  assert.equal(afterOmegaBoss.mutagen, 550);
  assert.equal(afterOmegaBoss.selectedCharacter, 'mob_omega_core');

  // Persistence round-trip
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };
  writePersistentSave(afterOmegaBoss, mockStorage);
  const reloaded = loadPersistentSave(mockStorage);
  assert.equal(reloaded.hasClearedGame, true);
  assert.equal(reloaded.selectedCharacter, 'mob_omega_core');
  assert.ok(reloaded.unlockedCharacters.includes('mob_volt_jelly'));
  assert.ok(reloaded.unlockedCharacters.includes('mob_omega_core'));
});

test('all 3 languages (TH, EN, ZH) cover all 14 organisms, 5 branches, 16 skills, 10 zones, 3 difficulties, 23 characters, daily seed, and rename labels', () => {
  assert.equal(ORGANISM_LIST.length, 14);
  const langs: Lang[] = ['th', 'en', 'zh'];
  for (const lang of langs) {
    const pack = TRANSLATIONS[lang];
    assert.ok(pack.gameTitle.length > 0);
    assert.ok(pack.menu.playerNameLabel.length > 0);
    assert.ok(pack.menu.renameBtn.length > 0);
    assert.ok(pack.menu.saveNameBtn.length > 0);
    assert.ok(pack.menu.dailySeedLabel.length > 0);
    assert.ok(pack.menu.dailySeedOn.length > 0);
    assert.ok(pack.menu.dailySeedOff.length > 0);
    assert.ok(pack.leaderboard.playerCol.length > 0);
    assert.ok(pack.gameover.playerLabel.length > 0);
    assert.ok(pack.characterVault.tabAll.length > 0);
    assert.ok(pack.characterVault.tabLegendary.length > 0);
    assert.ok(pack.characterVault.tabMonsters.length > 0);
    assert.ok(pack.characterVault.monsterBadge.length > 0);
    for (const org of ORGANISM_LIST) {
      assert.ok(pack.organisms[org]?.name.length > 0, `Missing ${org} name in ${lang}`);
      assert.ok(pack.organisms[org]?.desc.length > 0, `Missing ${org} desc in ${lang}`);
    }
    for (const br of SKILL_BRANCH_ORDER) {
      assert.ok(pack.branches[br]?.name.length > 0, `Missing branch ${br} name in ${lang}`);
      assert.ok(pack.branches[br]?.subtitle.length > 0, `Missing branch ${br} subtitle in ${lang}`);
    }
    for (const skill of SKILL_LIST) {
      assert.ok(pack.skills[skill.id]?.name.length > 0, `Missing ${skill.id} name in ${lang}`);
    }
    for (const z of ZONE_LIST) {
      assert.ok(pack.zones[z]?.name.length > 0, `Missing zone ${z} in ${lang}`);
      assert.ok(pack.zones[z]?.desc.length > 0, `Missing zone ${z} desc in ${lang}`);
    }
    for (const d of DIFFICULTY_ORDER) {
      assert.ok(pack.difficulties[d]?.name.length > 0, `Missing difficulty ${d} in ${lang}`);
      assert.ok(pack.difficulties[d]?.summary.length > 0, `Missing difficulty ${d} summary in ${lang}`);
    }
    for (const chId of CHARACTER_ORDER) {
      const ch = pack.characters[chId];
      assert.ok(ch?.name.length > 0, `Missing character ${chId} name in ${lang}`);
      assert.ok(ch?.archetype.length > 0, `Missing character ${chId} archetype in ${lang}`);
      assert.ok(ch?.passive.length > 0, `Missing character ${chId} passive in ${lang}`);
      assert.ok(ch?.specialName.length > 0, `Missing character ${chId} specialName in ${lang}`);
      assert.ok(ch?.specialDesc.length > 0, `Missing character ${chId} specialDesc in ${lang}`);
    }
  }
  assert.equal(formatTemplate('Zone {zone}: {name}', { zone: 7, name: 'Hive' }), 'Zone 7: Hive');
});
