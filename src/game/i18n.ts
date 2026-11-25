import { CharacterId, DifficultyId, DnaType, Lang, OrganismKind, SkillBranch, SkillId, ZoneId } from './types';

export interface TranslationPack {
  langLabel: string;
  gameTitle: string;
  gameSubtitle: string;
  storyHook: string;
  storyFull: string;
  difficulties: Record<DifficultyId, { name: string; summary: string }>;
  menu: {
    startNew: string;
    continueRun: string;
    characters: string;
    codex: string;
    leaderboard: string;
    credits: string;
    controlHintDesktop: string;
    controlHintMobile: string;
    mutagenBank: string;
    difficultyLabel: string;
    selectedStrain: string;
    playerNameLabel: string;
    renameBtn: string;
    saveNameBtn: string;
    cancelNameBtn: string;
    playerNamePlaceholder: string;
    dailySeedLabel: string;
    dailySeedOn: string;
    dailySeedOff: string;
  };
  hud: {
    hp: string;
    energy: string;
    biomass: string;
    zone: string;
    endless: string;
    skills: string;
    pause: string;
    dash: string;
    skill1: string;
    skill2: string;
    nextZoneBtn: string;
    zoneGoalGrow: string;
    zoneGoalBoss: string;
    zoneGoalFinal: string;
    bgm: string;
    sfx: string;
    bossWarning: string;
    spit: string;
    nova: string;
    volt: string;
    stealth: string;
    juggernaut: string;
    locked: string;
    touchControls: string;
    kills: string;
    time: string;
    growthCappedBanner: string;
  };
  dna: Record<DnaType, string>;
  zones: Record<ZoneId, { name: string; desc: string }>;
  organisms: Record<OrganismKind, { name: string; role: string; desc: string }>;
  branches: Record<SkillBranch, { name: string; subtitle: string }>;
  skills: Record<SkillId, { name: string; organ: string; desc: string; effect: string }>;
  skillTree: {
    title: string;
    nucleus: string;
    close: string;
    evolve: string;
    maxed: string;
    requires: string;
    cost: string;
    level: string;
    organPreview: string;
    selectHint: string;
    evoCapLabel: string;
    zoneEvoCapLabel: string;
    branchLimitLabel: string;
    branchSealedBadge: string;
    evoCapReached: string;
    zoneEvoCapReached: string;
    branchSealedReason: string;
    constraintHint: string;
    timePausedBadge: string;
    endlessSandboxBadge: string;
  };
  pause: {
    title: string;
    resume: string;
    restart: string;
    language: string;
    audio: string;
    backToTitle: string;
    saveNotice: string;
  };
  gameover: {
    defeatTitle: string;
    victoryTitle: string;
    defeatDesc: string;
    victoryDesc: string;
    zoneReached: string;
    finalBiomass: string;
    absorbed: string;
    timeSurvived: string;
    mutagenEarned: string;
    mutagenTotal: string;
    labTitle: string;
    labVitality: string;
    labVitalityDesc: string;
    labMetabolism: string;
    labMetabolismDesc: string;
    labMagnet: string;
    labMagnetDesc: string;
    labMobility: string;
    labMobilityDesc: string;
    upgradeBtn: string;
    continueEndless: string;
    playAgain: string;
    backToTitle: string;
    runScore: string;
    newRankBadge: string;
    viewLeaderboard: string;
    characterVault: string;
    postGameUnlockedNotice: string;
    playerLabel: string;
  };
  characters: Record<
    CharacterId,
    {
      name: string;
      archetype: string;
      passive: string;
      specialName: string;
      specialDesc: string;
    }
  >;
  characterVault: {
    title: string;
    subtitle: string;
    mutagenBalance: string;
    unlockedCount: string;
    postGameLockedBanner: string;
    postGameReadyBanner: string;
    tabAll: string;
    tabLegendary: string;
    tabMonsters: string;
    starterBadge: string;
    legendaryBadge: string;
    monsterBadge: string;
    selectedBadge: string;
    selectBtn: string;
    unlockBtn: string;
    needClearBtn: string;
    needMutagenBtn: string;
    passiveLabel: string;
    specialLabel: string;
    cooldownLabel: string;
    close: string;
  };
  leaderboard: {
    title: string;
    subtitle: string;
    empty: string;
    rankCol: string;
    playerCol: string;
    scoreCol: string;
    resultCol: string;
    zoneCol: string;
    biomassCol: string;
    killsCol: string;
    timeCol: string;
    victoryTag: string;
    defeatTag: string;
    close: string;
  };
  codex: {
    title: string;
    tabOrganisms: string;
    tabSkills: string;
    tabStory: string;
    catFood: string;
    catEnemy: string;
    catBoss: string;
    dnaDrop: string;
    none: string;
    howToPlayTitle: string;
    howToPlayBullets: string[];
    zonesHeading: string;
    close: string;
  };
  credits: {
    title: string;
    devRole: string;
    devName: string;
    artRole: string;
    artDesc: string;
    audioRole: string;
    audioDesc: string;
    techRole: string;
    techDesc: string;
    licenseNote: string;
    close: string;
  };
  toasts: {
    skillReady: string;
    evolved: string;
    zoneUnlocked: string;
    enteredZone: string;
    bossSpawned: string;
    bossDefeated: string;
    leechAttached: string;
    tooLarge: string;
    growthCapped: string;
    evoZoneCapped: string;
  };
}

export const TRANSLATIONS: Record<Lang, TranslationPack> = {
  th: {
    langLabel: 'ไทย',
    gameTitle: 'BIO-ROOT: CELL EVOLUTION',
    gameSubtitle: 'วิวัฒนาการรากเซลล์ชีวภาพ',
    storyHook: 'Specimen-0 เซลล์ทดลองชีวเรืองแสงหลุดออกจากห้องแล็บ จงเลือกสายวิวัฒนาการอย่างมีกลยุทธ์และฝ่า 10 โซนชีวภาพ',
    storyFull: 'ในปี 2094 ห้องปฏิบัติการชีวภาพใต้ทะเลลึกเกิดรอยรั่ว ทำให้เซลล์ต้นแบบ "Specimen-0" หลุดออกสู่จานเพาะเชื้อปลอดเชื้อ ด้วยรหัสพันธุกรรมแบบรากไม้ 5 สายที่ปรับตัวได้แต่มีขีดจำกัดความจุจีโนมต่อรอบ จงวางแผนผสมรากสกิลอย่างมีกลยุทธ์ ฝ่าทั้ง 10 โซนตั้งแต่จานเพาะเชื้อ บึงกรด ถังไครโอ ปล่องภูเขาไฟใต้ทะเล จนถึงเตาปฏิกรณ์เพื่อโค่น Omega Core',
    difficulties: {
      novice: { name: 'มือใหม่', summary: 'ศัตรูเบาลง · โควตาวิวัฒนาการ 24 แต้ม (สูงสุด 4 จาก 5 สาย) · Mutagen x0.85' },
      normal: { name: 'โหมดปกติ', summary: 'สมดุลมาตรฐาน · โควตาวิวัฒนาการ 21 แต้ม (สูงสุด 3 จาก 5 สาย) · Mutagen x1.0' },
      hell: { name: 'โหมดนรก', summary: 'ศัตรูโหดมาก · โควตาวิวัฒนาการ 18 แต้ม (ล็อก 2 จาก 5 สาย) · Mutagen x1.75' },
    },
    menu: {
      startNew: 'เริ่มเกมใหม่',
      continueRun: 'เล่นต่อจากเซฟ',
      characters: 'คลังตัวละคร & มอนสเตอร์',
      codex: 'คู่มือมอนสเตอร์ & สกิล',
      leaderboard: 'สถิติ 10 อันดับ',
      credits: 'เครดิตผู้พัฒนา',
      controlHintDesktop: 'WASD/เมาส์ เคลื่อนที่ · Space พุ่ง · Q สกิล 1 · E สกิล 2 · R สกิลพิเศษ · T รากสกิล · Esc หยุดเกม',
      controlHintMobile: 'จอยซ้าย เคลื่อนที่ · ปุ่มขวา พุ่งและใช้สกิลพิเศษ · แตะไอคอนรากไม้เพื่อวิวัฒนาการ',
      mutagenBank: 'แต้ม Mutagen สะสม',
      difficultyLabel: 'ระดับความยาก',
      selectedStrain: 'สายพันธุ์ที่เลือก',
      playerNameLabel: 'ชื่อผู้เล่น',
      renameBtn: 'เปลี่ยนชื่อ',
      saveNameBtn: 'บันทึก',
      cancelNameBtn: 'ยกเลิก',
      playerNamePlaceholder: 'ตั้งชื่อผู้เล่น (สูงสุด 20 ตัวอักษร)',
      dailySeedLabel: 'ด่านประจำวัน',
      dailySeedOn: 'เปิด',
      dailySeedOff: 'ปิด',
    },
    hud: {
      hp: 'พลังชีวิต',
      energy: 'พลังงาน',
      biomass: 'มวลชีวภาพ',
      zone: 'โซน',
      endless: 'โหมดไร้สิ้นสุด',
      skills: 'รากสกิล',
      pause: 'หยุด',
      dash: 'พุ่ง',
      skill1: 'สกิล 1',
      skill2: 'สกิล 2',
      nextZoneBtn: 'เข้าสู่โซนถัดไป',
      zoneGoalGrow: 'เติบโตถึงขนาด {target} เพื่อเปิดทางเชื่อม',
      zoneGoalBoss: 'โค่นบอสประจำโซนเพื่อเปิดประตู',
      zoneGoalFinal: 'โค่น Omega Core ในโซน 10 เพื่อชนะเกม',
      bgm: 'เพลง',
      sfx: 'เอฟเฟกต์',
      bossWarning: 'ตรวจพบสิ่งมีชีวิตรูปแบบบอส',
      spit: 'กรดพิษ',
      nova: 'พลาสมาโนวา',
      volt: 'ช็อตไฟฟ้า',
      stealth: 'พรางตัว',
      juggernaut: 'พุ่งชนอมตะ',
      locked: 'ล็อก',
      touchControls: 'ปุ่มสัมผัส',
      kills: 'ดูดกลืน',
      time: 'เวลา',
      growthCappedBanner: 'หยุดเติบโตในโซนนี้แล้ว! ย้ายโซนเพื่อวิวัฒนาการต่อ',
    },
    dna: {
      speed: 'Speed DNA',
      spike: 'Spike DNA',
      acid: 'Acid DNA',
      armor: 'Armor DNA',
      electric: 'Electric DNA',
      vampire: 'Vampire DNA',
      stealth: 'Stealth DNA',
      boss: 'Boss DNA',
    },
    zones: {
      1: { name: 'จานเพาะเชื้อปลอดเชื้อ', desc: 'Sterile Petri Dish — น้ำใสสว่าง เหมาะแก่การเติบโตและเก็บ DNA พื้นฐาน' },
      2: { name: 'บึงชีวภาพพิษกรด', desc: 'Toxic Bio-Swamp — เต็มไปด้วยบ่อกรดกัดกร่อนและบอส Colony Hydra' },
      3: { name: 'ท่อระบายก้นสมุทร', desc: 'Abyssal Drain — มืดมิด มีเพียงแสงเรืองรองรอบเซลล์และบอส Iron Leviathan' },
      4: { name: 'ถังแช่แข็งไครโอ', desc: 'Cryo Preservation Vat — บ่อน้ำแข็งเย็นจัดที่ลดความเร็วการว่ายและเต็มไปด้วยนักล่าพรางตัว' },
      5: { name: 'ปล่องน้ำร้อนใต้ทะเล', desc: 'Thermal Hydro-Vent — กระแสน้ำร้อนเดือดพล่านและบอส Thermo-Kraken' },
      6: { name: 'ท่อประจุไฟฟ้าชีวภาพ', desc: 'Bio-Electric Conduit — โหนดไฟฟ้าแรงสูงที่ปล่อยคลื่นช็อตเป็นจังหวะและฝูง Volt Jelly' },
      7: { name: 'รังปรสิตชีวภาพ', desc: 'Parasitic Hive Matrix — รังปรสิตสีม่วงแดงที่เต็มไปด้วยปลิงดูดเลือดและบอส Parasite Matriarch' },
      8: { name: 'ร่องกัมมันตรังสีกลายพันธุ์', desc: 'Mutagenic Fallout Trench — มืดมิดและเต็มไปด้วยบ่อกรดกัมมันตรังสีอันตราย' },
      9: { name: 'เครื่องเหวี่ยงแรงโน้มถ่วง', desc: 'Singularity Centrifuge — กระแสน้ำวนเชี่ยวกรากผสานสนามไฟฟ้าแรงสูง' },
      10: { name: 'เตาปฏิกรณ์แกนชีวภาพ', desc: 'Bio-Core Reactor — ด่านสุดท้ายเต็มไปด้วยน้ำวน กรด และบอสใหญ่ Omega Core' },
    },
    organisms: {
      glucose_orb: { name: 'ก้อนกลูโคส (Glucose Orb)', role: 'อาหาร', desc: 'สารอาหารเรืองแสงสีเขียวมิ้นต์ เพิ่มมวลชีวภาพและฟื้นฟู HP ทันที' },
      atp_spark: { name: 'ประกาย ATP (ATP Spark)', role: 'อาหารพลังงาน', desc: 'อนุภาคพลังงานสีทองที่เคลื่อนไหวว่องไว เติมแถบ Energy อย่างรวดเร็ว' },
      flagella_dart: { name: 'แฟลเจลลาดาร์ท (Flagella Dart)', role: 'ศัตรูว่องไว', desc: 'ว่ายเร็วมากและมักว่ายหนีเมื่อเข้าใกล้ ดรอป Speed DNA' },
      spike_urchin: { name: 'เม่นหนามเซลล์ (Spike Urchin)', role: 'ศัตรูสะท้อนดาเมจ', desc: 'รอบตัวมีหนามแหลม สะท้อนดาเมจเมื่อชนตรง ๆ ดรอป Spike DNA' },
      acid_amoeba: { name: 'อะมีบากรด (Acid Amoeba)', role: 'ศัตรูพิษกรด', desc: 'ทิ้งทางเมือกกรดไว้ด้านหลังซึ่งสร้างความเสียหายต่อเนื่อง ดรอป Acid DNA' },
      shell_diatom: { name: 'ไดอะตอมเกราะแข็ง (Shell Diatom)', role: 'ศัตรูเกราะหนา', desc: 'เคลื่อนที่ช้าแต่มีเกราะซิลิกาหกเหลี่ยมลดดาเมจ ดรอป Armor DNA' },
      volt_jelly: { name: 'แมงกะพรุนโวลต์ (Volt Jelly)', role: 'ศัตรูไฟฟ้า', desc: 'ชาร์จและปล่อยวงคลื่นไฟฟ้าเป็นจังหวะรอบตัว ดรอป Electric DNA' },
      leech_parasite: { name: 'ปรสิตปลิงดูดเลือด (Leech Parasite)', role: 'ศัตรูเกาะดูดเลือด', desc: 'พุ่งเกาะติดผู้เล่นเพื่อดูด HP ต้องพุ่ง Dash สะบัดออก ดรอป Vampire DNA' },
      camo_ghost: { name: 'วิญญาณพรางตัว (Camo Ghost)', role: 'ศัตรูลอบโจมตี', desc: 'พรางตัวโปร่งแสงแล้วซุ่มพุ่งกัดอย่างรุนแรง ดรอป Stealth DNA' },
      colony_hydra: { name: 'โคโลนีไฮดรา (Colony Hydra)', role: 'บอสโซน 2', desc: 'สิ่งมีชีวิตรวมกลุ่มที่แตกหน่อเรียกลูกสมุนและยิงสปอร์พิษ ดรอป Boss DNA' },
      iron_leviathan: { name: 'ไอรอนเลวีอาธาน (Iron Leviathan)', role: 'บอสโซน 3', desc: 'สัตว์ประหลาดเกราะเหล็กหนา เล็งเส้นแดงแล้วพุ่งชนรุนแรง ดรอป Boss DNA' },
      thermo_kraken: { name: 'เทอร์โมคราเคน (Thermo-Kraken)', role: 'บอสโซน 5', desc: 'อสูรหนวดลาวาแห่งปล่องน้ำร้อน ปล่อยคลื่นระเบิดเพลิงและเกลียวไฟรอบทิศ ดรอป Boss DNA' },
      parasite_matriarch: { name: 'ราชินีปรสิต (Parasite Matriarch)', role: 'บอสโซน 7', desc: 'แม่รังปรสิตสีชาด ปล่อยฝูงปลิงดูดเลือดและเส้นสูบชีพฟื้นฟูพลังชีวิตตน ดรอป Boss DNA' },
      omega_core: { name: 'โอเมกาคอร์ (Omega Core)', role: 'บอสใหญ่โซน 10', desc: 'แกนชีวภาพสูงสุด ปล่อยทั้งพายุกรด คลื่นสายฟ้า และแรงดูดน้ำวน ดรอป Boss DNA' },
    },
    branches: {
      predator: { name: 'รากนักล่า', subtitle: 'ความเร็ว · หนาม · ลอบโจมตี' },
      biochem: { name: 'รากชีวเคมี', subtitle: 'กรด · ไฟฟ้า · พลาสมา' },
      immortal: { name: 'รากอมตะ', subtitle: 'เกราะ · ดูดเลือด · บอส' },
      elemental: { name: 'รากธาตุสุดขั้ว', subtitle: 'เยือกแข็ง · ความร้อน · เหมันต์อัคคี' },
      symbiont: { name: 'รากซิมไบออนต์', subtitle: 'แรงโน้มถ่วง · เร่งยีน · ซิงกูลาริตี' },
    },
    skills: {
      jet_flagella: { name: 'หางแส้เจ็ต (Jet Flagella)', organ: 'งอกหางแส้พริ้วไหวด้านหลัง', desc: 'เพิ่มความเร็วการเคลื่อนที่และพลังพุ่ง Dash พร้อมลดคูลดาวน์', effect: '+18% ความเร็ว & Dash ไกลขึ้นต่อเลเวล' },
      chitin_spikes: { name: 'หนามไคติน (Chitin Spikes)', organ: 'งอกหนามแหลมและเขี้ยวหน้า', desc: 'ชนศัตรูแรงขึ้นและสะท้อนดาเมจกลับเมื่อถูกโจมตีระยะประชิด', effect: '+35% ดาเมจชน & สะท้อนดาเมจ 25% ต่อเลเวล' },
      phantom_ambush: { name: 'ลอบโจมตีเงา (Phantom Ambush)', organ: 'ตัวโปร่งแสงพร้อมออร่าม่วง', desc: 'กดสกิล 2 เพื่อพรางตัวหลบศัตรู การโจมตีครั้งแรกติดคริติคอล 2.4x', effect: 'พรางตัว 3.5 วิ & คริติคอลรุนแรง' },
      corrosive_spit: { name: 'พ่นกรดกัดกร่อน (Corrosive Spit)', organ: 'เกิดถุงกรดเรืองแสงสีเขียวในตัว', desc: 'กดสกิล 1 ยิงก้อนกรดที่แตกเป็นบ่อเมือกพิษละลายเกราะศัตรู', effect: 'ยิงก้อนกรด + บ่อพิษต่อเนื่อง' },
      bio_volt_pulse: { name: 'คลื่นไฟฟ้าชีวภาพ (Bio-Volt Pulse)', organ: 'เส้นสายฟ้าวิ่งรอบเยื่อหุ้มเซลล์', desc: 'ปล่อยคลื่นช็อตไฟฟ้ารอบตัวอัตโนมัติและกดสกิล 2 เพื่อช็อตแรงขึ้น', effect: 'ช็อตสายฟ้าแตกแขนงรอบทิศ' },
      plasmic_nova: { name: 'พลาสมาโนวาผสม (Plasmic Nova)', organ: 'แกนปฏิกรณ์กรด-สายฟ้าเรืองแสง', desc: 'สกิลผสมขั้นสูง อัปเกรดสกิล 1 เป็นคลื่นระเบิดกรดและสายฟ้าขนาดใหญ่', effect: 'คลื่นกรด+สายฟ้าทะลุเกราะและสตั๊น' },
      hexa_carapace: { name: 'เกราะหกเหลี่ยม (Hexa-Carapace)', organ: 'แผ่นเกราะหกเหลี่ยมสีทองหุ้มลำตัว', desc: 'ลดความเสียหายที่ได้รับทั้งหมดและเพิ่มพลังชีวิตสูงสุด', effect: 'ลดดาเมจ 12% & +30 Max HP ต่อเลเวล (เพดานเกราะ 55%)' },
      siphon_tentacles: { name: 'หนวดดูดกลืน (Siphon Tentacles)', organ: 'หนวดเส้นเล็กขยับได้รอบลำตัว', desc: 'ดึงดูดอาหารและก้อน DNA จากระยะไกล พร้อมดูดเลือดศัตรูใกล้ตัว', effect: 'ดูด DNA ไกลขึ้น & ดูดเลือด HP อัตโนมัติ' },
      mitosis_minions: { name: 'ลูกสมุนไมโทซิส (Mitosis Minions)', organ: 'เซลล์ลูกน้องเรืองแสงโคจรรอบตัว', desc: 'แบ่งตัวสร้างเซลล์บริวารช่วยไล่โจมตีศัตรูและกันกระสุน', effect: 'เรียกลูกน้องสูงสุด 2/4/6 ตัวช่วยสู้' },
      juggernaut_charge: { name: 'พุ่งชนอมตะ (Juggernaut Charge)', organ: 'เกราะหนามทองคำหน้าพุ่งชน', desc: 'กดสกิล 2 เข้าสู่สถานะอมตะและพุ่งกระแทกศัตรูทุกตัวจนกระเด็น', effect: 'อมตะ 2.5 วิ + ชนศัตรูเสียหายมหาศาล' },
      cryo_membrane: { name: 'เยื่อผลึกไครโอ (Cryo Membrane)', organ: 'ผลึกน้ำแข็งหกแฉกเรืองแสงรอบตัว', desc: 'แผ่ไอเย็นชะลอความเร็วศัตรูรอบข้างและลดความเสียหายจากโซนน้ำแข็ง', effect: 'ชะลอศัตรูรอบตัว & ต้านทานโซนไครโอ' },
      thermal_vent_core: { name: 'แกนภูเขาไฟร้อน (Thermal Core)', organ: 'รอยแยกเพลิงลาวาเรืองแสงในนิวเคลียส', desc: 'เร่งอุณหภูมิภายในเพิ่มพลังโจมตีทุกชนิดและต้านทานปล่องความร้อน', effect: '+14% ดาเมจทุกชนิดต่อเลเวล & ต้านทานความร้อน' },
      frostfire_pulse: { name: 'คลื่นเหมันต์อัคคี (Frostfire Pulse)', organ: 'วงแหวนเพลิงผสานน้ำแข็งหมุนวน', desc: 'ทุกครั้งที่พุ่งหรือใช้สกิล จะปล่อยคลื่นเหมันต์อัคคีเผาและแช่แข็งศัตรูใกล้เคียง', effect: 'ระเบิดคลื่นเหมันต์อัคคีทุกครั้งที่ใช้สกิล' },
      gravity_cilia: { name: 'ขนเซลล์แรงโน้มถ่วง (Gravity Cilia)', organ: 'วงแหวนแรงโน้มถ่วงสีม่วงรอบเยื่อหุ้ม', desc: 'เพิ่มระยะดูดอาหารและก้อน DNA มหาศาล พร้อมลดแรงดึงของกระแสน้ำวน', effect: '+48px ระยะดูดต่อเลเวล & ต้านทานน้ำวน' },
      genome_catalyst: { name: 'ตัวเร่งจีโนม (Genome Catalyst)', organ: 'เกลียวคู่ DNA สีเขียวมรกตหมุนรอบแกน', desc: 'เร่งการฟื้นพลังงาน เพิ่มเลือดจากอาหาร และเพิ่มโอกาสได้ก้อน DNA พิเศษ', effect: '+15% ฟื้น Energy, +22% ฮีลอาหาร & +16% โบนัส DNA' },
      singularity_bloom: { name: 'บุปผาซิงกูลาริตี (Singularity Bloom)', organ: 'วงแหวนหลุมดำจุลภาคโคจรรอบตัว', desc: 'ปล่อยคลื่นแรงโน้มถ่วงดึงศัตรูและอาหารเข้าศูนย์กลางเป็นจังหวะ พร้อมตีบอสแรงขึ้น', effect: 'ดูดศัตรู+ระเบิดแรงโน้มถ่วง & +15% ดาเมจบอสต่อเลเวล' },
    },
    skillTree: {
      title: 'แผนภูมิรากไม้วิวัฒนาการ (5 รากแก้ว)',
      nucleus: 'แกนนิวเคลียส Specimen-0',
      close: 'กลับสู่การเล่น',
      evolve: 'วิวัฒนาการ',
      maxed: 'วิวัฒนาการสูงสุดแล้ว',
      requires: 'ต้องปลดล็อกก่อน',
      cost: 'ต้องใช้ DNA',
      level: 'ระดับ',
      organPreview: 'อวัยวะที่จะงอก',
      selectHint: 'เลือกผสมรากแก้วจาก 5 สายหลักตามโควตาความยาก เพื่อสร้างสไตล์การเล่นเฉพาะตัว',
      evoCapLabel: 'โควตาจีโนมรอบนี้',
      zoneEvoCapLabel: 'ลิมิตโซนนี้',
      branchLimitLabel: 'สายรากที่เลือก',
      branchSealedBadge: 'ปิดผนึกรอบนี้',
      evoCapReached: 'เต็มขีดจำกัดจีโนมแล้ว (เริ่มรอบใหม่เพื่อเปลี่ยนสาย)',
      zoneEvoCapReached: 'ถึงขีดจำกัดวิวัฒนาการของโซนนี้แล้ว! รีบย้ายไปโซนถัดไปเพื่ออัปเกรดต่อ',
      branchSealedReason: 'รากสายนี้ถูกปิดผนึกเพราะคุณเลือกครบจำนวนสายหลักสูงสุดของความยากนี้แล้ว',
      constraintHint: 'แต่ละโซนมีขีดจำกัดการเติบโตและโควตาวิวัฒนาการ รีบย้ายโซนเพื่อปลดล็อกขั้นถัดไป (หลังจบโซน 10 ปลดล็อกครบ 5 สาย!)',
      timePausedBadge: 'หยุดเวลาแล้ว',
      endlessSandboxBadge: 'โหมดทดลองอิสระ (ปลดล็อกเต็ม 5 สาย 48/48)',
    },
    pause: {
      title: 'หยุดเกมชั่วคราว',
      resume: 'เล่นต่อ',
      restart: 'เริ่มรอบใหม่',
      language: 'ภาษา (Language)',
      audio: 'ระบบเสียง',
      backToTitle: 'กลับหน้าหลัก',
      saveNotice: 'บันทึกความคืบหน้าอัตโนมัติในเครื่องแล้ว',
    },
    gameover: {
      defeatTitle: 'เซลล์สลายตัว',
      victoryTitle: 'วิวัฒนาการสมบูรณ์!',
      defeatDesc: 'Specimen-0 พ่ายแพ้ต่อสภาพแวดล้อม แต่ข้อมูลพันธุกรรมถูกแปลงเป็น Mutagen ถาวรแล้ว ลองจัดสายวิวัฒนาการใหม่ในรอบถัดไป!',
      victoryDesc: 'คุณฝ่าครบทั้ง 10 โซนและโค่น Omega Core ได้สำเร็จ! เข้าสู่โหมด Endless เพื่อทดลองอัปเกรดรากสกิลทุกสายได้เต็มพิกัด',
      zoneReached: 'โซนที่ไปถึง',
      finalBiomass: 'มวลชีวภาพสุดท้าย',
      absorbed: 'ศัตรูที่ดูดกลืน',
      timeSurvived: 'เวลารอดชีวิต',
      mutagenEarned: 'Mutagen ที่ได้รับรอบนี้',
      mutagenTotal: 'Mutagen สะสมทั้งหมด',
      labTitle: 'ห้องแล็บอัปเกรดถาวร (Mutagen)',
      labVitality: 'เยื่อหุ้มเซลล์แกร่ง',
      labVitalityDesc: '+20 Max HP เริ่มต้นต่อเลเวล',
      labMetabolism: 'เมแทบอลิซึมเร่งด่วน',
      labMetabolismDesc: '+15% อัตราฟื้นฟู Energy ต่อเลเวล',
      labMagnet: 'แรงดึงดูดพันธุกรรม',
      labMagnetDesc: '+20% ระยะดูดอาหารและโบนัส DNA',
      labMobility: 'เยื่อขับเคลื่อนความเร็วสูง',
      labMobilityDesc: '+8% ความเร็วเคลื่อนที่และลดคูลดาวน์พุ่งต่อเลเวล',
      upgradeBtn: 'อัปเกรด',
      continueEndless: 'โหมด Endless (อัปเต็มทุกสาย)',
      playAgain: 'เริ่มรอบใหม่',
      backToTitle: 'หน้าหลัก',
      runScore: 'คะแนนรวมรอบนี้',
      newRankBadge: 'ติดอันดับ Top 10 ใหม่! อันดับ #{rank}',
      viewLeaderboard: 'ดูสถิติ 10 อันดับ',
      characterVault: 'คลังตัวละคร & มอนสเตอร์ (22)',
      postGameUnlockedNotice: 'ปลดล็อกสิทธิ์ซื้อ 10 สายพันธุ์ตำนาน + 12 มอนสเตอร์และบอสทั้งหมดในคลังตัวละครแล้ว!',
      playerLabel: 'ผู้เล่น',
    },
    characters: {
      specimen_0: {
        name: 'Specimen-0',
        archetype: 'เซลล์ต้นแบบมาตรฐาน',
        passive: 'ค่าสถานะสมดุลทุกด้าน เหมาะสำหรับเริ่มต้นและฝึกฝ่า 10 โซน',
        specialName: 'ไม่มีสกิลประจำตัว',
        specialDesc: 'ใช้สกิลจากการวิวัฒนาการรากไม้ตามปกติ',
      },
      pyro_phage: {
        name: 'Pyro-Phage',
        archetype: 'เพลิงสุริยะคลั่ง',
        passive: 'พลังโจมตี +15%, เลือด +15 และต้านทานปล่องความร้อน (Thermal Vents)',
        specialName: 'ปะทุสุริยะ',
        specialDesc: 'ระเบิดคลื่นเพลิงผลักศัตรูรอบตัวพร้อมยิงลูกไฟ 8 ทิศทางเผาผลาญรุนแรง',
      },
      cryo_diatom: {
        name: 'Cryo-Diatom',
        archetype: 'ผลึกเยือกแข็ง',
        passive: 'เลือด +30, เกราะ +8% และไม่ติดสถานะหนืดจากโซนน้ำแข็ง',
        specialName: 'แช่แข็งสัมบูรณ์',
        specialDesc: 'ปล่อยคลื่นน้ำแข็งสร้างความเสียหายและแช่แข็งศัตรูรอบตัวนาน 3.2 วินาที',
      },
      chrono_cilia: {
        name: 'Chrono-Cilia',
        archetype: 'ผู้ควบคุมกาลเวลา',
        passive: 'ความเร็ว +12%, ฟื้นพลังงาน +25% และลดคูลดาวน์พุ่ง 10%',
        specialName: 'ชะลอเวลา',
        specialDesc: 'กางเขตมิติเวลา 4.5 วินาที ลดความเร็วศัตรูและกระสุนลง 70% พร้อมเร่งความเร็วตน',
      },
      void_amoeba: {
        name: 'Void-Amoeba',
        archetype: 'หลุมดำชีวภาพ',
        passive: 'ระยะดูดอาหาร/DNA +50px, โอกาสได้ DNA เพิ่ม 10% และไม่โดนแรงดูดน้ำวน',
        specialName: 'หลุมดำจุลภาค',
        specialDesc: 'ดึงศัตรู อาหาร และก้อน DNA รอบข้างเข้าจุดศูนย์กลางแล้วระเบิดแรงโน้มถ่วง',
      },
      tesla_medusa: {
        name: 'Tesla-Medusa',
        archetype: 'พายุไฟฟ้าแรงสูง',
        passive: 'พลังโจมตี +25%, ฟื้นพลังงาน +18% และต้านทานเสาไฟฟ้าช็อต',
        specialName: 'พายุสายฟ้าคลั่ง',
        specialDesc: 'ฟาดสายฟ้าคริติคอลต่อเนื่องใส่ศัตรูสูงสุด 8 ตัวพร้อมกันในระยะกว้าง',
      },
      venom_hydra: {
        name: 'Venom-Hydra',
        archetype: 'ราชินีกรดพิษ',
        passive: 'เลือด +35, โจมตี +20%, ต้านทานบ่อกรด 100% และฟื้นเลือดเมื่อฆ่า',
        specialName: 'บุปผาพิษระบาด',
        specialDesc: 'สร้างบ่อกรดขนาดใหญ่ 4 จุดรอบตัวพร้อมสาดกระสุนพิษ 6 นัดรวด',
      },
      aegis_titan: {
        name: 'Aegis-Titan',
        archetype: 'ปราการทองคำไร้พ่าย',
        passive: 'เลือดสูงสุด +65, ลดดาเมจติดตัว 16% และฟื้นเลือด 4% เมื่อสังหาร',
        specialName: 'ป้อมปราการอมตะ',
        specialDesc: 'เปิดเกราะอมตะ 4 วินาที ฟื้นเลือด 25% ผลักศัตรูและสะท้อนดาเมจกลับอย่างรุนแรง',
      },
      crimson_vamp: {
        name: 'Crimson-Vamp',
        archetype: 'แวมไพร์สูบโลหิต',
        passive: 'ความเร็ว +10%, โจมตี +18% และฟื้นเลือด 8% + พลังงานทุกครั้งที่ฆ่า',
        specialName: 'พิธีสูบโลหิต',
        specialDesc: 'ยิงเส้นโลหิตดูดพลังศัตรูทั้งหมดในระยะกว้าง ฟื้นฟูเลือด 65% ของดาเมจที่ทำได้',
      },
      prism_phantom: {
        name: 'Prism-Phantom',
        archetype: 'เงาพริซึมข้ามมิติ',
        passive: 'ความเร็ว +18%, โจมตี +22%, ลดคูลดาวน์พุ่ง 20% และโอกาส DNA +15%',
        specialName: 'วาร์ปมิติพริซึม',
        specialDesc: 'วาร์ปพุ่งไปข้างหน้า 280px ทันที พร้อมระเบิดคลื่นพริซึมคริติคอลทั้งจุดเริ่มและจุดลง',
      },
      omega_prime: {
        name: 'Omega-Prime',
        archetype: 'จักรพรรดิแกนโอเมก้า',
        passive: 'เลือด +50, เร็ว +15%, โจมตี +28%, เกราะ +12% และโอกาส DNA +25%',
        specialName: 'ลำแสงโอเมก้าทำลายล้าง',
        specialDesc: 'ปล่อยมหาคลื่นโอเมก้าพร้อมลำแสง 10 ทิศทางและสถานะอมตะเร่งพลัง 2.5 วินาที',
      },
      mob_flagella_dart: {
        name: 'Flagella Dart (มอนสเตอร์)',
        archetype: 'มอนสเตอร์นักพุ่งความเร็วสูง',
        passive: 'ความเร็ว +20%, ฟื้นพลังงาน +18% และลดคูลดาวน์พุ่ง Dash ลง 22%',
        specialName: 'พุ่งแส้เหนือเสียง',
        specialDesc: 'พุ่งทะลวงอย่างรวดเร็วเฉือนศัตรูรอบทางและเร่งความเร็วสุดขีดนาน 2.6 วินาที',
      },
      mob_spike_urchin: {
        name: 'Spike Urchin (มอนสเตอร์)',
        archetype: 'มอนสเตอร์เม่นหนามสะท้อน',
        passive: 'เลือด +25, เกราะ +10%, โจมตี +16% และฟื้นเลือดเล็กน้อยเมื่อสังหาร',
        specialName: 'พายุหนามรอบทิศ',
        specialDesc: 'ยิงหนามแหลมเจาะเกราะ 12 ดอกรอบตัว 360 องศาสร้างความเสียหายหนัก',
      },
      mob_acid_amoeba: {
        name: 'Acid Amoeba (มอนสเตอร์)',
        archetype: 'มอนสเตอร์เมือกกรดกัดกร่อน',
        passive: 'เลือด +25, โจมตี +12%, ต้านทานบ่อกรด 100% และฟื้นเลือดเมื่อสังหาร',
        specialName: 'บึงกรดหลอมละลาย',
        specialDesc: 'ระเบิดบึงกรดขนาดยักษ์ใต้ตัวนาน 6 วินาทีพร้อมฟื้นฟูพลังชีวิตทันที 14%',
      },
      mob_shell_diatom: {
        name: 'Shell Diatom (มอนสเตอร์)',
        archetype: 'มอนสเตอร์ปราการซิลิกา',
        passive: 'เลือดสูงสุด +55 และเกราะซิลิกาลดความเสียหายติดตัวถึง 18%',
        specialName: 'โดมซิลิกาอมตะ',
        specialDesc: 'กางเกราะซิลิกาอมตะนาน 3 วินาทีพร้อมกระแทกคลื่นผลักศัตรูรอบตัวกระเด็น',
      },
      mob_volt_jelly: {
        name: 'Volt Jelly (มอนสเตอร์)',
        archetype: 'มอนสเตอร์แมงกะพรุนสายฟ้า',
        passive: 'โจมตี +18%, ฟื้นพลังงาน +22%, เร็ว +7% และต้านทานเสาไฟฟ้าช็อต',
        specialName: 'สายฟ้าแมงกะพรุน',
        specialDesc: 'ปล่อยสายฟ้าแรงสูงช็อตคริติคอลใส่ศัตรูสูงสุด 6 ตัวพร้อมกันในระยะกว้าง',
      },
      mob_leech_parasite: {
        name: 'Leech Parasite (มอนสเตอร์)',
        archetype: 'มอนสเตอร์ปลิงปรสิตสูบเลือด',
        passive: 'เร็ว +12%, โจมตี +14% และดูดฟื้นเลือด 9% ของ HP สูงสุดทุกครั้งที่ฆ่า',
        specialName: 'ระยางค์สูบชีพ',
        specialDesc: 'ยิงเส้นสูบพลังใส่ศัตรูทุกตัวในระยะ ฟื้นฟูทั้งพลังชีวิตและพลังงานทันที',
      },
      mob_camo_ghost: {
        name: 'Camo Ghost (มอนสเตอร์)',
        archetype: 'มอนสเตอร์วิญญาณพรางตัว',
        passive: 'เร็ว +15%, โจมตี +22%, ลดคูลดาวน์พุ่ง 15% และโอกาสได้ DNA +12%',
        specialName: 'พรางเงาสังหาร',
        specialDesc: 'หายตัวพรางเงา 4 วินาทีพร้อมระเบิดคลื่นเงารอบตัวและโจมตีครั้งถัดไปติดคริติคอล',
      },
      mob_colony_hydra: {
        name: 'Colony Hydra (บอส)',
        archetype: 'บอสรังไฮดราพิษ',
        passive: 'เลือด +55, โจมตี +22%, เกราะ +8%, ต้านทานกรด 100% และฟื้นเลือดเมื่อฆ่า',
        specialName: 'ระดมสปอร์ไฮดรา',
        specialDesc: 'สาดสปอร์กรดพิษ 8 ทิศทางรอบตัวพร้อมฟื้นพลังชีวิต 18% จากการแตกหน่อ',
      },
      mob_iron_leviathan: {
        name: 'Iron Leviathan (บอส)',
        archetype: 'บอสเกราะเหล็กใต้สมุทร',
        passive: 'เลือดสูงสุด +80, เกราะเหล็ก 16% และพลังโจมตี +24%',
        specialName: 'พุ่งชนเลวีอาธาน',
        specialDesc: 'เปิดโหมดพุ่งชนอมตะ 3.2 วินาทีและกระแทกคลื่นเหล็กผลักศัตรูรอบข้างรุนแรง',
      },
      mob_thermo_kraken: {
        name: 'Thermo-Kraken (บอส)',
        archetype: 'บอสคราเคนปล่องภูเขาไฟ',
        passive: 'เลือด +60, โจมตี +26%, เร็ว +8%, ต้านทานปล่องความร้อน และฟื้นเลือดเมื่อฆ่า',
        specialName: 'โนวาหนวดลาวา',
        specialDesc: 'ระเบิดคลื่นความร้อนรอบตัวผลักศัตรูและยิงลูกไฟลาวา 10 ทิศทางเผาผลาญรุนแรง',
      },
      mob_parasite_matriarch: {
        name: 'Parasite Matriarch (บอส)',
        archetype: 'บอสราชินีปรสิตดูดเลือด',
        passive: 'เลือด +70, โจมตี +24%, ต้านทานกรด และดูดฟื้นเลือด 10% ของ HP สูงสุดเมื่อฆ่า',
        specialName: 'ชีพจรปรสิตสีชาด',
        specialDesc: 'ปล่อยคลื่นดูดโลหิตใส่ศัตรูทุกตัวรอบข้างฟื้นฟูเลือดและพลังงาน พร้อมยิงกระสุนพิษ 6 นัด',
      },
      mob_omega_core: {
        name: 'Omega Core (บอสใหญ่)',
        archetype: 'บอสแกนปฏิกรณ์สูงสุด',
        passive: 'เลือด +65, โจมตี +30%, เกราะ +12%, โอกาส DNA +22% และต้านทานน้ำวน',
        specialName: 'แกนปฏิกรณ์ซิงกูลาริตี',
        specialDesc: 'ระเบิดวงแหวนพลาสมาคู่พร้อมยิงลำแสงโอเมก้า 12 ทิศทางและเร่งพลังอมตะ 2 วินาที',
      },
    },
    characterVault: {
      title: 'คลังตัวละคร & มอนสเตอร์ (22 สายพันธุ์ปลดล็อก)',
      subtitle: 'ปลดล็อกได้ทั้ง 10 สายพันธุ์ตำนาน และ 12 มอนสเตอร์/บอสทุกตัวในเกมด้วยแต้ม Mutagen พร้อมสกิลพิเศษ [R]',
      mutagenBalance: 'Mutagen คงเหลือ',
      unlockedCount: 'ปลดล็อกแล้ว',
      postGameLockedBanner: 'ชนะบอสสุดท้าย Omega Core ในโซน 10 อย่างน้อย 1 ครั้ง เพื่อเปิดสิทธิ์ซื้อ 22 สายพันธุ์พิเศษและมอนสเตอร์ทั้งหมด',
      postGameReadyBanner: 'ผ่านด่านสุดท้ายแล้ว! ใช้แต้ม Mutagen ปลดล็อกทั้งสายพันธุ์ตำนานและมอนสเตอร์/บอสทุกตัวได้เลย',
      tabAll: 'ทั้งหมด',
      tabLegendary: '10 สายพันธุ์ตำนาน',
      tabMonsters: '12 มอนสเตอร์ & บอส',
      starterBadge: 'สายพันธุ์เริ่มต้น',
      legendaryBadge: 'สายพันธุ์ตำนาน',
      monsterBadge: 'มอนสเตอร์เล่นได้',
      selectedBadge: 'กำลังใช้งาน',
      selectBtn: 'เลือกใช้งาน',
      unlockBtn: 'ปลดล็อก',
      needClearBtn: 'ต้องชนะโซน 10 ก่อน',
      needMutagenBtn: 'Mutagen ไม่พอ',
      passiveLabel: 'เอกลักษณ์ติดตัว',
      specialLabel: 'สกิลพิเศษ [R]',
      cooldownLabel: 'คูลดาวน์',
      close: 'ปิด',
    },
    leaderboard: {
      title: 'สถิติยอดเยี่ยม 10 อันดับ',
      subtitle: 'บันทึกสถิติสูงสุด 10 รอบการเล่นพร้อมชื่อผู้เล่น ณ เวลาที่เล่นรอบนั้น',
      empty: 'ยังไม่มีประวัติการเล่นที่จบเกม เริ่มเล่นรอบแรกเพื่อสร้างสถิติ!',
      rankCol: 'อันดับ',
      playerCol: 'ผู้เล่น',
      scoreCol: 'คะแนน',
      resultCol: 'สถานะ / ความยาก',
      zoneCol: 'โซน',
      biomassCol: 'มวลชีวภาพ',
      killsCol: 'ดูดกลืน',
      timeCol: 'เวลา',
      victoryTag: 'ชนะเกม',
      defeatTag: 'สลายตัว',
      close: 'ปิด',
    },
    codex: {
      title: 'สารานุกรมชีวภาพ & คู่มือการเล่น',
      tabOrganisms: 'สิ่งมีชีวิต 14 ชนิด',
      tabSkills: 'รากสกิล 5 สาย (16 โหนด)',
      tabStory: 'เนื้อเรื่อง & 10 โซน',
      catFood: 'อาหาร',
      catEnemy: 'ศัตรูทั่วไป',
      catBoss: 'บอสประจำโซน',
      dnaDrop: 'ดรอป DNA',
      none: 'เพิ่ม HP/Energy',
      howToPlayTitle: 'กติกาการเอาชีวิตรอดและข้อจำกัดวิวัฒนาการ',
      howToPlayBullets: [
        'กินอาหาร (Glucose / ATP) และศัตรูที่ตัวเล็กกว่าได้ทันทีเมื่อชน ส่วนศัตรูตัวใหญ่กว่าต้องโจมตีจนแตกเป็นก้อน DNA ก่อน',
        'ข้อจำกัดวิวัฒนาการ: รากสกิลมีทั้งหมด 5 สาย (16 สกิล) โควตาจีโนมสูงสุดตามความยาก (มือใหม่ 24 / ปกติ 21 / นรก 18) พร้อมเพดานพัฒนาการรายโซน และหลังชนะด่านสุดท้ายในโหมดไร้สิ้นสุดจะปลดล็อกเต็มทั้ง 5 สาย (48/48)',
        'แต่ละระดับความยากปรับพลังศัตรู ความหนาแน่น และตัวคูณแต้ม Mutagen ถาวร (โหมดนรกได้ Mutagen x1.75)',
        'เติบโตและโค่นบอสทั้ง 5 ตัวเพื่อฝ่าครบทั้ง 10 โซนจนถึงเตาปฏิกรณ์แกนชีวภาพและโค่น Omega Core เพื่อปลดล็อกคลัง 22 ตัวละครและมอนสเตอร์',
      ],
      zonesHeading: 'โซนชีวภาพทั้ง 10 เขต',
      close: 'ปิด',
    },
    credits: {
      title: 'เครดิตผู้พัฒนา & ทรัพยากร',
      devRole: 'ออกแบบเกมและวิศวกรรมระบบ',
      devName: 'BIO-ROOT Studio — Procedural Web Evolution Team',
      artRole: 'กราฟิกและแอนิเมชัน 2D',
      artDesc: 'วาดแบบ Procedural Bioluminescent Vector ทั้งหมดด้วย HTML5 Canvas 2D (ปราศจากภาพภายนอก ปลอดภัยด้านลิขสิทธิ์ 100%)',
      audioRole: 'เสียงประกอบและดนตรีบรรยากาศ',
      audioDesc: 'สังเคราะห์เสียงแบบเรียลไทม์ด้วย Web Audio API (Procedural SFX & Ambient BGM Loop)',
      techRole: 'เทคโนโลยีและแบบอักษรโอเพนซอร์ส',
      techDesc: 'React 19, TypeScript, Tailwind CSS, Lucide Icons (ISC License), Google Fonts (Outfit, Plus Jakarta Sans, Noto Sans Thai, Noto Sans SC — SIL OFL)',
      licenseNote: 'พร้อมต่อยอดพัฒนาสู่แพลตฟอร์มเว็บและมือถือ (Google Play Store / Capacitor)',
      close: 'ปิด',
    },
    toasts: {
      skillReady: 'DNA เพียงพอ! เปิดแผนภูมิรากสกิลเพื่อวิวัฒนาการ',
      evolved: 'วิวัฒนาการสำเร็จ: {name}!',
      zoneUnlocked: 'ปลดล็อกทางเชื่อมสู่โซน {zone} แล้ว!',
      enteredZone: 'เข้าสู่โซน {zone}: {name}',
      bossSpawned: 'คำเตือน! บอส {name} ปรากฏตัวแล้ว!',
      bossDefeated: 'โค่นบอส {name} สำเร็จ! เก็บก้อน Boss DNA!',
      leechAttached: 'ปรสิตเกาะตัว! กด Dash เพื่อสะบัดออก!',
      tooLarge: 'ศัตรูตัวใหญ่เกินไป! โจมตีให้แตกเป็นก้อน DNA ก่อน',
      growthCapped: 'หยุดการเจริญเติบโตในโซน {zone} แล้ว! รีบย้ายไปโซนถัดไปเพื่อโตและวิวัฒนาการต่อ',
      evoZoneCapped: 'เต็มขีดจำกัดวิวัฒนาการโซน {zone} ({cap} แต้ม) แล้ว! ย้ายโซนเพื่ออัปเกรดรากสกิลต่อ',
    },
  },

  en: {
    langLabel: 'EN',
    gameTitle: 'BIO-ROOT: CELL EVOLUTION',
    gameSubtitle: 'Bioluminescent Cell Simulation',
    storyHook: 'Experimental cell Specimen-0 has breached containment. Specialize your genome wisely and conquer 10 microscopic biomes.',
    storyFull: 'In 2094, an abyssal biolab breach released prototype "Specimen-0" into a sterile culture dish. Its adaptive 5-taproot genome has strategic biological limits per run—forcing distinct builds across 10 escalating biomes from Petri Dish and Cryo Vats to Hydro-Vents and the final Bio-Core Reactor.',
    difficulties: {
      novice: { name: 'Novice', summary: 'Forgiving foes · 24 Genome Slots (4 of 5 Roots) · Mutagen x0.85' },
      normal: { name: 'Normal', summary: 'Balanced · 21 Genome Slots (3 of 5 Roots) · Mutagen x1.0' },
      hell: { name: 'Hell Mode', summary: 'Lethal predators · 18 Genome Slots (2 of 5 Roots) · Mutagen x1.75' },
    },
    menu: {
      startNew: 'Start Evolution',
      continueRun: 'Continue Saved Run',
      characters: 'Strain & Monster Vault',
      codex: 'Bio-Codex & Guide',
      leaderboard: 'Top 10 Records',
      credits: 'Credits',
      controlHintDesktop: 'WASD/Mouse Move · Space Dash · Q Skill 1 · E Skill 2 · R Special · T Root Tree · Esc Pause',
      controlHintMobile: 'Left Stick Move · Right Buttons Dash & Special Skill · Tap Root Icon to Evolve',
      mutagenBank: 'Stored Mutagen',
      difficultyLabel: 'Difficulty',
      selectedStrain: 'Active Strain',
      playerNameLabel: 'Player',
      renameBtn: 'Rename',
      saveNameBtn: 'Save',
      cancelNameBtn: 'Cancel',
      playerNamePlaceholder: 'Enter player name (max 20 chars)',
      dailySeedLabel: 'Daily Seed',
      dailySeedOn: 'ON',
      dailySeedOff: 'OFF',
    },
    hud: {
      hp: 'Health',
      energy: 'Energy',
      biomass: 'Biomass',
      zone: 'Zone',
      endless: 'Endless Mode',
      skills: 'Root Tree',
      pause: 'Pause',
      dash: 'Dash',
      skill1: 'Skill 1',
      skill2: 'Skill 2',
      nextZoneBtn: 'Advance Zone',
      zoneGoalGrow: 'Reach size {target} to unlock gateway',
      zoneGoalBoss: 'Defeat the Zone Boss to unlock gateway',
      zoneGoalFinal: 'Defeat Omega Core in Zone 10 to win',
      bgm: 'Music',
      sfx: 'SFX',
      bossWarning: 'Apex Boss Detected',
      spit: 'Acid Spit',
      nova: 'Plasmic Nova',
      volt: 'Volt Pulse',
      stealth: 'Phantom',
      juggernaut: 'Juggernaut',
      locked: 'Locked',
      touchControls: 'Touch Pad',
      kills: 'Absorbed',
      time: 'Time',
      growthCappedBanner: 'Growth capped in this zone — advance to keep evolving!',
    },
    dna: {
      speed: 'Speed DNA',
      spike: 'Spike DNA',
      acid: 'Acid DNA',
      armor: 'Armor DNA',
      electric: 'Electric DNA',
      vampire: 'Vampire DNA',
      stealth: 'Stealth DNA',
      boss: 'Boss DNA',
    },
    zones: {
      1: { name: 'Sterile Petri Dish', desc: 'Bright cyan-lit laboratory dish ideal for early biomass growth and starter DNA.' },
      2: { name: 'Toxic Bio-Swamp', desc: 'Murky emerald mire filled with corrosive acid pools and the Colony Hydra.' },
      3: { name: 'Abyssal Drain', desc: 'Pitch-dark deep channel illuminated by bioluminescence, home to Iron Leviathan.' },
      4: { name: 'Cryo Preservation Vat', desc: 'Sub-zero freezing currents that chill movement while stealth hunters prowl.' },
      5: { name: 'Thermal Hydro-Vent', desc: 'Scalding hydrothermal jets and magma swarms guarded by the Thermo-Kraken.' },
      6: { name: 'Bio-Electric Conduit', desc: 'High-voltage static discharge nodes surrounded by pulsing Volt Jelly swarms.' },
      7: { name: 'Parasitic Hive Matrix', desc: 'Crimson organic brood nest swarming with Leech Parasites and the Parasite Matriarch.' },
      8: { name: 'Mutagenic Fallout Trench', desc: 'Pitch-black radioactive trench combining corrosive acid pools with abyssal darkness.' },
      9: { name: 'Singularity Centrifuge', desc: 'High-G vortex whirlpools and live shock conduits testing apex maneuverability.' },
      10: { name: 'Bio-Core Reactor', desc: 'Final crimson-violet vortex chamber guarded by the ultimate boss Omega Core.' },
    },
    organisms: {
      glucose_orb: { name: 'Glucose Orb', role: 'Nutrient', desc: 'Glowing mint nutrient sphere that boosts biomass and restores HP.' },
      atp_spark: { name: 'ATP Spark', role: 'Energy Cell', desc: 'Swift golden energy mote that rapidly refills your Energy bar.' },
      flagella_dart: { name: 'Flagella Dart', role: 'Swift Evader', desc: 'High-speed swimmer that flees on sight. Drops Speed DNA.' },
      spike_urchin: { name: 'Spike Urchin', role: 'Thorns Defender', desc: 'Covered in spines that reflect melee contact damage. Drops Spike DNA.' },
      acid_amoeba: { name: 'Acid Amoeba', role: 'Toxic Trail', desc: 'Leaves burning pools of corrosive slime in its wake. Drops Acid DNA.' },
      shell_diatom: { name: 'Shell Diatom', role: 'Heavy Armor', desc: 'Slow moving silicate fortress that mitigates physical hits. Drops Armor DNA.' },
      volt_jelly: { name: 'Volt Jelly', role: 'Shock Pulse', desc: 'Charges and discharges rhythmic electric shockwave rings. Drops Electric DNA.' },
      leech_parasite: { name: 'Leech Parasite', role: 'Vampiric Latch', desc: 'Latches onto you to drain HP until shaken off with Dash. Drops Vampire DNA.' },
      camo_ghost: { name: 'Camo Ghost', role: 'Stealth Ambusher', desc: 'Fades translucent before lunging with lethal speed. Drops Stealth DNA.' },
      colony_hydra: { name: 'Colony Hydra', role: 'Zone 2 Boss', desc: 'Multi-lobed hive organism that spawns polyps and acid spores. Drops Boss DNA.' },
      iron_leviathan: { name: 'Iron Leviathan', role: 'Zone 3 Boss', desc: 'Armored juggernaut that locks on and rams at blistering speed. Drops Boss DNA.' },
      thermo_kraken: { name: 'Thermo-Kraken', role: 'Zone 5 Boss', desc: 'Hydrothermal tentacle leviathan unleashing searing vent blasts and spiral ember barrages. Drops Boss DNA.' },
      parasite_matriarch: { name: 'Parasite Matriarch', role: 'Zone 7 Boss', desc: 'Crimson brood queen that spawns leeches and siphons player life with vampiric pulses. Drops Boss DNA.' },
      omega_core: { name: 'Omega Core', role: 'Zone 10 Final Boss', desc: 'Apex bio-reactor core wielding acid barrages, volt rings, and vortex pulls. Drops Boss DNA.' },
    },
    branches: {
      predator: { name: 'Predator Root', subtitle: 'Speed · Spikes · Stealth' },
      biochem: { name: 'Biochem Root', subtitle: 'Acid · Electric · Plasma' },
      immortal: { name: 'Immortal Root', subtitle: 'Armor · Siphon · Boss' },
      elemental: { name: 'Cryo-Thermal Root', subtitle: 'Frost · Heat · Frostfire' },
      symbiont: { name: 'Symbiont-Void Root', subtitle: 'Gravity · Catalyst · Singularity' },
    },
    skills: {
      jet_flagella: { name: 'Jet Flagella', organ: 'Grows animated whip tail behind cell', desc: 'Boosts swim speed, Dash distance, and reduces Dash cooldown.', effect: '+18% Speed & stronger Dash per level' },
      chitin_spikes: { name: 'Chitin Spikes', organ: 'Grows outer spikes & front fangs', desc: 'Increases ram damage and reflects melee damage back at attackers.', effect: '+35% Ram DMG & 25% Thorns per level' },
      phantom_ambush: { name: 'Phantom Ambush', organ: 'Translucent cloak & violet aura', desc: 'Activate Skill 2 to cloak and deal a 2.4x critical ambush strike.', effect: '3.5s Cloak & guaranteed Crit Ambush' },
      corrosive_spit: { name: 'Corrosive Spit', organ: 'Glowing emerald acid sacs inside cell', desc: 'Activate Skill 1 to fire acid globs that burst into corrosive puddles.', effect: 'Ranged Acid Glob + Damage-Over-Time pool' },
      bio_volt_pulse: { name: 'Bio-Volt Pulse', organ: 'Crackling lightning arcs around membrane', desc: 'Periodically zaps nearby foes and empowers Skill 2 into an AoE shockwave.', effect: 'Branching chain-lightning shockwave' },
      plasmic_nova: { name: 'Hybrid Plasmic Nova', organ: 'Acid-Lightning bio-core halo', desc: 'Hybrid apex upgrade turning Skill 1 into a massive acid-lightning blast.', effect: 'Armor-piercing Acid + Shock Nova' },
      hexa_carapace: { name: 'Hexa-Carapace', organ: 'Golden hexagonal armor plates', desc: 'Reduces all incoming damage and fortifies maximum HP.', effect: '-12% Damage Taken & +30 Max HP per level (55% cap)' },
      siphon_tentacles: { name: 'Siphon Tentacles', organ: 'Animated writhing siphon tendrils', desc: 'Pulls distant food & DNA chunks while draining HP from close enemies.', effect: 'Long-range magnet & passive life-drain' },
      mitosis_minions: { name: 'Mitosis Minions', organ: 'Orbiting symbiotic helper cells', desc: 'Divides off autonomous mini-cells that hunt nearby threats.', effect: 'Spawns up to 2 / 4 / 6 helper minions' },
      juggernaut_charge: { name: 'Juggernaut Charge', organ: 'Golden ramming crest & aura', desc: 'Activate Skill 2 to become invincible and plow through any foe.', effect: '2.5s Invulnerability + heavy ram crush' },
      cryo_membrane: { name: 'Cryo Membrane', organ: 'Crystalline frost lattice around cell', desc: 'Radiates chilling aura that slows nearby foes and resists Cryo zones.', effect: 'Chilling slow aura & Cryo immunity' },
      thermal_vent_core: { name: 'Thermal Vent Core', organ: 'Incandescent ember fissures in nucleus', desc: 'Superheats metabolism to boost all attack damage and resist Thermal Vents.', effect: '+14% All Damage per level & Thermal immunity' },
      frostfire_pulse: { name: 'Frostfire Pulse', organ: 'Twin orbiting ice-flame rings', desc: 'Triggers an explosive frostfire shockwave every time you Dash or cast a skill.', effect: 'Chilling thermal blast on every skill cast' },
      gravity_cilia: { name: 'Gravity Cilia', organ: 'Violet gravimetric cilia ring', desc: 'Massively extends food & DNA pull radius while dampening Vortex currents.', effect: '+48px Magnet pull per level & Vortex resistance' },
      genome_catalyst: { name: 'Genome Catalyst', organ: 'Twin emerald DNA helices orbiting core', desc: 'Accelerates energy regen, boosts nutrient healing, and multiplies DNA drops.', effect: '+15% Energy Regen, +22% Heal & +16% Bonus DNA' },
      singularity_bloom: { name: 'Singularity Bloom', organ: 'Orbiting micro-singularity accretion halo', desc: 'Periodically pulls foes & loot inward with gravity pulses and shreds Bosses.', effect: 'Gravity pull bursts & +15% Boss DMG per level' },
    },
    skillTree: {
      title: 'Bio-Root Evolution Tree (5 Taproots)',
      nucleus: 'Specimen-0 Nucleus',
      close: 'Return to Game',
      evolve: 'Evolve Organ',
      maxed: 'Max Evolution',
      requires: 'Requires',
      cost: 'DNA Cost',
      level: 'Level',
      organPreview: 'Physical Mutation',
      selectHint: 'Combine roots across 5 primary taproots within your difficulty cap to craft distinct builds.',
      evoCapLabel: 'Genome Slots',
      zoneEvoCapLabel: 'Zone Cap',
      branchLimitLabel: 'Active Taproots',
      branchSealedBadge: 'Sealed This Run',
      evoCapReached: 'Genome slot cap reached (replay to try another build)',
      zoneEvoCapReached: 'Zone evolution cap reached! Advance to the next zone to keep upgrading.',
      branchSealedReason: 'This taproot is sealed because you reached the active root limit for this difficulty.',
      constraintHint: 'Each zone caps growth & evolution—advance zones to unlock more, or clear Zone 10 for full Endless sandbox.',
      timePausedBadge: 'Time Paused',
      endlessSandboxBadge: 'Endless Sandbox (All 5 Roots Max 48/48)',
    },
    pause: {
      title: 'Simulation Paused',
      resume: 'Resume',
      restart: 'Restart Run',
      language: 'Language',
      audio: 'Audio',
      backToTitle: 'Main Menu',
      saveNotice: 'Progress automatically saved to local storage',
    },
    gameover: {
      defeatTitle: 'Cell Dissolved',
      victoryTitle: 'Apex Evolution Achieved!',
      defeatDesc: 'Specimen-0 perished, but its genetic imprint has been harvested as permanent Mutagen. Try a fresh build next run!',
      victoryDesc: 'You conquered all 10 biomes and defeated Omega Core! Continue in Endless Sandbox to max out every root branch freely.',
      zoneReached: 'Zone Reached',
      finalBiomass: 'Final Biomass',
      absorbed: 'Organisms Absorbed',
      timeSurvived: 'Time Survived',
      mutagenEarned: 'Mutagen Earned',
      mutagenTotal: 'Total Mutagen',
      labTitle: 'Permanent Mutagen Lab',
      labVitality: 'Reinforced Membrane',
      labVitalityDesc: '+20 Starting Max HP per level',
      labMetabolism: 'Hyper Metabolism',
      labMetabolismDesc: '+15% Energy Regeneration per level',
      labMagnet: 'Genetic Attraction',
      labMagnetDesc: '+20% Pickup Magnet & DNA yield',
      labMobility: 'Propulsion Cilia',
      labMobilityDesc: '+8% Swim Speed & faster Dash cooldown per level',
      upgradeBtn: 'Upgrade',
      continueEndless: 'Endless Sandbox (Max All)',
      playAgain: 'Play Again',
      backToTitle: 'Main Menu',
      runScore: 'Run Score',
      newRankBadge: 'New Top 10 Record! Rank #{rank}',
      viewLeaderboard: 'Top 10 Records',
      characterVault: 'Strain & Monster Vault (22)',
      postGameUnlockedNotice: 'Vault unlocked! Spend Mutagen to recruit 10 legendary strains + all 12 playable monsters & bosses.',
      playerLabel: 'Player',
    },
    characters: {
      specimen_0: {
        name: 'Specimen-0',
        archetype: 'Baseline Prototype Cell',
        passive: 'Balanced baseline cell designed for mastering all 10 microscopic zones.',
        specialName: 'No Signature Active',
        specialDesc: 'Relies purely on evolved Root Skill Tree abilities.',
      },
      pyro_phage: {
        name: 'Pyro-Phage',
        archetype: 'Solar Incinerator',
        passive: '+15% Damage, +15 Max HP, and immune to Thermal Vents.',
        specialName: 'Solar Eruption',
        specialDesc: 'Detonates a scorching shockwave knocking foes back while firing 8 ember bolts.',
      },
      cryo_diatom: {
        name: 'Cryo-Diatom',
        archetype: 'Glacial Crystal Shell',
        passive: '+30 Max HP, +8% Armor, and immune to Cryo chill zones.',
        specialName: 'Absolute Zero',
        specialDesc: 'Unleashes a frost pulse that damages and freezes nearby enemies solid for 3.2s.',
      },
      chrono_cilia: {
        name: 'Chrono-Cilia',
        archetype: 'Temporal Weaver',
        passive: '+12% Speed, +25% Energy Regen, and -10% Dash Cooldown.',
        specialName: 'Time Dilation',
        specialDesc: 'Slows all enemies and hostile projectiles to 30% speed for 4.5s while boosting movement.',
      },
      void_amoeba: {
        name: 'Void-Amoeba',
        archetype: 'Micro Singularity',
        passive: '+50px Magnet pull, +10% Bonus DNA chance, and immune to Vortex currents.',
        specialName: 'Singularity Rift',
        specialDesc: 'Violently pulls nearby enemies, nutrients, and DNA inward before a void implosion.',
      },
      tesla_medusa: {
        name: 'Tesla-Medusa',
        archetype: 'High-Voltage Storm Cell',
        passive: '+25% Damage, +18% Energy Regen, and immune to Shock Pylons.',
        specialName: 'Storm Overdrive',
        specialDesc: 'Calls down critical chain-lightning arcs striking up to 8 nearby enemies at once.',
      },
      venom_hydra: {
        name: 'Venom-Hydra',
        archetype: 'Acid Plague Matriarch',
        passive: '+35 Max HP, +20% Damage, 100% Acid Pool immunity, and sustain on kills.',
        specialName: 'Bio-Plague Bloom',
        specialDesc: 'Deploys 4 wide corrosive pools around you while spraying 6 venomous darts.',
      },
      aegis_titan: {
        name: 'Aegis-Titan',
        archetype: 'Gilded Citadel Cell',
        passive: '+65 Max HP, built-in 16% Armor mitigation, and +4% HP heal per kill.',
        specialName: 'Fortress Aegis',
        specialDesc: 'Raises a 4.0s invulnerability dome, heals 25% HP, knocks foes back, and reflects hits.',
      },
      crimson_vamp: {
        name: 'Crimson-Vamp',
        archetype: 'Sanguine Leech Lord',
        passive: '+10% Speed, +18% Damage, and restores 8% Max HP + Energy on every kill.',
        specialName: 'Blood Feast',
        specialDesc: 'Tethers blood beams to every nearby enemy, healing for 65% of total damage dealt.',
      },
      prism_phantom: {
        name: 'Prism-Phantom',
        archetype: 'Spectral Phase Assassin',
        passive: '+18% Speed, +22% Damage, -20% Dash Cooldown, and +15% Bonus DNA chance.',
        specialName: 'Phase Blink',
        specialDesc: 'Instantly teleports 280px forward with critical prismatic blasts at departure & arrival.',
      },
      omega_prime: {
        name: 'Omega-Prime',
        archetype: 'Apex Bio-Reactor Sovereign',
        passive: '+50 Max HP, +15% Speed, +28% Damage, +12% Armor, and +25% Bonus DNA chance.',
        specialName: 'Omega Annihilation',
        specialDesc: 'Unleashes an Omega hyper-nova, 10 radiant plasma rays, and 2.5s invincible surge.',
      },
      mob_flagella_dart: {
        name: 'Flagella Dart (Monster)',
        archetype: 'Supersonic Swimmer Strain',
        passive: '+20% Speed, +18% Energy Regen, and -22% Dash Cooldown.',
        specialName: 'Hyper-Flagella Jet',
        specialDesc: 'Launches a supersonic lunge slicing nearby enemies and granting a 2.6s speed surge.',
      },
      mob_spike_urchin: {
        name: 'Spike Urchin (Monster)',
        archetype: 'Armored Spine Monster',
        passive: '+25 Max HP, +10% Armor, +16% Damage, and minor HP sustain on kills.',
        specialName: 'Quill Nova',
        specialDesc: 'Fires 12 piercing chitin quills in a full 360° burst for heavy radial damage.',
      },
      mob_acid_amoeba: {
        name: 'Acid Amoeba (Monster)',
        archetype: 'Corrosive Slime Monster',
        passive: '+25 Max HP, +12% Damage, 100% Acid Pool immunity, and heal on kills.',
        specialName: 'Corrosive Meltdown',
        specialDesc: 'Creates a massive boiling acid mire for 6.0s while restoring 14% Max HP instantly.',
      },
      mob_shell_diatom: {
        name: 'Shell Diatom (Monster)',
        archetype: 'Silicate Fortress Monster',
        passive: '+55 Max HP and innate 18% armored damage reduction.',
        specialName: 'Silica Bastion',
        specialDesc: 'Raises a 3.0s invulnerability bastion and slams nearby foes back with a shockwave.',
      },
      mob_volt_jelly: {
        name: 'Volt Jelly (Monster)',
        archetype: 'Bio-Electric Jellyfish',
        passive: '+18% Damage, +22% Energy Regen, +7% Speed, and immune to Shock Pylons.',
        specialName: 'Arc Cascade',
        specialDesc: 'Discharges critical jellyfish lightning arcs hitting up to 6 targets in range.',
      },
      mob_leech_parasite: {
        name: 'Leech Parasite (Monster)',
        archetype: 'Sanguine Parasite Strain',
        passive: '+12% Speed, +14% Damage, and restores 9% Max HP on every kill.',
        specialName: 'Parasitic Syphon',
        specialDesc: 'Drains nearby enemies simultaneously to replenish both Health and Energy.',
      },
      mob_camo_ghost: {
        name: 'Camo Ghost (Monster)',
        archetype: 'Translucent Stalker Monster',
        passive: '+15% Speed, +22% Damage, -15% Dash Cooldown, and +12% Bonus DNA chance.',
        specialName: 'Spectral Ambush',
        specialDesc: 'Cloaks for 4.0s with an ambush shockwave and primes a guaranteed critical strike.',
      },
      mob_colony_hydra: {
        name: 'Colony Hydra (Boss)',
        archetype: 'Hive Matriarch Boss Strain',
        passive: '+55 Max HP, +22% Damage, +8% Armor, Acid immunity, and kill sustain.',
        specialName: 'Hydra Brood Volley',
        specialDesc: 'Unleashes an 8-way corrosive spore volley while regenerating 18% Max HP.',
      },
      mob_iron_leviathan: {
        name: 'Iron Leviathan (Boss)',
        archetype: 'Dreadnought Boss Strain',
        passive: '+80 Max HP, 16% heavy iron armor mitigation, and +24% Damage.',
        specialName: 'Leviathan Juggernaut',
        specialDesc: 'Triggers a 3.2s unstoppable armored charge with a crushing radial iron slam.',
      },
      mob_thermo_kraken: {
        name: 'Thermo-Kraken (Boss)',
        archetype: 'Hydrothermal Boss Strain',
        passive: '+60 Max HP, +26% Damage, +8% Speed, Thermal Vent immunity, and kill sustain.',
        specialName: 'Magma Tentacle Nova',
        specialDesc: 'Detonates a scorching hydro-vent shockwave and fires 10 blazing ember orbs.',
      },
      mob_parasite_matriarch: {
        name: 'Parasite Matriarch (Boss)',
        archetype: 'Crimson Hive Queen Strain',
        passive: '+70 Max HP, +24% Damage, Acid immunity, and restores 10% Max HP per kill.',
        specialName: 'Crimson Brood Siphon',
        specialDesc: 'Drains every nearby foe for massive HP & Energy while launching 6 crimson bolts.',
      },
      mob_omega_core: {
        name: 'Omega Core (Final Boss)',
        archetype: 'Apex Reactor Boss Strain',
        passive: '+65 Max HP, +30% Damage, +12% Armor, +22% Bonus DNA, and Vortex immunity.',
        specialName: 'Reactor Singularity',
        specialDesc: 'Detonates twin plasma shock rings, fires 12 Omega rays, and grants a 2.0s surge.',
      },
    },
    characterVault: {
      title: 'Strain & Monster Vault (22 Unlockables)',
      subtitle: 'Spend Mutagen to unlock 10 legendary apex strains AND all 12 playable monsters & unique bosses with [R] skills.',
      mutagenBalance: 'Available Mutagen',
      unlockedCount: 'Unlocked',
      postGameLockedBanner: 'Defeat Omega Core in Zone 10 at least once to unlock purchasing all 22 legendary, monster & boss strains.',
      postGameReadyBanner: 'Final Zone cleared! Spend Mutagen to recruit legendary strains or play as any monster & boss.',
      tabAll: 'All',
      tabLegendary: '10 Legendary Strains',
      tabMonsters: '12 Monsters & Bosses',
      starterBadge: 'Starter Strain',
      legendaryBadge: 'Legendary',
      monsterBadge: 'Playable Monster',
      selectedBadge: 'Equipped',
      selectBtn: 'Equip Strain',
      unlockBtn: 'Unlock',
      needClearBtn: 'Beat Zone 10 First',
      needMutagenBtn: 'Need More Mutagen',
      passiveLabel: 'Bio-Identity',
      specialLabel: 'Special Skill [R]',
      cooldownLabel: 'Cooldown',
      close: 'Close',
    },
    leaderboard: {
      title: 'Top 10 Personal Records',
      subtitle: 'Your 10 highest-scoring runs preserving the exact player name active during each run',
      empty: 'No completed runs recorded yet. Finish a run to set your first benchmark!',
      rankCol: '#',
      playerCol: 'Player',
      scoreCol: 'Score',
      resultCol: 'Outcome / Mode',
      zoneCol: 'Zone',
      biomassCol: 'Biomass',
      killsCol: 'Absorbed',
      timeCol: 'Time',
      victoryTag: 'Victory',
      defeatTag: 'Dissolved',
      close: 'Close',
    },
    codex: {
      title: 'Bio-Codex & Survival Manual',
      tabOrganisms: '14 Organisms',
      tabSkills: '5 Taproots (16 Skills)',
      tabStory: 'Lore & 10 Zones',
      catFood: 'Nutrients',
      catEnemy: 'Wild Microbes',
      catBoss: 'Zone Bosses',
      dnaDrop: 'DNA Drop',
      none: 'Restores HP / Energy',
      howToPlayTitle: 'Survival Rules & Evolution Limits',
      howToPlayBullets: [
        'Consume nutrients (Glucose / ATP) and smaller enemies instantly. Break larger foes into absorbable DNA chunks with skills first.',
        'Evolution Limits: 5 primary taproots (16 skills) with difficulty caps (Novice 24/4, Normal 21/3, Hell 18/2) and per-zone caps. Clearing Zone 10 unlocks full 48/48 Endless Sandbox.',
        'Difficulty Modes scale enemy threat, biome intensity, and Mutagen rewards (Hell Mode grants 1.75x Mutagen).',
        'Grow and defeat all 5 unique Zone Bosses across 10 biomes and overthrow Omega Core to unlock the 22-character Strain & Monster Vault.',
      ],
      zonesHeading: 'All 10 Microscopic Biomes',
      close: 'Close',
    },
    credits: {
      title: 'Credits & Open Resources',
      devRole: 'Game Design & Engineering',
      devName: 'BIO-ROOT Studio — Procedural Web Evolution Team',
      artRole: '2D Graphics & Animation',
      artDesc: '100% Procedural Bioluminescent Vector Graphics rendered on HTML5 Canvas 2D (zero external image dependencies, completely royalty-free).',
      audioRole: 'Audio & Procedural Synth',
      audioDesc: 'Real-time synthesized SFX and ambient microscopic BGM via Web Audio API.',
      techRole: 'Open-Source Tech & Fonts',
      techDesc: 'React 19, TypeScript, Tailwind CSS, Lucide Icons (ISC License), Google Fonts (Outfit, Plus Jakarta Sans, Noto Sans Thai, Noto Sans SC — SIL OFL).',
      licenseNote: 'Built responsive for desktop browsers and mobile touchscreens (Google Play Store ready).',
      close: 'Close',
    },
    toasts: {
      skillReady: 'DNA ready! Open the Root Skill Tree to evolve.',
      evolved: 'Organ Evolved: {name}!',
      zoneUnlocked: 'Gateway to Zone {zone} unlocked!',
      enteredZone: 'Entered Zone {zone}: {name}',
      bossSpawned: 'WARNING: {name} has emerged!',
      bossDefeated: '{name} defeated! Absorb the Boss DNA!',
      leechAttached: 'Leech latched on! Dash to shake it off!',
      tooLarge: 'Target too large! Break it into DNA chunks with attacks first.',
      growthCapped: 'Growth halted in Zone {zone}! Advance to the next zone to continue evolving.',
      evoZoneCapped: 'Zone {zone} evolution cap ({cap}) reached! Advance to the next zone to upgrade further.',
    },
  },

  zh: {
    langLabel: '中文',
    gameTitle: 'BIO-ROOT: CELL EVOLUTION',
    gameSubtitle: '生物根系：细胞进化',
    storyHook: '实验细胞 Specimen-0 逃离实验室。策略性选择进化路线，挑战 3 种难度并突破 10 大微观生态区。',
    storyFull: '2094年，深海生物实验室泄漏，原型细胞“Specimen-0”逸散至无菌培养皿中。它拥有 5 大适应性进化主根系，受限于单局基因组容量与分支上限，每局都需构筑不同流派，穿越全部 10 大微观区域并击败最终首领 Omega Core。',
    difficulties: {
      novice: { name: '新手模式', summary: '敌人较弱 · 24 进化点数（5选4主根）· 诱变点 x0.85' },
      normal: { name: '普通模式', summary: '标准平衡 · 21 进化点数（5选3主根）· 诱变点 x1.0' },
      hell: { name: '地狱模式', summary: '极高威胁 · 18 进化点数（5选2主根）· 诱变点 x1.75' },
    },
    menu: {
      startNew: '开始新进化',
      continueRun: '继续上次进度',
      characters: '角色与怪物库',
      codex: '生物图鉴与指南',
      leaderboard: '前 10 纪录榜',
      credits: '制作人员与声明',
      controlHintDesktop: 'WASD/鼠标 移动 · Space 冲刺 · Q 技能1 · E 技能2 · R 专属特技 · T 进化根系 · Esc 暂停',
      controlHintMobile: '左侧摇杆移动 · 右侧按钮冲刺与释放专属特技 · 点击根系图标即时进化',
      mutagenBank: '永久诱变点 Mutagen',
      difficultyLabel: '难度模式',
      selectedStrain: '当前株系',
      playerNameLabel: '玩家昵称',
      renameBtn: '改名',
      saveNameBtn: '保存',
      cancelNameBtn: '取消',
      playerNamePlaceholder: '输入玩家昵称（最多20字）',
      dailySeedLabel: '每日种子',
      dailySeedOn: '开',
      dailySeedOff: '关',
    },
    hud: {
      hp: '生命值',
      energy: '能量',
      biomass: '生物量',
      zone: '区域',
      endless: '无尽模式',
      skills: '根系技能',
      pause: '暂停',
      dash: '冲刺',
      skill1: '技能 1',
      skill2: '技能 2',
      nextZoneBtn: '前往下一区域',
      zoneGoalGrow: '成长至体型 {target} 以开启通道',
      zoneGoalBoss: '击败区域首领以开启通道',
      zoneGoalFinal: '在第 10 区击败 Omega Core 获胜',
      bgm: '音乐',
      sfx: '音效',
      bossWarning: '检测到区域首领',
      spit: '酸液喷吐',
      nova: '等离子新星',
      volt: '生物电脉冲',
      stealth: '幻影潜行',
      juggernaut: '无敌冲锋',
      locked: '未解锁',
      touchControls: '触控手柄',
      kills: '吞噬数',
      time: '时间',
      growthCappedBanner: '当前区域已达成长上限！请前往下一区域继续进化',
    },
    dna: {
      speed: '速度 DNA',
      spike: '尖刺 DNA',
      acid: '酸液 DNA',
      armor: '护甲 DNA',
      electric: '电流 DNA',
      vampire: '吸血 DNA',
      stealth: '隐身 DNA',
      boss: '首领 DNA',
    },
    zones: {
      1: { name: '无菌培养皿', desc: 'Sterile Petri Dish — 明亮清澈的浅蓝视野，适合初期成长与收集基础 DNA。' },
      2: { name: '毒液生物沼泽', desc: 'Toxic Bio-Swamp — 遍布腐蚀性酸池与区域首领 Colony Hydra。' },
      3: { name: '深渊排水管', desc: 'Abyssal Drain — 漆黑深蓝的微光海域，潜伏着装甲首领 Iron Leviathan。' },
      4: { name: '低温保存槽', desc: 'Cryo Preservation Vat — 极寒冰雾区域会减缓游动速度，隐身伏击者出没。' },
      5: { name: '深海热液喷口', desc: 'Thermal Hydro-Vent — 炽热喷流与熔岩敌群，由热液海妖 Thermo-Kraken 镇守。' },
      6: { name: '生物电导管道', desc: 'Bio-Electric Conduit — 周期性放电的高压节点与密集电压水母群。' },
      7: { name: '寄生蜂巢矩阵', desc: 'Parasitic Hive Matrix — 暗红寄生母巢，充满吸血蛭与寄生虫母皇 Parasite Matriarch。' },
      8: { name: '诱变辐射海沟', desc: 'Mutagenic Fallout Trench — 漆黑深渊叠加高腐蚀辐射酸池的致命险境。' },
      9: { name: '奇点离心机', desc: 'Singularity Centrifuge — 强力漩涡激流与高压电弧交织的极限试炼区。' },
      10: { name: '生物核心反应堆', desc: 'Bio-Core Reactor — 第10区终极漩涡战场，最终首领 Omega Core 镇守于此。' },
    },
    organisms: {
      glucose_orb: { name: '葡萄糖球 (Glucose Orb)', role: '营养物', desc: '荧光薄荷绿营养球，增加生物量并立即恢复生命值。' },
      atp_spark: { name: 'ATP 火花 (ATP Spark)', role: '能量微粒', desc: '活跃的金色能量微粒，快速补充能量条。' },
      flagella_dart: { name: '鞭毛飞镖 (Flagella Dart)', role: '高速逃逸者', desc: '游动极快，发现玩家时会迅速逃跑。掉落速度 DNA。' },
      spike_urchin: { name: '尖刺海胆 (Spike Urchin)', role: '反伤防御者', desc: '全身尖刺，近战碰撞会反弹伤害。掉落尖刺 DNA。' },
      acid_amoeba: { name: '酸液变形虫 (Acid Amoeba)', role: '毒液残留者', desc: '移动时留下具有持续腐蚀伤害的酸液轨迹。掉落酸液 DNA。' },
      shell_diatom: { name: '硬壳硅藻 (Shell Diatom)', role: '重甲巡逻者', desc: '移动缓慢但拥有坚硬的六边形硅质护甲，减免物理伤害。掉落护甲 DNA。' },
      volt_jelly: { name: '电压水母 (Volt Jelly)', role: '脉冲放电者', desc: '周期性蓄力并向四周释放环形电流冲击波。掉落电流 DNA。' },
      leech_parasite: { name: '吸血寄生蛭 (Leech Parasite)', role: '寄生吸血者', desc: '吸附在玩家身上持续吸血，必须使用冲刺甩脱。掉落吸血 DNA。' },
      camo_ghost: { name: '伪装幽灵 (Camo Ghost)', role: '隐身伏击者', desc: '半透明潜行接近，蓄力闪光后高速突袭啃咬。掉落隐身 DNA。' },
      colony_hydra: { name: '群落九头蛇 (Colony Hydra)', role: '第2区首领', desc: '多核群落巨兽，能不断分裂召唤小怪并喷射毒孢。掉落首领 DNA。' },
      iron_leviathan: { name: '钢铁利维坦 (Iron Leviathan)', role: '第3区首领', desc: '重装深海巨兽，锁定红线后发动毁灭性高速撞击。掉落首领 DNA。' },
      thermo_kraken: { name: '热液海妖 (Thermo-Kraken)', role: '第5区首领', desc: '深海熔岩触手巨兽，释放炙热喷口冲击波与螺旋火球弹幕。掉落首领 DNA。' },
      parasite_matriarch: { name: '寄生母皇 (Parasite Matriarch)', role: '第7区首领', desc: '猩红母巢霸主，召唤吸血蛭群并以吸血脉冲汲取玩家生命回血。掉落首领 DNA。' },
      omega_core: { name: '欧米茄核心 (Omega Core)', role: '第10区最终首领', desc: '终极生物反应核心，同时掌控酸液弹幕、电环与漩涡牵引。掉落首领 DNA。' },
    },
    branches: {
      predator: { name: '掠食者主根', subtitle: '速度 · 尖刺 · 潜行' },
      biochem: { name: '生化主根', subtitle: '酸液 · 电流 · 等离子' },
      immortal: { name: '不朽主根', subtitle: '护甲 · 吸血 · 首领' },
      elemental: { name: '冰火元素主根', subtitle: '极寒 · 炽热 · 霜火' },
      symbiont: { name: '共生虚空主根', subtitle: '引力 · 催化 · 奇点' },
    },
    skills: {
      jet_flagella: { name: '喷射鞭毛 (Jet Flagella)', organ: '尾部长出律动推进鞭毛', desc: '提升移动速度与冲刺距离，缩短冲刺冷却。', effect: '每级 +18% 移速并强化冲刺' },
      chitin_spikes: { name: '几丁质尖刺 (Chitin Spikes)', organ: '周身生长尖刺与前部獠牙', desc: '大幅提升冲撞伤害，并反弹近战碰撞伤害。', effect: '每级 +35% 撞击伤害与 25% 反伤' },
      phantom_ambush: { name: '幻影伏击 (Phantom Ambush)', organ: '细胞半透明并环绕紫色灵气', desc: '激活技能2进入隐身状态，首次攻击触发 2.4 倍暴击。', effect: '3.5秒潜行与高额伏击暴击' },
      corrosive_spit: { name: '腐蚀喷吐 (Corrosive Spit)', organ: '体内生成荧光绿色酸囊', desc: '激活技能1发射酸液弹，落地生成持续腐蚀毒池。', effect: '远程酸液弹 + 持续腐蚀毒沼' },
      bio_volt_pulse: { name: '生物电脉冲 (Bio-Volt Pulse)', organ: '细胞膜表面跃动闪电弧', desc: '自动电击周围敌人，激活技能2释放范围闪电冲击波。', effect: '多目标分支闪电范围电击' },
      plasmic_nova: { name: '混合等离子新星 (Plasmic Nova)', organ: '酸电融合双色核心光环', desc: '高级融合技能，将技能1升级为大范围酸电新星震波。', effect: '破甲酸电冲击波并麻痹敌人' },
      hexa_carapace: { name: '六边形甲壳 (Hexa-Carapace)', organ: '体表覆盖金色六边形装甲板', desc: '全面降低所受伤害并提高最大生命值。', effect: '每级减伤 12% 且 +30 最大生命（护甲上限 55%）' },
      siphon_tentacles: { name: '虹吸触须 (Siphon Tentacles)', organ: '周围生出灵动吸附触手', desc: '远距离吸取食物与 DNA，同时汲取附近敌人的生命。', effect: '远距磁吸并自动吸血回复' },
      mitosis_minions: { name: '有丝分裂随从 (Mitosis Minions)', organ: '环绕护航的共生子细胞', desc: '分裂出自主战斗的随从细胞协助围攻敌人。', effect: '最多召唤 2 / 4 / 6 个共生随从' },
      juggernaut_charge: { name: '主宰冲锋 (Juggernaut Charge)', organ: '金色无敌冲锋护盾与锋角', desc: '激活技能2进入无敌状态并强力冲撞击溃沿途敌人。', effect: '2.5秒无敌并造成巨额撞击伤害' },
      cryo_membrane: { name: '极寒晶膜 (Cryo Membrane)', organ: '细胞外缘凝结冰晶护环', desc: '散发寒气减速周围敌人，并免疫低温冰原减速。', effect: '周身寒流减速 & 免疫冰原' },
      thermal_vent_core: { name: '热液熔核 (Thermal Core)', organ: '细胞核迸发炽热熔岩裂纹', desc: '强化代谢热量大幅提升全部攻击伤害，并免疫热液喷口。', effect: '每级全伤害 +14% & 免疫热液' },
      frostfire_pulse: { name: '霜火脉冲 (Frostfire Pulse)', organ: '冰蓝与炽橙双色能量光环', desc: '每次冲刺或释放技能时触发霜火震波，同时灼烧并减速敌人。', effect: '每次施放技能触发霜火冲击波' },
      gravity_cilia: { name: '引力纤毛 (Gravity Cilia)', organ: '紫色重力场纤毛光圈', desc: '大幅扩大养分与 DNA 吸取范围，并大幅削弱漩涡吸力。', effect: '每级磁吸 +48px & 抗漩涡' },
      genome_catalyst: { name: '基因催化剂 (Genome Catalyst)', organ: '双螺旋翡翠 DNA 环绕核心', desc: '加速能量回复、提升营养球回血量，并提高额外 DNA 掉落概率。', effect: '+15% 回能、+22% 进食回血 & +16% 额外DNA' },
      singularity_bloom: { name: '奇点绽放 (Singularity Bloom)', organ: '微型黑洞吸积光环环绕周身', desc: '周期性释放引力脉冲牵引敌人与战利品，并大幅提高对首领伤害。', effect: '周期引力坍缩 & 每级首领伤害 +15%' },
    },
    skillTree: {
      title: '生物根系进化树（5 大主根）',
      nucleus: 'Specimen-0 核心细胞核',
      close: '返回游戏',
      evolve: '立即进化',
      maxed: '已达最高进化',
      requires: '前置条件',
      cost: '消耗 DNA',
      level: '等级',
      organPreview: '实体器官变化',
      selectHint: '按难度配额从 5 大主根系中自由搭配流派，构筑专属进化路线。',
      evoCapLabel: '单局进化容量',
      zoneEvoCapLabel: '本区上限',
      branchLimitLabel: '已激活主根',
      branchSealedBadge: '本局已封印',
      evoCapReached: '已达单局进化上限（重开可尝试新流派）',
      zoneEvoCapReached: '已达本区进化上限！请尽快前往下一区域继续升级。',
      branchSealedReason: '本局已达当前难度的主根数量上限，该分支已封印。',
      constraintHint: '每个区域均有体型与进化上限，推进区域即可解锁；通关第 10 区后进入无尽模式可全 5 系满级体验。',
      timePausedBadge: '时间已暂停',
      endlessSandboxBadge: '无尽自由实验（全 5 主根满级 48/48）',
    },
    pause: {
      title: '游戏已暂停',
      resume: '继续游戏',
      restart: '重新开始',
      language: '语言切换',
      audio: '音频控制',
      backToTitle: '返回主菜单',
      saveNotice: '进度已自动保存至本地存储',
    },
    gameover: {
      defeatTitle: '细胞解体',
      victoryTitle: '终极进化达成！',
      defeatDesc: 'Specimen-0 在微生态中阵亡，但基因数据已转化为永久 Mutagen 点数。下局尝试全新的根系组合吧！',
      victoryDesc: '你征服了全部 10 大区域并击败了 Omega Core！进入无尽模式即可自由点满全部三条主根系。',
      zoneReached: '抵达区域',
      finalBiomass: '最终生物量',
      absorbed: '吞噬生物',
      timeSurvived: '存活时间',
      mutagenEarned: '本局获得 Mutagen',
      mutagenTotal: '累计 Mutagen',
      labTitle: '永久基因实验室 (Mutagen)',
      labVitality: '强化细胞膜',
      labVitalityDesc: '每级 +20 初始生命上限',
      labMetabolism: '高效代谢',
      labMetabolismDesc: '每级 +15% 能量回复速度',
      labMagnet: '基因引力',
      labMagnetDesc: '每级 +20% 吞噬吸力与 DNA 加成',
      labMobility: '推进纤毛强化',
      labMobilityDesc: '每级 +8% 移动速度并缩短冲刺冷却',
      upgradeBtn: '升级',
      continueEndless: '进入无尽模式（全系满级）',
      playAgain: '再来一局',
      backToTitle: '主菜单',
      runScore: '本局总分',
      newRankBadge: '新上榜前 10！第 #{rank} 名',
      viewLeaderboard: '查看前 10 纪录',
      characterVault: '角色与怪物库 (22)',
      postGameUnlockedNotice: '已解锁全部 22 个通关角色与可操控怪物/首领！消耗诱变点即可解锁出战。',
      playerLabel: '玩家',
    },
    characters: {
      specimen_0: {
        name: 'Specimen-0',
        archetype: '标准实验原型细胞',
        passive: '各项属性均衡，适合探索与征服全部 10 大生态区。',
        specialName: '无专属特技',
        specialDesc: '完全依靠根系进化树解锁主动技能。',
      },
      pyro_phage: {
        name: 'Pyro-Phage',
        archetype: '日炎焚烧细胞',
        passive: '伤害 +15%，生命 +15，完全免疫热液喷口灼伤。',
        specialName: '日炎爆裂',
        specialDesc: '释放炙热冲击波击退四周敌人，并向 8 个方向发射烈焰弹。',
      },
      cryo_diatom: {
        name: 'Cryo-Diatom',
        archetype: '极寒晶甲硅藻',
        passive: '生命 +30，护甲 +8%，免疫寒流冰原减速效果。',
        specialName: '绝对零度',
        specialDesc: '释放冰晶震波造成伤害，并冻结周围敌人 3.2 秒。',
      },
      chrono_cilia: {
        name: 'Chrono-Cilia',
        archetype: '时空纤毛体',
        passive: '移速 +12%，能量回复 +25%，冲刺冷却缩短 10%。',
        specialName: '时间膨胀',
        specialDesc: '展开 4.5 秒时间力场，令所有敌人与敌方弹幕减速 70% 并加速自身。',
      },
      void_amoeba: {
        name: 'Void-Amoeba',
        archetype: '微缩奇点变形虫',
        passive: '吞噬磁吸 +50px，额外 DNA 概率 +10%，免疫漩涡吸力。',
        specialName: '奇点裂隙',
        specialDesc: '强力牵引周围敌人、养分与 DNA 至中心后引发虚空坍缩爆炸。',
      },
      tesla_medusa: {
        name: 'Tesla-Medusa',
        archetype: '高压风暴水母',
        passive: '伤害 +25%，能量回复 +18%，免疫高压电桩电击。',
        specialName: '雷暴过载',
        specialDesc: '同时召唤暴击连锁闪电轰击范围内最多 8 名敌人。',
      },
      venom_hydra: {
        name: 'Venom-Hydra',
        archetype: '剧毒九头母体',
        passive: '生命 +35，伤害 +20%，100% 免疫酸液池且击杀回血。',
        specialName: '瘟疫绽放',
        specialDesc: '在四周生成 4 片大型腐蚀酸池并齐射 6 枚剧毒飞弹。',
      },
      aegis_titan: {
        name: 'Aegis-Titan',
        archetype: '黄金堡垒泰坦',
        passive: '生命 +65，自带 16% 减伤护甲，每次击杀回复 4% 生命。',
        specialName: '不朽圣盾',
        specialDesc: '开启 4 秒无敌护盾、回复 25% 生命并击退反弹来袭敌人。',
      },
      crimson_vamp: {
        name: 'Crimson-Vamp',
        archetype: '猩红吸血领主',
        passive: '移速 +10%，伤害 +18%，每次击杀回复 8% 最大生命与能量。',
        specialName: '鲜血盛宴',
        specialDesc: '向范围内所有敌人发射吸血光束，回复造成总伤害 65% 的生命。',
      },
      prism_phantom: {
        name: 'Prism-Phantom',
        archetype: '棱镜相位幽影',
        passive: '移速 +18%，伤害 +22%，冲刺冷却 -20%，额外 DNA 概率 +15%。',
        specialName: '相位闪现',
        specialDesc: '瞬间向前瞬移 280px，并在起点与落点同时触发暴击棱镜新星。',
      },
      omega_prime: {
        name: 'Omega-Prime',
        archetype: '欧米茄终极君主',
        passive: '生命 +50，移速 +15%，伤害 +28%，护甲 +12%，额外 DNA 概率 +25%。',
        specialName: '欧米茄湮灭',
        specialDesc: '引爆欧米茄超新星、发射 10 道等离子射线并获得 2.5 秒无敌激增。',
      },
      mob_flagella_dart: {
        name: '鞭毛飞镖 (怪物)',
        archetype: '高速突袭怪物株系',
        passive: '移速 +20%，能量回复 +18%，冲刺冷却缩短 22%。',
        specialName: '超音速鞭毛冲刺',
        specialDesc: '高速突刺斩击沿途敌人，并获得 2.6 秒极速推进状态。',
      },
      mob_spike_urchin: {
        name: '尖刺海胆 (怪物)',
        archetype: '尖刺反伤怪物株系',
        passive: '生命 +25，护甲 +10%，伤害 +16%，击杀微量回血。',
        specialName: '360° 刺针新星',
        specialDesc: '向四周 360° 发射 12 根穿甲尖刺造成高额范围伤害。',
      },
      mob_acid_amoeba: {
        name: '酸液变形虫 (怪物)',
        archetype: '腐蚀毒沼怪物株系',
        passive: '生命 +25，伤害 +12%，100% 免疫酸池且击杀回血。',
        specialName: '强酸熔解池',
        specialDesc: '在脚下生成持续 6 秒的大型沸腾酸池，并立即回复 14% 最大生命。',
      },
      mob_shell_diatom: {
        name: '硬壳硅藻 (怪物)',
        archetype: '硅甲堡垒怪物株系',
        passive: '最大生命 +55，自带 18% 高额硅甲减伤。',
        specialName: '硅质壁垒',
        specialDesc: '开启 3 秒无敌硅甲护盾，并释放重击冲击波击退四周敌人。',
      },
      mob_volt_jelly: {
        name: '电压水母 (怪物)',
        archetype: '高压生物电水母',
        passive: '伤害 +18%，回能 +22%，移速 +7%，免疫电桩电击。',
        specialName: '电弧瀑布',
        specialDesc: '释放高能水母连锁闪电，同时暴击电击范围内最多 6 名敌人。',
      },
      mob_leech_parasite: {
        name: '吸血寄生蛭 (怪物)',
        archetype: '吸血寄生怪物株系',
        passive: '移速 +12%，伤害 +14%，每次击杀回复 9% 最大生命。',
        specialName: '寄生虹吸',
        specialDesc: '同时汲取附近所有敌人生命，迅速回复大量生命值与能量。',
      },
      mob_camo_ghost: {
        name: '伪装幽灵 (怪物)',
        archetype: '幽影伏击怪物株系',
        passive: '移速 +15%，伤害 +22%，冲刺冷却 -15%，额外 DNA +12%。',
        specialName: '幽灵突袭',
        specialDesc: '隐身潜行 4 秒、爆发幽影冲击波，并让下次攻击必定暴击。',
      },
      mob_colony_hydra: {
        name: '群落九头蛇 (首领)',
        archetype: '剧毒母巢首领株系',
        passive: '生命 +55，伤害 +22%，护甲 +8%，免疫酸池且击杀回血。',
        specialName: '九头蛇孢子齐射',
        specialDesc: '向 8 个方向齐射腐蚀毒孢，并立即回复 18% 最大生命。',
      },
      mob_iron_leviathan: {
        name: '钢铁利维坦 (首领)',
        archetype: '重甲深海首领株系',
        passive: '最大生命 +80，16% 钢铁重甲减伤，伤害 +24%。',
        specialName: '利维坦主宰冲锋',
        specialDesc: '发动 3.2 秒无敌重甲冲锋并引发毁灭性钢铁震荡波击退敌人。',
      },
      mob_thermo_kraken: {
        name: '热液海妖 (首领)',
        archetype: '深海热液首领株系',
        passive: '生命 +60，伤害 +26%，移速 +8%，免疫热液喷口且击杀回血。',
        specialName: '熔岩触手新星',
        specialDesc: '引爆炙热喷口冲击波击退敌人，并向四周齐射 10 枚烈焰火球。',
      },
      mob_parasite_matriarch: {
        name: '寄生母皇 (首领)',
        archetype: '猩红母巢首领株系',
        passive: '生命 +70，伤害 +24%，免疫酸池，每次击杀回复 10% 最大生命。',
        specialName: '猩红母巢虹吸',
        specialDesc: '汲取周围全部敌人回复高额生命与能量，同时发射 6 枚猩红毒弹。',
      },
      mob_omega_core: {
        name: '欧米茄核心 (最终首领)',
        archetype: '终极反应堆首领株系',
        passive: '生命 +65，伤害 +30%，护甲 +12%，额外 DNA +22%，免疫漩涡。',
        specialName: '反应堆奇点爆发',
        specialDesc: '引爆双层等离子冲击环、齐射 12 道欧米茄射线并获得 2 秒爆发。',
      },
    },
    characterVault: {
      title: '通关角色与怪物库（22 个可解锁株系）',
      subtitle: '消耗诱变点即可解锁 10 个传奇株系与全部 12 种游戏内怪物/首领，均含专属主动特技 [R]',
      mutagenBalance: '当前诱变点',
      unlockedCount: '已解锁',
      postGameLockedBanner: '首次击败第 10 区最终首领 Omega Core 后，即可开放购买全部 22 位传奇角色与怪物/首领',
      postGameReadyBanner: '已通关最终区域！消耗诱变点解锁传奇株系或化身任意怪物与首领出战',
      tabAll: '全部',
      tabLegendary: '10 传奇株系',
      tabMonsters: '12 怪物与首领',
      starterBadge: '初始株系',
      legendaryBadge: '传奇株系',
      monsterBadge: '可玩怪物',
      selectedBadge: '已装备',
      selectBtn: '选择出战',
      unlockBtn: '解锁',
      needClearBtn: '需先通关第 10 区',
      needMutagenBtn: '诱变点不足',
      passiveLabel: '专属特性',
      specialLabel: '专属特技 [R]',
      cooldownLabel: '冷却',
      close: '关闭',
    },
    leaderboard: {
      title: '个人前 10 进化纪录',
      subtitle: '记录得分最高的 10 次进化历程，并保留当时对局使用的玩家昵称',
      empty: '暂无已完成对局纪录，完成一局游戏即可上榜！',
      rankCol: '名次',
      playerCol: '玩家',
      scoreCol: '得分',
      resultCol: '结果 / 难度',
      zoneCol: '区域',
      biomassCol: '生物量',
      killsCol: '吞噬',
      timeCol: '耗时',
      victoryTag: '通关',
      defeatTag: '阵亡',
      close: '关闭',
    },
    codex: {
      title: '生物图鉴与生存指南',
      tabOrganisms: '14 种生物',
      tabSkills: '5 大主根 (16 技能)',
      tabStory: '背景与 10 大区域',
      catFood: '营养物',
      catEnemy: '普通敌人',
      catBoss: '区域首领',
      dnaDrop: '掉落 DNA',
      none: '恢复生命 / 能量',
      howToPlayTitle: '核心生存法则与进化限制',
      howToPlayBullets: [
        '碰撞即可直接吞噬营养球及小于你的敌人；大型敌人需先击碎为 DNA 块再吸收。',
        '进化限制：共 5 大主根系（16 项技能），单局上限随难度调整（新手 24/4、普通 21/3、地狱 18/2）；通关第 10 区进入无尽模式即可全 5 系满级 48/48。',
        '三种难度会动态调整敌方属性与诱变点倍率（地狱模式享受 x1.75 诱变点加成）。',
        '不断成长并击败 5 位独特首领，穿越全部 10 大生态区并摧毁第 10 区的 Omega Core 即可解锁 22 个传奇角色与怪物。',
      ],
      zonesHeading: '全部 10 大微观生态区',
      close: '关闭',
    },
    credits: {
      title: '制作人员与资源声明',
      devRole: '游戏设计与系统开发',
      devName: 'BIO-ROOT Studio — Procedural Web Evolution Team',
      artRole: '2D 矢量与荧光美术',
      artDesc: '全部图形由 HTML5 Canvas 2D 程序化矢量实时绘制（零外部图片依赖，100% 无版权风险）。',
      audioRole: '音效与背景音乐',
      audioDesc: '通过 Web Audio API 实时程序化合成音效与微观环境循环音乐。',
      techRole: '开源技术与字体',
      techDesc: 'React 19、TypeScript、Tailwind CSS、Lucide Icons (ISC)、Google Fonts (Outfit、Plus Jakarta Sans、Noto Sans Thai、Noto Sans SC — SIL OFL)。',
      licenseNote: '完整适配桌面端与移动端触控操作，可直接打包上架 Google Play Store。',
      close: '关闭',
    },
    toasts: {
      skillReady: 'DNA 充足！打开根系进化树生长新器官',
      evolved: '器官进化完成：{name}！',
      zoneUnlocked: '通往第 {zone} 区的通道已解锁！',
      enteredZone: '已进入第 {zone} 区：{name}',
      bossSpawned: '警告！区域首领 {name} 出现了！',
      bossDefeated: '已击败 {name}！快吸收首领 DNA！',
      leechAttached: '被寄生蛭吸附！立即使用冲刺甩开！',
      tooLarge: '目标过大！请先用技能击碎为 DNA 块再吞噬',
      growthCapped: '第 {zone} 区成长已达上限！请立即前往下一区域继续成长与进化',
      evoZoneCapped: '已达第 {zone} 区进化上限（{cap} 点）！前往下一区域以解锁更多进化',
    },
  },
};

export function formatTemplate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  );
}
