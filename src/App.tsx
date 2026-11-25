/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CharacterVaultModal } from './components/CharacterVaultModal';
import { CodexModal } from './components/CodexModal';
import { CreditsModal } from './components/CreditsModal';
import { GameHud } from './components/GameHud';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { PauseModal } from './components/PauseModal';
import { RootSkillTreeModal } from './components/RootSkillTreeModal';
import { TitleScreen } from './components/TitleScreen';
import { BioAudioEngine } from './game/audio';
import { createEmptyDna, createEmptySkills, POST_GAME_CHARACTERS, ZONES } from './game/data';
import { BioRootEngine } from './game/engine';
import { formatSeedCode, getDailyChallengeSeed } from './game/rng';
import {
  getMutagenUpgradeCost,
  loadPersistentSave,
  recordLeaderboardEntry,
  sanitizePlayerName,
  unlockCharacter,
  writePersistentSave,
} from './game/rules';
import {
  CharacterId,
  DifficultyId,
  GameState,
  HudSnapshot,
  Lang,
  MutagenUpgrades,
  PersistentSave,
  RunSummary,
  SavedRunSnapshot,
  SkillId,
  VirtualJoystickInput,
} from './game/types';

function createInitialHud(): HudSnapshot {
  return {
    hp: 120,
    maxHp: 120,
    ghostHp: 120,
    energy: 100,
    maxEnergy: 100,
    radius: 22,
    biomass: 100,
    zone: 1,
    difficulty: 'normal',
    characterId: 'specimen_0',
    endlessMode: false,
    dna: createEmptyDna(),
    skills: createEmptySkills(),
    canAffordAnySkill: false,
    nextZoneUnlocked: false,
    nextZoneRequirementText: `zoneGoalGrow:${ZONES[1].requiredRadiusToAdvance}`,
    growthCapped: false,
    evoZoneCapped: false,
    zoneEvoUsed: 0,
    zoneEvoCap: ZONES[1].maxEvoPointsInZone,
    maxRadiusInZone: ZONES[1].maxRadiusInZone,
    boss: null,
    cooldowns: {
      dash: 0,
      dashMax: 2.0,
      skill1: 0,
      skill1Max: 2.2,
      skill2: 0,
      skill2Max: 4.5,
      special: 0,
      specialMax: 0,
    },
    unlockedActives: {
      skill1Name: null,
      skill2Name: null,
      hasCharacterSpecial: false,
    },
    stealthActive: false,
    juggernautActive: false,
    specialActive: false,
    kills: 0,
    elapsedSec: 0,
    minimap: [],
    toast: null,
  };
}

function detectDefaultTouchMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 1024 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BioRootEngine | null>(null);
  const audioRef = useRef<BioAudioEngine | null>(null);

  const [save, setSave] = useState<PersistentSave>(() => loadPersistentSave());
  const saveRef = useRef<PersistentSave>(save);
  saveRef.current = save;

  const [gameState, setGameState] = useState<GameState>('title');
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  const [hud, setHud] = useState<HudSnapshot>(() => createInitialHud());
  const [skillTreeOpen, setSkillTreeOpen] = useState(false);
  const [charactersOpen, setCharactersOpen] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [lastRank, setLastRank] = useState<number | null>(null);
  const [lastEntryId, setLastEntryId] = useState<string | null>(null);
  const [touchMode, setTouchMode] = useState<boolean>(() => detectDefaultTouchMode());
  const [dailyChallenge, setDailyChallenge] = useState(false);
  const dailyChallengeRef = useRef(dailyChallenge);
  dailyChallengeRef.current = dailyChallenge;
  const dailySeed = getDailyChallengeSeed();
  const dailySeedCode = formatSeedCode(dailySeed);

  // Sync document.body.dataset.state & <html lang> cleanly
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Declaratively freeze simulation time whenever ANY upgrade/info modal is open
  useEffect(() => {
    engineRef.current?.setOverlayPaused(
      skillTreeOpen || charactersOpen || codexOpen || creditsOpen || leaderboardOpen
    );
  }, [skillTreeOpen, charactersOpen, codexOpen, creditsOpen, leaderboardOpen]);

  useEffect(() => {
    document.documentElement.lang = save.lang;
    writePersistentSave(save);
    audioRef.current?.setSettings(save.sfxEnabled, save.bgmEnabled);
  }, [save]);

  // Responsive check for mobile virtual joystick visibility on viewport resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) {
        setTouchMode(true);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const persistSaveUpdate = useCallback((updater: (prev: PersistentSave) => PersistentSave) => {
    setSave((prev) => {
      const next = updater(prev);
      writePersistentSave(next);
      return next;
    });
  }, []);

  // Mount Canvas2D Engine ONCE inside isolated sibling container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const audio = new BioAudioEngine();
    audio.setSettings(saveRef.current.sfxEnabled, saveRef.current.bgmEnabled);
    audioRef.current = audio;

    const engine = new BioRootEngine(canvas, audio, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onGameOver: (summary) => {
        const activePlayerName = sanitizePlayerName(saveRef.current.playerName);
        const enrichedSummary: RunSummary = {
          ...summary,
          playerName: activePlayerName,
        };
        const recorded = recordLeaderboardEntry(
          saveRef.current.leaderboard,
          enrichedSummary,
          Date.now(),
          activePlayerName
        );
        setRunSummary(enrichedSummary);
        setLastRank(recorded.rank);
        setLastEntryId(recorded.entryId);
        setSkillTreeOpen(false);
        setGameState('gameover');
        persistSaveUpdate((prev) => ({
          ...prev,
          mutagen: prev.mutagen + summary.mutagenEarned,
          bestBiomass: Math.max(prev.bestBiomass, summary.finalBiomass),
          bestZone: Math.max(prev.bestZone, summary.zoneReached) as PersistentSave['bestZone'],
          totalKills: prev.totalKills + summary.kills,
          hasClearedGame: prev.hasClearedGame || summary.victory,
          leaderboard: recorded.entries,
          savedRun: summary.victory ? prev.savedRun : null,
        }));
      },
      onAutoSave: (snapshot: SavedRunSnapshot | null) => {
        persistSaveUpdate((prev) => ({
          ...prev,
          savedRun: snapshot,
        }));
      },
      onRequestToggleSkillTree: () => {
        setSkillTreeOpen((open) => !open);
      },
      onRequestTogglePause: () => {
        if (gameStateRef.current === 'playing') {
          setSkillTreeOpen(false);
          setGameState('paused');
          engine.setGameState('paused');
        }
      },
    });

    engineRef.current = engine;
    engine.setSelectedCharacter(saveRef.current.selectedCharacter);

    // Support ?autostart=1 to jump directly into active gameplay
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      document.body.dataset.state = 'playing';
      setGameState('playing');
      engine.startNewRun(
        saveRef.current.upgrades,
        false,
        saveRef.current.difficulty,
        saveRef.current.selectedCharacter
      );
    }

    return () => {
      engine.dispose();
      audio.dispose();
      engineRef.current = null;
      audioRef.current = null;
    };
  }, [persistSaveUpdate]);

  // Escape key closes Skill Tree, modals, or resumes Pause modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (charactersOpen) {
          setCharactersOpen(false);
          return;
        }
        if (leaderboardOpen) {
          setLeaderboardOpen(false);
          return;
        }
        if (codexOpen) {
          setCodexOpen(false);
          return;
        }
        if (creditsOpen) {
          setCreditsOpen(false);
          return;
        }
        if (skillTreeOpen) {
          setSkillTreeOpen(false);
          return;
        }
        if (gameState === 'paused') {
          setGameState('playing');
          engineRef.current?.setGameState('playing');
        }
      } else if (e.code === 'KeyT' && skillTreeOpen) {
        e.preventDefault();
        setSkillTreeOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [charactersOpen, codexOpen, creditsOpen, leaderboardOpen, skillTreeOpen, gameState]);

  const handleStartNew = useCallback(() => {
    document.body.dataset.state = 'playing';
    setRunSummary(null);
    setLastRank(null);
    setLastEntryId(null);
    setSkillTreeOpen(false);
    setCharactersOpen(false);
    setCodexOpen(false);
    setCreditsOpen(false);
    setLeaderboardOpen(false);
    setGameState('playing');
    engineRef.current?.setOverlayPaused(false);
    const useDaily = dailyChallengeRef.current;
    engineRef.current?.startNewRun(
      saveRef.current.upgrades,
      true,
      saveRef.current.difficulty,
      saveRef.current.selectedCharacter,
      useDaily ? getDailyChallengeSeed() : undefined,
      useDaily
    );
  }, []);

  const handleContinueSaved = useCallback(() => {
    const savedRun = saveRef.current.savedRun;
    if (!savedRun) {
      handleStartNew();
      return;
    }
    document.body.dataset.state = 'playing';
    setRunSummary(null);
    setSkillTreeOpen(false);
    setCharactersOpen(false);
    setLeaderboardOpen(false);
    setGameState('playing');
    engineRef.current?.setOverlayPaused(false);
    engineRef.current?.continueFromSave(savedRun, saveRef.current.upgrades);
  }, [handleStartNew]);

  const handleContinueEndless = useCallback(() => {
    document.body.dataset.state = 'playing';
    setRunSummary(null);
    setCharactersOpen(false);
    setLeaderboardOpen(false);
    setGameState('playing');
    engineRef.current?.setOverlayPaused(false);
    engineRef.current?.continueEndlessMode();
  }, []);

  const handlePause = useCallback(() => {
    setSkillTreeOpen(false);
    setGameState('paused');
    engineRef.current?.setGameState('paused');
  }, []);

  const handleResume = useCallback(() => {
    setGameState('playing');
    engineRef.current?.setGameState('playing');
  }, []);

  const handleBackToTitle = useCallback(() => {
    setSkillTreeOpen(false);
    setCharactersOpen(false);
    setLeaderboardOpen(false);
    setRunSummary(null);
    setGameState('title');
    engineRef.current?.setOverlayPaused(false);
    engineRef.current?.returnToTitleDemo();
  }, []);

  const handleOpenSkillTree = useCallback(() => {
    if (gameState !== 'playing') return;
    engineRef.current?.setOverlayPaused(true);
    setSkillTreeOpen(true);
  }, [gameState]);

  const handleCloseSkillTree = useCallback(() => {
    setSkillTreeOpen(false);
    engineRef.current?.setOverlayPaused(false);
  }, []);

  const handleUpgradeSkill = useCallback((skillId: SkillId) => {
    engineRef.current?.upgradeSkill(skillId);
  }, []);

  const handleAdvanceZone = useCallback(() => {
    engineRef.current?.advanceToNextZone();
  }, []);

  const handleChangeLang = useCallback(
    (lang: Lang) => {
      persistSaveUpdate((prev) => ({ ...prev, lang }));
    },
    [persistSaveUpdate]
  );

  const handleChangePlayerName = useCallback(
    (rawName: string) => {
      const sanitized = sanitizePlayerName(rawName);
      persistSaveUpdate((prev) => ({ ...prev, playerName: sanitized }));
    },
    [persistSaveUpdate]
  );

  const handleChangeDifficulty = useCallback(
    (difficulty: DifficultyId) => {
      persistSaveUpdate((prev) => ({ ...prev, difficulty }));
    },
    [persistSaveUpdate]
  );

  const handleToggleSfx = useCallback(() => {
    persistSaveUpdate((prev) => ({ ...prev, sfxEnabled: !prev.sfxEnabled }));
  }, [persistSaveUpdate]);

  const handleToggleBgm = useCallback(() => {
    persistSaveUpdate((prev) => ({ ...prev, bgmEnabled: !prev.bgmEnabled }));
  }, [persistSaveUpdate]);

  const handleBuyMutagenUpgrade = useCallback(
    (key: keyof MutagenUpgrades) => {
      persistSaveUpdate((prev) => {
        const lv = prev.upgrades[key];
        const cost = getMutagenUpgradeCost(lv);
        if (lv >= 6 || prev.mutagen < cost) return prev;
        const nextUpgrades = { ...prev.upgrades, [key]: lv + 1 };
        engineRef.current?.setMutagenUpgrades(nextUpgrades);
        return {
          ...prev,
          mutagen: prev.mutagen - cost,
          upgrades: nextUpgrades,
        };
      });
    },
    [persistSaveUpdate]
  );

  const handleJoystickChange = useCallback((input: VirtualJoystickInput) => {
    engineRef.current?.setVirtualJoystick(input);
  }, []);

  const handleDash = useCallback(() => {
    engineRef.current?.triggerDash();
  }, []);

  const handleSkill1 = useCallback(() => {
    engineRef.current?.triggerSkill1();
  }, []);

  const handleSkill2 = useCallback(() => {
    engineRef.current?.triggerSkill2();
  }, []);

  const handleCharacterSpecial = useCallback(() => {
    engineRef.current?.triggerCharacterSpecial();
  }, []);

  const handleSelectCharacter = useCallback(
    (id: CharacterId) => {
      persistSaveUpdate((prev) => {
        if (!prev.unlockedCharacters.includes(id)) return prev;
        engineRef.current?.setSelectedCharacter(id);
        return {
          ...prev,
          selectedCharacter: id,
        };
      });
    },
    [persistSaveUpdate]
  );

  const handleUnlockCharacter = useCallback(
    (id: CharacterId) => {
      persistSaveUpdate((prev) => {
        const next = unlockCharacter(prev, id);
        if (!next) return prev;
        engineRef.current?.setSelectedCharacter(next.selectedCharacter);
        return next;
      });
    },
    [persistSaveUpdate]
  );

  const unlockedPostGameCount = POST_GAME_CHARACTERS.filter((c) =>
    save.unlockedCharacters.includes(c.id)
  ).length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030b12]">
      {/* Isolated Full-Bleed 60 FPS Canvas Container (Never re-mounted on HUD updates) */}
      <div className="absolute inset-0">
        <canvas
          ref={canvasRef}
          data-testid="game-canvas"
          className="block w-full h-full cursor-crosshair"
        />
      </div>

      {/* TITLE SCREEN */}
      {gameState === 'title' && (
        <TitleScreen
          lang={save.lang}
          playerName={save.playerName}
          difficulty={save.difficulty}
          dailyChallenge={dailyChallenge}
          dailySeedCode={dailySeedCode}
          selectedCharacter={save.selectedCharacter}
          unlockedPostGameCount={unlockedPostGameCount}
          hasSavedRun={Boolean(save.savedRun)}
          mutagen={save.mutagen}
          bestBiomass={save.bestBiomass}
          bestZone={save.bestZone}
          onChangeLang={handleChangeLang}
          onChangePlayerName={handleChangePlayerName}
          onChangeDifficulty={handleChangeDifficulty}
          onToggleDailyChallenge={() => setDailyChallenge((v) => !v)}
          onStartNew={handleStartNew}
          onContinue={handleContinueSaved}
          onOpenCharacters={() => setCharactersOpen(true)}
          onOpenCodex={() => setCodexOpen(true)}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
          onOpenCredits={() => setCreditsOpen(true)}
          modalOpen={charactersOpen || codexOpen || creditsOpen || leaderboardOpen}
        />
      )}

      {/* ACTIVE PLAYING HUD */}
      {gameState === 'playing' && (
        <GameHud
          lang={save.lang}
          hud={hud}
          sfxEnabled={save.sfxEnabled}
          bgmEnabled={save.bgmEnabled}
          touchMode={touchMode}
          onToggleTouchMode={() => setTouchMode((v) => !v)}
          onToggleSfx={handleToggleSfx}
          onToggleBgm={handleToggleBgm}
          onOpenSkillTree={handleOpenSkillTree}
          onPause={handlePause}
          onAdvanceZone={handleAdvanceZone}
          onJoystickChange={handleJoystickChange}
          onDash={handleDash}
          onSkill1={handleSkill1}
          onSkill2={handleSkill2}
          onCharacterSpecial={handleCharacterSpecial}
        />
      )}

      {/* INTERACTIVE BIOLOGICAL ROOT SKILL TREE MODAL */}
      {skillTreeOpen && (
        <RootSkillTreeModal
          lang={save.lang}
          difficulty={hud.difficulty}
          zone={hud.zone}
          endlessMode={hud.endlessMode}
          dna={hud.dna}
          skills={hud.skills}
          onUpgrade={handleUpgradeSkill}
          onClose={handleCloseSkillTree}
        />
      )}

      {/* PAUSE MODAL */}
      {gameState === 'paused' && !skillTreeOpen && (
        <PauseModal
          lang={save.lang}
          sfxEnabled={save.sfxEnabled}
          bgmEnabled={save.bgmEnabled}
          onChangeLang={handleChangeLang}
          onToggleSfx={handleToggleSfx}
          onToggleBgm={handleToggleBgm}
          onResume={handleResume}
          onRestart={handleStartNew}
          onBackToTitle={handleBackToTitle}
        />
      )}

      {/* VICTORY / GAME OVER + MUTAGEN LAB MODAL */}
      {gameState === 'gameover' && runSummary && (
        <GameOverModal
          lang={save.lang}
          playerName={save.playerName}
          summary={runSummary}
          newRank={lastRank}
          totalMutagen={save.mutagen}
          upgrades={save.upgrades}
          onBuyUpgrade={handleBuyMutagenUpgrade}
          onOpenCharacters={() => setCharactersOpen(true)}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
          onContinueEndless={handleContinueEndless}
          onPlayAgain={handleStartNew}
          onBackToTitle={handleBackToTitle}
        />
      )}

      {/* POST-GAME CHARACTER VAULT, CODEX, TOP 10 LEADERBOARD & CREDITS MODALS */}
      {charactersOpen && (
        <CharacterVaultModal
          lang={save.lang}
          save={save}
          onSelect={handleSelectCharacter}
          onUnlock={handleUnlockCharacter}
          onClose={() => setCharactersOpen(false)}
        />
      )}
      {codexOpen && <CodexModal lang={save.lang} onClose={() => setCodexOpen(false)} />}
      {leaderboardOpen && (
        <LeaderboardModal
          lang={save.lang}
          entries={save.leaderboard}
          highlightId={lastEntryId}
          onClose={() => setLeaderboardOpen(false)}
        />
      )}
      {creditsOpen && <CreditsModal lang={save.lang} onClose={() => setCreditsOpen(false)} />}
    </div>
  );
}
