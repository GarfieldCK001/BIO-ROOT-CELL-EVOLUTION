import { CHARACTERS, DNA_COLORS, MAX_ZONE, ORGANISMS, ZONES } from './data';
import { computeSoftBodyRadius } from './rules';
import { BiomeHazardZone, EnemySim, FoodKind, PlayerSim, RenderWorldState } from './simTypes';

/**
 * Draw a smooth closed organic soft-body cell path using quadratic midpoint splines.
 */
function traceSoftBodyPath(
  ctx: CanvasRenderingContext2D,
  radius: number,
  time: number,
  speedRatio: number,
  phaseSeed: number,
  segments = 20,
  squashX = 1,
  squashY = 1
): void {
  const ptsX: number[] = new Array(segments);
  const ptsY: number[] = new Array(segments);
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const r = computeSoftBodyRadius(radius, a, time, speedRatio, phaseSeed);
    ptsX[i] = Math.cos(a) * r * squashX;
    ptsY[i] = Math.sin(a) * r * squashY;
  }

  ctx.beginPath();
  const startMx = (ptsX[segments - 1] + ptsX[0]) * 0.5;
  const startMy = (ptsY[segments - 1] + ptsY[0]) * 0.5;
  ctx.moveTo(startMx, startMy);
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    const mx = (ptsX[i] + ptsX[next]) * 0.5;
    const my = (ptsY[i] + ptsY[next]) * 0.5;
    ctx.quadraticCurveTo(ptsX[i], ptsY[i], mx, my);
  }
  ctx.closePath();
}

export function renderBioWorld(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: RenderWorldState
): void {
  const zoneCfg = ZONES[world.zone];
  const { time, cameraX, cameraY, cameraZoom, shakeX, shakeY } = world;

  // 1. Microscope Lens Radial Background
  const bgGrad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    Math.min(width, height) * 0.08,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.78
  );
  bgGrad.addColorStop(0, zoneCfg.bgInner);
  bgGrad.addColorStop(1, zoneCfg.bgOuter);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Parallax Layer A: Deep out-of-focus bubbles & plankton
  ctx.save();
  for (let i = 0; i < world.ambientMotes.length; i++) {
    const m = world.ambientMotes[i];
    const span = 2600;
    let sx = ((m.x - cameraX * m.depth) % span + span) % span - span * 0.5 + width * 0.5;
    let sy = ((m.y - cameraY * m.depth) % span + span) % span - span * 0.5 + height * 0.5;
    sx += Math.sin(time * 0.6 + m.phase) * 14 * m.depth;
    sy += Math.cos(time * 0.5 + m.phase) * 14 * m.depth;
    if (sx < -60 || sx > width + 60 || sy < -60 || sy > height + 60) continue;

    ctx.globalAlpha = 0.08 + m.depth * 0.14;
    ctx.strokeStyle = m.hue;
    ctx.fillStyle = m.hue;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(sx, sy, m.size * (0.7 + m.depth * 0.6), 0, Math.PI * 2);
    if (i % 3 === 0) {
      ctx.stroke();
    } else {
      ctx.fill();
    }
  }
  ctx.restore();

  // 3. Parallax Layer B: Microscope Reticle Scale Grid
  drawMicroscopeGrid(ctx, width, height, cameraX, cameraY, cameraZoom, zoneCfg.gridColor);

  // 4. World-Space Camera Transform
  ctx.save();
  ctx.translate(width * 0.5 + shakeX, height * 0.5 + shakeY);
  ctx.scale(cameraZoom, cameraZoom);
  ctx.translate(-cameraX, -cameraY);

  // 4a. World Dish Boundary Ring
  drawDishBoundary(ctx, zoneCfg.worldRadius, zoneCfg.accentColor, time);

  // 4b. Vortex Fluid Currents (Zones 9 & 10)
  for (const v of world.vortices) {
    drawVortex(ctx, v.x, v.y, v.radius, v.clockwise, time);
  }

  // 4b2. Special Biome Hazards: Cryo Frost, Thermal Hydro-Vents, Shock Conduits
  for (const hz of world.hazardZones) {
    drawBiomeHazard(ctx, hz, time);
  }

  // 4c. Acid Pools (Biome hazards + player corrosive spit puddles)
  for (const pool of world.acidPools) {
    const fade = pool.permanent ? 0.85 : Math.min(1, pool.life / Math.min(1.2, pool.maxLife));
    ctx.save();
    ctx.globalAlpha = fade * (pool.fromPlayer ? 0.55 : 0.48);
    const grad = ctx.createRadialGradient(pool.x, pool.y, pool.radius * 0.15, pool.x, pool.y, pool.radius);
    grad.addColorStop(0, pool.fromPlayer ? '#7dff8e' : '#3bf56c');
    grad.addColorStop(0.7, pool.fromPlayer ? 'rgba(52, 235, 110, 0.45)' : 'rgba(22, 168, 72, 0.35)');
    grad.addColorStop(1, 'rgba(15, 120, 48, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pool.x, pool.y, pool.radius * (1 + Math.sin(time * 2.5 + pool.id) * 0.03), 0, Math.PI * 2);
    ctx.fill();

    // Bubbling rings inside acid pool
    ctx.strokeStyle = 'rgba(170, 255, 185, 0.45)';
    ctx.lineWidth = 1.5;
    for (let b = 0; b < 3; b++) {
      const bt = (time * 0.7 + pool.id * 0.4 + b * 0.33) % 1;
      const bx = pool.x + Math.cos(pool.id + b * 2.1) * pool.radius * 0.45;
      const by = pool.y + Math.sin(pool.id * 1.3 + b * 2.4) * pool.radius * 0.45;
      ctx.globalAlpha = (1 - bt) * fade * 0.55;
      ctx.beginPath();
      ctx.arc(bx, by, 3 + bt * 11, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4d. Zone Gateway Portal (when unlocked on Zones 1..9)
  if (world.portalUnlocked && world.zone < MAX_ZONE) {
    drawZonePortal(ctx, world.portalX, world.portalY, zoneCfg.accentColor, time);
  }

  // 4e. Food Items (Glucose Orb & ATP Spark)
  for (const f of world.foods) {
    if (!isOnScreen(f.x, f.y, f.radius + 30, cameraX, cameraY, width, height, cameraZoom)) continue;
    drawFood(ctx, f.x, f.y, f.radius, f.kind, time + f.phase);
  }

  // 4f. Absorbable DNA Chunks
  for (const chunk of world.dnaChunks) {
    if (!isOnScreen(chunk.x, chunk.y, 40, cameraX, cameraY, width, height, cameraZoom)) continue;
    const col = DNA_COLORS[chunk.dnaType];
    const pulse = 1 + Math.sin(time * 7 + chunk.phase) * 0.14;
    ctx.save();
    ctx.translate(chunk.x, chunk.y);
    ctx.rotate(time * 2.2 + chunk.phase);

    // Outer glow
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, chunk.radius * 1.8 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Double-helix inspired diamond-capsule core
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = col;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -chunk.radius * pulse);
    ctx.lineTo(chunk.radius * 0.72 * pulse, 0);
    ctx.lineTo(0, chunk.radius * pulse);
    ctx.lineTo(-chunk.radius * 0.72 * pulse, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 4g. Siphon Tentacle Tethers (between player and drained targets)
  if (world.siphonTargets.length > 0 && !world.isTitleDemo) {
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 71, 166, 0.58)';
    ctx.lineWidth = 2.2;
    for (const target of world.siphonTargets) {
      ctx.beginPath();
      ctx.moveTo(world.player.x, world.player.y);
      const mx = (world.player.x + target.x) * 0.5 + Math.sin(time * 12) * 12;
      const my = (world.player.y + target.y) * 0.5 + Math.cos(time * 12) * 12;
      ctx.quadraticCurveTo(mx, my, target.x, target.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4h. Mitosis Minions
  for (const m of world.minions) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.fillStyle = 'rgba(255, 232, 117, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, m.radius * 1.55, 0, Math.PI * 2);
    ctx.fill();

    traceSoftBodyPath(ctx, m.radius, time * 1.5, 0.4, m.id, 12);
    ctx.fillStyle = 'rgba(98, 255, 214, 0.72)';
    ctx.strokeStyle = '#fff08a';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, m.radius * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 4i-0. Boss Territory Aggro Boundary Ring (clear visual perimeter for boss domain)
  for (const e of world.enemies) {
    if (!e.isBoss || e.dyingTimer > 0) continue;
    drawBossTerritoryRing(ctx, e.homeX, e.homeY, e.territoryRadius, e.bossEngaged, time);
  }

  // 4i. Enemies & Zone Bosses
  for (const e of world.enemies) {
    if (!isOnScreen(e.x, e.y, e.radius + 140, cameraX, cameraY, width, height, cameraZoom)) continue;
    drawEnemy(ctx, e, time, world.player.radius, world.isTitleDemo);
  }

  // 4j. Projectiles
  for (const p of world.projectiles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-p.radius * 0.22, -p.radius * 0.22, p.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 4k. Player Specimen-0 with Modular Body Parts
  drawPlayerCell(ctx, world.player, time);

  // 4l. Branching Lightning Arcs
  for (const arc of world.lightningArcs) {
    const alpha = Math.max(0, arc.life / arc.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = arc.color;
    ctx.lineWidth = arc.width * 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    arc.points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, arc.width * 0.7);
    ctx.stroke();
    ctx.restore();
  }

  // 4m. Pooled Particles & Expanding Rings
  for (let i = 0; i < world.particles.length; i++) {
    const pt = world.particles[i];
    if (!pt.active) continue;
    const t = Math.max(0, pt.life / pt.maxLife);
    ctx.save();
    ctx.globalAlpha = t;
    if (pt.ring) {
      const expand = 1 + (1 - t) * 2.8;
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = Math.max(1.2, 4.5 * t);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * expand, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(0.8, pt.size * t), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 4n. Floating Combat & DNA Numbers
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < world.floatingTexts.length; i++) {
    const ft = world.floatingTexts[i];
    if (!ft.active) continue;
    const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.6);
    const fontSize = Math.round(14 * ft.scale);
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${fontSize}px 'JetBrains Mono', 'Outfit', sans-serif`;
    ctx.strokeStyle = 'rgba(2, 8, 16, 0.9)';
    ctx.lineWidth = 3.5;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.restore();

  ctx.restore(); // End world camera transform

  // 5. Zone 3 Abyssal Bioluminescent Darkness Lighting Layer
  if (zoneCfg.hasAbyssalDarkness) {
    const playerScreenX = width * 0.5 + (world.player.x - cameraX) * cameraZoom + shakeX;
    const playerScreenY = height * 0.5 + (world.player.y - cameraY) * cameraZoom + shakeY;
    const lightRadius = Math.max(210, (world.player.radius * 7.8 + 140) * cameraZoom);

    ctx.save();
    const darkGrad = ctx.createRadialGradient(
      playerScreenX,
      playerScreenY,
      lightRadius * 0.25,
      playerScreenX,
      playerScreenY,
      lightRadius
    );
    darkGrad.addColorStop(0, 'rgba(2, 6, 18, 0)');
    darkGrad.addColorStop(0.6, 'rgba(2, 6, 18, 0.45)');
    darkGrad.addColorStop(1, 'rgba(1, 3, 12, 0.86)');
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 6. Subtle Critical HP Peripheral Vignette (Gaze routing without blocking playfield)
  if (!world.isTitleDemo && world.player.hp / world.player.maxHp < 0.3) {
    const pulse = 0.22 + Math.sin(time * 7) * 0.1;
    const vig = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.32,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.7
    );
    vig.addColorStop(0, 'rgba(255, 30, 70, 0)');
    vig.addColorStop(1, `rgba(220, 20, 60, ${pulse.toFixed(3)})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }
}

function isOnScreen(
  wx: number,
  wy: number,
  margin: number,
  camX: number,
  camY: number,
  w: number,
  h: number,
  zoom: number
): boolean {
  const halfW = (w * 0.5) / zoom + margin;
  const halfH = (h * 0.5) / zoom + margin;
  return Math.abs(wx - camX) <= halfW && Math.abs(wy - camY) <= halfH;
}

function drawMicroscopeGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  cameraY: number,
  zoom: number,
  color: string
): void {
  const step = 110 * zoom;
  if (step < 18) return;
  const parallax = 0.65;
  const offsetX = ((-cameraX * parallax * zoom) % step + step) % step;
  const offsetY = ((-cameraY * parallax * zoom) % step + step) % step;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  ctx.beginPath();
  for (let x = offsetX; x < width; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = offsetY; y < height; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Subtle microscope calibration crosshairs at major intersections (single batched stroke)
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = offsetX; x < width; x += step * 2) {
    for (let y = offsetY; y < height; y += step * 2) {
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x + 5, y);
      ctx.moveTo(x, y - 5);
      ctx.lineTo(x, y + 5);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawDishBoundary(
  ctx: CanvasRenderingContext2D,
  worldRadius: number,
  accentColor: string,
  time: number
): void {
  ctx.save();
  ctx.strokeStyle = accentColor;
  ctx.globalAlpha = 0.22 + Math.sin(time * 2) * 0.05;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(0, 0, worldRadius + 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.68;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, worldRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawVortex(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  clockwise: boolean,
  time: number
): void {
  ctx.save();
  ctx.translate(x, y);
  const dir = clockwise ? 1 : -1;
  ctx.rotate(time * 0.9 * dir);

  const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, radius);
  grad.addColorStop(0, 'rgba(255, 65, 160, 0.34)');
  grad.addColorStop(0.55, 'rgba(130, 30, 175, 0.16)');
  grad.addColorStop(1, 'rgba(90, 20, 120, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 110, 195, 0.38)';
  ctx.lineWidth = 2.4;
  for (let arm = 0; arm < 4; arm++) {
    const baseAngle = (arm / 4) * Math.PI * 2;
    ctx.beginPath();
    for (let s = 0; s <= 18; s++) {
      const f = s / 18;
      const r = 14 + f * (radius - 18);
      const a = baseAngle + f * 2.4 * dir;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawBiomeHazard(
  ctx: CanvasRenderingContext2D,
  hz: BiomeHazardZone,
  time: number
): void {
  const phase = (hz.id * 1.73) % (Math.PI * 2);
  ctx.save();
  ctx.translate(hz.x, hz.y);

  if (hz.kind === 'cryo') {
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, hz.radius);
    grad.addColorStop(0, 'rgba(130, 232, 255, 0.32)');
    grad.addColorStop(0.65, 'rgba(65, 196, 255, 0.14)');
    grad.addColorStop(1, 'rgba(30, 140, 210, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, hz.radius, 0, Math.PI * 2);
    ctx.fill();

    // Rotating frost crystal spokes
    ctx.rotate(time * 0.18 + phase);
    ctx.strokeStyle = 'rgba(175, 244, 255, 0.42)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const r = hz.radius * 0.72;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(130, 235, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, hz.radius * (0.86 + Math.sin(time * 2 + phase) * 0.03), 0, Math.PI * 2);
    ctx.stroke();
  } else if (hz.kind === 'thermal') {
    const pulse = 0.88 + Math.sin(time * 4.5 + phase) * 0.12;
    const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, hz.radius * pulse);
    grad.addColorStop(0, 'rgba(255, 200, 90, 0.56)');
    grad.addColorStop(0.45, 'rgba(255, 92, 42, 0.3)');
    grad.addColorStop(1, 'rgba(220, 40, 18, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, hz.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Expanding heat wave ring
    const ringF = (time * 0.8 + phase) % 1;
    ctx.strokeStyle = `rgba(255, 162, 82, ${(1 - ringF) * 0.65})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 14 + ringF * (hz.radius - 14), 0, Math.PI * 2);
    ctx.stroke();

    // Vent core crater
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
  } else if (hz.kind === 'shock') {
    // Periodic electrical discharge pylon with clear telegraph charge ring
    const charging = hz.timer < 1.1;
    const chargeProg = charging ? Math.max(0, Math.min(1, 1 - hz.timer / 1.1)) : 0;

    ctx.fillStyle = charging
      ? `rgba(74, 214, 255, ${0.12 + chargeProg * 0.24})`
      : 'rgba(42, 145, 215, 0.08)';
    ctx.beginPath();
    ctx.arc(0, 0, hz.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = charging ? 'rgba(130, 240, 255, 0.82)' : 'rgba(70, 185, 245, 0.3)';
    ctx.lineWidth = charging ? 2.6 : 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, hz.radius * (charging ? 0.22 + chargeProg * 0.78 : 0.92), 0, Math.PI * 2);
    ctx.stroke();

    // Central bio-capacitor node
    ctx.fillStyle = charging ? '#e8ffff' : '#4cc3ff';
    ctx.beginPath();
    ctx.arc(0, 0, 11 + chargeProg * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawZonePortal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  accent: string,
  time: number
): void {
  ctx.save();
  ctx.translate(x, y);
  const r = 56 + Math.sin(time * 3.5) * 4;

  const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, r * 1.45);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.35, accent);
  grad.addColorStop(1, 'rgba(0, 255, 220, 0)');
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.rotate(time * 1.6);
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.rotate(-time * 3.1);
  ctx.strokeStyle = accent;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBossTerritoryRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  engaged: boolean,
  time: number
): void {
  ctx.save();
  ctx.translate(x, y);

  // Subtle territorial floor tint
  const tint = ctx.createRadialGradient(0, 0, radius * 0.65, 0, 0, radius);
  tint.addColorStop(0, 'rgba(255, 59, 108, 0)');
  tint.addColorStop(1, engaged ? 'rgba(255, 45, 95, 0.14)' : 'rgba(255, 168, 76, 0.08)');
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Rotating dashed perimeter boundary
  const pulse = 0.52 + Math.sin(time * (engaged ? 5.5 : 2.2)) * 0.18;
  ctx.rotate(time * (engaged ? 0.25 : 0.08));
  ctx.strokeStyle = engaged
    ? `rgba(255, 68, 114, ${Math.min(0.92, pulse + 0.2).toFixed(3)})`
    : `rgba(255, 186, 92, ${pulse.toFixed(3)})`;
  ctx.lineWidth = engaged ? 3.2 : 2.2;
  ctx.setLineDash([18, 14]);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 8 directional perimeter hazard ticks
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.moveTo(Math.cos(a) * (radius - 10), Math.sin(a) * (radius - 10));
    ctx.lineTo(Math.cos(a) * (radius + 6), Math.sin(a) * (radius + 6));
  }
  ctx.stroke();

  ctx.restore();
}

function drawFood(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  kind: FoodKind,
  t: number
): void {
  const pulse = 1 + Math.sin(t * 4.5) * 0.1;
  ctx.save();
  ctx.translate(x, y);

  if (kind === 'glucose_orb') {
    ctx.fillStyle = 'rgba(110, 255, 184, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.85 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5cf5ab';
    ctx.beginPath();
    ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e5fff2';
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.25, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'atp_spark') {
    // ATP Spark: radiant 4-point golden spark
    ctx.rotate(t * 2.6);
    ctx.fillStyle = 'rgba(255, 232, 92, 0.26)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.0 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffe85c';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rad = i % 2 === 0 ? r * 1.35 * pulse : r * 0.48;
      if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'hp_micro') {
    // Small Bio-Heal Droplet: glowing rose orb with crisp white '+' cross
    ctx.fillStyle = 'rgba(255, 78, 128, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.1 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff4d7d';
    ctx.strokeStyle = '#ffd1df';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.05 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    const arm = r * 0.56;
    ctx.beginPath();
    ctx.moveTo(-arm, 0);
    ctx.lineTo(arm, 0);
    ctx.moveTo(0, -arm);
    ctx.lineTo(0, arm);
    ctx.stroke();
  } else {
    // Small Energy Micro-Cell: glowing cyan-gold diamond capsule
    ctx.rotate(Math.sin(t * 3.2) * 0.25);
    ctx.fillStyle = 'rgba(56, 224, 255, 0.26)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.1 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38e0ff';
    ctx.strokeStyle = '#fff099';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.25 * pulse);
    ctx.lineTo(r * 0.95 * pulse, 0);
    ctx.lineTo(0, r * 1.25 * pulse);
    ctx.lineTo(-r * 0.95 * pulse, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff4a3';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayerCell(ctx: CanvasRenderingContext2D, p: PlayerSim, time: number): void {
  const speed = Math.hypot(p.vx, p.vy);
  const speedRatio = Math.min(1.4, speed / 260);
  const s = p.skills;

  ctx.save();
  ctx.translate(p.x, p.y);

  // Stealth cloak transparency
  const baseAlpha = p.stealthTimer > 0 ? 0.34 : 1;
  ctx.globalAlpha = baseAlpha;

  // 1. Siphon Tentacles (drawn underneath body)
  if (s.siphon_tentacles > 0) {
    const count = 4 + s.siphon_tentacles * 2;
    ctx.save();
    ctx.strokeStyle = '#f447a6';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    for (let i = 0; i < count; i++) {
      const baseA = (i / count) * Math.PI * 2 + time * 0.5;
      const len = p.radius * (0.72 + s.siphon_tentacles * 0.16);
      const sx = Math.cos(baseA) * (p.radius * 0.85);
      const sy = Math.sin(baseA) * (p.radius * 0.85);
      const wave = Math.sin(time * 6 + i * 1.3) * 0.42;
      const cx = Math.cos(baseA + wave) * (p.radius + len * 0.55);
      const cy = Math.sin(baseA + wave) * (p.radius + len * 0.55);
      const ex = Math.cos(baseA - wave * 0.6) * (p.radius + len);
      const ey = Math.sin(baseA - wave * 0.6) * (p.radius + len);

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(cx, cy, ex, ey);
      ctx.stroke();

      ctx.fillStyle = '#ffc7e6';
      ctx.beginPath();
      ctx.arc(ex, ey, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Rotate to player heading for directional organs (tail, fangs, crest)
  ctx.save();
  ctx.rotate(p.angle);

  // 2. Jet Flagella (animated whip tail behind cell)
  if (s.jet_flagella > 0) {
    const tails = Math.min(3, s.jet_flagella);
    for (let tIdx = 0; tIdx < tails; tIdx++) {
      const spread = (tIdx - (tails - 1) * 0.5) * 0.34;
      const tailLen = p.radius * (1.35 + s.jet_flagella * 0.32);
      ctx.save();
      ctx.rotate(spread);
      ctx.strokeStyle = p.dashTimer > 0 ? '#fff0a8' : '#ff8c42';
      ctx.lineWidth = Math.max(2.2, 4.2 - tIdx * 0.6);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-p.radius * 0.82, 0);
      for (let seg = 1; seg <= 8; seg++) {
        const f = seg / 8;
        const tx = -p.radius * 0.82 - f * tailLen;
        const ty = Math.sin(time * (12 + speedRatio * 10) - f * 5.2 + tIdx) * (5 + f * 12);
        ctx.lineTo(tx, ty);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // 3. Bioluminescent Outer Aura (character-tinted + active special auras)
  const charDef = CHARACTERS[p.characterId];
  const auraColor =
    p.juggernautTimer > 0 || p.aegisTimer > 0
      ? 'rgba(255, 206, 72, 0.42)'
      : p.omegaSurgeTimer > 0
      ? 'rgba(255, 79, 147, 0.45)'
      : s.phantom_ambush > 0 && p.stealthTimer > 0
      ? 'rgba(178, 107, 255, 0.45)'
      : `${charDef.accentColor}38`;
  ctx.fillStyle = auraColor;
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    p.radius * (p.juggernautTimer > 0 || p.aegisTimer > 0 || p.omegaSurgeTimer > 0 ? 1.68 : 1.42),
    0,
    Math.PI * 2
  );
  ctx.fill();

  // 3b. Character-Specific Rear/Outer Silhouettes (10 distinct post-game identities)
  drawCharacterUnderlay(ctx, p, time);

  // 4. Chitin Spikes & Front Fangs
  if (s.chitin_spikes > 0) {
    const spikeCount = 6 + s.chitin_spikes * 3;
    ctx.fillStyle = '#ff4264';
    ctx.strokeStyle = '#ffd1dc';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < spikeCount; i++) {
      const a = (i / spikeCount) * Math.PI * 2;
      const tip = p.radius + 7 + s.chitin_spikes * 3.5;
      const baseW = 0.14;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - baseW) * (p.radius * 0.88), Math.sin(a - baseW) * (p.radius * 0.88));
      ctx.lineTo(Math.cos(a) * tip, Math.sin(a) * tip);
      ctx.lineTo(Math.cos(a + baseW) * (p.radius * 0.88), Math.sin(a + baseW) * (p.radius * 0.88));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // Twin curved front predator fangs
    for (const sign of [-1, 1]) {
      ctx.fillStyle = '#fff0f3';
      ctx.beginPath();
      ctx.moveTo(p.radius * 0.72, sign * p.radius * 0.34);
      ctx.quadraticCurveTo(
        p.radius * 1.32,
        sign * p.radius * 0.42,
        p.radius * (1.28 + s.chitin_spikes * 0.1),
        sign * p.radius * 0.14
      );
      ctx.lineTo(p.radius * 0.82, sign * p.radius * 0.16);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 5. Soft-Body Translucent Membrane (colored per selected strain)
  const squashX = 1 + p.squash * 0.24 + (p.dashTimer > 0 ? 0.2 : 0);
  const squashY = 1 - p.squash * 0.18 - (p.dashTimer > 0 ? 0.14 : 0);
  traceSoftBodyPath(ctx, p.radius, time, speedRatio, 0, 22, squashX, squashY);

  const bodyGrad = ctx.createRadialGradient(-p.radius * 0.2, -p.radius * 0.2, p.radius * 0.1, 0, 0, p.radius * 1.1);
  if (p.hitFlash > 0) {
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(1, '#ffd4de');
  } else if (p.juggernautTimer > 0 || p.aegisTimer > 0) {
    bodyGrad.addColorStop(0, '#fff7c2');
    bodyGrad.addColorStop(0.6, '#ffbb33');
    bodyGrad.addColorStop(1, '#d97706');
  } else if (p.characterId === 'specimen_0') {
    bodyGrad.addColorStop(0, 'rgba(130, 255, 240, 0.88)');
    bodyGrad.addColorStop(0.65, 'rgba(20, 198, 190, 0.62)');
    bodyGrad.addColorStop(1, 'rgba(8, 110, 132, 0.78)');
  } else {
    bodyGrad.addColorStop(0, charDef.primaryColor);
    bodyGrad.addColorStop(0.65, `${charDef.secondaryColor}cc`);
    bodyGrad.addColorStop(1, `${charDef.secondaryColor}e6`);
  }
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  ctx.strokeStyle =
    p.hitFlash > 0
      ? '#ffffff'
      : p.stealthTimer > 0
      ? '#d8a6ff'
      : p.characterId === 'specimen_0'
      ? '#7efcf0'
      : charDef.primaryColor;
  ctx.lineWidth = 2.6;
  ctx.stroke();

  // 6. Corrosive Acid Sacs inside cytoplasm
  if (s.corrosive_spit > 0) {
    const sacCount = 2 + s.corrosive_spit;
    for (let i = 0; i < sacCount; i++) {
      const a = (i / sacCount) * Math.PI * 2 + time * 0.8;
      const dist = p.radius * 0.48;
      const sacR = Math.max(3.5, p.radius * 0.16);
      ctx.fillStyle = '#44f56b';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * dist, Math.sin(a) * dist, sacR * (0.9 + Math.sin(time * 5 + i) * 0.14), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 7. Central Pulsing Nucleus (upgrades with Plasmic Nova halo + Character core color)
  const nucPulse = 1 + Math.sin(time * 4.5) * 0.08;
  if (s.plasmic_nova > 0) {
    ctx.strokeStyle = '#3af7c8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 0.56, time * 2, time * 2 + Math.PI * 1.45);
    ctx.stroke();
  }
  ctx.fillStyle = p.hitFlash > 0 ? '#ffffff' : p.characterId === 'specimen_0' ? '#d6fffb' : charDef.primaryColor;
  ctx.beginPath();
  ctx.arc(p.radius * 0.1, 0, p.radius * 0.34 * nucPulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = s.plasmic_nova > 0 ? '#3af7c8' : charDef.coreColor;
  ctx.beginPath();
  ctx.arc(p.radius * 0.16, 0, p.radius * 0.16 * nucPulse, 0, Math.PI * 2);
  ctx.fill();

  // 7b. Character-Specific Overlay Ornaments (crystal crest, dual-hex aegis, Omega core star, etc.)
  drawCharacterOverlay(ctx, p, time);

  // 8. Hexa-Carapace Armor Plates around rim
  if (s.hexa_carapace > 0) {
    const plates = 6;
    ctx.strokeStyle = '#f5c542';
    ctx.fillStyle = 'rgba(245, 197, 66, 0.24)';
    ctx.lineWidth = 2.2 + s.hexa_carapace * 0.4;
    ctx.beginPath();
    for (let i = 0; i < plates; i++) {
      const a = (i / plates) * Math.PI * 2;
      const r = p.radius * 1.07;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 9. Juggernaut Forward Crest
  if (s.juggernaut_charge > 0) {
    ctx.strokeStyle = p.juggernautTimer > 0 ? '#ffffff' : '#ffad42';
    ctx.lineWidth = p.juggernautTimer > 0 ? 4.5 : 3;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 1.18, -0.75, 0.75);
    ctx.stroke();
  }

  ctx.restore(); // End heading rotation

  // 10. Bio-Volt Crackling Arcs around cell membrane (world orientation)
  if (s.bio_volt_pulse > 0) {
    ctx.save();
    ctx.strokeStyle = '#6ce8ff';
    ctx.lineWidth = 1.6;
    const arcs = 2 + s.bio_volt_pulse;
    for (let i = 0; i < arcs; i++) {
      const a0 = time * 3.2 + (i / arcs) * Math.PI * 2;
      const a1 = a0 + 0.55;
      const r = p.radius * 1.14;
      const mx = Math.cos((a0 + a1) * 0.5) * (r + Math.sin(time * 28 + i * 5) * 6);
      const my = Math.sin((a0 + a1) * 0.5) * (r + Math.cos(time * 24 + i * 3) * 6);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a0) * r, Math.sin(a0) * r);
      ctx.lineTo(mx, my);
      ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 11. Phantom Ambush Violet Aura Ring
  if (s.phantom_ambush > 0) {
    ctx.save();
    ctx.strokeStyle = p.ambushCritReady ? '#e4b8ff' : 'rgba(178, 107, 255, 0.55)';
    ctx.lineWidth = p.ambushCritReady ? 2.4 : 1.4;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 1.28, time * 1.5, time * 1.5 + Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 11b. Elemental & Symbiont Organ Mutations (Cryo Membrane / Thermal Core / Gravity Cilia / Singularity Bloom)
  if (s.cryo_membrane > 0) {
    ctx.save();
    ctx.rotate(time * 0.5);
    ctx.strokeStyle = 'rgba(124, 232, 255, 0.7)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const rad = p.radius * 1.24;
      if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  if (s.thermal_vent_core > 0) {
    ctx.save();
    const heatGrad = ctx.createRadialGradient(0, 0, p.radius * 0.1, 0, 0, p.radius * 0.9);
    heatGrad.addColorStop(0, 'rgba(255, 160, 70, 0.45)');
    heatGrad.addColorStop(1, 'rgba(255, 90, 40, 0)');
    ctx.fillStyle = heatGrad;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (s.gravity_cilia > 0 || s.singularity_bloom > 0) {
    ctx.save();
    ctx.rotate(-time * 1.15);
    ctx.strokeStyle = s.singularity_bloom > 0 ? 'rgba(232, 121, 249, 0.65)' : 'rgba(192, 132, 252, 0.48)';
    ctx.lineWidth = s.singularity_bloom > 0 ? 2.2 : 1.4;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * (s.singularity_bloom > 0 ? 1.42 : 1.32), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 12. Active Character Special Field Rings (Chrono Timefield / Aegis Shield / Omega Surge)
  if (p.chronoTimer > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(252, 211, 77, 0.72)';
    ctx.fillStyle = 'rgba(252, 211, 77, 0.08)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([14, 10]);
    ctx.rotate(time * 0.7);
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  if (p.aegisTimer > 0) {
    ctx.save();
    ctx.strokeStyle = '#fef08a';
    ctx.fillStyle = 'rgba(250, 204, 21, 0.18)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 1.52, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  if (p.omegaSurgeTimer > 0) {
    ctx.save();
    ctx.rotate(-time * 2.4);
    ctx.strokeStyle = '#ff4f93';
    ctx.lineWidth = 3.2;
    ctx.setLineDash([18, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 1.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawCharacterUnderlay(ctx: CanvasRenderingContext2D, p: PlayerSim, time: number): void {
  const r = p.radius;
  switch (p.characterId) {
    case 'pyro_phage': {
      // Orbiting solar flame corona spikes
      ctx.fillStyle = 'rgba(255, 110, 40, 0.75)';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + time * 1.6;
        const flare = r * (1.28 + Math.sin(time * 7 + i) * 0.12);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a - 0.18) * r * 0.85, Math.sin(a - 0.18) * r * 0.85);
        ctx.lineTo(Math.cos(a) * flare, Math.sin(a) * flare);
        ctx.lineTo(Math.cos(a + 0.18) * r * 0.85, Math.sin(a + 0.18) * r * 0.85);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'tesla_medusa': {
      // Trailing bioluminescent plasma tendrils behind the cell
      ctx.strokeStyle = '#38e8ff';
      ctx.lineWidth = 2.0;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, i * r * 0.28);
        ctx.quadraticCurveTo(
          -r * 1.3,
          i * r * 0.35 + Math.sin(time * 10 + i * 1.4) * 8,
          -r * 1.95,
          i * r * 0.24
        );
        ctx.stroke();
      }
      break;
    }
    case 'venom_hydra': {
      // 4 glowing satellite acid lobes around membrane
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + time * 0.9;
        ctx.fillStyle = 'rgba(74, 222, 128, 0.52)';
        ctx.strokeStyle = '#d9f99d';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.88, Math.sin(a) * r * 0.88, r * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      break;
    }
    case 'crimson_vamp': {
      // Barbed crimson predator spines swept backward
      ctx.fillStyle = '#fb4570';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a - 0.14) * r * 0.9, Math.sin(a - 0.14) * r * 0.9);
        ctx.lineTo(Math.cos(a) * r * 1.38, Math.sin(a) * r * 1.38);
        ctx.lineTo(Math.cos(a + 0.14) * r * 0.9, Math.sin(a + 0.14) * r * 0.9);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'mob_flagella_dart': {
      // Twin whipping orange dart flagella behind player
      ctx.strokeStyle = '#ff823d';
      ctx.lineWidth = 3.0;
      ctx.lineCap = 'round';
      for (const side of [-0.28, 0.28]) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.65, side * r);
        ctx.quadraticCurveTo(
          -r * 1.55,
          side * r + Math.sin(time * 16 + side * 4) * 10,
          -r * 2.3,
          side * r * 0.6
        );
        ctx.stroke();
      }
      break;
    }
    case 'mob_spike_urchin': {
      // 10 sharp sea-urchin quills radiating around player
      ctx.strokeStyle = '#ff385c';
      ctx.lineWidth = 3.0;
      ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + time * 0.4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82);
        ctx.lineTo(Math.cos(a) * r * 1.48, Math.sin(a) * r * 1.48);
        ctx.stroke();
      }
      break;
    }
    case 'mob_volt_jelly': {
      // Trailing jellyfish plasma tentacles
      ctx.strokeStyle = '#74e8ff';
      ctx.lineWidth = 2.0;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, i * r * 0.25);
        ctx.quadraticCurveTo(
          -r * 1.25,
          i * r * 0.35 + Math.sin(time * 11 + i) * 7,
          -r * 1.9,
          i * r * 0.2
        );
        ctx.stroke();
      }
      break;
    }
    case 'mob_colony_hydra': {
      // 5 orbiting mini hydra colony buds
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + time * 0.75;
        ctx.fillStyle = 'rgba(78, 242, 137, 0.62)';
        ctx.strokeStyle = '#e2ff9c';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.94, Math.sin(a) * r * 0.94, r * 0.36, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      break;
    }
    default:
      break;
  }
}

function drawCharacterOverlay(ctx: CanvasRenderingContext2D, p: PlayerSim, time: number): void {
  const r = p.radius;
  switch (p.characterId) {
    case 'cryo_diatom': {
      // Translucent crystalline octagon shell
      ctx.strokeStyle = '#d9faff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + time * 0.25;
        const rad = r * 1.08;
        if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'chrono_cilia': {
      // Dual counter-rotating clockwork arcs
      ctx.save();
      ctx.strokeStyle = '#fcd34d';
      ctx.lineWidth = 2.0;
      ctx.rotate(time * 1.4);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.18, 0, Math.PI * 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.18, Math.PI, Math.PI * 1.7);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'void_amoeba': {
      // Swirling dark singularity accretion ring
      ctx.save();
      ctx.rotate(-time * 1.8);
      ctx.strokeStyle = '#d8b4fe';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'aegis_titan': {
      // Heavy royal-gold hexagonal citadel rim
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const rad = r * 1.12;
        if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'prism_phantom': {
      // Rotating iridescent 4-point spectral star crest
      ctx.save();
      ctx.rotate(time * 1.5);
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rad = i % 2 === 0 ? r * 1.28 : r * 0.68;
        if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'omega_prime': {
      // Iconic dual counter-rotating Omega Reactor rings
      ctx.save();
      ctx.rotate(time * 1.6);
      ctx.strokeStyle = '#7cf7ff';
      ctx.lineWidth = 2.6;
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.rotate(-time * 3.1);
      ctx.strokeStyle = '#ff4f93';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([10, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'mob_shell_diatom': {
      ctx.strokeStyle = '#ffe58f';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const rad = r * 1.12;
        if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'mob_acid_amoeba': {
      ctx.fillStyle = 'rgba(186, 255, 201, 0.65)';
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + time * 1.1;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'mob_leech_parasite': {
      // Forward crimson sucker mouth
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(r * 0.88, 0, r * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a042e';
      ctx.beginPath();
      ctx.arc(r * 0.92, 0, r * 0.11, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'mob_camo_ghost': {
      // Spectral dashed outline + twin glowing eyes
      ctx.strokeStyle = '#ecd9ff';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(r * 0.34, -r * 0.24, r * 0.12, 0, Math.PI * 2);
      ctx.arc(r * 0.34, r * 0.24, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'mob_iron_leviathan': {
      // Heavy octagonal Leviathan carapace + forward crimson core eye
      ctx.strokeStyle = '#fff1b8';
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rad = r * 1.16;
        if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'mob_thermo_kraken': {
      // 6 writhing magma tentacles radiating from the player cell
      ctx.strokeStyle = '#ff8a47';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + time * 0.9;
        const wave = Math.sin(time * 7 + i * 1.4) * 0.28;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78);
        ctx.quadraticCurveTo(
          Math.cos(a + wave) * r * 1.32,
          Math.sin(a + wave) * r * 1.32,
          Math.cos(a - wave * 0.5) * r * 1.72,
          Math.sin(a - wave * 0.5) * r * 1.72
        );
        ctx.stroke();
      }
      break;
    }
    case 'mob_parasite_matriarch': {
      // Crimson orbiting brood pods + vampiric crown ring
      ctx.strokeStyle = '#ff7ab3';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 - time * 1.1;
        ctx.fillStyle = '#ff5c9f';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 1.16, Math.sin(a) * r * 1.16, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'mob_omega_core': {
      // Authentic Omega Core Boss dual glowing reactor rings
      ctx.save();
      ctx.rotate(time * 1.9);
      ctx.strokeStyle = '#7cf7ff';
      ctx.lineWidth = 2.8;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    default:
      break;
  }
}

function drawEnemy(
  ctx: CanvasRenderingContext2D,
  e: EnemySim,
  time: number,
  playerRadius: number,
  isTitleDemo: boolean
): void {
  const def = ORGANISMS[e.kind];
  const speed = Math.hypot(e.vx, e.vy);
  const speedRatio = Math.min(1.2, speed / Math.max(60, def.speed));
  const dyingScale = e.dyingTimer > 0 ? Math.max(0.05, 1 - (0.35 - e.dyingTimer) / 0.35) : 1;

  ctx.save();
  ctx.translate(e.x, e.y);

  // Visible Attack Telegraph before heavy enemy/boss strikes!
  if (e.aiState === 'telegraph' && e.dyingTimer <= 0) {
    const progress = 1 - Math.max(0, e.telegraphTimer / Math.max(0.05, e.telegraphMax));
    if (
      e.kind === 'volt_jelly' ||
      e.kind === 'omega_core' ||
      e.kind === 'thermo_kraken' ||
      e.kind === 'parasite_matriarch'
    ) {
      const blastR =
        e.kind === 'thermo_kraken'
          ? e.radius * 3.0
          : e.kind === 'parasite_matriarch'
          ? e.radius * 3.2
          : e.isBoss
          ? e.radius * 3.1
          : e.radius * 3.8;
      const strokeColor =
        e.kind === 'thermo_kraken'
          ? '#ff7a33'
          : e.kind === 'parasite_matriarch'
          ? '#f447a6'
          : e.kind === 'omega_core'
          ? '#ff55a3'
          : '#35d8ff';
      const fillColor =
        e.kind === 'thermo_kraken'
          ? 'rgba(255, 110, 40, 0.16)'
          : e.kind === 'parasite_matriarch'
          ? 'rgba(244, 71, 166, 0.16)'
          : e.kind === 'omega_core'
          ? 'rgba(255, 70, 150, 0.14)'
          : 'rgba(53, 216, 255, 0.12)';
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = fillColor;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, blastR * progress, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, blastR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (e.kind === 'iron_leviathan' || e.kind === 'camo_ghost') {
      ctx.save();
      ctx.strokeStyle = e.kind === 'iron_leviathan' ? '#ff3b5c' : '#d296ff';
      ctx.lineWidth = e.kind === 'iron_leviathan' ? 4 : 2.5;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(e.chargeDirX * (e.isBoss ? 440 : 220), e.chargeDirY * (e.isBoss ? 440 : 220));
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.scale(dyingScale, dyingScale);
  ctx.globalAlpha = e.dyingTimer > 0 ? dyingScale : e.cloakAlpha;
  ctx.rotate(e.angle);

  // Species-specific external appendages
  if (e.kind === 'flagella_dart') {
    ctx.strokeStyle = '#ffaa66';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-e.radius * 0.8, 0);
    for (let i = 1; i <= 6; i++) {
      const f = i / 6;
      ctx.lineTo(-e.radius * 0.8 - f * e.radius * 1.4, Math.sin(time * 18 - f * 5 + e.phase) * (4 + f * 6));
    }
    ctx.stroke();
  } else if (e.kind === 'spike_urchin') {
    ctx.fillStyle = '#ff385c';
    const spikes = 10;
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2 + time * 1.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.16) * e.radius * 0.8, Math.sin(a - 0.16) * e.radius * 0.8);
      ctx.lineTo(Math.cos(a) * (e.radius * 1.45), Math.sin(a) * (e.radius * 1.45));
      ctx.lineTo(Math.cos(a + 0.16) * e.radius * 0.8, Math.sin(a + 0.16) * e.radius * 0.8);
      ctx.closePath();
      ctx.fill();
    }
  } else if (e.kind === 'volt_jelly') {
    ctx.strokeStyle = '#74e8ff';
    ctx.lineWidth = 1.8;
    for (let t = -2; t <= 2; t++) {
      ctx.beginPath();
      ctx.moveTo(-e.radius * 0.5, t * e.radius * 0.25);
      ctx.quadraticCurveTo(
        -e.radius * 1.2,
        t * e.radius * 0.35 + Math.sin(time * 9 + t + e.phase) * 8,
        -e.radius * 1.85,
        t * e.radius * 0.22
      );
      ctx.stroke();
    }
  } else if (e.kind === 'colony_hydra') {
    // Orbiting hydra lobes
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + time * 0.7;
      const lx = Math.cos(a) * e.radius * 0.82;
      const ly = Math.sin(a) * e.radius * 0.82;
      ctx.fillStyle = 'rgba(78, 242, 137, 0.52)';
      ctx.strokeStyle = '#c8ff9e';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(lx, ly, e.radius * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (e.kind === 'thermo_kraken') {
    // 6 undulating magma-vent tentacles + glowing caldera vents
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + time * 0.55;
      const sway = Math.sin(time * 5.2 + i * 1.1) * 0.32;
      ctx.strokeStyle = i % 2 === 0 ? '#ff6a2b' : '#ffae42';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * e.radius * 0.72, Math.sin(a) * e.radius * 0.72);
      ctx.quadraticCurveTo(
        Math.cos(a + sway) * e.radius * 1.28,
        Math.sin(a + sway) * e.radius * 1.28,
        Math.cos(a - sway * 0.45) * e.radius * 1.66,
        Math.sin(a - sway * 0.45) * e.radius * 1.66
      );
      ctx.stroke();
      ctx.fillStyle = '#ffe07d';
      ctx.beginPath();
      ctx.arc(
        Math.cos(a - sway * 0.45) * e.radius * 1.66,
        Math.sin(a - sway * 0.45) * e.radius * 1.66,
        5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  } else if (e.kind === 'parasite_matriarch') {
    // Crimson brood womb aura + 4 orbiting parasitic egg sacs
    ctx.save();
    ctx.rotate(-time * 0.85);
    ctx.strokeStyle = '#ff7ab3';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 1.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const px = Math.cos(a) * e.radius * 0.96;
      const py = Math.sin(a) * e.radius * 0.96;
      ctx.fillStyle = 'rgba(230, 46, 123, 0.72)';
      ctx.strokeStyle = '#ffd6e8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(px, py, e.radius * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  } else if (e.kind === 'omega_core') {
    // Rotating bio-reactor outer ring
    ctx.save();
    ctx.rotate(time * 1.1);
    ctx.strokeStyle = '#7cf7ff';
    ctx.lineWidth = 4;
    ctx.setLineDash([22, 14]);
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 1.24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Main Cell Membrane
  const squashX = e.kind === 'leech_parasite' ? 1.45 : e.kind === 'flagella_dart' ? 1.24 : 1;
  const squashY = e.kind === 'leech_parasite' ? 0.65 : e.kind === 'flagella_dart' ? 0.82 : 1;
  traceSoftBodyPath(ctx, e.radius, time, speedRatio, e.phase, e.isBoss ? 28 : 16, squashX, squashY);

  ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : def.color;
  ctx.globalAlpha = (e.dyingTimer > 0 ? dyingScale : e.cloakAlpha) * (e.hitFlash > 0 ? 0.95 : 0.72);
  ctx.fill();

  ctx.globalAlpha = e.dyingTimer > 0 ? dyingScale : e.cloakAlpha;
  ctx.strokeStyle = e.hitFlash > 0 ? '#ffffff' : def.coreColor;
  ctx.lineWidth = e.isBoss ? 3.5 : 2;
  ctx.stroke();

  // Shell Diatom & Iron Leviathan armored hexagonal shell overlay
  if (e.kind === 'shell_diatom' || e.kind === 'iron_leviathan') {
    const sides = e.kind === 'iron_leviathan' ? 8 : 6;
    ctx.strokeStyle = '#ffe58f';
    ctx.fillStyle = 'rgba(245, 194, 59, 0.25)';
    ctx.lineWidth = e.isBoss ? 4.2 : 2.6;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      const r = e.radius * 1.06;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Nucleus / Core
  ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : def.coreColor;
  ctx.beginPath();
  ctx.arc(e.radius * 0.14, 0, e.radius * 0.34, 0, Math.PI * 2);
  ctx.fill();

  // Camo Ghost glowing ambush eyes
  if (e.kind === 'camo_ghost') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(e.radius * 0.42, -e.radius * 0.2, 3.2, 0, Math.PI * 2);
    ctx.arc(e.radius * 0.42, e.radius * 0.2, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cryo-Diatom Freeze Crystal Shell
  if (e.freezeTimer > 0) {
    ctx.fillStyle = 'rgba(140, 238, 255, 0.32)';
    ctx.strokeStyle = '#d9faff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const rad = e.radius * 1.15;
      if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();

  // Subtle eatability ring / HP bar for damaged or larger non-boss enemies (hidden on Title Demo)
  if (!isTitleDemo && e.dyingTimer <= 0 && !e.isBoss) {
    const canEat = playerRadius >= e.radius * 1.08;
    if (e.hp < e.maxHp || !canEat) {
      const barW = Math.max(28, e.radius * 1.5);
      const barY = e.y - e.radius - 12;
      ctx.save();
      ctx.globalAlpha = Math.min(0.92, e.cloakAlpha + 0.15);
      ctx.fillStyle = 'rgba(4, 12, 20, 0.78)';
      ctx.fillRect(e.x - barW * 0.5, barY, barW, 4.5);
      ctx.fillStyle = canEat ? '#5cf5ab' : '#ff4f79';
      ctx.fillRect(e.x - barW * 0.5, barY, barW * Math.max(0, e.hp / e.maxHp), 4.5);
      ctx.restore();
    }
  }
}
