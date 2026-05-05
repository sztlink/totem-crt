// luta.js — Fighting game adaptado do Chris Courses para Totem CRT
// Mecânica: Player vs Enemy AI, gravidade, combate, health bars

const W = 640;
const H = 480;
const GRAVITY = 0.5;
const GROUND_Y = 380;
const PLAYER_SPEED = 4;
const AI_SPEED = 2.5;
const JUMP_VEL = -13;
const ATTACK_COOLDOWN = 30;
const SPECIAL_COOLDOWN = 90;
const SPECIAL_SPEED = 5;
const GROUND_WAVE_COOLDOWN = 95;
const GROUND_WAVE_SPEED = 7.2;
const GROUND_WAVE_DAMAGE = 16;
const COMBO_WINDOW = 20;
const DASH_SPEED = 14;
const DASH_DURATION = 12;
const DASH_COOLDOWN = 30;
const DASH_STRIKE_SPEED = 17;
const DASH_STRIKE_DURATION = 14;
const DASH_STRIKE_DAMAGE = 18;
const DASH_STRIKE_COOLDOWN = 90;
const BURST_DAMAGE = 12;
const BURST_KNOCKBACK = 14;
const BURST_COOLDOWN = 120;
const BURST_RADIUS = 100;
const CYBER_JUMP_COOLDOWN = 65;
const CYBER_JUMP_TRAIL_DURATION = 56;
const CYBER_JUMP_TRAIL_INTERVAL = 2;
const CYBER_JUMP_BOLT_DAMAGE = 8;
const CYBER_GROUND_SURGE_SPEED = 9.5;
const CYBER_GROUND_SURGE_DAMAGE = 18;

const P1_ATTACK_DAMAGE = 8;
const P1_SPECIAL_DAMAGE = 20;
const P1_HP = 100;
const P1_NEON_PRIMARY = 'rgb(0, 255, 180)'; // Cyber mint neon
const P1_NEON_SECONDARY = 'rgb(0, 190, 255)'; // Electric cyan-blue

const P2_ATTACK_DAMAGE = 10;
const P2_HP = 180;
const P2_RANGED_DAMAGE = 8;
const P2_NEON_PRIMARY = '#ff4dd9';   // rosa neon
const P2_NEON_SECONDARY = '#9a3dff'; // roxo neon

const IDLE_LOGO_SRC = 'assets/fight/logo_luta.png';
let idleLogoImage = null;
const IDLE_LOGO_FIGHT_SRC = '/assets/LOGOS/logo_fight.png';
let idleFightLogoImage = null;
function ensureIdleLogoLoaded() {
  if (!idleLogoImage) {
    idleLogoImage = new Image();
    idleLogoImage.src = IDLE_LOGO_SRC;
  }
  return idleLogoImage;
}
function ensureIdleFightLogoLoaded() {
  if (!idleFightLogoImage) {
    idleFightLogoImage = new Image();
    idleFightLogoImage.src = IDLE_LOGO_FIGHT_SRC;
  }
  return idleFightLogoImage;
}

// Estado global do jogo
let state = 'idle'; // 'idle' | 'playing' | 'pre_phase2' | 'phase_transition' | 'phase2_intro' | 'dying' | 'won' | 'lost'
let _canvas = null;
let _inputRef = null;

// Entidades
let player = null;
let enemy = null;

// IA
let aiAttackTimer = 0;
let aiJumpTimer = 0;
let aiStrafeDir = 1;
let aiStrafeTimer = 0;
let aiRangedTimer = 0;
let aiMeleeCommitTimer = 0;
let aiP2DashCooldown = 0;
let prevButtonB = false;

// Audio context
let audioCtx = null;

// Timer de batalha
let battleTimer = 60;
let timerFrame = 0;

// Projéteis ativos
let projectiles = [];
let energyFields = [];
let groundWaves = [];
let cyberJumpBolts = [];
let cyberGroundSurges = [];
let bossTraps = [];
let bossTrapTimer = 0;
let bossPowers = [];
let bossPowerTimer = 0;

// Vidas do P1
const P1_MAX_LIVES = 5;
let p1Lives = P1_MAX_LIVES;
const BERSERKER_LIVES_THRESHOLD = 2;
const BERSERKER_DAMAGE_MULT = 1.72;
const BERSERKER_HUD_L1 = '>> P1 OVERDRIVE <<';
const BERSERKER_HUD_L2 = 'LIMITE DE DANO: OFF';

// Super meter
const SUPER_MAX = 100;
let superMeter = 0;
const P1_SUPER_AOE_RADIUS = 300;
const P1_SUPER_HP_FRACTION = 0.32;
const P1_SUPER_FLAT = 20;
const P1_SUPER_MAX_DURATION = 118;
let p1SuperFx = null;
let prevButtonX = false;
let bossCineFx = {
  flash: 0,
  shake: 0,
  glitch: 0,
  bars: 0
};

// Boss phase
let bossPhase = 1;
let phaseTransition = null;
const PHASE2_TRIGGER_PCT = 0.5;
const P2_PHASE2_HP_BONUS = 120;
const P2_PHASE2_SCALE = 1.4;
const P2_PHASE2_DAMAGE = 20;
const P2_BOSS_DASH_DAMAGE = 18;
const P2_PHASE2_SPEED = 3.2;
const TRAP_DAMAGE = 5;
const TRAP_STUN_DURATION = 60;
const TRAP_SPAWN_INTERVAL_MIN = 105;
const TRAP_SPAWN_INTERVAL_MAX = 200;
const TRAP_LIFETIME = 300;
const TRAP_MAX_ACTIVE = 2;
const BOSS_PROJ_SPEED = 4;
const BOSS_PROJ_DAMAGE = 15;
const BOSS_WAVE_DAMAGE = 13;
const BOSS_RAIN_DAMAGE = 11;
const BOSS_POWER_COOLDOWN = 78;
const P2_SHIELD_WIDTH = 56;
const P2_SHIELD_OFFSET_X = 12;
const P2_SHIELD_OFFSET_Y = -52;
const P2_SHIELD_BLOCK_CHANCE = 0.62;
const P2_PHASE2_SHIELD_WIDTH = 50;
const P2_PHASE2_SHIELD_BLOCK_CHANCE = 0.154;
let p2ShieldFlashTimer = 0;
let p2ShieldFailTimer = 0;
let p2ShieldFailX = 0;
let p2ShieldFailY = 0;

// Explosão digital
let deathExplosion = null;

// Victory FX
let victoryTimer = 0;
let victoryParticles = [];
const VICTORY_CORPSE_PAUSE_FRAMES = 42;

function isP1Berserker() {
  return p1Lives <= BERSERKER_LIVES_THRESHOLD;
}

function berserkerScreenFxActive() {
  return isP1Berserker() && (
    state === 'playing' ||
    state === 'pre_phase2' ||
    state === 'phase2_intro'
  );
}

function getBerserkerScreenShake() {
  const t = bgOffset;
  const amp = 1.35;
  return {
    x: (Math.sin(t * 0.37) + Math.sin(t * 0.91) * 0.52) * amp,
    y: (Math.cos(t * 0.29) + Math.sin(t * 0.64) * 0.48) * amp * 0.72
  };
}

function renderBerserkerScreenGlitch(ctx) {
  const t = bgOffset;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < 11; i++) {
    if (Math.sin(t * (0.13 + i * 0.019) + i * 0.88) > 0.28) {
      const gy = (t * (5.5 + i * 1.1) + i * 43) % H;
      ctx.globalAlpha = 0.045 + (i % 4) * 0.02;
      ctx.fillStyle = i % 3 === 0 ? '#00ffee' : i % 3 === 1 ? '#ff00aa' : '#fff44f';
      ctx.fillRect(0, gy, W, 1 + (i % 4));
    }
  }

  for (let v = 0; v < 8; v++) {
    if (Math.sin(t * 0.21 + v * 1.17) > 0.42) {
      const vx = (t * (10 + v * 2.1) + v * 71) % (W - 3);
      ctx.globalAlpha = 0.055;
      ctx.fillStyle = v % 2 ? '#ff66cc' : '#66fff6';
      ctx.fillRect(vx, 0, 2 + (v % 4), H);
    }
  }

  for (let b = 0; b < 6; b++) {
    if (Math.sin(t * 0.35 + b * 2.05) > 0.68) {
      const bx = (t * 19 + b * 97) % (W - 50);
      const bw = 18 + (b * 19) % 55;
      const by = ((t * 12) + b * 79) % (H - 24);
      ctx.globalAlpha = 0.075;
      ctx.fillStyle = b % 2 ? '#ffffff' : '#ff00ff';
      ctx.fillRect(bx, by, bw, 3 + (b % 6));
    }
  }

  if (Math.sin(t * 0.26) > 0.58 || t % 11 === 0 || t % 13 === 4 || t % 17 === 9) {
    const sliceH = 7 + (t % 12);
    const sy = (t * 22 + (t >> 1) * 19) % (H - sliceH);
    ctx.globalAlpha = 0.085;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, sy, W, sliceH);
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = 'rgba(0, 255, 255, 0.75)';
    ctx.fillRect(3, sy + 1, W - 6, sliceH - 2);
    ctx.fillStyle = 'rgba(255, 0, 160, 0.45)';
    ctx.fillRect(0, sy + 2, W, Math.max(1, sliceH - 4));
  }

  if ((t + (t >> 2)) % 10 < 3) {
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, 12 + (t % 8));
    ctx.fillRect(0, H - 16 - (t % 6), W, 16 + (t % 6));
  }

  if (Math.sin(t * 0.41) > 0.75) {
    const gx = (t * 31) % W;
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#ff0066';
    ctx.fillRect(gx, 0, 4, H);
    ctx.fillStyle = '#00fff7';
    ctx.fillRect((gx + 14) % W, 0, 3, H);
  }

  ctx.restore();
}

function getPrePhase2ScreenShake() {
  const prog = Math.min(1, prePhase2Timer / PRE_PHASE2_DURATION);
  const amp = 2.4 + prog * 4.2 + Math.sin(prePhase2Timer * 0.48) * 1.4;
  const T = prePhase2Timer * 1.85 + bgOffset * 0.55;
  return {
    x: (Math.sin(T * 0.53) + Math.sin(T * 1.09) * 0.64) * amp,
    y: (Math.cos(T * 0.47) + Math.sin(T * 0.93) * 0.6) * amp * 0.8
  };
}

function getOverclockScreenShake() {
  const t = bgOffset;
  const amp = 1.8;
  return {
    x: (Math.sin(t * 0.95) + Math.cos(t * 1.7) * 0.45) * amp,
    y: (Math.cos(t * 0.82) + Math.sin(t * 1.35) * 0.4) * amp * 0.62
  };
}

function renderPrePhase2ScreenGlitch(ctx) {
  const T = prePhase2Timer + bgOffset;
  const B = bgOffset;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < 10; i++) {
    if (Math.sin(T * 0.16 + i * 0.9) > 0.28) {
      const y = (T * (2.8 + i * 0.35) + i * 47) % H;
      ctx.globalAlpha = 0.07 + (i % 3) * 0.025;
      ctx.fillStyle = i % 2 ? '#00f5ff' : '#ff45d0';
      ctx.fillRect(0, y, W, 1 + (i % 3));
    }
  }

  if ((T + B * 2) % 6 < 2 || (T * 3) % 11 < 2) {
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
  }

  const sliceH = 14 + (T % 7);
  const sy = (T * 23 + B * 5) % (H - sliceH);
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = 'rgba(255,0,180,0.5)';
  ctx.fillRect(0, sy, W, sliceH);
  ctx.fillStyle = 'rgba(0,255,255,0.35)';
  ctx.fillRect(3, sy + 2, W - 6, sliceH - 4);

  for (let j = 0; j < 6; j++) {
    const bx = (T * 19 + j * 83) % (W - 24);
    const by = (T * 17 + j * 61) % (H - 16);
    if (Math.sin(T * 0.27 + j * 1.1) > 0.42) {
      ctx.globalAlpha = 0.09;
      ctx.fillStyle = j % 2 ? '#ffffff' : '#aa66ff';
      ctx.fillRect(bx, by, 18 + (j % 4) * 6, 2 + (j % 2));
    }
  }

  if (Math.sin(T * 0.31) > 0.55) {
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#ff0066';
    ctx.fillRect(0, 0, 5, H);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(W - 5, 0, 5, H);
  }

  ctx.restore();
}

function renderBossDefeatTerminal(ctx) {
  if (victoryTimer < VICTORY_CORPSE_PAUSE_FRAMES) return;
  const t = victoryTimer - VICTORY_CORPSE_PAUSE_FRAMES;
  const cx = W / 2;
  const cy = H / 2;
  const panelPad = 14;
  const panelX = panelPad;
  const panelY = 24;
  const panelW = W - panelPad * 2;
  const panelH = H - 48;

  // Transition before terminal: full-screen glitch + CRT power-off effect.
  const bootDelay = 30;
  if (t < bootDelay) {
    const p = t / Math.max(1, bootDelay);
    ctx.save();
    ctx.fillStyle = 'rgba(4, 2, 14, 0.98)';
    ctx.fillRect(0, 0, W, H);

    // Glitch bars over the whole screen.
    for (let i = 0; i < 14; i++) {
      if (Math.sin(t * 0.35 + i * 0.7) > -0.15) {
        const gy = (t * (3.2 + i * 0.27) + i * 29) % H;
        const gh = 1 + (i % 3);
        ctx.globalAlpha = 0.08 + (i % 4) * 0.03;
        ctx.fillStyle = i % 2 ? '#00f7ff' : '#ff45d0';
        ctx.fillRect(0, gy, W, gh);
      }
    }

    // Quick white/cyan strobe.
    if ((t % 6) < 2 || Math.sin(t * 0.9) > 0.8) {
      ctx.globalAlpha = 0.08 + (1 - p) * 0.2;
      ctx.fillStyle = t % 2 === 0 ? '#ffffff' : '#6ff8ff';
      ctx.fillRect(0, 0, W, H);
    }

    // "Screen turning off" collapse line, then reopen.
    const offPhase = 1 - Math.abs(0.5 - p) * 2; // peaks in the middle
    const lineH = Math.max(2, Math.floor(H * (1 - offPhase * 0.96)));
    const y = cy - lineH / 2;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(8,0,20,0.85)';
    ctx.fillRect(0, 0, W, y);
    ctx.fillRect(0, y + lineH, W, H - (y + lineH));
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#a6ffff';
    ctx.fillRect(0, cy - 1, W, 2);

    ctx.restore();
    return;
  }

  // Full-screen dark terminal base.
  ctx.save();
  ctx.fillStyle = 'rgba(3, 8, 18, 0.96)';
  ctx.fillRect(0, 0, W, H);

  // Outer cyber frame.
  ctx.strokeStyle = 'rgba(0,255,255,0.45)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00f5ff';
  ctx.shadowBlur = 12;
  ctx.strokeRect(panelX, panelY, panelW, panelH);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,0,180,0.28)';
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX + 6, panelY + 6, panelW - 12, panelH - 12);

  // Scanlines.
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  // Header bar.
  const headPulse = 0.55 + 0.45 * Math.sin(t * 0.08);
  ctx.fillStyle = `rgba(0,255,255,${0.06 + 0.05 * headPulse})`;
  ctx.fillRect(panelX + 2, panelY + 2, panelW - 4, 22);
  ctx.fillStyle = '#89ffff';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('NEURAL CORE TERMINAL :: UNIT CQ-02 :: POST-BATTLE REPORT', panelX + 10, panelY + 17);
  ctx.fillStyle = `rgba(255,120,210,${0.35 + 0.25 * headPulse})`;
  ctx.fillRect(panelX + 8, panelY + 21, panelW - 16, 1);

  // Terminal log area.
  const logX = panelX + 14;
  const logY = panelY + 38;
  const logW = panelW - 28;
  const logH = panelH - 86;
  ctx.fillStyle = 'rgba(0,20,30,0.55)';
  ctx.fillRect(logX, logY, logW, logH);

  const logs = [
    '[BOOT] AI kernel handshake.................OK',
    '[AUTH] Quantum key ladder..................VALID',
    '[SCAN] Combat telemetry stream.............LIVE',
    '[TRACE] Motor cortex thread...............UNSTABLE',
    '[WARN] Adaptive loop divergence............+38%',
    '[WARN] External damage overflow............CRITICAL',
    '[PATCH] Self-healing subsystem.............FAILED',
    '[TRACE] Neural lattice checksum............MISMATCH',
    '[IO] Weapon bus channel A..................OFFLINE',
    '[IO] Weapon bus channel B..................OFFLINE',
    '[CORE] Autonomous routine.................ABORTED',
    '[SEC] Emergency sandbox....................TRIGGERED',
    '[MEM] Conscious shard archive..............SEALED',
    '[SYS] Shutdown sequence....................RUNNING',
  ];

  const lineH = 17;
  const linesVisible = Math.floor(logH / lineH);
  const bootDelayForLogs = 30;
  const logStartT = Math.max(0, t - bootDelayForLogs);
  const progressLines = Math.min(logs.length, Math.floor(logStartT / 11));
  const startLine = Math.max(0, progressLines - linesVisible);

  ctx.font = '13px monospace';
  for (let i = 0; i < linesVisible; i++) {
    const idx = startLine + i;
    if (idx >= progressLines) break;
    const yy = logY + 16 + i * lineH;
    const line = logs[idx];
    const lineLocalT = Math.max(0, logStartT - idx * 11);
    const charCount = Math.max(0, Math.min(line.length, Math.floor(lineLocalT / 1.25)));
    const typingLine = line.slice(0, charCount);
    const glitch = (t + i * 7) % 27 === 0 ? (Math.random() > 0.5 ? ' <ERR>' : ' <SYNC>') : '';
    ctx.fillStyle = idx % 3 === 0 ? '#79f7ff' : idx % 3 === 1 ? '#ff75d8' : '#9af6c5';
    ctx.globalAlpha = 0.9;
    ctx.fillText(`> ${typingLine}${charCount >= line.length ? glitch : ''}`, logX + 8, yy);
  }

  // Cursor blink.
  if (Math.sin(t * 0.3) > 0) {
    const activeIdx = Math.max(0, progressLines - 1);
    const activeLine = logs[Math.min(activeIdx, logs.length - 1)] || '';
    const activeLocalT = Math.max(0, logStartT - activeIdx * 11);
    const activeChars = Math.max(0, Math.min(activeLine.length, Math.floor(activeLocalT / 1.25)));
    const cyLine = logY + 16 + Math.min(linesVisible - 1, Math.max(0, progressLines - startLine - 1)) * lineH - 10;
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(logX + 24 + activeChars * 7, cyLine, 9, 3);
  }

  // Final message block.
  if (t > bootDelay + 64) {
    const a = Math.min(1, (t - (bootDelay + 64)) / 26);
    const bw = Math.min(panelW - 34, 470);
    const bh = 66;
    const bx = cx - bw / 2;
    const by = panelY + panelH - bh - 14;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(8, 12, 28, 0.92)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(255,0,170,0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.textAlign = 'center';
    ctx.font = 'bold 22px monospace';
    ctx.shadowColor = '#ff2bd1';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffd9f5';
    ctx.fillText('BOSS DERROTADO', cx, by + 26);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#9ef7ff';
    ctx.fillText('PROGRAMA FINALIZADO', cx, by + 50);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

function renderPhase2BootTerminal(ctx, t) {
  const cx = W / 2;
  const cy = H / 2;
  const pulse = 0.55 + 0.45 * Math.sin(t * 0.09);

  ctx.save();
  // Full-screen terminal base.
  ctx.fillStyle = 'rgba(2,8,18,0.94)';
  ctx.fillRect(0, 0, W, H);

  // Frame + corners.
  ctx.strokeStyle = `rgba(0,255,255,${0.34 + 0.18 * pulse})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00f6ff';
  ctx.shadowBlur = 12;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(255,0,180,${0.2 + 0.12 * pulse})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 14, W - 28, H - 28);

  // Header.
  ctx.fillStyle = 'rgba(0,255,255,0.08)';
  ctx.fillRect(10, 10, W - 20, 24);
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = '#9afaff';
  ctx.fillText('TERMINAL :: CIRCUIT QUEEN :: PHASE TRANSITION PROTOCOL', 18, 28);

  // Code area.
  const logs = [
    '[BOOT] Linking Queen-Core.................OK',
    '[AUTH] Neural gate.........................OK',
    '[SYNC] Combat matrix.......................OK',
    '[LOAD] Weapon threads......................OK',
    '[LOAD] Shield adapters.....................OK',
    '[PATCH] Adaptive combat layer..............OK',
    '[MODE] Circuit Queen // Phase 2............ONLINE',
  ];
  const startY = 66;
  const lineH = 20;
  const typedLines = Math.min(logs.length, Math.floor(Math.max(0, t - 22) / 10));

  ctx.font = '14px monospace';
  for (let i = 0; i < typedLines; i++) {
    const y = startY + i * lineH;
    const localT = Math.max(0, t - 22 - i * 10);
    const chars = Math.min(logs[i].length, Math.floor(localT / 1.2));
    const line = logs[i].slice(0, chars);
    ctx.fillStyle = i % 2 ? '#7cf8ff' : '#ff8ce6';
    ctx.globalAlpha = 0.9;
    ctx.fillText(`> ${line}`, 24, y);
  }

  // Main title (two-line cyberpunk boot message).
  const titleTop = 'INICIANDO';
  const titleBottom = 'FASE 2 // CIRCUIT QUEEN';
  const topChars = Math.min(titleTop.length, Math.floor(Math.max(0, t - 30) / 1.5));
  const bottomChars = Math.min(titleBottom.length, Math.floor(Math.max(0, t - 44) / 1.25));
  const topText = titleTop.slice(0, topChars);
  const bottomText = titleBottom.slice(0, bottomChars);
  const gx = Math.sin(t * 0.33) > 0.72 ? (Math.random() - 0.5) * 5 : 0;
  const gy = Math.sin(t * 0.29) > 0.8 ? (Math.random() - 0.5) * 2 : 0;

  ctx.textAlign = 'center';

  // Top line (status command style).
  ctx.font = 'bold 22px monospace';
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#ff2e9d';
  ctx.fillText(topText, cx - 2 + gx, cy - 10 + gy);
  ctx.fillStyle = '#00f7ff';
  ctx.fillText(topText, cx + 2 + gx, cy - 10 + gy);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#e9fcff';
  ctx.shadowColor = '#00f7ff';
  ctx.shadowBlur = 12;
  ctx.fillText(topText, cx + gx, cy - 10 + gy);
  ctx.shadowBlur = 0;

  // Divider line.
  if (t > 42) {
    const da = Math.min(1, (t - 42) / 10);
    ctx.globalAlpha = 0.45 * da;
    ctx.strokeStyle = '#00f7ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 180, cy + 3);
    ctx.lineTo(cx + 180, cy + 3);
    ctx.stroke();
  }

  // Bottom line (phase title).
  ctx.font = 'bold 29px monospace';
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#ff2e9d';
  ctx.fillText(bottomText, cx - 2.4 + gx, cy + 32 + gy);
  ctx.fillStyle = '#00f7ff';
  ctx.fillText(bottomText, cx + 2.4 + gx, cy + 32 + gy);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f4feff';
  ctx.shadowColor = '#ff2bd1';
  ctx.shadowBlur = 15;
  ctx.fillText(bottomText, cx + gx, cy + 32 + gy);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';

  // Full-screen terminal scanlines + glitches.
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#000';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  if (Math.sin(t * 0.26) > 0.4) {
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = Math.random() > 0.5 ? '#00f7ff' : '#ff46d1';
    ctx.fillRect(0, (t * 8.4) % H, W, 2);
  }
  ctx.restore();
}

function scaleP1Damage(baseDamage) {
  if (!isP1Berserker()) return baseDamage;
  return Math.round(baseDamage * BERSERKER_DAMAGE_MULT);
}

function enemyBossDashIntangible() {
  return bossPhase >= 2 && enemy && enemy.health > 0 && enemy.dashing && !enemy.dashStrikeActive;
}

function getP2ShieldBox() {
  if (!enemy || enemy.health <= 0) return null;
  if (bossPhase >= 2) {
    const w = P2_PHASE2_SHIELD_WIDTH;
    const h = Math.floor(enemy.h * 0.9);
    const shieldY = enemy.y + Math.floor((enemy.h - h) * 0.12);
    const shieldX = enemy.facingRight
      ? enemy.x + enemy.w - Math.floor(w * 0.35)
      : enemy.x - Math.floor(w * 0.65);
    return { x: shieldX, y: shieldY, w, h };
  }
  const shieldHeight = enemy.h + 12;
  const shieldX = enemy.facingRight
    ? enemy.x + enemy.w + P2_SHIELD_OFFSET_X
    : enemy.x - P2_SHIELD_WIDTH - P2_SHIELD_OFFSET_X;
  const shieldY = enemy.y + P2_SHIELD_OFFSET_Y;
  return { x: shieldX, y: shieldY, w: P2_SHIELD_WIDTH, h: shieldHeight };
}

function p2ShieldBlocksHit(hitBox, hitRef = null) {
  const shieldBox = getP2ShieldBox();
  if (!shieldBox) return false;
  if (!checkCollision(hitBox, shieldBox)) return false;

  const blockChance = bossPhase >= 2 ? P2_PHASE2_SHIELD_BLOCK_CHANCE : P2_SHIELD_BLOCK_CHANCE;
  // Roll only once per projectile/wave to avoid guaranteed block over many frames.
  if (hitRef) {
    if (typeof hitRef._shieldBlockRoll !== 'boolean') {
      hitRef._shieldBlockRoll = Math.random() < blockChance;
    }
    if (!hitRef._shieldBlockRoll) {
      p2ShieldFailTimer = 12;
      p2ShieldFailX = hitBox.x + hitBox.w / 2;
      p2ShieldFailY = hitBox.y + hitBox.h / 2;
      return false;
    }
  } else if (Math.random() >= blockChance) {
    p2ShieldFailTimer = 12;
    p2ShieldFailX = hitBox.x + hitBox.w / 2;
    p2ShieldFailY = hitBox.y + hitBox.h / 2;
    return false;
  }

  const blocked = true;
  if (blocked) p2ShieldFlashTimer = 10;
  return blocked;
}

function renderP2Shield(ctx) {
  if (p2ShieldFlashTimer <= 0 && p2ShieldFailTimer <= 0) return;
  const shieldBox = getP2ShieldBox();
  if (!shieldBox) return;

  const pulse = 0.65 + 0.35 * Math.sin(bgOffset * 0.22);
  const flash = Math.min(1, p2ShieldFlashTimer / 10);
  const alpha = Math.min(0.92, 0.38 + pulse * 0.26 + flash * 0.3);
  const cx = shieldBox.x + shieldBox.w / 2;
  const cy = shieldBox.y + shieldBox.h / 2;
  const rx = shieldBox.w / 2;
  const ry = shieldBox.h / 2;
  const skew = enemy && enemy.facingRight ? 1 : -1;

  ctx.save();
  const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, Math.max(rx, ry) + 16);
  g.addColorStop(0, `rgba(170,255,255,${alpha})`);
  g.addColorStop(0.36, `rgba(80,225,255,${alpha * 0.82})`);
  g.addColorStop(0.7, `rgba(140,70,255,${alpha * 0.4})`);
  g.addColorStop(1, 'rgba(25,70,180,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx + skew * 2, cy, rx + 10, ry + 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer neon shell
  ctx.strokeStyle = `rgba(190,255,255,${0.65 + flash * 0.3})`;
  ctx.lineWidth = 2.2;
  ctx.shadowColor = '#66f2ff';
  ctx.shadowBlur = 16 + flash * 22;
  ctx.beginPath();
  ctx.ellipse(cx + skew * 1.5, cy, rx + 3, ry + 4, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Inner magenta ring for cyberpunk contrast
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(255,110,245,${0.35 + flash * 0.2})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cx + skew * 1, cy, rx - 6, ry - 8, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Hex-like scan segments
  ctx.strokeStyle = `rgba(170,255,255,${0.5 + flash * 0.25})`;
  ctx.lineWidth = 1;
  const segs = 7;
  for (let i = 0; i < segs; i++) {
    const t = i / (segs - 1);
    const sy = shieldBox.y + 8 + t * (shieldBox.h - 16);
    const dx = 9 + Math.sin(bgOffset * 0.3 + i * 0.9) * 3;
    const left = cx - rx + 6 + (i % 2 ? 2 : 0);
    const right = cx + rx - 6 - (i % 2 ? 2 : 0);
    ctx.beginPath();
    ctx.moveTo(left, sy);
    ctx.lineTo(left + dx, sy - 2);
    ctx.lineTo(right - dx, sy - 2);
    ctx.lineTo(right, sy);
    ctx.stroke();
  }

  // Glitch shards
  ctx.fillStyle = `rgba(140,255,255,${0.35 + flash * 0.35})`;
  for (let i = 0; i < 9; i++) {
    const a = bgOffset * 0.18 + i * 0.8;
    const px = cx + Math.cos(a) * (rx * 0.7) + skew * 2;
    const py = cy + Math.sin(a * 1.3) * (ry * 0.85);
    ctx.fillRect(px, py, 2, 2);
  }

  // Failed block effect: digital shield crack/glitch burst.
  if (p2ShieldFailTimer > 0) {
    const fp = p2ShieldFailTimer / 12;
    const failR = 12 + (1 - fp) * 18;
    const fx = p2ShieldFailX || cx;
    const fy = p2ShieldFailY || cy;

    ctx.strokeStyle = `rgba(255,70,180,${0.25 + fp * 0.55})`;
    ctx.lineWidth = 1.4;
    ctx.shadowColor = '#ff2ad4';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(fx, fy, failR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    for (let i = 0; i < 6; i++) {
      const a = i * (Math.PI * 2 / 6) + bgOffset * 0.25;
      const len = 8 + (1 - fp) * 12;
      const x2 = fx + Math.cos(a) * len;
      const y2 = fy + Math.sin(a) * len;
      ctx.strokeStyle = `rgba(255,120,240,${0.2 + fp * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function renderBossPhase2ShieldPassive(ctx) {
  if (bossPhase < 2 || !enemy || enemy.health <= 0) return;
  const b = getP2ShieldBox();
  if (!b) return;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const rx = b.w * 0.52;
  const ry = b.h * 0.42;
  const skew = enemy.facingRight ? 1 : -1;
  const pulse = 0.55 + 0.45 * Math.sin(bgOffset * 0.14);
  const rot = skew * 0.09;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  ctx.globalAlpha = 0.1 + pulse * 0.06;
  const g1 = ctx.createRadialGradient(
    cx + skew * 14, cy - 6, 2,
    cx + skew * 22, cy + 4, Math.max(rx, ry) * 1.35
  );
  g1.addColorStop(0, 'rgba(255, 220, 255, 0.55)');
  g1.addColorStop(0.35, 'rgba(200, 100, 220, 0.2)');
  g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g1;
  ctx.beginPath();
  ctx.ellipse(cx + skew * 8, cy, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.08 + pulse * 0.05;
  const g2 = ctx.createRadialGradient(cx - skew * 10, cy + 10, 0, cx, cy, rx * 0.9);
  g2.addColorStop(0, 'rgba(120, 255, 255, 0.45)');
  g2.addColorStop(0.5, 'rgba(60, 180, 255, 0.12)');
  g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.ellipse(cx + skew * 4, cy + 2, rx * 0.78, ry * 0.88, -rot * 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.22 + pulse * 0.12;
  ctx.strokeStyle = `rgba(160, 255, 255, ${0.35 + pulse * 0.25})`;
  ctx.lineWidth = 1.4;
  ctx.shadowColor = '#66ffff';
  ctx.shadowBlur = 6 + pulse * 6;
  ctx.beginPath();
  ctx.ellipse(cx + skew * 6, cy, rx + 3, ry + 4, rot, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 0.2 + pulse * 0.1;
  ctx.strokeStyle = `rgba(255, 120, 220, ${0.28 + pulse * 0.2})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.ellipse(cx + skew * 6, cy, rx + 8, ry + 10, rot, -0.35 * Math.PI, 0.35 * Math.PI);
  ctx.stroke();
  ctx.setLineDash([]);

  for (let i = 0; i < 14; i++) {
    const t = (i / 14) * Math.PI * 2 + bgOffset * 0.045;
    const px = cx + Math.cos(t) * (rx * 0.82) + skew * 10;
    const py = cy + Math.sin(t * 1.1) * (ry * 0.75);
    ctx.globalAlpha = 0.12 + (i % 4) * 0.03;
    ctx.fillStyle = i % 3 === 0 ? '#ffccff' : i % 3 === 1 ? '#aaffff' : '#ffaadd';
    ctx.beginPath();
    ctx.arc(px, py, 1.1 + (i % 3) * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function triggerBossCinematic(kind, intensity = 1) {
  if (bossPhase < 2) return;
  const i = Math.max(0.2, intensity);
  if (kind === 'spawn') {
    bossCineFx.flash = Math.max(bossCineFx.flash, 0.08 * i);
    bossCineFx.shake = Math.max(bossCineFx.shake, 0.9 * i);
    bossCineFx.glitch = Math.max(bossCineFx.glitch, 0.35 * i);
    bossCineFx.bars = Math.max(bossCineFx.bars, 0.4 * i);
  } else if (kind === 'impact') {
    bossCineFx.flash = Math.max(bossCineFx.flash, 0.2 * i);
    bossCineFx.shake = Math.max(bossCineFx.shake, 1.7 * i);
    bossCineFx.glitch = Math.max(bossCineFx.glitch, 0.65 * i);
    bossCineFx.bars = Math.max(bossCineFx.bars, 0.8 * i);
  } else {
    bossCineFx.flash = Math.max(bossCineFx.flash, 0.12 * i);
    bossCineFx.shake = Math.max(bossCineFx.shake, 1.1 * i);
    bossCineFx.glitch = Math.max(bossCineFx.glitch, 0.45 * i);
    bossCineFx.bars = Math.max(bossCineFx.bars, 0.55 * i);
  }
}

function updateBossCinematic() {
  bossCineFx.flash *= 0.9;
  bossCineFx.shake *= 0.86;
  bossCineFx.glitch *= 0.88;
  bossCineFx.bars *= 0.84;
  if (bossCineFx.flash < 0.002) bossCineFx.flash = 0;
  if (bossCineFx.shake < 0.02) bossCineFx.shake = 0;
  if (bossCineFx.glitch < 0.01) bossCineFx.glitch = 0;
  if (bossCineFx.bars < 0.01) bossCineFx.bars = 0;
}

function renderBossCinematic(ctx) {
  if (bossPhase < 2) return;
  if (bossCineFx.flash <= 0 && bossCineFx.glitch <= 0 && bossCineFx.bars <= 0) return;

  const pulse = 0.5 + 0.5 * Math.sin(bgOffset * 0.2);
  const flashA = Math.min(0.35, bossCineFx.flash);
  const glitchA = Math.min(0.3, bossCineFx.glitch);
  const barsA = Math.min(0.22, bossCineFx.bars);
  const shakePx = Math.min(6, bossCineFx.shake * 2.4);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, `rgba(255,70,220,${flashA * (0.6 + pulse * 0.4)})`);
  overlay.addColorStop(0.55, `rgba(120,0,200,${flashA * 0.45})`);
  overlay.addColorStop(1, `rgba(0,0,0,0)`);
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  if (glitchA > 0.01) {
    ctx.save();
    const shift = (Math.sin(bgOffset * 0.55) * 1.8) * (0.6 + glitchA) + Math.sin(bgOffset * 1.1) * shakePx;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = glitchA * 0.25;
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(Math.max(0, shift), 0, W - Math.abs(shift), H);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(0, 0, W - Math.max(0, shift), H);
    ctx.restore();
  }

  if (barsA > 0.01) {
    ctx.save();
    ctx.globalAlpha = barsA;
    for (let i = 0; i < 5; i++) {
      const y = (bgOffset * 13 + i * 79 + Math.sin(bgOffset * 0.3 + i) * shakePx * 3) % H;
      const h = 1 + (i % 3);
      ctx.fillStyle = i % 2 ? 'rgba(255,0,255,0.6)' : 'rgba(0,255,255,0.45)';
      ctx.fillRect(0, y, W, h);
    }
    ctx.restore();
  }
}

function spawnVictoryFX() {
  victoryTimer = 0;
  victoryParticles = [];
  for (let i = 0; i < 50; i++) {
    victoryParticles.push({
      x: Math.random() * W,
      y: H + Math.random() * 40,
      vy: -1 - Math.random() * 3,
      vx: (Math.random() - 0.5) * 1.5,
      size: 1 + Math.random() * 3,
      color: ['#0ff', '#00ffaa', '#f0f', '#fff', '#ffff00', '#00aaff'][Math.floor(Math.random() * 6)],
      twinkle: Math.random() * Math.PI * 2
    });
  }
}

function spawnDeathExplosion(cx, cy) {
  const particles = [];
  const colors = [P1_NEON_PRIMARY, P1_NEON_SECONDARY, '#ff5bff', '#fff', '#ffe35a', '#7dfbff'];

  // Ring burst
  for (let i = 0; i < 40; i++) {
    const angle = (Math.PI * 2 / 40) * i;
    const speed = 3 + Math.random() * 5;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 60 + Math.random() * 40,
      maxLife: 100,
      type: 'spark'
    });
  }

  // Glitch blocks
  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x: cx + (Math.random() - 0.5) * 40,
      y: cy + (Math.random() - 0.5) * 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      w: 4 + Math.random() * 16,
      h: 2 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 50 + Math.random() * 50,
      maxLife: 100,
      type: 'block',
      glitchTimer: 0
    });
  }

  // Data streams (vertical lines rising up)
  for (let i = 0; i < 15; i++) {
    particles.push({
      x: cx + (Math.random() - 0.5) * 120,
      y: cy,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -2 - Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 70 + Math.random() * 40,
      maxLife: 110,
      type: 'stream',
      chars: Array.from({ length: 3 + Math.floor(Math.random() * 5) }, () =>
        String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))
      )
    });
  }

  // Shockwave rings
  for (let i = 0; i < 3; i++) {
    particles.push({
      x: cx, y: cy,
      radius: 0,
      maxRadius: 100 + i * 60,
      speed: 3 + i * 1.5,
      color: i === 0 ? '#0ff' : i === 1 ? '#f0f' : '#fff',
      life: 30 + i * 10,
      maxLife: 40 + i * 10,
      type: 'ring'
    });
  }

  // Pixel shards burst (denser cyberpunk fragmentation)
  for (let i = 0; i < 64; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.8 + Math.random() * 5.2;
    const size = 2 + Math.floor(Math.random() * 4);
    particles.push({
      x: cx + (Math.random() - 0.5) * 12,
      y: cy + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      size,
      rot: Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 45 + Math.random() * 38,
      maxLife: 83,
      type: 'pixel'
    });
  }

  // Core bloom rings for brighter nova center
  for (let i = 0; i < 2; i++) {
    particles.push({
      x: cx, y: cy,
      radius: 0,
      maxRadius: 70 + i * 40,
      speed: 4 + i * 1.2,
      color: i === 0 ? P1_NEON_PRIMARY : P1_NEON_SECONDARY,
      life: 26 + i * 8,
      maxLife: 34 + i * 10,
      thick: 3.5 - i,
      type: 'novaRing'
    });
  }

  deathExplosion = { particles, timer: 0, fadeIn: 0 };
}

function updateDeathExplosion() {
  if (!deathExplosion) return;
  deathExplosion.timer++;
  if (deathExplosion.fadeIn < 1) deathExplosion.fadeIn += 0.02;

  deathExplosion.particles.forEach(p => {
    p.life--;
    if (p.type === 'spark') {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.size *= 0.98;
    } else if (p.type === 'block') {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.glitchTimer++;
      if (p.glitchTimer % 6 === 0) {
        p.x += (Math.random() - 0.5) * 8;
      }
    } else if (p.type === 'stream') {
      p.x += p.vx;
      p.y += p.vy;
    } else if (p.type === 'ring') {
      p.radius += p.speed;
    } else if (p.type === 'pixel') {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy = p.vy * 0.97 + 0.04;
      p.rot += p.rotSpd;
      p.size *= 0.992;
    } else if (p.type === 'novaRing') {
      p.radius += p.speed;
    }
  });

  deathExplosion.particles = deathExplosion.particles.filter(p => p.life > 0);
}

function renderDeathExplosion(ctx) {
  if (!deathExplosion) return;

  // Soft background pulse to make the detonation feel fuller.
  const t = deathExplosion.timer;
  const pulseA = Math.max(0, 0.26 - t * 0.0052);
  if (pulseA > 0.01) {
    const coreX = player ? player.x + player.w / 2 : W / 2;
    const coreY = player ? player.y + player.h / 2 : H / 2;
    const bg = ctx.createRadialGradient(coreX, coreY, 10, coreX, coreY, 220);
    bg.addColorStop(0, `rgba(0,255,220,${pulseA})`);
    bg.addColorStop(0.45, `rgba(0,140,255,${pulseA * 0.45})`);
    bg.addColorStop(0.85, `rgba(255,0,220,${pulseA * 0.28})`);
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  deathExplosion.particles.forEach(p => {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();

    if (p.type === 'spark') {
      ctx.globalAlpha = alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    } else if (p.type === 'block') {
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = alpha * 0.3;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    } else if (p.type === 'stream') {
      ctx.globalAlpha = alpha * 0.6;
      ctx.font = '8px monospace';
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 4;
      p.chars.forEach((ch, i) => {
        ctx.fillText(ch, p.x, p.y + i * 10);
      });
    } else if (p.type === 'ring') {
      ctx.globalAlpha = alpha * 0.5;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.type === 'pixel') {
      const s = Math.max(1, p.size);
      ctx.globalAlpha = alpha * 0.9;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(-s * 0.5, -s * 0.5, s, s);
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = '#fff';
      ctx.fillRect(-s * 0.25, -s * 0.25, s * 0.5, s * 0.5);
    } else if (p.type === 'novaRing') {
      ctx.globalAlpha = alpha * 0.65;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.thick || 2.5;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  });
}

function spawnP1CyberJumpBolt(fighter) {
  if (!fighter) return;
  const coreColor = Math.random() < 0.5 ? P1_NEON_PRIMARY : P1_NEON_SECONDARY;
  const fanSign = Math.random() < 0.5 ? -1 : 1;
  const px = fighter.x + fighter.w * (0.35 + Math.random() * 0.3);
  const py = fighter.y + fighter.h * (0.25 + Math.random() * 0.5);
  const drift = (Math.random() - 0.5) * 1.8 + fanSign * (0.9 + Math.random() * 1.6);
  cyberJumpBolts.push({
    x: px,
    y: py,
    vx: drift + (fighter.facingRight ? 0.35 : -0.35),
    vy: -0.2 - Math.random() * 0.7,
    size: 8 + Math.random() * 8,
    life: 24 + Math.random() * 10,
    maxLife: 34,
    hitDone: false,
    color: coreColor,
    side: fanSign
  });
}

function updateP1CyberJumpBolts() {
  cyberJumpBolts.forEach(b => {
    b.life--;
    b.x += b.vx;
    b.y += b.vy;
    b.vx *= 0.95;
    b.vy += 0.03;

    if (!b.hitDone && enemy && enemy.health > 0 && state === 'playing') {
      const boltBox = { x: b.x - b.size * 0.5, y: b.y - b.size * 0.5, w: b.size, h: b.size };
      const eBox = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
      if (checkCollision(boltBox, eBox) && !enemyBossDashIntangible()) {
        enemy.takeHit(scaleP1Damage(CYBER_JUMP_BOLT_DAMAGE));
        b.hitDone = true;
      }
    }
  });
  cyberJumpBolts = cyberJumpBolts.filter(b => b.life > 0);
}

function renderP1CyberJumpBolts(ctx) {
  cyberJumpBolts.forEach(b => {
    const a = Math.max(0, b.life / b.maxLife);
    const s = Math.max(2, b.size * (0.45 + a * 0.6));
    const x = b.x;
    const y = b.y;
    ctx.save();
    ctx.globalAlpha = a * 0.95;
    ctx.strokeStyle = `rgba(0,255,255,${0.4 + a * 0.5})`;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#00ffee';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.45, y - s * 0.3);
    ctx.lineTo(x - s * 0.1, y + s * 0.1);
    ctx.lineTo(x + s * 0.15, y - s * 0.05);
    ctx.lineTo(x + s * 0.42, y + s * 0.32);
    ctx.stroke();

    ctx.globalAlpha = a * 0.6;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, s * 1.35);
    glow.addColorStop(0, b.color || 'rgba(140,255,255,0.55)');
    glow.addColorStop(0.45, b.side > 0 ? 'rgba(255,80,240,0.32)' : 'rgba(80,170,255,0.3)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, s * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // Side fan streak: opens the effect outward.
    const dir = b.side > 0 ? 1 : -1;
    ctx.globalAlpha = a * 0.42;
    ctx.strokeStyle = dir > 0 ? 'rgba(255,90,235,0.75)' : 'rgba(80,210,255,0.75)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dir * (s * 2.6), y - s * 0.55);
    ctx.lineTo(x + dir * (s * 3.2), y + s * 0.25);
    ctx.stroke();

    ctx.globalAlpha = a * 0.85;
    ctx.fillStyle = 'rgba(255, 80, 240, 0.88)';
    ctx.fillRect(x - 1.8, y - 1.8, 3.6, 3.6);
    ctx.restore();
  });
}

class CyberGroundSurge {
  constructor(x, dirRight = true) {
    this.x = x;
    this.dirRight = !!dirRight;
    this.y = GROUND_Y - 8;
    this.life = 0;
    this.maxLife = 140;
    this.alive = true;
    this.hitDone = false;
    this.w = 40;
    this.h = 20;
  }

  update() {
    this.life++;
    this.x += this.dirRight ? CYBER_GROUND_SURGE_SPEED : -CYBER_GROUND_SURGE_SPEED;
    if (this.x < -100 || this.x > W + 100 || this.life > this.maxLife) this.alive = false;
  }

  getBox() {
    return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h + 10 };
  }

  render(ctx) {
    const a = Math.max(0, 1 - this.life / this.maxLife);
    const dir = this.dirRight ? 1 : -1;
    const headX = this.x;
    const baseY = GROUND_Y - 4;
    const pulse = 0.55 + 0.45 * Math.sin(this.life * 0.36);
    ctx.save();
    ctx.globalAlpha = 0.88 * a;
    ctx.shadowColor = '#00ffee';
    ctx.shadowBlur = 16 + 6 * pulse;

    // Main sonic wedge
    const g = ctx.createLinearGradient(headX - dir * 52, baseY - 26, headX + dir * 58, baseY + 10);
    g.addColorStop(0, 'rgba(0,255,220,0)');
    g.addColorStop(0.3, 'rgba(0,255,220,0.45)');
    g.addColorStop(0.68, 'rgba(80,200,255,0.52)');
    g.addColorStop(1, 'rgba(255,80,240,0.2)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(headX - dir * 44, baseY + 4);
    ctx.lineTo(headX - dir * 4, baseY - 20 - 4 * pulse);
    ctx.lineTo(headX + dir * 58, baseY - 2);
    ctx.lineTo(headX - dir * 2, baseY + 10 + 3 * pulse);
    ctx.closePath();
    ctx.fill();

    // Sonic rings spreading sideways on ground
    for (let i = 0; i < 3; i++) {
      const ringX = headX - dir * (12 + i * 16);
      const ringW = 14 + i * 10 + pulse * 4;
      const ringH = 5 + i * 2;
      ctx.globalAlpha = a * (0.45 - i * 0.1);
      ctx.strokeStyle = i % 2
        ? 'rgba(255,90,240,0.9)'
        : 'rgba(120,255,255,0.9)';
      ctx.lineWidth = 1.8 - i * 0.35;
      ctx.beginPath();
      ctx.ellipse(ringX, baseY + 2, ringW, ringH, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Wide floor wavefronts (acoustic ripple arcs)
    for (let i = 0; i < 4; i++) {
      const wx = headX - dir * (28 + i * 22);
      const ww = 24 + i * 14 + pulse * 7;
      const wh = 8 + i * 2.4;
      const wa = a * (0.42 - i * 0.08);
      if (wa <= 0) continue;
      ctx.globalAlpha = wa;
      ctx.strokeStyle = i % 2
        ? 'rgba(255,120,245,0.95)'
        : 'rgba(120,255,255,0.95)';
      ctx.lineWidth = 2.2 - i * 0.35;
      ctx.beginPath();
      // Half-open arc for a "sound wave" look moving across floor
      ctx.ellipse(wx, baseY + 4, ww, wh, 0, Math.PI * 0.08, Math.PI * 0.92);
      ctx.stroke();
    }

    // Horizontal sonic bands hugging the ground
    for (let i = 0; i < 5; i++) {
      const bandLen = 18 + i * 14 + pulse * 6;
      const bx = headX - dir * (10 + i * 16);
      const by = baseY + 1 + i * 1.6;
      const ba = a * (0.35 - i * 0.05);
      if (ba <= 0) continue;
      ctx.globalAlpha = ba;
      ctx.strokeStyle = i % 2
        ? 'rgba(0,255,230,0.9)'
        : 'rgba(255,120,255,0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx - dir * bandLen * 0.5, by);
      ctx.lineTo(bx + dir * bandLen * 0.5, by);
      ctx.stroke();
    }

    // Crackling top line
    ctx.globalAlpha = a * 0.9;
    ctx.strokeStyle = 'rgba(210,255,255,0.96)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX - dir * 34, baseY - 2);
    ctx.lineTo(headX - dir * 8, baseY - 10 - 2 * pulse);
    ctx.lineTo(headX + dir * 14, baseY - 4);
    ctx.lineTo(headX + dir * 34, baseY - 13 + 2 * pulse);
    ctx.lineTo(headX + dir * 54, baseY - 5);
    ctx.stroke();

    // Ground glow trail
    const floorGlow = ctx.createRadialGradient(headX, baseY + 3, 0, headX, baseY + 3, 44);
    floorGlow.addColorStop(0, `rgba(0,255,220,${0.25 * a})`);
    floorGlow.addColorStop(0.5, `rgba(255,80,240,${0.18 * a})`);
    floorGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = floorGlow;
    ctx.beginPath();
    ctx.ellipse(headX, baseY + 3, 46, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bright front core
    ctx.globalAlpha = a * 0.95;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(headX + dir * 36, baseY - 3, 4 + pulse * 2, 3 + pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Background animation
let bgOffset = 0;
let bgRaindrops = [];
let bgSmoke = [];
let bgEmbers = [];
let bgImage = null;
let bgImageLoaded = false;
const BG_PHASE2_SRC =
  'assets/fight/Cenario_002.png';
let bgImageP2 = null;
let bgImageP2Loaded = false;
let bgImageP2InitDone = false;
/** true durante transição / fase 2 — troca o fundo no primeiro frame do overlay (flash cobre a troca) */
let showBossPhase2Background = false;
let phase2Intro = null;

const PRE_PHASE2_DURATION = 110;
let prePhase2Timer = 0;
const PRE_PHASE2_EXPLOSION_SPRITE = {
  basePath: 'assets/fight/enemy-explosion',
  prefix: 'enemy-explosion-',
  count: 6,
  frameHold: 3,
  scaleMin: 0.9,
  scaleMax: 1.8,
  /** multiplicador aleatório por explosão (algumas bem pequenas, outras grandes) */
  sizeRandMin: 0.42,
  sizeRandMax: 1.65
};
let prePhase2ExplosionSprites = [];
let prePhase2ExplosionSpritesReady = false;
let prePhase2Explosions = [];
let bossImploding = false;
let prePhase2ExplosionSfxCooldown = 0;

function loadPrePhase2ExplosionSprites() {
  if (prePhase2ExplosionSprites.length > 0) return;
  for (let i = 1; i <= PRE_PHASE2_EXPLOSION_SPRITE.count; i++) {
    const img = new Image();
    img.onload = () => {
      if (prePhase2ExplosionSprites.filter(s => s.complete && s.naturalWidth > 0).length >= PRE_PHASE2_EXPLOSION_SPRITE.count) {
        prePhase2ExplosionSpritesReady = true;
      }
    };
    img.src = `${PRE_PHASE2_EXPLOSION_SPRITE.basePath}/${PRE_PHASE2_EXPLOSION_SPRITE.prefix}${i}.png`;
    prePhase2ExplosionSprites.push(img);
  }
}

// =============================================================================
// SPRITE SYSTEM
// =============================================================================

const SPRITE_SCALE = 3;
const DESTROYER_SCALE_FIX = 0.72;
const ENEMY_PHASE2_SPRITE_KEY = 'Enemy-Punk-Phase2';

const SPRITE_DEFS = {
  'Enemy-Punk': {
    basePath: 'assets/fight',
    defaultFacingRight: false,
    animations: {
      idle:  { folder: 'Destroyer/Idle',  prefix: 'idle',  count: 5, speed: 8, loop: true },
      walk:  { folder: 'Destroyer/Walk',  prefix: 'walk',  count: 8, speed: 6, loop: true },
      punch: { folder: 'Destroyer/Punch', prefix: 'punch', count: 3, speed: 5, loop: false },
      hurt:  { folder: 'Destroyer/Hurt',  prefix: 'hurt',  count: 3, speed: 6, loop: false },
      shot:  { folder: 'Destroyer/Shot',  prefix: 'shot',  count: 8, speed: 5, loop: true },
      chargeHit: { folder: 'Destroyer/ChargeImpact', prefix: 'charge', count: 5, speed: 4, loop: false },
      dead:  { folder: 'Destroyer/Dead',  prefix: 'dead',  count: 7, speed: 7, loop: false },
    }
  },
  // Optional phase 2 skin for P2 boss.
  // If these files don't exist yet, runtime falls back to phase 1 sprites.
  [ENEMY_PHASE2_SPRITE_KEY]: {
    basePath: 'assets/fight',
    defaultFacingRight: true,
    animations: {
      idle:  { folder: 'DestroyerPhase2/Idle',  prefix: 'idle',  count: 5, speed: 8, loop: true },
      walk:  { folder: 'DestroyerPhase2/Walk',  prefix: 'walk',  count: 8, speed: 6, loop: true },
      punch1: { folder: 'DestroyerPhase2/Attack1', prefix: 'attack1_', count: 4, speed: 5, loop: false },
      punch2: { folder: 'DestroyerPhase2/Attack2', prefix: 'attack2_', count: 2, speed: 5, loop: false },
      punch3: { folder: 'DestroyerPhase2/Attack3', prefix: 'attack3_', count: 2, speed: 5, loop: false },
      punch4: { folder: 'DestroyerPhase2/Attack4', prefix: 'attack4_', count: 4, speed: 5, loop: false },
      hurt:  { folder: 'DestroyerPhase2/Hurt',  prefix: 'hurt',  count: 3, speed: 6, loop: false },
      shot:  { folder: 'DestroyerPhase2/Shot',  prefix: 'shot',  count: 8, speed: 5, loop: true },
      chargeHit: { folder: 'DestroyerPhase2/ChargeImpact', prefix: 'charge', count: 5, speed: 4, loop: false },
      dead:  { folder: 'DestroyerPhase2/Dead',  prefix: 'dead',  count: 4, speed: 7, loop: false },
    }
  },
  'Brawler-Girl': {
    basePath: 'assets/fight',
    defaultFacingRight: true,
    animations: {
      idle:      { folder: 'player/idle',      prefix: 'idle-',      count: 4,  speed: 8, loop: true },
      walk:      { folder: 'player/walk',      prefix: 'walk-',      count: 16, speed: 4, loop: true },
      run:       { folder: 'player/run',       prefix: 'run-',       count: 8,  speed: 4, loop: true },
      crouch:    { folder: 'player/crouch',    prefix: 'crouch',     count: 1,  speed: 8, loop: false },
      punch:     { folder: 'player/punch',     prefix: 'punch',      count: 1,  speed: 6, loop: false },
      jump:      { folder: 'player/jump',      prefix: 'jump-',      count: 4,  speed: 6, loop: false },
      hurt:      { folder: 'player/hurt',      prefix: 'hurt',       count: 1,  speed: 6, loop: false },
      kick:      { folder: 'Brawler-Girl/Kick',      prefix: 'kick',      count: 5,  speed: 5, loop: false },
      jab:       { folder: 'Brawler-Girl/Jab',       prefix: 'jab',       count: 3,  speed: 4, loop: false },
      jump_kick: { folder: 'player/back-jump', prefix: 'back-jump-', count: 7,  speed: 5, loop: false },
      dive_kick: { folder: 'Brawler-Girl/Dive_kick', prefix: 'dive_kick', count: 5,  speed: 5, loop: false },
    }
  }
};

const spriteCache = {};
let spritesToLoad = 0;
let spritesLoadedCount = 0;
let spritesReady = false;

function loadAllSprites() {
  if (spritesReady || spritesToLoad > 0) return;

  for (const [charName, def] of Object.entries(SPRITE_DEFS)) {
    spriteCache[charName] = {};
    for (const [animName, anim] of Object.entries(def.animations)) {
      spriteCache[charName][animName] = [];
      for (let i = 1; i <= anim.count; i++) {
        spritesToLoad++;
        const img = new Image();
        img.onload = () => {
          spritesLoadedCount++;
          if (spritesLoadedCount >= spritesToLoad) spritesReady = true;
        };
        img.src = `${def.basePath}/${anim.folder}/${anim.prefix}${i}.png`;
        spriteCache[charName][animName].push(img);
      }
    }
  }
}

function getSprite(charName, animName, frameIndex) {
  const frames = spriteCache[charName]?.[animName];
  if (!frames || frames.length === 0) return null;
  return frames[frameIndex % frames.length];
}

function getFighterSpriteKey(fighter) {
  if (fighter && !fighter.isPlayer && fighter.charName === 'Enemy-Punk' && bossPhase >= 2) {
    return ENEMY_PHASE2_SPRITE_KEY;
  }
  return fighter?.charName;
}

function getFighterSpriteDef(fighter) {
  const key = getFighterSpriteKey(fighter);
  return SPRITE_DEFS[key] || SPRITE_DEFS[fighter?.charName];
}

function getFighterSprite(fighter, animName, frameIndex) {
  const key = getFighterSpriteKey(fighter);
  const phaseSprite = getSprite(key, animName, frameIndex);
  if (phaseSprite && phaseSprite.complete && phaseSprite.naturalWidth > 0) return phaseSprite;
  return getSprite(fighter.charName, animName, frameIndex);
}

// =============================================================================
// CLASSES
// =============================================================================

class Fighter {
  constructor(x, y, charName, isPlayer = true) {
    this.x = x;
    this.y = y;
    this.w = 50;
    this.h = 80;
    this.vx = 0;
    this.vy = 0;
    this.charName = charName;
    this.isPlayer = isPlayer;

    this.maxHealth = isPlayer ? P1_HP : P2_HP;
    this.health = this.maxHealth;

    this.attacking = false;
    this.attackFrame = 0;
    this.attackAnimDuration = 15;
    this.activeMeleeAnim = 'punch1';
    this.attackCooldown = 0;

    this.hitFlicker = 0;
    this.hitLanded = false;
    this.onGround = false;
    this.facingRight = isPlayer;
    this.stunTimer = 0;

    // Sprite animation
    this.currentAnim = 'idle';
    this.prevAnim = 'idle';
    this.spriteFrame = 0;
    this.spriteTimer = 0;
    this.forcedAnim = null;
    this.forcedAnimTimer = 0;
    this.queuedProjectileTimer = 0;
    this.queuedProjectileDirRight = true;

    this.attackBox = { x: 0, y: 0, w: 60, h: 40 };

    // Combo / special
    this.inputBuffer = [];
    this.specialCooldown = 0;
    this.prevBackPressed = false;

    // Dash
    this.dashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashDir = 1;
    this.dashStrikeActive = false;
    this.dashStrikeTimer = 0;
    this.dashStrikeCooldown = 0;
    this.dashStrikeHitDone = false;
    this.bossDashHitDone = false;
    this.fwdBuffer = [];
    this.prevFwdPressed = false;
    this.afterimages = [];

    // Burst (energy field)
    this.bfBuffer = [];
    this.burstCooldown = 0;
    this.groundWaveCooldown = 0;
    this.cyberJumpCooldown = 0;
    this.cyberJumpTrailTimer = 0;
    this.cyberJumpInputBuffer = 0;
  }

  getAnimState() {
    const def = getFighterSpriteDef(this);
    if (this.health <= 0 && def.animations.dead) return 'dead';
    if (this.hitFlicker > 0) return 'hurt';
    if (this.dashing && this.onGround && def.animations.walk) return 'walk';
    if (this.forcedAnimTimer > 0 && this.forcedAnim && def.animations[this.forcedAnim]) return this.forcedAnim;
    if (!this.onGround) {
      if (this.attacking && def.animations.jump_kick) {
        // Falling + attack = dive_kick, rising + attack = jump_kick
        if (this.vy > 0 && def.animations.dive_kick) return 'dive_kick';
        return 'jump_kick';
      }
      return def.animations.jump ? 'jump' : 'idle';
    }
    if (this.attacking) {
      if (this.activeMeleeAnim && def.animations[this.activeMeleeAnim]) return this.activeMeleeAnim;
      if (!this.isPlayer && this.charName === 'Enemy-Punk' && bossPhase >= 2 && def.animations.punch1) return 'punch1';
      return 'punch';
    }
    if (Math.abs(this.vx) > 0.5) return 'walk';
    return 'idle';
  }

  update(dt) {
    if (this.stunTimer > 0) {
      this.stunTimer--;
      this.vx = 0;
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + this.h >= GROUND_Y) {
        this.y = GROUND_Y - this.h;
        this.vy = 0;
        this.onGround = true;
      }
      if (this.hitFlicker > 0) this.hitFlicker--;
      return;
    }

    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    if (this.y + this.h >= GROUND_Y) {
      this.y = GROUND_Y - this.h;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    if (this.x < 10) this.x = 10;
    if (this.x > W - this.w - 10) this.x = W - this.w - 10;

    const opponent = this.isPlayer ? enemy : player;
    if (opponent) {
      const dx = opponent.x - this.x;
      if (Math.abs(dx) > 4) this.facingRight = dx > 0;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.dashStrikeCooldown > 0) this.dashStrikeCooldown--;
    if (this.burstCooldown > 0) this.burstCooldown--;
    if (this.groundWaveCooldown > 0) this.groundWaveCooldown--;
    if (this.cyberJumpCooldown > 0) this.cyberJumpCooldown--;
    if (this.cyberJumpTrailTimer > 0) this.cyberJumpTrailTimer--;
    if (this.cyberJumpInputBuffer > 0) this.cyberJumpInputBuffer--;
    if (this.forcedAnimTimer > 0) this.forcedAnimTimer--;

    if (!this.isPlayer && this.queuedProjectileTimer > 0) {
      this.queuedProjectileTimer--;
      if (this.queuedProjectileTimer <= 0 && state === 'playing' && this.health > 0) {
        const px = this.queuedProjectileDirRight ? this.x + this.w + 8 : this.x - 8;
        const py = this.y - 45;
        projectiles.push(new Projectile(px, py, this.queuedProjectileDirRight, this));
        sndBossProjectileSfx();
      }
    }

    // Dash movement
    if (this.dashing) {
      this.vx = (this.dashStrikeActive ? DASH_STRIKE_SPEED : DASH_SPEED) * this.dashDir;
      this.dashTimer--;
      if (this.dashStrikeActive) this.dashStrikeTimer--;

      this.afterimages.push({
        x: this.x, y: this.y, w: this.w, h: this.h,
        anim: this.currentAnim, frame: this.spriteFrame,
        facingRight: this.facingRight, alpha: 0.7, life: 18,
        tint: this.dashStrikeActive
          ? (this.afterimages.length % 2 === 0 ? [217, 255, 47] : [57, 255, 143])
          : (this.afterimages.length % 2 === 0 ? [0, 255, 255] : [0, 200, 255])
      });

      if (this.dashTimer <= 0 || (this.dashStrikeActive && this.dashStrikeTimer <= 0)) {
        this.dashing = false;
        this.dashStrikeActive = false;
        this.vx = 0;
        this.bossDashHitDone = false;
      }
    }

    if (
      this.isPlayer &&
      this.cyberJumpTrailTimer > 0 &&
      state === 'playing' &&
      (this.cyberJumpTrailTimer % CYBER_JUMP_TRAIL_INTERVAL) === 0
    ) {
      spawnP1CyberJumpBolt(this);
    }

    // Afterimages decay
    this.afterimages.forEach(a => { a.life--; a.alpha -= 0.04; });
    this.afterimages = this.afterimages.filter(a => a.life > 0 && a.alpha > 0);

    if (this.attacking) {
      this.attackFrame++;
      if (this.attackFrame > this.attackAnimDuration) {
        this.attacking = false;
        this.attackFrame = 0;
        this.activeMeleeAnim = 'punch1';
        this.attackAnimDuration = 15;
      }
    }

    if (this.hitFlicker > 0) this.hitFlicker--;

    // Sprite animation state machine
    const newAnim = this.getAnimState();
    if (newAnim !== this.currentAnim) {
      this.currentAnim = newAnim;
      this.spriteFrame = 0;
      this.spriteTimer = 0;
    }

    const def = getFighterSpriteDef(this);
    const animDef = def.animations[this.currentAnim] || def.animations.idle;

    this.spriteTimer++;
    if (this.spriteTimer >= animDef.speed) {
      this.spriteTimer = 0;
      if (this.spriteFrame < animDef.count - 1) {
        this.spriteFrame++;
      } else if (animDef.loop) {
        this.spriteFrame = 0;
      }
    }

    this.updateAttackBox();
  }

  updateAttackBox() {
    this.attackBox.x = this.x + (this.facingRight ? this.w : -this.attackBox.w);
    this.attackBox.y = this.y + 15;
  }

  attack() {
    if (this.attackCooldown > 0 || this.attacking) return;
    const def = getFighterSpriteDef(this);
    let meleeAnim = 'punch';
    if (!this.isPlayer && this.charName === 'Enemy-Punk' && bossPhase >= 2) {
      // Weighted random: favor attack 1 because it has more frames/impact.
      const roll = Math.random();
      if (roll < 0.5) meleeAnim = 'punch1';
      else if (roll < 0.68) meleeAnim = 'punch2';
      else if (roll < 0.84) meleeAnim = 'punch3';
      else meleeAnim = 'punch4';
      if (!def.animations[meleeAnim]) meleeAnim = 'punch1';
    }
    const animDef = def.animations[meleeAnim] || def.animations.punch1 || def.animations.punch;

    this.attacking = true;
    this.attackFrame = 0;
    this.activeMeleeAnim = meleeAnim;
    this.attackAnimDuration = Math.max(8, animDef.count * animDef.speed - 1);
    this.hitLanded = false;
    this.attackCooldown = ATTACK_COOLDOWN;
    if (this.isPlayer) sndPunchP1();
    else sndPunch();
  }

  jump() {
    if (!this.onGround) return;
    this.vy = JUMP_VEL;
    if (this.isPlayer) sndP1JumpSfx();
    else sndJump();
  }

  recordBack(frameCount) {
    this.inputBuffer.push(frameCount);
    if (this.inputBuffer.length > 5) this.inputBuffer.shift();
  }

  checkCombo(frameCount) {
    if (this.specialCooldown > 0) return false;
    const buf = this.inputBuffer;
    if (buf.length < 2) return false;
    const last = buf[buf.length - 1];
    const prev = buf[buf.length - 2];
    return (last - prev) <= COMBO_WINDOW;
  }

  recordFwd(frameCount) {
    this.fwdBuffer.push(frameCount);
    if (this.fwdBuffer.length > 5) this.fwdBuffer.shift();
  }

  checkDashCombo(frameCount) {
    if (this.dashCooldown > 0 || this.dashing) return false;
    const buf = this.fwdBuffer;
    if (buf.length < 2) return false;
    const last = buf[buf.length - 1];
    const prev = buf[buf.length - 2];
    return (last - prev) <= COMBO_WINDOW;
  }

  startDash() {
    if (this.dashCooldown > 0 || this.dashing) return;
    this.dashing = true;
    this.dashTimer = DASH_DURATION;
    this.dashDir = this.facingRight ? 1 : -1;
    this.dashStrikeActive = false;
    this.dashStrikeTimer = 0;
    this.dashStrikeHitDone = false;
    this.dashCooldown = DASH_COOLDOWN;
    if (!this.isPlayer) this.bossDashHitDone = false;
    if (!this.isPlayer && bossPhase >= 2) sndBossPhase2DashSfx();
    else sndDashWhoosh();
  }

  startDashStrike() {
    if (!this.isPlayer) return false;
    if (!this.dashing) return false;
    if (this.dashStrikeActive) return false;
    if (this.dashStrikeCooldown > 0) return false;
    this.dashStrikeActive = true;
    this.dashStrikeTimer = DASH_STRIKE_DURATION;
    this.dashTimer = Math.max(this.dashTimer, DASH_STRIKE_DURATION);
    this.dashStrikeHitDone = false;
    this.dashStrikeCooldown = DASH_STRIKE_COOLDOWN;
    this.forcedAnim = null;
    this.forcedAnimTimer = 0;
    sndSpecial();
    return true;
  }

  fireSpecial() {
    if (this.specialCooldown > 0) return;
    this.specialCooldown = SPECIAL_COOLDOWN;

    const px = this.facingRight ? this.x + this.w + 10 : this.x - 10;
    const py = this.y;
    projectiles.push(new Projectile(px, py, this.facingRight, this));
    if (this.isPlayer) sndP1ProjectileSfx();
    else sndSpecial();
  }

  recordBackFwd(frameCount, type) {
    this.bfBuffer.push({ frame: frameCount, type });
    if (this.bfBuffer.length > 6) this.bfBuffer.shift();
  }

  checkBurstCombo(frameCount) {
    if (this.burstCooldown > 0) return false;
    const buf = this.bfBuffer;
    if (buf.length < 2) return false;
    let lastFwd = -1, lastBack = -1;
    for (let i = buf.length - 1; i >= 0; i--) {
      if (buf[i].type === 'fwd' && lastFwd < 0) lastFwd = i;
      if (buf[i].type === 'back' && lastBack < 0) lastBack = i;
    }
    if (lastBack < 0 || lastFwd < 0) return false;
    if (lastBack >= lastFwd) return false;
    return (buf[lastFwd].frame - buf[lastBack].frame) <= COMBO_WINDOW;
  }

  fireBurst() {
    if (this.burstCooldown > 0) return;
    this.burstCooldown = BURST_COOLDOWN;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    energyFields.push(new EnergyField(cx, cy, this));
    sndBurst();
  }

  fireGroundWave() {
    if (this.groundWaveCooldown > 0) return false;
    this.groundWaveCooldown = GROUND_WAVE_COOLDOWN;
    const gx = this.facingRight ? this.x + this.w + 4 : this.x - 4;
    groundWaves.push(new GroundWave(gx, this, this.facingRight));
    if (this.isPlayer) sndP1GroundWaveSfx();
    else sndSpecial();
    return true;
  }

  fireCyberJumpTrail() {
    if (!this.isPlayer) return false;
    if (this.cyberJumpCooldown > 0) return false;

    this.cyberJumpCooldown = CYBER_JUMP_COOLDOWN;
    this.cyberJumpTrailTimer = CYBER_JUMP_TRAIL_DURATION;
    this.vy = JUMP_VEL * 0.82;
    this.forcedAnim = null;
    this.forcedAnimTimer = 0;
    sndP1CyberJumpSfx();
    for (let i = 0; i < 4; i++) spawnP1CyberJumpBolt(this);
    cyberGroundSurges.push(new CyberGroundSurge(this.x + this.w / 2, this.facingRight));
    return true;
  }

  takeHit(damage) {
    this.health -= damage;
    if (this.health < 0) this.health = 0;
    const def = getFighterSpriteDef(this);
    const hurtAnim = def?.animations?.hurt;
    // Keep hurt state long enough to display all hurt frames.
    this.hitFlicker = hurtAnim ? Math.max(10, hurtAnim.count * hurtAnim.speed + 2) : 10;
    if (this.isPlayer) sndP1HitSfx();
    else sndHit();
  }

  triggerAnim(animName) {
    if (!this.isPlayer && this.charName === 'Enemy-Punk' && bossPhase >= 2 && animName === 'shot') {
      // Phase 2: avoid legacy shot fallback sprite.
      animName = 'punch1';
    }
    const def = getFighterSpriteDef(this);
    const anim = def?.animations?.[animName];
    if (!anim) return;
    this.forcedAnim = animName;
    this.forcedAnimTimer = Math.max(4, anim.count * anim.speed);
  }

  queueRangedShot(dirRight) {
    const def = getFighterSpriteDef(this);
    const shotAnim = def?.animations?.shot;
    this.queuedProjectileDirRight = !!dirRight;
    this.queuedProjectileTimer = shotAnim ? Math.max(4, Math.floor(shotAnim.count * shotAnim.speed * 0.62)) : 8;
    this.triggerAnim('shot');
  }

  renderSprite(ctx, sprite, posX, posY, w, h, fRight, alpha) {
    if (!sprite || !sprite.complete || sprite.naturalWidth === 0) return;
    const sw = sprite.naturalWidth;
    const sh = sprite.naturalHeight;
    const dw = sw * SPRITE_SCALE;
    const dh = sh * SPRITE_SCALE;
    const centerX = posX + w / 2;
    const dY = posY + h - dh;
    const def = getFighterSpriteDef(this);
    const needsFlip = fRight !== def.defaultFacingRight;

    ctx.save();
    ctx.globalAlpha = alpha;
    if (needsFlip) {
      ctx.translate(centerX, dY);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, -dw / 2, 0, dw, dh);
    } else {
      ctx.drawImage(sprite, centerX - dw / 2, dY, dw, dh);
    }
    ctx.restore();
  }

  render(ctx) {
    // Afterimages (echo) — sprite copies with fade
    this.afterimages.forEach(a => {
      const ghostSprite = getFighterSprite(this, a.anim, a.frame);
      if (!ghostSprite || !ghostSprite.complete) return;
      const sw = ghostSprite.naturalWidth;
      const sh = ghostSprite.naturalHeight;
      const dw = sw * SPRITE_SCALE;
      const dh = sh * SPRITE_SCALE;
      const gx = a.x + a.w / 2;
      const gy = a.y + a.h - dh;
      const def = getFighterSpriteDef(this);
      const flip = a.facingRight !== def.defaultFacingRight;

      ctx.save();
      ctx.globalAlpha = a.alpha * 0.55;

      if (flip) {
        ctx.translate(gx, gy);
        ctx.scale(-1, 1);
        ctx.drawImage(ghostSprite, -dw / 2, 0, dw, dh);
      } else {
        ctx.drawImage(ghostSprite, gx - dw / 2, gy, dw, dh);
      }

      ctx.restore();
    });

    // Main sprite
    const sprite = getFighterSprite(this, this.currentAnim, this.spriteFrame);

    ctx.save();
    if (!this.isPlayer && bossImploding) {
      const st = 0.15 + 0.85 * Math.abs(Math.sin(bgOffset * 0.55));
      const flick = bgOffset % 5 < 2 ? st * 0.35 : st;
      ctx.globalAlpha = flick;
    } else if (this.hitFlicker > 0 && this.hitFlicker % 4 < 2) {
      ctx.globalAlpha = 0.3;
    }

    if (!sprite || !sprite.complete || sprite.naturalWidth === 0) {
      ctx.fillStyle = this.isPlayer ? '#0ff' : '#f0f';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.restore();
      return;
    }

    const sw = sprite.naturalWidth;
    const sh = sprite.naturalHeight;
    const enemyScaleFix = (!this.isPlayer && this.charName === 'Enemy-Punk') ? DESTROYER_SCALE_FIX : 1;
    const scale = (!this.isPlayer && bossPhase >= 2)
      ? SPRITE_SCALE * enemyScaleFix * P2_PHASE2_SCALE
      : SPRITE_SCALE * enemyScaleFix;
    const dw = sw * scale;
    const dh = sh * scale;

    const cx = this.x + this.w / 2;
    const drawY = this.y + this.h - dh;

    const def = getFighterSpriteDef(this);
    const needsFlip = this.facingRight !== def.defaultFacingRight;

    if (needsFlip) {
      ctx.translate(cx, drawY);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, -dw / 2, 0, dw, dh);
    } else {
      ctx.drawImage(sprite, cx - dw / 2, drawY, dw, dh);
    }

    if (this.isPlayer && this.dashStrikeActive) {
      const pulse = 0.55 + 0.45 * Math.sin(bgOffset * 0.6);
      const ex = needsFlip ? 0 : cx;
      const ey = needsFlip ? dh * 0.55 : drawY + dh * 0.55;
      const aura = ctx.createRadialGradient(ex, ey, 8, ex, ey, Math.max(dw, dh) * 0.72);
      aura.addColorStop(0, `rgba(217,255,47,${0.32 + pulse * 0.18})`);
      aura.addColorStop(0.45, `rgba(57,255,143,${0.2 + pulse * 0.14})`);
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = aura;
      if (needsFlip) {
        ctx.fillRect(-dw * 0.9, -dh * 0.1, dw * 1.8, dh * 1.3);
      } else {
        ctx.fillRect(cx - dw * 0.9, drawY - dh * 0.1, dw * 1.8, dh * 1.3);
      }
    }

    ctx.restore();
  }
}

// =============================================================================
// PROJECTILE — Energy Blast
// =============================================================================

class Projectile {
  constructor(x, y, dirRight, owner) {
    this.x = x;
    this.y = y;
    this.w = 56;
    this.h = 36;
    this.dirRight = dirRight;
    this.owner = owner;
    this.alive = true;
    this.life = 0;
    this.trail = [];
    this.exploding = false;
    this.explodeFrame = 0;
    this.explodeTick = 0;
    this.dataChars = [];
    for (let i = 0; i < 8; i++) {
      this.dataChars.push({
        char: String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)),
        offsetY: (Math.random() - 0.5) * 24,
        speed: 0.5 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.4
      });
    }
  }

  update() {
    if (this.exploding) {
      this.explodeTick++;
      if (this.explodeTick % 3 === 0) this.explodeFrame++;
      if (this.explodeFrame >= 5) this.alive = false;
      return;
    }

    this.x += this.dirRight ? SPECIAL_SPEED : -SPECIAL_SPEED;
    this.life++;

    this.trail.push({ x: this.x, y: this.y, alpha: 1 });
    if (this.trail.length > 20) this.trail.shift();
    this.trail.forEach(t => { t.alpha -= 0.05; });

    // Randomize data chars periodically
    if (this.life % 4 === 0) {
      const idx = Math.floor(Math.random() * this.dataChars.length);
      this.dataChars[idx].char = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
    }

    if (this.x < -60 || this.x > W + 60) this.alive = false;
  }

  render(ctx) {
    const t = bgOffset;
    const pulse = 0.7 + 0.3 * Math.sin(t * 0.2 + this.life * 0.3);
    const isPlayer = this.owner === player;

    if (!isPlayer) {
      if (this.exploding) {
        ctx.save();
        const ip = Math.min(1, this.explodeFrame / 4);
        const r = 14 + ip * 18;
        const blast = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
        blast.addColorStop(0, `rgba(255,255,255,${0.9 - ip * 0.2})`);
        blast.addColorStop(0.35, `rgba(255,90,230,${0.75 - ip * 0.25})`);
        blast.addColorStop(1, 'rgba(120,0,255,0)');
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = blast;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255,140,245,${0.6 - ip * 0.35})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ff40dd';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r * (0.7 + ip * 0.25), 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
        return;
      }

      // Phase 1 boss custom shot (cyberpunk procedural).
      const dir = this.dirRight ? 1 : -1;
      const p = 0.65 + 0.35 * Math.sin(this.life * 0.45);
      ctx.save();

      // Tail ribbon
      ctx.strokeStyle = `rgba(255,70,230,${0.45 + 0.2 * p})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff2be3';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(this.x - dir * 30, this.y + Math.sin(this.life * 0.2) * 1.6);
      ctx.lineTo(this.x - dir * 12, this.y - Math.sin(this.life * 0.32) * 2.2);
      ctx.lineTo(this.x + dir * 4, this.y);
      ctx.stroke();

      // Core orb
      const coreR = 11 + 3 * p;
      const core = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, coreR);
      core.addColorStop(0, 'rgba(255,255,255,0.95)');
      core.addColorStop(0.28, 'rgba(255,140,245,0.9)');
      core.addColorStop(0.75, 'rgba(160,30,255,0.55)');
      core.addColorStop(1, 'rgba(90,0,180,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(this.x, this.y, coreR, 0, Math.PI * 2);
      ctx.fill();

      // Digital shards around core
      ctx.shadowBlur = 0;
      for (let i = 0; i < 6; i++) {
        const a = this.life * 0.18 + i * (Math.PI * 2 / 6);
        const sx = this.x + Math.cos(a) * (9 + 2 * p);
        const sy = this.y + Math.sin(a) * (6 + 1.5 * p);
        const ss = 1.5 + (i % 2);
        ctx.fillStyle = i % 2 ? 'rgba(255,90,220,0.8)' : 'rgba(120,255,255,0.65)';
        ctx.fillRect(sx, sy, ss, ss);
      }

      // Front highlight
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.ellipse(this.x + dir * 2, this.y - 1, 3.8, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return;
    }

    const coreColor = isPlayer ? P1_NEON_PRIMARY : P2_NEON_PRIMARY;
    const glowColor = isPlayer ? 'rgba(57,255,143,' : 'rgba(255,77,217,';
    const trailDir = this.dirRight ? -1 : 1;

    // Digital data trail (katakana stream behind projectile)
    this.dataChars.forEach((dc, i) => {
      const dist = (i + 1) * 10 * trailDir;
      const dx = this.x + dist + Math.sin(this.life * 0.2 + i) * 2;
      const dy = this.y + dc.offsetY;
      ctx.save();
      ctx.font = '8px monospace';
      ctx.fillStyle = coreColor;
      ctx.globalAlpha = dc.alpha * (1 - i / this.dataChars.length) * 0.6;
      ctx.fillText(dc.char, dx, dy);
      ctx.restore();
    });

    // Energy trail (glow orbs)
    this.trail.forEach((tr, i) => {
      if (tr.alpha <= 0) return;
      const trSize = 18 * (tr.alpha * 0.6 + 0.4);
      ctx.save();
      ctx.globalAlpha = tr.alpha * 0.35;
      const g = ctx.createRadialGradient(tr.x, tr.y, 0, tr.x, tr.y, trSize);
      g.addColorStop(0, glowColor + '0.6)');
      g.addColorStop(0.5, glowColor + '0.2)');
      g.addColorStop(1, glowColor + '0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, trSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Small digital sparks along trail
      if (i % 3 === 0 && tr.alpha > 0.3) {
        ctx.save();
        ctx.fillStyle = coreColor;
        ctx.globalAlpha = tr.alpha * 0.5;
        const sx = tr.x + (Math.random() - 0.5) * 12;
        const sy = tr.y + (Math.random() - 0.5) * 12;
        ctx.fillRect(sx, sy, 2, 2);
        ctx.restore();
      }
    });

    // Connecting line (energy beam)
    if (this.trail.length > 2) {
      const tail = this.trail[0];
      ctx.save();
      ctx.strokeStyle = coreColor;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 3;
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();

    // Outer glow (large)
    const outerR = 55 * pulse;
    const outerGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, outerR);
    outerGlow.addColorStop(0, glowColor + '0.4)');
    outerGlow.addColorStop(0.4, glowColor + '0.15)');
    outerGlow.addColorStop(1, glowColor + '0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, outerR, 0, Math.PI * 2);
    ctx.fill();

    // Ring around core
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(this.life * 0.4);
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, 26 * pulse, 17 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Core white (big)
    ctx.globalAlpha = 1;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 30 * pulse;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, 20 * pulse, 13 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // Core color
    ctx.shadowBlur = 20;
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, 15, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright spot
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.7 + 0.3 * pulse;
    ctx.beginPath();
    ctx.ellipse(this.x - 3, this.y - 2, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  getBox() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }
}

// =============================================================================
// P1 GROUND WAVE — Down + Punch power
// =============================================================================

class GroundWave {
  constructor(x, owner, dirRight = true) {
    this.x = x;
    this.y = GROUND_Y;
    this.owner = owner;
    this.dirRight = dirRight;
    this.alive = true;
    this.life = 0;
    this.maxLife = 140;
    this.w = 62;
    this.h = 0;
    this.hitDone = false;
    this.shards = Array.from({ length: 12 }, (_, i) => ({
      phase: Math.random() * Math.PI * 2 + i * 0.55,
      amp: 3 + Math.random() * 7,
      dx: (Math.random() - 0.5) * 28
    }));
  }

  update() {
    this.life++;
    this.x += this.dirRight ? GROUND_WAVE_SPEED : -GROUND_WAVE_SPEED;
    // Column rises from the ground until near the top of screen.
    const rise = Math.min(1, this.life / 32);
    this.h = Math.max(26, (GROUND_Y - 24) * rise);

    if (this.x < -90 || this.x > W + 90 || this.life > this.maxLife) this.alive = false;
  }

  getBox() {
    return { x: this.x - this.w / 2, y: GROUND_Y - this.h, w: this.w, h: this.h };
  }

  render(ctx) {
    const pulse = 0.66 + 0.34 * Math.sin(this.life * 0.32);
    const alpha = Math.max(0, 1 - this.life / this.maxLife);
    const headX = this.x;
    const trailDir = this.dirRight ? -1 : 1;
    const topY = GROUND_Y - this.h;

    ctx.save();

    // Ground glow trail
    for (let i = 0; i < 8; i++) {
      const tx = headX + trailDir * i * 14;
      const ta = alpha * (1 - i / 8) * 0.3;
      const g = ctx.createRadialGradient(tx, GROUND_Y - 2, 0, tx, GROUND_Y - 2, 18 + i * 2);
      g.addColorStop(0, `rgba(217,255,47,${ta * 1.2})`);
      g.addColorStop(0.5, `rgba(57,255,143,${ta})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tx, GROUND_Y - 2, 20 + i * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main vertical wave column (similar to boss phase 2 wave)
    const colGrad = ctx.createLinearGradient(headX, GROUND_Y, headX, topY);
    colGrad.addColorStop(0, `rgba(217,255,47,${0.65 * alpha})`);
    colGrad.addColorStop(0.45, `rgba(120,255,170,${0.38 * alpha})`);
    colGrad.addColorStop(1, 'rgba(40,220,90,0)');
    ctx.fillStyle = colGrad;
    ctx.fillRect(headX - this.w / 2, topY, this.w, this.h);

    ctx.shadowColor = '#9dff3a';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = `rgba(231,255,150,${0.55 * alpha})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(headX - this.w / 2, GROUND_Y);
    ctx.lineTo(headX - this.w / 2, topY);
    ctx.lineTo(headX + this.w / 2, topY);
    ctx.lineTo(headX + this.w / 2, GROUND_Y);
    ctx.stroke();

    // Inner wave ribbons
    ctx.strokeStyle = `rgba(200,255,180,${0.4 * alpha})`;
    ctx.lineWidth = 1.2;
    for (let r = 0; r < 3; r++) {
      const ox = (r - 1) * 9;
      ctx.beginPath();
      for (let i = 0; i <= 11; i++) {
        const tt = i / 11;
        const ry = GROUND_Y - this.h * tt;
        const rx = headX + ox + Math.sin(this.life * 0.25 + tt * 8 + r) * (4 + pulse * 2);
        if (i === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.stroke();
    }

    // Glitch shards
    ctx.shadowBlur = 0;
    this.shards.forEach((s, i) => {
      const t = (i % 8) / 8;
      const sx = headX + s.dx * (0.55 + pulse * 0.4);
      const sy = GROUND_Y - this.h * t - Math.sin(this.life * 0.22 + s.phase) * s.amp;
      const sz = 2 + (i % 4);
      ctx.fillStyle = i % 2 === 0
        ? `rgba(240,255,140,${0.45 * alpha})`
        : `rgba(120,255,170,${0.36 * alpha})`;
      ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
    });

    // Crest flash at top
    const crestR = 10 + pulse * 4;
    const crest = ctx.createRadialGradient(headX, topY, 0, headX, topY, crestR);
    crest.addColorStop(0, `rgba(255,255,255,${0.85 * alpha})`);
    crest.addColorStop(0.35, `rgba(230,255,120,${0.7 * alpha})`);
    crest.addColorStop(1, 'rgba(60,220,90,0)');
    ctx.fillStyle = crest;
    ctx.beginPath();
    ctx.arc(headX, topY, crestR, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// =============================================================================
// ENERGY FIELD — Burst Push
// =============================================================================

class EnergyField {
  constructor(cx, cy, owner) {
    this.cx = cx;
    this.cy = cy;
    this.owner = owner;
    this.radius = 0;
    this.maxRadius = BURST_RADIUS;
    this.life = 0;
    this.maxLife = 30;
    this.alive = true;
    this.hitDone = false;
    this.sparks = [];
    this.hexagons = [];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i + Math.random() * 0.3;
      this.sparks.push({
        angle,
        dist: 0,
        speed: 3 + Math.random() * 4,
        size: 2 + Math.random() * 3,
        alpha: 1,
        char: String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))
      });
    }
    for (let i = 0; i < 6; i++) {
      this.hexagons.push({
        angle: (Math.PI * 2 / 6) * i,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        scale: 0.5 + Math.random() * 0.5
      });
    }
  }

  update() {
    this.life++;
    const t = this.life / this.maxLife;
    this.radius = this.maxRadius * Math.min(1, t * 2.5);

    this.sparks.forEach(s => {
      s.dist += s.speed;
      s.alpha = Math.max(0, 1 - t);
    });
    this.hexagons.forEach(h => {
      h.angle += h.rotSpeed;
    });

    if (!this.hitDone && this.radius > 30) {
      const target = this.owner === player ? enemy : player;
      if (target) {
        const dx = (target.x + target.w / 2) - this.cx;
        const dy = (target.y + target.h / 2) - this.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.radius + 30) {
          if (this.owner === player && target === enemy && enemyBossDashIntangible()) {
            /* dash: intangível ao burst */
          } else {
            const burstDmg = this.owner === player ? scaleP1Damage(BURST_DAMAGE) : BURST_DAMAGE;
            target.takeHit(burstDmg);
            if (this.owner === player) superMeter = Math.min(SUPER_MAX, superMeter + 10);
            const pushDir = dx > 0 ? 1 : -1;
            target.x += pushDir * BURST_KNOCKBACK * 6;
            target.vy = -6;
            if (target.x < 10) target.x = 10;
            if (target.x > W - target.w - 10) target.x = W - target.w - 10;
            this.hitDone = true;
          }
        }
      }
    }

    if (this.life >= this.maxLife) this.alive = false;
  }

  render(ctx) {
    const t = this.life / this.maxLife;
    const alpha = Math.max(0, 1 - t * 0.8);
    const pulse = 0.8 + 0.2 * Math.sin(this.life * 0.8);

    ctx.save();

    // Shockwave ring (outer)
    const ringAlpha = alpha * 0.5;
    ctx.strokeStyle = `rgba(0,255,255,${ringAlpha})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Second ring
    ctx.strokeStyle = `rgba(255,0,255,${ringAlpha * 0.6})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#f0f';
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.radius * 0.75, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow fill
    const grad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, this.radius);
    grad.addColorStop(0, `rgba(0,255,255,${alpha * 0.25 * pulse})`);
    grad.addColorStop(0.4, `rgba(100,200,255,${alpha * 0.12})`);
    grad.addColorStop(0.7, `rgba(255,0,255,${alpha * 0.06})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Hexagonal grid pattern
    ctx.shadowBlur = 0;
    this.hexagons.forEach(h => {
      const hx = this.cx + Math.cos(h.angle) * this.radius * 0.5;
      const hy = this.cy + Math.sin(h.angle) * this.radius * 0.5;
      const s = 10 * h.scale * pulse;
      ctx.strokeStyle = `rgba(0,255,255,${alpha * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 / 6) * i + h.angle;
        const px = hx + Math.cos(a) * s;
        const py = hy + Math.sin(a) * s;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    });

    // Energy sparks with data chars
    this.sparks.forEach(s => {
      if (s.alpha <= 0) return;
      const sx = this.cx + Math.cos(s.angle) * s.dist;
      const sy = this.cy + Math.sin(s.angle) * s.dist;

      ctx.fillStyle = `rgba(0,255,255,${s.alpha * 0.8})`;
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 6;
      ctx.fillRect(sx - s.size / 2, sy - s.size / 2, s.size, s.size);

      ctx.shadowBlur = 0;
      ctx.font = '7px monospace';
      ctx.fillStyle = `rgba(0,255,255,${s.alpha * 0.5})`;
      ctx.fillText(s.char, sx + 4, sy - 2);
    });

    // Center flash
    if (t < 0.3) {
      const flashAlpha = (1 - t / 0.3) * 0.6;
      ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, 15 * (1 - t), 0, Math.PI * 2);
      ctx.fill();
    }

    // Glitch lines radiating outward
    if (t < 0.6) {
      ctx.strokeStyle = `rgba(0,255,255,${alpha * 0.4})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 / 8) * i + this.life * 0.1;
        const r1 = this.radius * 0.3;
        const r2 = this.radius * (0.7 + Math.random() * 0.3);
        ctx.beginPath();
        ctx.moveTo(this.cx + Math.cos(a) * r1, this.cy + Math.sin(a) * r1);
        ctx.lineTo(this.cx + Math.cos(a) * r2, this.cy + Math.sin(a) * r2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

// =============================================================================
// BOSS TRAP — Ground hazards (Phase 2)
// =============================================================================

class BossTrap {
  constructor(x) {
    this.x = x;
    this.y = GROUND_Y;
    this.w = 70;
    this.h = 22;
    this.life = 0;
    this.maxLife = TRAP_LIFETIME;
    this.alive = true;
    this.activated = false;
    this.spawnDone = false;
    this.pulseOffset = Math.random() * Math.PI * 2;
    this.glitchChars = Array.from({ length: 8 }, () =>
      String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))
    );
    this.sparks = [];
  }

  update() {
    this.life++;

    if (this.life > 15) this.spawnDone = true;

    // Randomize chars
    if (this.life % 8 === 0) {
      const idx = Math.floor(Math.random() * this.glitchChars.length);
      this.glitchChars[idx] = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
    }

    // Check collision with player
    if (this.spawnDone && !this.activated && player && player.stunTimer <= 0) {
      const px = player.x + player.w / 2;
      const py = player.y + player.h;
      if (px > this.x - this.w / 2 && px < this.x + this.w / 2 && py >= GROUND_Y - 5) {
        this.activated = true;
        player.stunTimer = TRAP_STUN_DURATION;
        player.takeHit(TRAP_DAMAGE);
        sndTrap();
        for (let i = 0; i < 18; i++) {
          this.sparks.push({
            x: this.x + (Math.random() - 0.5) * this.w,
            y: this.y - Math.random() * 30,
            vx: (Math.random() - 0.5) * 6,
            vy: -2 - Math.random() * 6,
            life: 20 + Math.random() * 20,
            size: 1.5 + Math.random() * 3
          });
        }
      }
    }

    // Update sparks
    this.sparks.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.15;
      s.life--;
    });
    this.sparks = this.sparks.filter(s => s.life > 0);

    if (this.activated && this.sparks.length === 0) this.alive = false;
    if (this.life >= this.maxLife) this.alive = false;
  }

  render(ctx) {
    const t = this.life;
    const pulse = 0.6 + 0.4 * Math.sin(t * 0.12 + this.pulseOffset);
    const spawnAlpha = this.spawnDone ? 1 : t / 15;
    const fadeOut = this.activated ? Math.max(0, 1 - (t - this.life) * 0.1) : 1;
    const dying = this.life > this.maxLife - 40;
    const dyingAlpha = dying ? (this.maxLife - this.life) / 40 : 1;
    const alpha = spawnAlpha * fadeOut * dyingAlpha;

    if (alpha <= 0 && this.sparks.length === 0) return;

    const cx = this.x;
    const cy = this.y;

    ctx.save();

    if (!this.activated) {
      // Warning glow on ground
      const glowR = this.w * 0.85;
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glowGrad.addColorStop(0, `rgba(255,0,80,${0.25 * pulse * alpha})`);
      glowGrad.addColorStop(0.4, `rgba(255,0,80,${0.12 * alpha})`);
      glowGrad.addColorStop(0.7, `rgba(255,0,60,${0.05 * alpha})`);
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Main electric line on ground
      ctx.strokeStyle = `rgba(255,0,100,${0.6 * pulse * alpha})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ff0066';
      ctx.shadowBlur = 14 * pulse;
      ctx.beginPath();
      ctx.moveTo(cx - this.w / 2, cy);
      ctx.lineTo(cx + this.w / 2, cy);
      ctx.stroke();

      // Double zigzag electricity
      for (let row = 0; row < 2; row++) {
        ctx.strokeStyle = `rgba(255,${80 + row * 80},${180 + row * 40},${(0.5 + row * 0.15) * pulse * alpha})`;
        ctx.lineWidth = 1.5 - row * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - this.w / 2, cy);
        for (let i = 1; i <= 12; i++) {
          const lx = cx - this.w / 2 + (this.w / 12) * i;
          const amp = (6 + row * 3) * pulse * (Math.random() * 0.5 + 0.5);
          const ly = cy + (i % 2 === 0 ? -amp : amp);
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
      }

      // Vertical energy pillars
      ctx.strokeStyle = `rgba(255,0,120,${0.2 * pulse * alpha})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 6;
      for (let i = 0; i < 3; i++) {
        const px = cx - this.w / 3 + (this.w / 3) * i + Math.sin(t * 0.1 + i) * 3;
        const ph = 15 + Math.sin(t * 0.2 + i * 2) * 8;
        ctx.beginPath();
        ctx.moveTo(px, cy);
        ctx.lineTo(px, cy - ph);
        ctx.stroke();
      }

      // Danger symbols / data chars
      ctx.shadowBlur = 0;
      ctx.font = '8px monospace';
      ctx.fillStyle = `rgba(255,0,100,${0.45 * alpha})`;
      this.glitchChars.forEach((ch, i) => {
        const gx = cx - this.w / 2 + 4 + i * 9;
        const gy = cy - 10 - Math.sin(t * 0.15 + i) * 3;
        ctx.fillText(ch, gx, gy);
      });

      // Hazard warning symbol
      if (t % 30 < 15) {
        ctx.font = `bold 10px ${HUD_FONT}`;
        ctx.fillStyle = `rgba(255,0,80,${0.5 * pulse * alpha})`;
        ctx.textAlign = 'center';
        ctx.fillText('⚠', cx, cy - 18);
        ctx.textAlign = 'left';
      }

      // Helper label for P1: subtle cyberpunk glitch text above trap
      const labelY = cy - 40 - Math.sin(t * 0.1) * 2;
      const jitterX = (Math.random() - 0.5) * 1.6;
      const textAlpha = 0.62 * alpha;
      ctx.textAlign = 'center';
      ctx.font = `bold 15px ${HUD_FONT}`;
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(0,255,255,${textAlpha * 0.5})`;
      ctx.fillText('ARMADILHA', cx - 1 + jitterX, labelY + 0.4);
      ctx.fillStyle = `rgba(255,0,170,${textAlpha * 0.45})`;
      ctx.fillText('ARMADILHA', cx + 1 + jitterX, labelY - 0.4);
      ctx.fillStyle = `rgba(255,90,170,${textAlpha})`;
      ctx.fillText('ARMADILHA', cx + jitterX, labelY);
      ctx.textAlign = 'left';

      // Corner marks
      const hw = this.w / 2;
      ctx.strokeStyle = `rgba(255,0,100,${0.4 * alpha})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      // Left corner
      ctx.beginPath();
      ctx.moveTo(cx - hw, cy + 2);
      ctx.lineTo(cx - hw, cy - 6);
      ctx.lineTo(cx - hw + 5, cy - 6);
      ctx.stroke();
      // Right corner
      ctx.beginPath();
      ctx.moveTo(cx + hw, cy + 2);
      ctx.lineTo(cx + hw, cy - 6);
      ctx.lineTo(cx + hw - 5, cy - 6);
      ctx.stroke();

      // Pulsing ring when about to disappear
      if (dying) {
        ctx.strokeStyle = `rgba(255,0,100,${0.3 * pulse * dyingAlpha})`;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, this.w / 2 + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Activation sparks
    this.sparks.forEach(s => {
      ctx.fillStyle = `rgba(255,${50 + Math.random() * 100},${150 + Math.random() * 105},${Math.min(1, s.life / 8)})`;
      ctx.shadowColor = '#ff0066';
      ctx.shadowBlur = 4;
      ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
    });

    ctx.restore();
  }
}

// =============================================================================
// BOSS POWERS (Phase 2)
// =============================================================================

class BossProjectile {
  constructor(x, y, dirRight) {
    this.x = x;
    this.y = y;
    this.dirRight = dirRight;
    this.alive = true;
    this.life = 0;
    this.trail = [];
    this.w = 72;
    this.h = 44;
    this.hitDone = false;
    triggerBossCinematic('spawn', 0.9);
  }

  update() {
    this.x += this.dirRight ? BOSS_PROJ_SPEED : -BOSS_PROJ_SPEED;
    this.life++;
    this.trail.push({ x: this.x, y: this.y, alpha: 1 });
    if (this.trail.length > 18) this.trail.shift();
    this.trail.forEach(t => { t.alpha -= 0.055; });

    if (!this.hitDone && player) {
      const dx = Math.abs((player.x + player.w / 2) - this.x);
      const dy = Math.abs((player.y + player.h / 2) - this.y);
      if (dx < 40 && dy < 32) {
        player.takeHit(BOSS_PROJ_DAMAGE);
        this.hitDone = true;
        this.alive = false;
        triggerBossCinematic('impact', 1.1);
      }
    }
    if (this.x < -60 || this.x > W + 60) this.alive = false;
  }

  render(ctx) {
    const pulse = 0.7 + 0.3 * Math.sin(this.life * 0.3);

    this.trail.forEach(tr => {
      if (tr.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = tr.alpha * 0.3;
      const g = ctx.createRadialGradient(tr.x, tr.y, 0, tr.x, tr.y, 24);
      g.addColorStop(0, 'rgba(255,0,255,0.5)');
      g.addColorStop(1, 'rgba(255,0,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();
    const outerR = 66 * pulse;
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, outerR);
    g.addColorStop(0, `rgba(255,0,255,${0.35 * pulse})`);
    g.addColorStop(0.5, 'rgba(255,0,200,0.1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, outerR, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 32 * pulse;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, 24 * pulse, 15 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, 18, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class BossGroundWave {
  constructor(startX, dirRight) {
    this.x = startX;
    this.dirRight = dirRight;
    this.alive = true;
    this.life = 0;
    this.speed = 5.4;
    this.w = 84;
    this.h = 86;
    this.hitPlayers = new Set();
    this.sparks = [];
    triggerBossCinematic('spawn', 1.15);
  }

  update() {
    this.x += this.dirRight ? this.speed : -this.speed;
    this.life++;

    if (this.life % 2 === 0) {
      this.sparks.push({
        x: this.x + (Math.random() - 0.5) * this.w,
        y: GROUND_Y - Math.random() * this.h,
        vy: -1 - Math.random() * 2,
        life: 10 + Math.random() * 10,
        size: 1 + Math.random() * 2
      });
    }
    this.sparks.forEach(s => { s.y += s.vy; s.life--; });
    this.sparks = this.sparks.filter(s => s.life > 0);

    if (player && !this.hitPlayers.has('p1')) {
      const px = player.x + player.w / 2;
      const py = player.y + player.h;
      if (Math.abs(px - this.x) < this.w * 0.58 && py >= GROUND_Y - 14) {
        player.takeHit(BOSS_WAVE_DAMAGE);
        player.vy = -8;
        this.hitPlayers.add('p1');
        triggerBossCinematic('impact', 1.3);
      }
    }

    if (this.x < -80 || this.x > W + 80) this.alive = false;
  }

  render(ctx) {
    const pulse = 0.7 + 0.3 * Math.sin(this.life * 0.4);
    const waveH = this.h * pulse;

    ctx.save();

    // Ground energy column
    const grad = ctx.createLinearGradient(this.x, GROUND_Y, this.x, GROUND_Y - waveH);
    grad.addColorStop(0, `rgba(255,0,180,0.72)`);
    grad.addColorStop(0.5, `rgba(255,0,255,0.35)`);
    grad.addColorStop(1, 'rgba(255,0,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(this.x - this.w / 2, GROUND_Y - waveH, this.w, waveH);

    // Glow
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 22;
    ctx.strokeStyle = `rgba(255,0,255,${0.6 * pulse})`;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(this.x - this.w / 2, GROUND_Y);
    ctx.lineTo(this.x - this.w / 2, GROUND_Y - waveH);
    ctx.lineTo(this.x + this.w / 2, GROUND_Y - waveH);
    ctx.lineTo(this.x + this.w / 2, GROUND_Y);
    ctx.stroke();

    // Base flash
    ctx.shadowBlur = 14;
    ctx.fillStyle = `rgba(255,100,255,${0.55 * pulse})`;
    ctx.fillRect(this.x - this.w / 2 - 8, GROUND_Y - 4, this.w + 16, 4);

    // Sparks
    ctx.shadowBlur = 4;
    this.sparks.forEach(s => {
      ctx.fillStyle = `rgba(255,${150 + Math.random() * 100},255,${Math.min(1, s.life / 6)})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    ctx.restore();
  }
}

class BossEnergyRain {
  constructor() {
    this.alive = true;
    this.life = 0;
    this.maxLife = 90;
    this.drops = [];
    this.impacts = [];
    triggerBossCinematic('spawn', 1.2);
    const numDrops = 7 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numDrops; i++) {
      this.drops.push({
        x: 40 + Math.random() * (W - 80),
        y: -20 - Math.random() * 60,
        targetY: GROUND_Y,
        speed: 4.6 + Math.random() * 3.2,
        hit: false,
        radius: 36 + Math.random() * 20,
        delay: i * 6
      });
    }
  }

  update() {
    this.life++;

    this.drops.forEach(d => {
      if (this.life < d.delay) return;
      if (d.hit) return;
      d.y += d.speed;
      if (d.y >= d.targetY) {
        d.y = d.targetY;
        d.hit = true;
        this.impacts.push({
          x: d.x, radius: 0, maxRadius: d.radius,
          alpha: 0.8, life: 20
        });
        if (player) {
          const dx = Math.abs((player.x + player.w / 2) - d.x);
          if (dx < d.radius && player.y + player.h >= GROUND_Y - 10) {
            player.takeHit(BOSS_RAIN_DAMAGE);
            triggerBossCinematic('impact', 1.25);
          }
        }
      }
    });

    this.impacts.forEach(imp => {
      imp.radius = Math.min(imp.maxRadius, imp.radius + imp.maxRadius / 6);
      imp.alpha *= 0.9;
      imp.life--;
    });
    this.impacts = this.impacts.filter(imp => imp.life > 0);

    if (this.life >= this.maxLife && this.impacts.length === 0) this.alive = false;
  }

  render(ctx) {
    ctx.save();

    // Warning markers on ground before drops hit
    this.drops.forEach(d => {
      if (this.life < d.delay || d.hit) return;
      const progress = Math.min(1, (d.targetY - d.y) / 200);
      ctx.strokeStyle = `rgba(255,0,100,${0.3 + 0.3 * (1 - progress)})`;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(d.x, GROUND_Y, d.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Falling energy bolts
    this.drops.forEach(d => {
      if (this.life < d.delay || d.hit) return;
      const boltH = 30;
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#ff80ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - boltH);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - boltH);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();

      const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, 18);
      g.addColorStop(0, 'rgba(255,0,255,0.4)');
      g.addColorStop(1, 'rgba(255,0,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 18, 0, Math.PI * 2);
      ctx.fill();
    });

    // Impact explosions
    this.impacts.forEach(imp => {
      ctx.shadowColor = '#ff0066';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = `rgba(255,0,150,${imp.alpha})`;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(imp.x, GROUND_Y, imp.radius, 0, Math.PI * 2);
      ctx.stroke();

      const ig = ctx.createRadialGradient(imp.x, GROUND_Y, 0, imp.x, GROUND_Y, imp.radius);
      ig.addColorStop(0, `rgba(255,0,180,${imp.alpha * 0.3})`);
      ig.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(imp.x, GROUND_Y, imp.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}

function sndBossShoot() {
  sndBossProjectileSfx();
}

function sndBossWave() {
  sndBossGroundPowerSfx();
}

function sndBossRain() {
  sndBossProjectileSfx();
}

// =============================================================================
// P1 SUPER — Overclock Nova (full-screen cyberpunk strike)
// =============================================================================

function sndP1SuperCharge() {
  sndP1OverclockLayerSfx();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g);
  g.connect(audioCtx.destination);
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(80, t);
  o.frequency.exponentialRampToValueAtTime(200, t + 0.4);
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
  o.start(t);
  o.stop(t + 0.4);
}

function sndP1SuperImpact() {
  sndP1OverclockLayerSfx();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  for (let i = 0; i < 3; i++) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.type = 'square';
    o.frequency.setValueAtTime(120 + i * 40, t + i * 0.05);
    o.frequency.exponentialRampToValueAtTime(40, t + i * 0.05 + 0.35);
    g.gain.setValueAtTime(0.1, t + i * 0.05);
    g.gain.exponentialRampToValueAtTime(0.01, t + i * 0.05 + 0.35);
    o.start(t + i * 0.05);
    o.stop(t + i * 0.05 + 0.35);
  }
  const noise = audioCtx.createOscillator();
  const ng = audioCtx.createGain();
  noise.connect(ng);
  ng.connect(audioCtx.destination);
  noise.type = 'sawtooth';
  noise.frequency.setValueAtTime(400, t);
  noise.frequency.exponentialRampToValueAtTime(50, t + 0.5);
  ng.gain.setValueAtTime(0.08, t);
  ng.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
  noise.start(t);
  noise.stop(t + 0.5);
}

function tryFireP1Super() {
  if (superMeter < SUPER_MAX || p1SuperFx) return false;
  superMeter = 0;
  p1SuperFx = {
    t: 0,
    max: P1_SUPER_MAX_DURATION,
    dealt: false,
    bolts: [],
    particles: [],
    rings: [],
    glitchBars: []
  };
  for (let i = 0; i < 24; i++) {
    p1SuperFx.bolts.push({
      x: Math.random() * W,
      y: -20 - Math.random() * 200,
      len: 40 + Math.random() * 120,
      speed: 12 + Math.random() * 16,
      phase: Math.random() * Math.PI * 2,
      w: 2 + Math.random() * 3
    });
  }
  for (let i = 0; i < 60; i++) {
    p1SuperFx.particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30 + Math.random() * 80,
      size: 1 + Math.random() * 2
    });
  }
  for (let i = 0; i < 5; i++) {
    p1SuperFx.rings.push({ r: 0, maxR: 200 + i * 40, alpha: 0.6 - i * 0.1, slow: 0.02 + i * 0.01 });
  }
  sndP1SuperCharge();
  return true;
}

function updateP1Super() {
  if (!p1SuperFx) return false;
  const fx = p1SuperFx;
  fx.t++;
  bgOffset += 3;

  fx.bolts.forEach(b => {
    b.y += b.speed;
    b.x += Math.sin(fx.t * 0.1 + b.phase) * 2;
    if (b.y > H + 50) b.y = -100 - Math.random() * 200;
  });

  fx.particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });
  fx.particles = fx.particles.filter(p => p.life > 0);

  if (fx.t % 4 === 0) {
    fx.glitchBars.push({
      y: Math.random() * H,
      h: 3 + Math.random() * 20,
      dx: (Math.random() - 0.5) * 30,
      life: 8 + Math.random() * 8,
      col: Math.random() < 0.5 ? P1_NEON_PRIMARY : P1_NEON_SECONDARY
    });
  }
  fx.glitchBars.forEach(g => { g.life--; });
  fx.glitchBars = fx.glitchBars.filter(g => g.life > 0);

  fx.rings.forEach(r => {
    r.r = Math.min(r.maxR, r.r + 14 + fx.t * 0.3);
  });

    if (!fx.dealt && fx.t === 50 && player && enemy) {
    const pcx = player.x + player.w / 2;
    const ecx = enemy.x + enemy.w / 2;
    if (Math.abs(ecx - pcx) <= P1_SUPER_AOE_RADIUS && !enemyBossDashIntangible()) {
      const raw = Math.floor(enemy.maxHealth * P1_SUPER_HP_FRACTION) + P1_SUPER_FLAT;
      const dmg = Math.min(95, Math.max(40, scaleP1Damage(raw)));
      enemy.takeHit(dmg);
      sndP1SuperImpact();
    }
    fx.dealt = true;
  }

  if (fx.t >= fx.max) p1SuperFx = null;
  return true;
}

function renderP1Super(ctx) {
  if (!p1SuperFx) return;
  const fx = p1SuperFx;
  const t = fx.t;
  const prog = t / fx.max;
  const pcx = player ? player.x + player.w / 2 : W / 2;
  const pcy = player ? player.y + player.h / 2 : H / 2;

  const shake = t > 45 && t < 85 ? (Math.random() - 0.5) * (6 * (1 - Math.abs(t - 65) / 20)) : 0;
  const sy = shake;
  ctx.save();
  ctx.translate(shake, sy);

  // Dark veil
  ctx.fillStyle = `rgba(0,5,25,${0.35 + 0.25 * Math.sin(t * 0.08)})`;
  ctx.fillRect(0, 0, W, H);

  // Expanding rings from player
  fx.rings.forEach((r, i) => {
    ctx.strokeStyle = `rgba(217,255,47,${r.alpha * (1 - prog) * 0.5})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = P1_NEON_PRIMARY;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(pcx, pcy, Math.min(r.r, r.maxR), 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.shadowBlur = 0;

  // Huge AOE preview (faint)
  if (t < 55) {
    const aoeA = 0.15 + 0.1 * Math.sin(t * 0.2);
    ctx.strokeStyle = `rgba(57,255,143,${aoeA})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(pcx, pcy, P1_SUPER_AOE_RADIUS * (0.3 + (t / 55) * 0.7), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Lightning bolts
  fx.bolts.forEach(b => {
    ctx.strokeStyle = `rgba(217,255,47,${0.4 + 0.3 * Math.sin(t * 0.3 + b.phase)})`;
    ctx.lineWidth = b.w;
    ctx.shadowColor = P1_NEON_PRIMARY;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    let ly = b.y;
    for (let s = 0; s < 8; s++) {
      ly += b.len / 8;
      const jx = b.x + (Math.random() - 0.5) * 25;
      ctx.lineTo(jx, ly);
    }
    ctx.stroke();
  });
  ctx.shadowBlur = 0;

  // Glitch bars
  fx.glitchBars.forEach(g => {
    ctx.globalAlpha = g.life / 12;
    ctx.fillStyle = g.col;
    ctx.fillRect(g.dx, g.y, W, g.h);
  });
  ctx.globalAlpha = 1;

  // Particles
  fx.particles.forEach(p => {
    ctx.globalAlpha = Math.min(1, p.life / 30);
    ctx.fillStyle = Math.random() < 0.5 ? P1_NEON_PRIMARY : P1_NEON_SECONDARY;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1;

  // Hex grid fragment
  if (t > 20) {
    ctx.strokeStyle = `rgba(57,255,143,${0.15 * (1 - prog * 0.5)})`;
    ctx.lineWidth = 0.5;
    const gs = 40;
    for (let gx = 0; gx < W + gs; gx += gs) {
      for (let gy = 0; gy < H + gs; gy += gs) {
        const ox = (gx + t * 2) % (gs * 2);
        ctx.strokeRect(ox + shake, gy, gs * 0.9, gs * 0.9);
      }
    }
  }

  // Center flash on impact frame
  if (t >= 48 && t <= 58) {
    const flash = 1 - Math.abs(t - 53) / 5;
    ctx.fillStyle = `rgba(255,255,255,${0.5 * flash})`;
    ctx.fillRect(0, 0, W, H);
    const ringGrad = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, P1_SUPER_AOE_RADIUS);
    ringGrad.addColorStop(0, `rgba(217,255,47,${0.45 * flash})`);
    ringGrad.addColorStop(0.4, `rgba(57,255,143,${0.2 * flash})`);
    ringGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(pcx, pcy, P1_SUPER_AOE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  // Title text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const titleY = 70 + Math.sin(t * 0.08) * 3;
  ctx.font = `bold 22px ${HUD_FONT}`;
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = P1_NEON_PRIMARY;
  ctx.fillText('OVERCLOCK NOVA', W / 2 - 2 + shake, titleY);
  ctx.fillStyle = P1_NEON_SECONDARY;
  ctx.fillText('OVERCLOCK NOVA', W / 2 + 2 + shake, titleY);
  ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 0.2);
  ctx.shadowColor = P1_NEON_PRIMARY;
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#fff';
  ctx.fillText('OVERCLOCK NOVA', W / 2 + shake, titleY);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  ctx.font = `8px ${HUD_FONT}`;
  ctx.fillStyle = 'rgba(57,255,143,0.5)';
  ctx.fillText('[ SYSTEM LIMITER — DISABLED ]', W / 2 + shake, titleY + 22);

  // Scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);

  ctx.restore();
}

// =============================================================================
// COLLISION DETECTION
// =============================================================================

function checkCollision(box1, box2) {
  return (
    box1.x < box2.x + box2.w &&
    box1.x + box1.w > box2.x &&
    box1.y < box2.y + box2.h &&
    box1.y + box1.h > box2.y
  );
}

function checkHit(attacker, defender) {
  if (!attacker.attacking) return false;
  if (attacker.hitLanded) return false;
  if (attacker.attackFrame < 3 || attacker.attackFrame > 8) return false;
  
  const attackBox = attacker.attackBox;
  const defenderBox = { x: defender.x, y: defender.y, w: defender.w, h: defender.h };
  
  if (checkCollision(attackBox, defenderBox)) {
    attacker.hitLanded = true;
    return true;
  }
  return false;
}

// =============================================================================
// ENEMY AI
// =============================================================================

let aiState = 'chase';
let aiStateTimer = 0;
let aiComboCount = 0;
let aiDodgeCooldown = 0;
let aiBlockTimer = 0;
let aiFeintTimer = 0;
let aiPunishWindow = 0;
let aiLastPlayerHP = 100;
let aiPatternMemory = [];
let aiPreferredRange = 80;

function updateEnemyAI(dt) {
  if (!enemy || state !== 'playing') return;
  if (enemy.health <= 0) return;

  const prevVx = enemy.vx;
  if (!enemy.dashing) {
    enemy.vx = 0;
  }
  const isPreparingRangedShot = bossPhase < 2 && enemy.queuedProjectileTimer > 0;

  const distX = player.x - enemy.x;
  const absDist = Math.abs(distX);
  const dirToPlayer = distX > 0 ? 1 : -1;
  const healthPct = enemy.health / enemy.maxHealth;
  const playerHealthPct = player.health / player.maxHealth;
  const aiSpeed = bossPhase >= 2 ? P2_PHASE2_SPEED : AI_SPEED;
  const atkDmg = bossPhase >= 2 ? P2_PHASE2_DAMAGE : P2_ATTACK_DAMAGE;

  // Track player attack patterns for adaptation
  if (player.attacking && aiPatternMemory.length < 50) {
    aiPatternMemory.push({ dist: absDist, time: bgOffset });
  }

  // Detect if player just attacked and missed (punish window)
  if (player.attacking && absDist > 100) {
    aiPunishWindow = 30;
  }
  if (aiPunishWindow > 0) aiPunishWindow--;
  if (aiDodgeCooldown > 0) aiDodgeCooldown--;
  if (aiFeintTimer > 0) aiFeintTimer--;
  if (bossPhase >= 2 && aiP2DashCooldown > 0) aiP2DashCooldown--;

  aiAttackTimer--;
  aiRangedTimer--;
  aiJumpTimer--;

  // Determine preferred fighting range based on health and phase
  if (bossPhase >= 2) {
    aiPreferredRange = healthPct > 0.5 ? 130 : healthPct > 0.25 ? 110 : 90;
  } else {
    // Phase 1: shorter preferred range to pressure P1 more often.
    aiPreferredRange = healthPct > 0.6 ? 130 : healthPct > 0.3 ? 112 : 95;
  }

  // State machine transitions
  aiStateTimer--;
  if (aiStateTimer <= 0) {
    const roll = Math.random();

    if (bossPhase >= 2) {
      // Phase 2: more varied movement, less sticking to player
      if (aiPunishWindow > 0) {
        aiState = 'punish';
        aiStateTimer = 20 + Math.random() * 10;
      } else if (healthPct < 0.25) {
        aiState = roll < 0.35 ? 'aggressive' : roll < 0.55 ? 'retreat' : roll < 0.75 ? 'circle' : 'bait';
        aiStateTimer = 30 + Math.random() * 25;
      } else if (absDist < 80) {
        aiState = roll < 0.35 ? 'retreat' : roll < 0.55 ? 'circle' : roll < 0.75 ? 'bait' : 'aggressive';
        aiStateTimer = 30 + Math.random() * 35;
      } else if (absDist > 200) {
        aiState = roll < 0.5 ? 'chase' : roll < 0.75 ? 'aggressive' : 'circle';
        aiStateTimer = 40 + Math.random() * 30;
      } else {
        aiState = roll < 0.2 ? 'chase' : roll < 0.4 ? 'circle' : roll < 0.6 ? 'bait' : roll < 0.8 ? 'retreat' : 'aggressive';
        aiStateTimer = 35 + Math.random() * 40;
      }
    } else {
      if (aiPunishWindow > 0) {
        aiState = 'punish';
        aiStateTimer = 20 + Math.random() * 12;
      } else if (healthPct < 0.2) {
        aiState = roll < 0.62 ? 'aggressive' : roll < 0.82 ? 'retreat' : 'bait';
        aiStateTimer = 32 + Math.random() * 24;
      } else if (healthPct < 0.5) {
        aiState = roll < 0.4 ? 'aggressive' : roll < 0.62 ? 'circle' : roll < 0.82 ? 'chase' : 'bait';
        aiStateTimer = 38 + Math.random() * 46;
      } else if (playerHealthPct < 0.4) {
        aiState = roll < 0.75 ? 'aggressive' : 'chase';
        aiStateTimer = 46 + Math.random() * 30;
      } else if (absDist < 60) {
        aiState = roll < 0.2 ? 'retreat' : roll < 0.45 ? 'circle' : roll < 0.86 ? 'aggressive' : 'bait';
        aiStateTimer = 34 + Math.random() * 38;
      } else {
        aiState = roll < 0.44 ? 'chase' : roll < 0.66 ? 'circle' : roll < 0.9 ? 'aggressive' : 'bait';
        aiStateTimer = 44 + Math.random() * 60;
      }
    }
  }

  // Movement based on state
  const circleMin = bossPhase >= 2 ? 80 : 50;
  const circleMax = bossPhase >= 2 ? 180 : 140;
  const retreatDist = bossPhase >= 2 ? 200 : 150;

  aiMeleeCommitTimer--;

  if (!enemy.dashing) {
  if (aiState === 'chase') {
    if (absDist > aiPreferredRange) {
      enemy.vx = dirToPlayer * aiSpeed;
    } else if (bossPhase >= 2 && absDist > 40) {
      enemy.vx = dirToPlayer * aiSpeed * 0.35;
    } else if (bossPhase < 2 && absDist < aiPreferredRange - 20) {
      enemy.vx = -dirToPlayer * aiSpeed * 0.35;
    }
    // Phase 2: avoid sticking to player at point-blank range.
    if (bossPhase >= 2 && absDist < 38) {
      enemy.vx = -dirToPlayer * aiSpeed * 0.75;
    } else if (bossPhase >= 2 && absDist < 60) {
      enemy.vx = 0;
    }
  } else if (aiState === 'circle') {
    if (absDist > circleMax) {
      enemy.vx = dirToPlayer * aiSpeed * 0.9;
    } else if (absDist < circleMin) {
      enemy.vx = -dirToPlayer * aiSpeed * 0.8;
    } else {
      if (bossPhase >= 2) {
        const strafeDir = Math.sin(bgOffset * 0.07 + Math.cos(bgOffset * 0.03) * 2);
        enemy.vx = (strafeDir > 0 ? 1 : -1) * aiSpeed * 0.6;
      } else {
        // Phase 1: keep strafe direction for a short window to avoid jitter.
        aiStrafeTimer--;
        if (aiStrafeTimer <= 0) {
          aiStrafeDir = Math.random() < 0.5 ? -1 : 1;
          aiStrafeTimer = 24 + Math.random() * 22;
        }
        enemy.vx = aiStrafeDir * aiSpeed * 0.55;
      }
    }
  } else if (aiState === 'retreat') {
    if (absDist < retreatDist) {
      enemy.vx = -dirToPlayer * aiSpeed * 0.9;
      if (aiFeintTimer <= 0 && absDist < 90 && Math.random() < 0.02) {
        aiState = 'punish';
        aiStateTimer = 15;
        aiFeintTimer = 120;
      }
    }
  } else if (aiState === 'aggressive') {
    if (bossPhase < 2 && aiMeleeCommitTimer <= 0) {
      // In phase 1, only close in during short commit windows.
      if (Math.random() < 0.075 && absDist < 190) {
        aiMeleeCommitTimer = 34 + Math.random() * 24;
      } else if (absDist < 95) {
        enemy.vx = -dirToPlayer * aiSpeed * 0.3;
      } else if (absDist < 150) {
        enemy.vx = dirToPlayer * aiSpeed * 0.85;
      }
    }

    if (aiMeleeCommitTimer > 0 || bossPhase >= 2) {
      if (absDist > 45) {
        enemy.vx = dirToPlayer * aiSpeed * 1.4;
      } else {
        enemy.vx = dirToPlayer * aiSpeed * 0.3;
      }
    }
  } else if (aiState === 'punish') {
    if (absDist > 40) {
      enemy.vx = dirToPlayer * aiSpeed * 1.6;
    }
  } else if (aiState === 'bait') {
    const baitFreq = bossPhase >= 2 ? 0.06 : 0.1;
    const baitCycle = Math.sin(bgOffset * baitFreq + Math.cos(bgOffset * 0.04) * 1.5);
    if (baitCycle > 0.2) {
      enemy.vx = dirToPlayer * aiSpeed * (bossPhase >= 2 ? 1.0 : 0.8);
    } else if (baitCycle < -0.2) {
      enemy.vx = -dirToPlayer * aiSpeed * (bossPhase >= 2 ? 0.9 : 0.6);
    }
  }

  // Keep enemy on screen
  if (enemy.x < 20) enemy.vx = Math.max(enemy.vx, aiSpeed * 0.5);
  if (enemy.x > W - 60) enemy.vx = Math.min(enemy.vx, -aiSpeed * 0.5);

  // Phase 1 only: smooth horizontal acceleration to reduce twitchy movement.
  if (bossPhase < 2 && enemy.onGround) {
    const maxStep = aiSpeed * 0.34;
    const delta = enemy.vx - prevVx;
    if (delta > maxStep) enemy.vx = prevVx + maxStep;
    else if (delta < -maxStep) enemy.vx = prevVx - maxStep;
    if (Math.abs(enemy.vx) < 0.05) enemy.vx = 0;
  }

  // Keep phase 1 boss stationary while shot animation is active.
  if (isPreparingRangedShot) {
    enemy.vx = 0;
  }

  // Attack logic — varies by state and distance
  if (!isPreparingRangedShot && aiAttackTimer <= 0 && !enemy.attacking) {
    let shouldAttack = false;
    let nextCooldown = 90;

    if (aiState === 'punish' && absDist < 90) {
      shouldAttack = true;
      nextCooldown = 20 + Math.random() * 20;
    } else if (aiState === 'aggressive' && absDist < 100 && (bossPhase >= 2 || aiMeleeCommitTimer > 0 || absDist < 62)) {
      shouldAttack = true;
      // Combo: rapid successive hits
      if (aiComboCount < 2 + Math.floor(Math.random() * 2)) {
        nextCooldown = 18 + Math.random() * 15;
        aiComboCount++;
      } else {
        nextCooldown = 70 + Math.random() * 50;
        aiComboCount = 0;
      }
    } else if (aiState === 'bait' && absDist < 80 && Math.sin(bgOffset * 0.1) > 0.2) {
      shouldAttack = true;
      nextCooldown = 60 + Math.random() * 50;
    } else if ((aiState === 'chase' || aiState === 'circle') && absDist < 110 && absDist > 18) {
      shouldAttack = true;
      nextCooldown = 80 + Math.random() * 60;
    }

    if (shouldAttack) {
      enemy.attack();
      aiAttackTimer = bossPhase >= 2 ? nextCooldown * 0.65 : nextCooldown * 0.82;
      if (bossPhase < 2) aiMeleeCommitTimer = 0;
    }
  }

  // Phase 2 anti-stall: if too close and not attacking, force quick reposition.
  if (!isPreparingRangedShot && bossPhase >= 2 && !enemy.attacking && absDist < 24) {
    enemy.vx = -dirToPlayer * aiSpeed * 1.1;
    if (aiState !== 'retreat' && Math.random() < 0.2) {
      aiState = 'retreat';
      aiStateTimer = 20 + Math.random() * 20;
    }
  }

  // Phase 1 ranged pressure: boss occasionally shoots at medium/long range.
  if (bossPhase < 2 && aiRangedTimer <= 0 && !enemy.attacking && enemy.onGround) {
    const hasClearRange = absDist > 130 && absDist < 320;
    const lowProjectileDensity = projectiles.filter(p => p.owner === enemy && p.alive).length < 1;
    if (hasClearRange && lowProjectileDensity && Math.random() < 0.62) {
      enemy.queueRangedShot(enemy.facingRight);
      aiRangedTimer = 120 + Math.random() * 85;
    } else {
      aiRangedTimer = 22 + Math.random() * 16;
    }
  }

  // Reactive dodge — jump or backstep when player attacks
  if (!isPreparingRangedShot && player.attacking && absDist < 95 && aiDodgeCooldown <= 0) {
    const dodgeRoll = Math.random();
    if (bossPhase >= 2 && dodgeRoll < 0.25 && enemy.onGround) {
      // Jump dodge
      enemy.jump();
      aiDodgeCooldown = 40;
    } else if (dodgeRoll < 0.45) {
      // Backstep dodge
      enemy.vx = -dirToPlayer * aiSpeed * 2;
      aiDodgeCooldown = 30;
    }
  }

  // Dodge projectiles
  for (const proj of projectiles) {
    if (!proj.alive || proj.owner !== player) continue;
    const projDist = Math.abs(proj.x - enemy.x);
    const projApproaching = proj.dirRight ? (proj.x < enemy.x) : (proj.x > enemy.x);
    if (!isPreparingRangedShot && projDist < 120 && projApproaching && enemy.onGround && aiDodgeCooldown <= 0) {
      // Do not always dodge projectiles: add reaction chance.
      const dodgeChance = bossPhase >= 2 ? 0.62 : 0.45;
      if (Math.random() < dodgeChance) {
        if (bossPhase >= 2) {
          enemy.jump();
          aiDodgeCooldown = 50;
        } else {
          enemy.vx = -dirToPlayer * aiSpeed * 1.2;
          aiDodgeCooldown = 28;
        }
      } else {
        // Small hesitation window so the AI doesn't re-roll every frame.
        aiDodgeCooldown = 18;
      }
      break;
    }
  }

  // Strategic jump
  if (!isPreparingRangedShot && bossPhase >= 2 && aiJumpTimer <= 0 && enemy.onGround) {
    if (aiState === 'aggressive' && absDist > 90 && absDist < 180) {
      // Jump-in attack
      enemy.jump();
      aiJumpTimer = 60 + Math.random() * 60;
    } else if (aiState === 'retreat' && absDist < 60) {
      // Escape jump
      enemy.jump();
      enemy.vx = -dirToPlayer * AI_SPEED;
      aiJumpTimer = 70 + Math.random() * 50;
    } else if (Math.random() < 0.08) {
      enemy.jump();
      aiJumpTimer = 90 + Math.random() * 80;
    } else {
      aiJumpTimer = 40 + Math.random() * 40;
    }
  }

  } // !enemy.dashing (movement / melee / jumps)

  // Face player
  enemy.facingRight = distX > 0;

  // Fase 2: investida (dash) em média distância
  if (
    bossPhase >= 2 &&
    !enemy.dashing &&
    !enemy.attacking &&
    enemy.onGround &&
    enemy.stunTimer <= 0 &&
    aiP2DashCooldown <= 0
  ) {
    if (absDist > 72 && absDist < 300 && Math.random() < 0.42) {
      enemy.startDash();
      aiP2DashCooldown = 85 + Math.random() * 55;
    }
  }

  // Phase 2: spawn ground traps
  if (bossPhase >= 2) {
    bossTrapTimer--;
    if (bossTrapTimer <= 0 && bossTraps.filter(t => !t.activated).length < TRAP_MAX_ACTIVE) {
      const trapX = 40 + Math.random() * (W - 80);
      bossTraps.push(new BossTrap(trapX));
      sndTrapSpawn();
      bossTrapTimer = TRAP_SPAWN_INTERVAL_MIN + Math.random() * (TRAP_SPAWN_INTERVAL_MAX - TRAP_SPAWN_INTERVAL_MIN);
    }

    // Boss powers: projectile, ground wave, energy rain
    bossPowerTimer--;
    if (bossPowerTimer <= 0) {
      const powerRoll = Math.random();
      if (powerRoll < 0.35) {
        // Projectile at player
        const px = enemy.facingRight ? enemy.x + enemy.w + 10 : enemy.x - 10;
        const py = enemy.y + enemy.h * 0.16;
        bossPowers.push(new BossProjectile(px, py, enemy.facingRight));
        enemy.triggerAnim('shot');
        sndBossShoot();
        bossPowerTimer = BOSS_POWER_COOLDOWN * 0.48;
      } else if (powerRoll < 0.65) {
        // Ground wave from boss position
        bossPowers.push(new BossGroundWave(enemy.x + enemy.w / 2, true));
        bossPowers.push(new BossGroundWave(enemy.x + enemy.w / 2, false));
        sndBossWave();
        bossPowerTimer = BOSS_POWER_COOLDOWN * 0.72;
      } else {
        // Energy rain from sky
        bossPowers.push(new BossEnergyRain());
        sndBossRain();
        bossPowerTimer = BOSS_POWER_COOLDOWN * 0.95;
      }
    }
  }
}

// =============================================================================
// SOUNDS (Web Audio API)
// =============================================================================

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  ensureP1PunchSfx();
  ensureDashWhooshSfx();
  ensureP1ProjectileSfx();
  ensureP1GroundWaveSfx();
  ensureP1JumpSfx();
  ensureP1HitSfx();
  ensureP1OverclockLayerSfx();
  ensureBossPhase2DashSfx();
  ensurePhase2FloatSfx();
  ensureBossProjectileSfx();
  ensureBossGroundPowerSfx();
  ensureTerminalOverlaySfx();
  ensurePrePhase2ExplosionSfx();
  ensureFightBgm();
}

const P1_PUNCH_SFX_URLS = [
  'assets/fight/SFX/615793__parret__arcade-punch-01.wav',
  'assets/fight/SFX/615792__parret__arcade-punch-02.wav'
];
let p1PunchSfxIndex = 0;
let p1PunchSfxReady = false;
const p1PunchSfxPool = [null, null];

function ensureP1PunchSfx() {
  if (p1PunchSfxReady) return;
  p1PunchSfxPool[0] = new Audio(P1_PUNCH_SFX_URLS[0]);
  p1PunchSfxPool[1] = new Audio(P1_PUNCH_SFX_URLS[1]);
  p1PunchSfxPool.forEach(a => {
    if (a) a.preload = 'auto';
  });
  p1PunchSfxReady = true;
}

function sndPunchP1() {
  ensureP1PunchSfx();
  const a = p1PunchSfxPool[p1PunchSfxIndex % 2];
  p1PunchSfxIndex++;
  if (!a) return;
  a.currentTime = 0;
  a.volume = 0.88;
  const p = a.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

const DASH_WHOOSH_SFX_URL =
  'assets/fight/SFX/274211__littlerobotsoundfactory__whoosh_electric_00.wav';
let dashWhooshAudio = null;

function ensureDashWhooshSfx() {
  if (dashWhooshAudio) return;
  dashWhooshAudio = new Audio(DASH_WHOOSH_SFX_URL);
  dashWhooshAudio.preload = 'auto';
}

function sndDashWhoosh() {
  ensureDashWhooshSfx();
  if (!dashWhooshAudio) return;
  dashWhooshAudio.currentTime = 0;
  dashWhooshAudio.volume = 0.78;
  const p = dashWhooshAudio.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

const P1_PROJECTILE_SFX_URL =
  'assets/fight/SFX/777293__artninja__custom_tiger_claw_ice_laser_sound_12182024.wav';
let p1ProjectileAudio = null;

function ensureP1ProjectileSfx() {
  if (p1ProjectileAudio) return;
  p1ProjectileAudio = new Audio(P1_PROJECTILE_SFX_URL);
  p1ProjectileAudio.preload = 'auto';
}

function sndP1ProjectileSfx() {
  ensureP1ProjectileSfx();
  if (!p1ProjectileAudio) return;
  p1ProjectileAudio.currentTime = 0;
  p1ProjectileAudio.volume = 0.45;
  const p = p1ProjectileAudio.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

const P1_GROUND_WAVE_SFX_URL =
  'assets/fight/SFX/490303__anomaex__sci-fi_effect_2.wav';
let p1GroundWaveAudio = null;

function ensureP1GroundWaveSfx() {
  if (p1GroundWaveAudio) return;
  p1GroundWaveAudio = new Audio(P1_GROUND_WAVE_SFX_URL);
  p1GroundWaveAudio.preload = 'auto';
}

function sndP1GroundWaveSfx() {
  ensureP1GroundWaveSfx();
  if (!p1GroundWaveAudio) return;
  p1GroundWaveAudio.currentTime = 0;
  p1GroundWaveAudio.volume = 0.68;
  const p = p1GroundWaveAudio.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

const P1_JUMP_SFX_URL = `assets/fight/SFX/${encodeURIComponent(
  '686986__tailssonic__little-fighter-jump (1).wav'
)}`;
let p1JumpAudio = null;

function ensureP1JumpSfx() {
  if (p1JumpAudio) return;
  p1JumpAudio = new Audio(P1_JUMP_SFX_URL);
  p1JumpAudio.preload = 'auto';
}

function sndP1JumpSfx() {
  ensureP1JumpSfx();
  if (!p1JumpAudio) return;
  p1JumpAudio.currentTime = 0;
  p1JumpAudio.volume = 0.72;
  const p = p1JumpAudio.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

const P1_HIT_SFX_URL = 'assets/fight/SFX/universfield-punch-03-352040.mp3';
let p1HitAudio = null;

function ensureP1HitSfx() {
  if (p1HitAudio) return;
  p1HitAudio = new Audio(P1_HIT_SFX_URL);
  p1HitAudio.preload = 'auto';
}

function sndP1HitSfx() {
  ensureP1HitSfx();
  if (!p1HitAudio) return;
  p1HitAudio.currentTime = 0;
  p1HitAudio.volume = 0.43;
  const p = p1HitAudio.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

function sndP1CyberJumpSfx() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o1 = audioCtx.createOscillator();
  const o2 = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o1.connect(g); o2.connect(g); g.connect(audioCtx.destination);
  o1.type = 'sawtooth';
  o2.type = 'triangle';
  o1.frequency.setValueAtTime(420, t);
  o1.frequency.exponentialRampToValueAtTime(160, t + 0.22);
  o2.frequency.setValueAtTime(760, t);
  o2.frequency.exponentialRampToValueAtTime(260, t + 0.22);
  g.gain.setValueAtTime(0.14, t);
  g.gain.exponentialRampToValueAtTime(0.01, t + 0.24);
  o1.start(t); o2.start(t);
  o1.stop(t + 0.24); o2.stop(t + 0.24);
}

const P1_OVERCLOCK_LAYER_SFX_URLS = [
  'assets/fight/SFX/828087__audiopapkin__sound-design-elements-impact-sfx-ps-118.wav',
  'assets/fight/SFX/843655__cat-fox_alex__glitch-fx-impact-2.flac'
];
const p1OverclockLayerPool = [null, null];
let p1OverclockLayerReady = false;

function ensureP1OverclockLayerSfx() {
  if (p1OverclockLayerReady) return;
  p1OverclockLayerPool[0] = new Audio(P1_OVERCLOCK_LAYER_SFX_URLS[0]);
  p1OverclockLayerPool[1] = new Audio(P1_OVERCLOCK_LAYER_SFX_URLS[1]);
  p1OverclockLayerPool.forEach(a => {
    if (a) a.preload = 'auto';
  });
  p1OverclockLayerReady = true;
}

function sndP1OverclockLayerSfx() {
  ensureP1OverclockLayerSfx();
  const a0 = p1OverclockLayerPool[0];
  const a1 = p1OverclockLayerPool[1];
  if (a0) {
    a0.currentTime = 0;
    a0.volume = 0.58;
    const p0 = a0.play();
    if (p0 && typeof p0.catch === 'function') p0.catch(() => {});
  }
  if (a1) {
    a1.currentTime = 0;
    a1.volume = 0.52;
    const p1 = a1.play();
    if (p1 && typeof p1.catch === 'function') p1.catch(() => {});
  }
}

const BOSS_P2_DASH_SFX_URL = 'assets/fight/SFX/316312__littlerobotsoundfactory__robot2_15.wav';
let bossP2DashAudio = null;

function ensureBossPhase2DashSfx() {
  if (bossP2DashAudio) return;
  bossP2DashAudio = new Audio(BOSS_P2_DASH_SFX_URL);
  bossP2DashAudio.preload = 'auto';
}

function sndBossPhase2DashSfx() {
  ensureBossPhase2DashSfx();
  if (!bossP2DashAudio) return;
  bossP2DashAudio.currentTime = 0;
  bossP2DashAudio.volume = 0.74;
  const p = bossP2DashAudio.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

const PHASE2_FLOAT_SFX_URL = 'assets/fight/SFX/397477__theogobbo__pgj-breach.wav';
let phase2FloatAudio = null;

function ensurePhase2FloatSfx() {
  if (phase2FloatAudio) return;
  phase2FloatAudio = new Audio(PHASE2_FLOAT_SFX_URL);
  phase2FloatAudio.preload = 'auto';
}

function sndPhase2FloatSfx() {
  ensurePhase2FloatSfx();
  if (!phase2FloatAudio) return;
  phase2FloatAudio.currentTime = 0;
  phase2FloatAudio.volume = 1;
  const p = phase2FloatAudio.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

const BOSS_PROJECTILE_SFX_URL =
  'assets/fight/SFX/459615__bolkmar__fx-laser-shoot-c.wav';
let bossProjectileAudio = null;

function ensureBossProjectileSfx() {
  if (bossProjectileAudio) return;
  bossProjectileAudio = new Audio(BOSS_PROJECTILE_SFX_URL);
  bossProjectileAudio.preload = 'auto';
}

function sndBossProjectileSfx() {
  ensureBossProjectileSfx();
  if (!bossProjectileAudio) return;
  bossProjectileAudio.currentTime = 0;
  bossProjectileAudio.volume = 0.68;
  const p = bossProjectileAudio.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

const BOSS_GROUND_POWER_SFX_URL =
  'assets/fight/SFX/401752__zenithinfinitivestudios__robot_sound.wav';
let bossGroundPowerAudio = null;

function ensureBossGroundPowerSfx() {
  if (bossGroundPowerAudio) return;
  bossGroundPowerAudio = new Audio(BOSS_GROUND_POWER_SFX_URL);
  bossGroundPowerAudio.preload = 'auto';
}

function sndBossGroundPowerSfx() {
  ensureBossGroundPowerSfx();
  if (!bossGroundPowerAudio) return;
  bossGroundPowerAudio.currentTime = 0;
  bossGroundPowerAudio.volume = 0.66;
  const p = bossGroundPowerAudio.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

const TERMINAL_OVERLAY_SFX_URLS = [
  'assets/fight/SFX/757449__cabled_mess__sci-fi-computing-transmission-01_stereo.wav',
  `assets/fight/SFX/${encodeURIComponent('493891__crinkem__vintage-hard-drive-read-and-idle (1).wav')}`
];
const TERMINAL_OVERLAY_BASE_VOLUMES = [0.46, 0.58];
const terminalOverlayAudios = [null, null];
let terminalOverlaySfxReady = false;
let terminalOverlaySfxPlaying = false;
let terminalOverlayFadeActive = false;
let terminalOverlayFadeTimer = 0;
let terminalOverlayFadeDelay = 0;
let terminalOverlayFadeDuration = 1;
let terminalOverlayFinalFadeStarted = false;

function ensureTerminalOverlaySfx() {
  if (terminalOverlaySfxReady) return;
  terminalOverlayAudios[0] = new Audio(TERMINAL_OVERLAY_SFX_URLS[0]);
  terminalOverlayAudios[1] = new Audio(TERMINAL_OVERLAY_SFX_URLS[1]);
  terminalOverlayAudios.forEach(a => {
    if (!a) return;
    a.preload = 'auto';
    a.loop = true;
  });
  terminalOverlaySfxReady = true;
}

function sndTerminalOverlaySfx() {
  ensureTerminalOverlaySfx();
  if (terminalOverlaySfxPlaying) return;
  terminalOverlaySfxPlaying = true;
  terminalOverlayFadeActive = false;
  terminalOverlayFadeTimer = 0;
  terminalOverlayFinalFadeStarted = false;
  const a0 = terminalOverlayAudios[0];
  const a1 = terminalOverlayAudios[1];
  if (a0) {
    a0.currentTime = 0;
    a0.volume = TERMINAL_OVERLAY_BASE_VOLUMES[0];
    const p0 = a0.play();
    if (p0 && typeof p0.catch === 'function') p0.catch(() => {});
  }
  if (a1) {
    a1.currentTime = 0;
    a1.volume = TERMINAL_OVERLAY_BASE_VOLUMES[1];
    const p1 = a1.play();
    if (p1 && typeof p1.catch === 'function') p1.catch(() => {});
  }
}

function startTerminalOverlayFadeOut(delayFrames = 24, durationFrames = 34) {
  if (!terminalOverlaySfxPlaying) return;
  terminalOverlayFadeActive = true;
  terminalOverlayFadeTimer = 0;
  terminalOverlayFadeDelay = Math.max(0, delayFrames);
  terminalOverlayFadeDuration = Math.max(1, durationFrames);
}

function updateTerminalOverlaySfxFade() {
  if (!terminalOverlayFadeActive || !terminalOverlaySfxPlaying) return;
  terminalOverlayFadeTimer++;
  if (terminalOverlayFadeTimer <= terminalOverlayFadeDelay) return;

  const t = Math.min(
    1,
    (terminalOverlayFadeTimer - terminalOverlayFadeDelay) / terminalOverlayFadeDuration
  );
  const gain = 1 - t;
  const a0 = terminalOverlayAudios[0];
  const a1 = terminalOverlayAudios[1];
  if (a0) a0.volume = TERMINAL_OVERLAY_BASE_VOLUMES[0] * gain;
  if (a1) a1.volume = TERMINAL_OVERLAY_BASE_VOLUMES[1] * gain;

  if (t >= 1) {
    stopTerminalOverlaySfx();
  }
}

function stopTerminalOverlaySfx() {
  if (!terminalOverlaySfxReady) return;
  terminalOverlaySfxPlaying = false;
  terminalOverlayFadeActive = false;
  terminalOverlayFadeTimer = 0;
  terminalOverlayFinalFadeStarted = false;
  terminalOverlayAudios.forEach(a => {
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  });
}

const PRE_PHASE2_EXPLOSION_SFX_URLS = [
  'assets/fight/SFX/414345__bykgames__explosion-near.wav',
  'assets/fight/SFX/607206__fupicat__explode.wav',
  'assets/fight/SFX/501103__evretro__8-bit-explosion.wav'
];
const prePhase2ExplosionSfxBases = [null, null, null];
let prePhase2ExplosionSfxReady = false;
let prePhase2ExplosionSfxIdx = 0;
let prePhase2ExplosionSfxActive = [];

function ensurePrePhase2ExplosionSfx() {
  if (prePhase2ExplosionSfxReady) return;
  for (let i = 0; i < PRE_PHASE2_EXPLOSION_SFX_URLS.length; i++) {
    const a = new Audio(PRE_PHASE2_EXPLOSION_SFX_URLS[i]);
    a.preload = 'auto';
    prePhase2ExplosionSfxBases[i] = a;
  }
  prePhase2ExplosionSfxReady = true;
}

function sndPrePhase2ExplosionRandom() {
  ensurePrePhase2ExplosionSfx();
  const alive = prePhase2ExplosionSfxBases.filter(Boolean);
  if (!alive.length) return;

  prePhase2ExplosionSfxIdx = (prePhase2ExplosionSfxIdx + 1 + Math.floor(Math.random() * alive.length)) % alive.length;
  const base = alive[prePhase2ExplosionSfxIdx];
  if (!base) return;
  const a = base.cloneNode(true);
  a.volume = 0.52 + Math.random() * 0.18;
  prePhase2ExplosionSfxActive.push(a);
  const p = a.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
  a.onended = () => {
    prePhase2ExplosionSfxActive = prePhase2ExplosionSfxActive.filter(x => x !== a);
  };
}

function stopPrePhase2ExplosionSfx() {
  prePhase2ExplosionSfxActive.forEach(a => {
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  });
  prePhase2ExplosionSfxActive = [];
}

const FIGHT_BGM_PHASE1_URL = 'assets/fight/SFX/alperomeresin-the-final-boss-battle-158700.mp3';
const FIGHT_BGM_PHASE2_URL = 'assets/fight/SFX/junipersona-to-the-death-159171.mp3';
let fightBgmPhase1Audio = null;
let fightBgmPhase2Audio = null;
let fightBgmActiveTrack = '';

function ensureFightBgm() {
  if (!fightBgmPhase1Audio) {
    fightBgmPhase1Audio = new Audio(FIGHT_BGM_PHASE1_URL);
    fightBgmPhase1Audio.preload = 'auto';
    fightBgmPhase1Audio.loop = true;
  }
  if (!fightBgmPhase2Audio) {
    fightBgmPhase2Audio = new Audio(FIGHT_BGM_PHASE2_URL);
    fightBgmPhase2Audio.preload = 'auto';
    fightBgmPhase2Audio.loop = true;
  }
}

function playFightBgm(track) {
  ensureFightBgm();
  if (fightBgmActiveTrack === track) return;
  stopFightBgm();
  const a = track === 'phase2' ? fightBgmPhase2Audio : fightBgmPhase1Audio;
  if (!a) return;
  fightBgmActiveTrack = track;
  a.currentTime = 0;
  a.volume = track === 'phase2' ? 0.42 : 0.31;
  const p = a.play();
  if (p && typeof p.catch === 'function') {
    p.catch(() => {
      if (fightBgmActiveTrack === track) fightBgmActiveTrack = '';
    });
  }
}

function stopFightBgm() {
  if (fightBgmPhase1Audio) {
    fightBgmPhase1Audio.pause();
    fightBgmPhase1Audio.currentTime = 0;
  }
  if (fightBgmPhase2Audio) {
    fightBgmPhase2Audio.pause();
    fightBgmPhase2Audio.currentTime = 0;
  }
  fightBgmActiveTrack = '';
}

function updateFightBgmByState() {
  const phase1Combat = (state === 'playing' || state === 'dying' || state === 'lost') && bossPhase < 2;
  const phase2Combat = (state === 'playing' || state === 'phase2_intro' || state === 'dying' || state === 'lost') && bossPhase >= 2;
  if (phase2Combat) playFightBgm('phase2');
  else if (phase1Combat) playFightBgm('phase1');
  else stopFightBgm();
}

function sndPunch() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

function sndJump() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.15);
  
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

function sndHit() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.08);
  
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.08);
}

function sndVictory() {
  if (!audioCtx) return;
  const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);
    
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.3);
    
    osc.start(audioCtx.currentTime + i * 0.15);
    osc.stop(audioCtx.currentTime + i * 0.15 + 0.3);
  });
}

function sndSpecial() {
  if (!audioCtx) return;
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(audioCtx.destination);

  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(600, audioCtx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.3);

  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

  osc1.start();
  osc2.start();
  osc1.stop(audioCtx.currentTime + 0.3);
  osc2.stop(audioCtx.currentTime + 0.3);
}

function sndBurst() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;

  const noise = audioCtx.createOscillator();
  const noiseGain = audioCtx.createGain();
  noise.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noise.type = 'sawtooth';
  noise.frequency.setValueAtTime(150, t);
  noise.frequency.exponentialRampToValueAtTime(50, t + 0.4);
  noiseGain.gain.setValueAtTime(0.18, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
  noise.start(t);
  noise.stop(t + 0.4);

  const bass = audioCtx.createOscillator();
  const bassGain = audioCtx.createGain();
  bass.connect(bassGain);
  bassGain.connect(audioCtx.destination);
  bass.type = 'sine';
  bass.frequency.setValueAtTime(80, t);
  bass.frequency.exponentialRampToValueAtTime(30, t + 0.3);
  bassGain.gain.setValueAtTime(0.2, t);
  bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
  bass.start(t);
  bass.stop(t + 0.3);

  const hi = audioCtx.createOscillator();
  const hiGain = audioCtx.createGain();
  hi.connect(hiGain);
  hiGain.connect(audioCtx.destination);
  hi.type = 'square';
  hi.frequency.setValueAtTime(800, t);
  hi.frequency.exponentialRampToValueAtTime(200, t + 0.2);
  hiGain.gain.setValueAtTime(0.06, t);
  hiGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
  hi.start(t);
  hi.stop(t + 0.2);
}

function sndTrap() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;

  const buzz = audioCtx.createOscillator();
  const buzzGain = audioCtx.createGain();
  buzz.connect(buzzGain);
  buzzGain.connect(audioCtx.destination);
  buzz.type = 'sawtooth';
  buzz.frequency.setValueAtTime(120, t);
  buzz.frequency.exponentialRampToValueAtTime(60, t + 0.3);
  buzzGain.gain.setValueAtTime(0.12, t);
  buzzGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
  buzz.start(t);
  buzz.stop(t + 0.3);

  const zap = audioCtx.createOscillator();
  const zapGain = audioCtx.createGain();
  zap.connect(zapGain);
  zapGain.connect(audioCtx.destination);
  zap.type = 'square';
  zap.frequency.setValueAtTime(600, t);
  zap.frequency.exponentialRampToValueAtTime(150, t + 0.15);
  zapGain.gain.setValueAtTime(0.08, t);
  zapGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
  zap.start(t);
  zap.stop(t + 0.15);
}

function sndTrapSpawn() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
  gain.gain.setValueAtTime(0.06, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
  osc.start(t);
  osc.stop(t + 0.2);
}

function sndRespawn() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.2);
  
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

// =============================================================================
// BACKGROUND — Cyberpunk Arena
// =============================================================================

function initBackground() {
  if (!bgImage) {
    bgImage = new Image();
    bgImage.onload = () => { bgImageLoaded = true; };
    bgImage.src = 'assets/fight/Cenario_001.png';
  }

  if (!bgImageP2InitDone) {
    bgImageP2InitDone = true;
    bgImageP2 = new Image();
    bgImageP2.onload = () => { bgImageP2Loaded = true; };
    bgImageP2.onerror = () => { bgImageP2Loaded = false; };
    bgImageP2.src = BG_PHASE2_SRC;
  }

  bgRaindrops = [];
  for (let i = 0; i < 120; i++) {
    bgRaindrops.push({
      x: Math.random() * W,
      y: Math.random() * GROUND_Y,
      len: 4 + Math.random() * 12,
      speed: 6 + Math.random() * 8,
      alpha: 0.08 + Math.random() * 0.18
    });
  }

  bgSmoke = [];
  for (let i = 0; i < 8; i++) {
    bgSmoke.push({
      x: Math.random() * W,
      y: GROUND_Y - 10 - Math.random() * 30,
      r: 20 + Math.random() * 40,
      vx: -0.15 + Math.random() * 0.3,
      alpha: 0.02 + Math.random() * 0.04
    });
  }

  bgEmbers = [];
  for (let i = 0; i < 42; i++) {
    bgEmbers.push({
      x: Math.random() * W,
      y: GROUND_Y + Math.random() * (H - GROUND_Y + 20),
      vy: 0.5 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.45,
      size: 1 + Math.random() * 2.4,
      alpha: 0.25 + Math.random() * 0.55,
      life: 40 + Math.random() * 70,
      maxLife: 40 + Math.random() * 70
    });
  }

  bgOffset = 0;
}

function renderBackground(ctx) {
  const t = bgOffset;

  if (
    state === 'phase_transition' &&
    !showBossPhase2Background &&
    bgImageP2Loaded &&
    bgImageP2
  ) {
    showBossPhase2Background = true;
  }

  // --- Background image (fase 2: após swap na transição ou bossPhase >= 2) ---
  if (
    bgImageP2Loaded &&
    bgImageP2 &&
    (bossPhase >= 2 || showBossPhase2Background)
  ) {
    ctx.drawImage(bgImageP2, 0, 0, W, H);
  } else if (bgImageLoaded && bgImage) {
    ctx.drawImage(bgImage, 0, 0, W, H);
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#020012');
    sky.addColorStop(0.5, '#0a0028');
    sky.addColorStop(1, '#050510');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
  }

  // --- Smoke / steam ---
  bgSmoke.forEach(s => {
    s.x += s.vx;
    s.y -= 0.1;
    if (s.y < GROUND_Y - 80) { s.y = GROUND_Y - 5; s.x = Math.random() * W; }
    if (s.x < -50) s.x = W + 50;
    if (s.x > W + 50) s.x = -50;
    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
    grad.addColorStop(0, `rgba(160, 120, 200, ${s.alpha})`);
    grad.addColorStop(1, 'rgba(80, 40, 120, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  });

  // --- Rain ---
  ctx.strokeStyle = 'rgba(180, 210, 255, 0.15)';
  ctx.lineWidth = 1;
  bgRaindrops.forEach(r => {
    r.y += r.speed;
    r.x -= 1.2;
    if (r.y > GROUND_Y) {
      r.y = -r.len;
      r.x = Math.random() * (W + 60);
    }
    if (r.x < -10) r.x = W + 10;
    ctx.globalAlpha = r.alpha;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y);
    ctx.lineTo(r.x - 1.2 * (r.len / r.speed) * 2, r.y + r.len);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  // --- Scanline overlay ---
  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
  for (let y = 0; y < H; y += 3) {
    ctx.fillRect(0, y, W, 1);
  }

  // --- Phase 2: rising red embers from destroyed ground ---
  if (bossPhase >= 2 && state !== 'phase_transition') {
    bgEmbers.forEach(e => {
      e.y -= e.vy;
      e.x += e.vx + Math.sin((t + e.y) * 0.03) * 0.15;
      e.life--;

      if (e.life <= 0 || e.y < -20) {
        e.x = Math.random() * W;
        e.y = GROUND_Y + Math.random() * (H - GROUND_Y + 24);
        e.vy = 0.55 + Math.random() * 2.1;
        e.vx = (Math.random() - 0.5) * 0.5;
        e.size = 1 + Math.random() * 2.6;
        e.alpha = 0.25 + Math.random() * 0.6;
        e.maxLife = 40 + Math.random() * 80;
        e.life = e.maxLife;
      }

      const lifePct = e.life / e.maxLife;
      ctx.save();
      ctx.globalAlpha = e.alpha * Math.max(0, lifePct) * (0.7 + 0.3 * Math.sin(t * 0.2 + e.x * 0.05));
      ctx.shadowColor = '#ff2a2a';
      ctx.shadowBlur = 8;
      ctx.fillStyle = lifePct > 0.45 ? '#ff4b3a' : '#ffb36a';
      ctx.fillRect(e.x, e.y, e.size, e.size * 1.8);
      ctx.restore();
    });
  }

  if (bossPhase >= 2 && state !== 'phase_transition') {
    renderBossPhase2ScreenEffect(ctx, t);
  }

  bgOffset += 1;
}

function renderBossPhase2ScreenEffect(ctx, t) {
  const pulse = 0.45 + 0.55 * Math.sin(t * 0.06);
  const pulse2 = 0.5 + 0.5 * Math.sin(t * 0.11 + 1.2);

  ctx.save();

  // Tom magenta / perigo sobre a cena
  ctx.globalCompositeOperation = 'multiply';
  const tint = ctx.createLinearGradient(0, 0, W, H);
  tint.addColorStop(0, `rgba(80, 0, 90, ${0.22 + pulse * 0.06})`);
  tint.addColorStop(0.4, `rgba(120, 0, 80, ${0.14 + pulse2 * 0.08})`);
  tint.addColorStop(1, `rgba(40, 0, 100, ${0.2 + pulse * 0.05})`);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'screen';

  const wash = ctx.createRadialGradient(W * 0.5, H * 0.45, 40, W * 0.5, H * 0.45, W * 0.75);
  wash.addColorStop(0, `rgba(255, 0, 120, ${0.06 * pulse})`);
  wash.addColorStop(0.55, 'rgba(255, 0, 200, 0)');
  wash.addColorStop(1, `rgba(0, 200, 255, ${0.04 * pulse2})`);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = 'source-over';

  // Vignette escuro nas bordas
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(0.65, 'rgba(0,0,0,0.12)');
  vig.addColorStop(1, 'rgba(10,0,25,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Barras de glitch horizontais (fracas, aleatórias)
  if (t % 5 === 0) {
    const gy = Math.random() * H;
    ctx.globalAlpha = 0.08 + Math.random() * 0.1;
    ctx.fillStyle = Math.random() < 0.5 ? '#ff0088' : '#00ffff';
    ctx.fillRect((Math.random() - 0.5) * 20, gy, W, 2 + Math.random() * 10);
  }
  ctx.globalAlpha = 1;

  // Borda pulsante de alerta
  ctx.strokeStyle = `rgba(255,0,100,${0.25 + 0.2 * pulse})`;
  ctx.lineWidth = 2 + pulse;
  ctx.shadowColor = '#ff0066';
  ctx.shadowBlur = 12 * pulse;
  ctx.strokeRect(3, 3, W - 6, H - 6);
  ctx.strokeStyle = `rgba(0,255,255,${0.12 + 0.1 * pulse2})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.shadowBlur = 0;

  // Scanlines extras (mais densas na fase 2)
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#000';
  for (let y = 0; y < H; y += 2) {
    if (y % 4 !== 0) ctx.fillRect(0, y, W, 1);
  }
  ctx.globalAlpha = 1;

  // Partículas digitais drift
  const seed = Math.floor(t / 3);
  ctx.fillStyle = 'rgba(255,0,180,0.12)';
  for (let i = 0; i < 12; i++) {
    const px = ((seed * 37 + i * 97) % W) + Math.sin(t * 0.02 + i) * 15;
    const py = ((t * 2 + i * 41) % H);
    ctx.fillRect(px, py, 1 + (i % 2), 2);
  }

  ctx.restore();
}

// =============================================================================
// HUD — Cyberpunk Neon
// =============================================================================

const HUD_FONT = '"Press Start 2P", monospace';
const TIMER_BOX_W = 62;
const BAR_GAP = 6;
const BAR_W = (W - TIMER_BOX_W - BAR_GAP * 2 - 16) / 2;
const BAR_H = 16;
const BAR_Y = 26;
const BAR_PAD = 8;

function hudRoundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHealthBar(ctx, x, y, w, h, pct, colorA, colorB, glowColor, flip) {
  const t = bgOffset;
  const pulse = 0.7 + 0.3 * Math.sin(t * 0.06);

  // Panel background
  const panelX = flip ? x - 8 : x - 8;
  const panelW = w + 16;
  ctx.save();
  hudRoundRect(ctx, panelX, y - 4, panelW, h + 8, 3);
  const bg = ctx.createLinearGradient(panelX, y, panelX, y + h);
  bg.addColorStop(0, 'rgba(10, 5, 30, 0.92)');
  bg.addColorStop(1, 'rgba(5, 2, 18, 0.95)');
  ctx.fillStyle = bg;
  ctx.fill();

  // Border glow
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8 * pulse;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1.5;
  hudRoundRect(ctx, panelX, y - 4, panelW, h + 8, 3);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Inner border
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  hudRoundRect(ctx, panelX + 2, y - 2, panelW - 4, h + 4, 2);
  ctx.stroke();
  ctx.restore();

  // Bar track
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x, y, w, h);

  // Health fill
  const fillW = Math.max(0, w * pct);
  if (fillW > 0) {
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, colorA);
    grad.addColorStop(1, colorB);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, fillW, h);

    // Shine highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x, y, fillW, h * 0.35);

    // Glow on fill edge
    if (pct < 1) {
      ctx.save();
      ctx.shadowColor = colorB;
      ctx.shadowBlur = 10;
      ctx.fillStyle = colorB;
      ctx.globalAlpha = 0.6 * pulse;
      ctx.fillRect(x + fillW - 3, y, 3, h);
      ctx.restore();
    }

    // Segment lines
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const sx = x + (w / 5) * i;
      if (sx < x + fillW) {
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.lineTo(sx, y + h);
        ctx.stroke();
      }
    }
  }

  // Low health warning pulse
  if (pct <= 0.25 && pct > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + 0.1 * Math.sin(t * 0.15)})`;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
}

function renderHUD(ctx) {
  const t = bgOffset;
  const pulse = 0.65 + 0.35 * Math.sin(t * 0.05);
  const cx = W / 2;

  // === Layout: bars almost touching the center timer box ===
  const pBarX = BAR_PAD;
  const eBarX = cx + TIMER_BOX_W / 2 + BAR_GAP;
  const pBarW = cx - TIMER_BOX_W / 2 - BAR_GAP - BAR_PAD;
  const eBarW = pBarW;

  // === PLAYER HEALTH (left → fills toward center) ===
  const pPct = player.health / player.maxHealth;
  const p1Od = isP1Berserker();
  const pBarColorA = p1Od ? '#ff00c8' : '#00ffff';
  const pBarColorB = p1Od ? '#ffea00' : '#00ff88';
  const pBarGlow = p1Od ? 'rgba(255, 0, 180, 0.88)' : 'rgba(0,255,255,0.7)';
  drawHealthBar(ctx, pBarX, BAR_Y, pBarW, BAR_H, pPct, pBarColorA, pBarColorB, pBarGlow, false);

  // Player label
  ctx.save();
  ctx.font = `bold 11px ${HUD_FONT}`;
  ctx.textAlign = 'left';
  if (p1Od) {
    ctx.shadowColor = '#ff0088';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#fff6a0';
  } else {
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#0ff';
  }
  ctx.fillText('PLAYER 01', pBarX + 2, BAR_Y - 7);
  ctx.shadowBlur = 0;
  ctx.restore();

  // P1 Lives
  const livesY = BAR_Y + BAR_H + 5;
  for (let i = 0; i < P1_MAX_LIVES; i++) {
    const lx = pBarX + i * 14 + 2;
    const alive = i < p1Lives;
    ctx.save();
    if (alive) {
      if (p1Od) {
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 8;
        ctx.fillStyle = i % 2 ? '#ff00aa' : '#ffee55';
      } else {
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#0ff';
      }
    } else {
      ctx.fillStyle = p1Od ? 'rgba(255,100,180,0.18)' : 'rgba(0,255,255,0.15)';
    }
    ctx.beginPath();
    const s = 4;
    ctx.moveTo(lx, livesY + s);
    ctx.bezierCurveTo(lx, livesY, lx - s, livesY, lx - s, livesY + s * 0.6);
    ctx.bezierCurveTo(lx - s, livesY + s * 1.4, lx, livesY + s * 1.8, lx, livesY + s * 2.2);
    ctx.bezierCurveTo(lx, livesY + s * 1.8, lx + s, livesY + s * 1.4, lx + s, livesY + s * 0.6);
    ctx.bezierCurveTo(lx + s, livesY, lx, livesY, lx, livesY + s);
    ctx.fill();
    ctx.restore();
  }

  // === ONDA GLITCH BAR (below lives, larger and slightly lower) ===
  const superY = livesY + 22;
  const superBarW = pBarW * 0.7;
  const superBarH = 9;
  const superPct = superMeter / SUPER_MAX;
  const superFull = superMeter >= SUPER_MAX;

  // Background
  ctx.save();
  ctx.fillStyle = p1Od ? 'rgba(36, 0, 22, 0.82)' : 'rgba(10,0,30,0.7)';
  ctx.strokeStyle = p1Od ? 'rgba(255, 70, 160, 0.5)' : 'rgba(180,120,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(pBarX, superY, superBarW, superBarH);
  ctx.fill();
  ctx.stroke();

  // Fill
  if (superPct > 0) {
    const fillW = superBarW * superPct;
    const superGrad = ctx.createLinearGradient(pBarX, superY, pBarX + fillW, superY);
    if (superFull) {
      const flashAlpha = 0.7 + 0.3 * Math.sin(t * 0.15);
      superGrad.addColorStop(0, `rgba(255,200,0,${flashAlpha})`);
      superGrad.addColorStop(0.5, `rgba(255,255,100,${flashAlpha})`);
      superGrad.addColorStop(1, `rgba(255,180,0,${flashAlpha})`);
    } else {
      superGrad.addColorStop(0, '#a040ff');
      superGrad.addColorStop(0.5, '#c060ff');
      superGrad.addColorStop(1, '#8020dd');
    }
    ctx.fillStyle = superGrad;
    ctx.fillRect(pBarX, superY, fillW, superBarH);

    // Glow on top
    ctx.shadowColor = superFull ? '#ffcc00' : '#a040ff';
    ctx.shadowBlur = superFull ? 10 * pulse : 4;
    ctx.fillStyle = superFull ? 'rgba(255,255,150,0.3)' : 'rgba(180,100,255,0.2)';
    ctx.fillRect(pBarX, superY, fillW, superBarH / 2);
    ctx.shadowBlur = 0;
  }

  // Segment lines
  for (let i = 1; i < 4; i++) {
    const sx = pBarX + (superBarW / 4) * i;
    ctx.strokeStyle = p1Od ? 'rgba(255, 120, 200, 0.35)' : 'rgba(180,120,255,0.25)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sx, superY);
    ctx.lineTo(sx, superY + superBarH);
    ctx.stroke();
  }

  // Label — cyberpunk styled power name
  const labelX = pBarX;
  const labelY = superY - 6;
  ctx.textAlign = 'left';

  if (superFull) {
    // Glitch offset when full
    const glitchX = Math.random() < 0.1 ? (Math.random() - 0.5) * 4 : 0;
    const glitchY = Math.random() < 0.08 ? (Math.random() - 0.5) * 2 : 0;

    // Cinematic neon frame when full
    ctx.save();
    ctx.strokeStyle = `rgba(255,210,120,${0.45 + 0.25 * pulse})`;
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#ffdd66';
    ctx.shadowBlur = 14 + 8 * pulse;
    ctx.strokeRect(pBarX - 3, superY - 2, superBarW + 6, superBarH + 4);
    ctx.restore();

    // Chromatic text layers
    ctx.font = `bold 8px ${HUD_FONT}`;
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = '#ff3ca8';
    ctx.fillText('⚡ OVERCLOCK NOVA ⚡', labelX - 1 + glitchX, labelY + glitchY);
    ctx.fillStyle = '#00ffff';
    ctx.fillText('⚡ OVERCLOCK NOVA ⚡', labelX + 1 + glitchX, labelY + glitchY);

    // Main text with stronger glow
    ctx.globalAlpha = 1;
    ctx.shadowColor = '#ffd86a';
    ctx.shadowBlur = 18 * pulse;
    ctx.fillStyle = `rgba(255,238,120,${0.84 + 0.16 * pulse})`;
    ctx.fillText('⚡ OVERCLOCK NOVA ⚡', labelX + glitchX, labelY + glitchY);
    ctx.shadowBlur = 0;

    // Dual shine sweep across bar
    const sweepX = pBarX + ((t * 2.4) % (superBarW + 30)) - 15;
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#fff';
    ctx.fillRect(sweepX, superY - 1, 4, superBarH + 2);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffd7ff';
    ctx.fillRect(sweepX - 9, superY, 3, superBarH);

    // Small energy sparks over the bar
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 4; i++) {
      const sx = pBarX + ((t * (1.6 + i * 0.3) + i * 37) % superBarW);
      const sy = superY - 2 + Math.sin(t * 0.18 + i) * 2;
      ctx.fillStyle = i % 2 ? '#ffe37a' : '#9fffff';
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  } else {
    // Dim version with stronger visibility while charging
    ctx.font = `bold 7px ${HUD_FONT}`;

    // Subtle chromatic
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = '#ff00ff';
    ctx.fillText('OVERCLOCK NOVA', labelX - 0.5, labelY);
    ctx.fillStyle = '#00ffff';
    ctx.fillText('OVERCLOCK NOVA', labelX + 0.5, labelY);

    ctx.globalAlpha = 0.65 + superPct * 0.25;
    ctx.shadowColor = '#a040ff';
    ctx.shadowBlur = 5 + superPct * 6;
    ctx.fillStyle = `rgba(210,150,255,${0.68 + superPct * 0.3})`;
    ctx.fillText('OVERCLOCK NOVA', labelX, labelY);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Percentage indicator
    ctx.font = `5px ${HUD_FONT}`;
    ctx.fillStyle = 'rgba(210,150,255,0.55)';
    ctx.fillText(`${Math.floor(superPct * 100)}%`, labelX + superBarW - 20, labelY);
  }
  ctx.restore();

  // === ENEMY HEALTH (right → fills toward center) ===
  const ePct = enemy.health / enemy.maxHealth;
  drawHealthBar(ctx, eBarX, BAR_Y, eBarW, BAR_H, ePct, '#ff00ff', '#ff0044', 'rgba(255,0,255,0.7)', true);

  // === P1 overdrive: aviso só em texto (pisca) ===
  if (isP1Berserker()) {
    const bPulse = 0.5 + 0.5 * Math.sin(t * 0.32);
    const blinkFast = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.24));
    const blinkSoft = 0.52 + 0.48 * Math.sin(t * 0.1);
    const blink = Math.min(1, blinkFast * blinkSoft);
    const bx = W / 2;
    const by = BAR_Y + BAR_H + 40;
    const gOff = Math.sin(t * 0.41) > 0.88 ? (Math.sin(t * 2.1) * 3) : 0;
    const gOffY = Math.sin(t * 0.37) > 0.9 ? (Math.cos(t * 1.9) * 1.6) : 0;
    const scalePulse = 1 + 0.045 * Math.sin(t * 0.28);

    ctx.save();
    ctx.textAlign = 'center';

    ctx.translate(bx, by);
    ctx.scale(scalePulse, scalePulse);
    ctx.translate(-bx, -by);

    const drawOdLine = (str, y, sizePx) => {
      ctx.font = `bold ${sizePx}px ${HUD_FONT}`;
      ctx.globalAlpha = 0.42 * blink;
      ctx.fillStyle = '#ff00aa';
      ctx.fillText(str, bx - 3 + gOff, y + gOffY);
      ctx.fillStyle = '#ffea00';
      ctx.fillText(str, bx + 3 + gOff, y + gOffY);
      ctx.globalAlpha = (0.92 + 0.08 * bPulse) * blink;
      ctx.shadowColor = '#ff0088';
      ctx.shadowBlur = 18 + 12 * bPulse;
      ctx.fillStyle = `rgba(255, 255, 220, ${0.92 + 0.08 * bPulse})`;
      ctx.fillText(str, bx + gOff * 0.25, y + gOffY * 0.25);
      ctx.shadowColor = '#00fff7';
      ctx.shadowBlur = 10 + 8 * bPulse;
      ctx.fillStyle = `rgba(255, 160, 220, ${0.45 + 0.4 * bPulse})`;
      ctx.fillText(str, bx + gOff * 0.25, y + gOffY * 0.25);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    drawOdLine(BERSERKER_HUD_L1, by, 18);
    drawOdLine(BERSERKER_HUD_L2, by + 22, 13);

    ctx.restore();
  }

  // Enemy label
  ctx.save();
  ctx.font = `bold 11px ${HUD_FONT}`;
  ctx.textAlign = 'right';
  ctx.shadowColor = '#f0f';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#f0f';
  ctx.fillText('CIRCUIT QUEEN', eBarX + eBarW - 2, BAR_Y - 7);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Corner tick (enemy)
  ctx.strokeStyle = 'rgba(255,0,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(eBarX + eBarW, BAR_Y + BAR_H + 3);
  ctx.lineTo(eBarX + eBarW, BAR_Y + BAR_H + 7);
  ctx.lineTo(eBarX + eBarW - 10, BAR_Y + BAR_H + 7);
  ctx.stroke();

  // === TIMER (center, large hi-tech) ===
  const timerStr = battleTimer.toString().padStart(2, '0');
  const timerLow = battleTimer <= 10;
  const timerBoxH = BAR_H + 24;
  const tx = cx - TIMER_BOX_W / 2;
  const ty = BAR_Y - 10;

  // Timer panel bg
  ctx.save();
  hudRoundRect(ctx, tx, ty, TIMER_BOX_W, timerBoxH, 4);
  const tbg = ctx.createLinearGradient(tx, ty, tx, ty + timerBoxH);
  tbg.addColorStop(0, 'rgba(15, 3, 35, 0.95)');
  tbg.addColorStop(0.5, 'rgba(8, 2, 22, 0.97)');
  tbg.addColorStop(1, 'rgba(4, 1, 14, 0.98)');
  ctx.fillStyle = tbg;
  ctx.fill();

  // Timer outer border
  const bCol = timerLow ? `rgba(255,30,30,${0.55 + 0.45 * pulse})` : 'rgba(180,160,255,0.45)';
  ctx.shadowColor = timerLow ? '#ff0000' : 'rgba(160,140,255,0.5)';
  ctx.shadowBlur = timerLow ? 16 * pulse : 8;
  ctx.strokeStyle = bCol;
  ctx.lineWidth = 1.8;
  hudRoundRect(ctx, tx, ty, TIMER_BOX_W, timerBoxH, 4);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Inner border
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  hudRoundRect(ctx, tx + 2, ty + 2, TIMER_BOX_W - 4, timerBoxH - 4, 3);
  ctx.stroke();

  // Corner accents on timer box
  const cLen = 7;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(0,255,255,0.5)';
  ctx.beginPath(); ctx.moveTo(tx, ty + cLen); ctx.lineTo(tx, ty); ctx.lineTo(tx + cLen, ty); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tx, ty + timerBoxH - cLen); ctx.lineTo(tx, ty + timerBoxH); ctx.lineTo(tx + cLen, ty + timerBoxH); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,0,255,0.5)';
  ctx.beginPath(); ctx.moveTo(tx + TIMER_BOX_W - cLen, ty); ctx.lineTo(tx + TIMER_BOX_W, ty); ctx.lineTo(tx + TIMER_BOX_W, ty + cLen); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tx + TIMER_BOX_W - cLen, ty + timerBoxH); ctx.lineTo(tx + TIMER_BOX_W, ty + timerBoxH); ctx.lineTo(tx + TIMER_BOX_W, ty + timerBoxH - cLen); ctx.stroke();
  ctx.restore();

  // Timer number — large
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const timerCY = ty + timerBoxH / 2 + 2;

  if (timerLow) {
    const flash = Math.sin(t * 0.15) > 0;
    // Chromatic aberration
    ctx.font = `20px ${HUD_FONT}`;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ff0000';
    ctx.fillText(timerStr, cx - 1.5, timerCY);
    ctx.fillStyle = '#0000ff';
    ctx.fillText(timerStr, cx + 1.5, timerCY);
    ctx.globalAlpha = 1;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 18 * pulse;
    ctx.fillStyle = flash ? '#ff1111' : '#ff5544';
    ctx.fillText(timerStr, cx, timerCY);
  } else {
    // Chromatic aberration subtle
    ctx.font = `20px ${HUD_FONT}`;
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#0ff';
    ctx.fillText(timerStr, cx - 1, timerCY);
    ctx.fillStyle = '#f0f';
    ctx.fillText(timerStr, cx + 1, timerCY);
    ctx.globalAlpha = 1;
    ctx.shadowColor = 'rgba(200,180,255,0.7)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.fillText(timerStr, cx, timerCY);
  }
  ctx.shadowBlur = 0;
  ctx.textBaseline = 'alphabetic';
  ctx.restore();

  // Timer label "TIME"
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `5px ${HUD_FONT}`;
  ctx.fillStyle = timerLow ? `rgba(255,100,100,${0.4 + 0.3 * pulse})` : 'rgba(180,160,255,0.4)';
  ctx.fillText('TIME', cx, ty - 2);
  ctx.restore();

  // === Connecting lines: bars → timer ===
  // Left bar → timer
  ctx.strokeStyle = 'rgba(0,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pBarX + pBarW, BAR_Y + BAR_H / 2);
  ctx.lineTo(tx, BAR_Y + BAR_H / 2);
  ctx.stroke();
  // Right bar → timer
  ctx.strokeStyle = 'rgba(255,0,255,0.2)';
  ctx.beginPath();
  ctx.moveTo(eBarX, BAR_Y + BAR_H / 2);
  ctx.lineTo(tx + TIMER_BOX_W, BAR_Y + BAR_H / 2);
  ctx.stroke();

  // === Top edge decorative corners ===
  ctx.strokeStyle = 'rgba(0,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, 14); ctx.lineTo(4, 4); ctx.lineTo(16, 4);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,0,255,0.15)';
  ctx.beginPath();
  ctx.moveTo(W - 4, 14); ctx.lineTo(W - 4, 4); ctx.lineTo(W - 16, 4);
  ctx.stroke();
}

// =============================================================================
// GAME LOGIC
// =============================================================================

function startGame() {
  stopTerminalOverlaySfx();
  stopPrePhase2ExplosionSfx();
  state = 'playing';
  battleTimer = 60;
  timerFrame = 0;
  gameFrameCount = 0;
  projectiles = [];
  energyFields = [];
  groundWaves = [];
  cyberJumpBolts = [];
  cyberGroundSurges = [];
  bossTraps = [];
  bossTrapTimer = 0;
  bossPowers = [];
  bossPowerTimer = 0;
  p1Lives = P1_MAX_LIVES;
  superMeter = 0;
  p2ShieldFlashTimer = 0;
  p2ShieldFailTimer = 0;
  p1SuperFx = null;
  prevButtonX = false;
  prevButtonB = false;
  phase2Intro = null;
  showBossPhase2Background = false;
  bossCineFx = { flash: 0, shake: 0, glitch: 0, bars: 0 };
  bossPhase = 1;
  phaseTransition = null;
  prePhase2Timer = 0;
  prePhase2Explosions = [];
  bossImploding = false;
  
  player = new Fighter(100, 300, 'Brawler-Girl', true);
  enemy = new Fighter(500, 300, 'Enemy-Punk', false);
  
  aiAttackTimer = 90;
  aiJumpTimer = 60;
  aiStrafeDir = 1;
  aiStrafeTimer = 0;
  aiRangedTimer = 70;
  aiMeleeCommitTimer = 0;
  aiP2DashCooldown = 0;
  aiState = 'chase';
  aiStateTimer = 0;
  aiComboCount = 0;
  aiDodgeCooldown = 0;
  aiBlockTimer = 0;
  aiFeintTimer = 0;
  aiPunishWindow = 0;
  aiPatternMemory = [];
  aiPreferredRange = 80;
  
  initBackground();
  initAudio();
}

function respawnPlayer() {
  player.health = player.maxHealth;
  player.x = 100;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
  player.attacking = false;
  player.attackFrame = 0;
  player.hitLanded = false;
  player.hitFlicker = 0;
  player.currentAnim = 'idle';
  player.spriteFrame = 0;
  player.spriteTimer = 0;
  player.dashing = false;
  player.dashTimer = 0;
  player.dashStrikeActive = false;
  player.dashStrikeTimer = 0;
  player.dashStrikeHitDone = false;
  player.afterimages = [];
  player.burstCooldown = 0;
  player.groundWaveCooldown = 0;
  bossCineFx = { flash: 0, shake: 0, glitch: 0, bars: 0 };
  player.bfBuffer = [];
  player.stunTimer = 0;
  sndRespawn();
}

function loseLife() {
  p1Lives--;
  spawnDeathExplosion(player.x + player.w / 2, player.y + player.h / 2);
  state = 'dying';
}

// =============================================================================
// PRE PHASE 2 — Boss “implode” + explosões em sprite (enemy-explosion)
// =============================================================================

function spawnPrePhase2Sequence() {
  loadPrePhase2ExplosionSprites();
  prePhase2Timer = 0;
  prePhase2Explosions = [];
  prePhase2ExplosionSfxCooldown = 0;
  stopPrePhase2ExplosionSfx();
  bossImploding = true;
  for (let i = 0; i < 16; i++) {
    prePhase2Explosions.push({
      x: 30 + Math.random() * (W - 60),
      y: 60 + Math.random() * (GROUND_Y - 100),
      life: -Math.floor(i * 3),
      maxLife: 42 + Math.floor(Math.random() * 28),
      maxR: 50 + Math.random() * 110,
      r: 0,
      sizeMult:
        PRE_PHASE2_EXPLOSION_SPRITE.sizeRandMin +
        Math.random() * (PRE_PHASE2_EXPLOSION_SPRITE.sizeRandMax - PRE_PHASE2_EXPLOSION_SPRITE.sizeRandMin)
    });
  }
  sndPrePhase2Rumble();
}

function sndPrePhase2Rumble() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g);
  g.connect(audioCtx.destination);
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(45, t);
  o.frequency.exponentialRampToValueAtTime(120, t + 0.25);
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
  o.start(t);
  o.stop(t + 0.35);
}

function sndPrePhase2Pop() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g);
  g.connect(audioCtx.destination);
  o.type = 'square';
  o.frequency.setValueAtTime(200 + Math.random() * 150, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  g.gain.setValueAtTime(0.05, t);
  g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
  o.start(t);
  o.stop(t + 0.12);
}

function updatePrePhase2() {
  prePhase2Timer++;
  bgOffset++;
  if (prePhase2ExplosionSfxCooldown > 0) prePhase2ExplosionSfxCooldown--;

  if (prePhase2Timer % 6 === 0) {
    prePhase2Explosions.push({
      x: 20 + Math.random() * (W - 40),
      y: 40 + Math.random() * (GROUND_Y - 120),
      life: 0,
      maxLife: 38 + Math.floor(Math.random() * 30),
      maxR: 45 + Math.random() * 95,
      r: 0,
      sizeMult:
        PRE_PHASE2_EXPLOSION_SPRITE.sizeRandMin +
        Math.random() * (PRE_PHASE2_EXPLOSION_SPRITE.sizeRandMax - PRE_PHASE2_EXPLOSION_SPRITE.sizeRandMin)
    });
    if (prePhase2ExplosionSfxCooldown <= 0) {
      sndPrePhase2ExplosionRandom();
      prePhase2ExplosionSfxCooldown = 4 + Math.floor(Math.random() * 5);
    }
    if (prePhase2Timer % 18 === 0) sndPrePhase2Pop();
  }

  if (prePhase2Timer % 4 === 0) {
    const ex = enemy ? enemy.x + enemy.w / 2 : W / 2;
    const ey = enemy ? enemy.y + enemy.h / 2 : GROUND_Y - 60;
    prePhase2Explosions.push({
      x: ex + (Math.random() - 0.5) * 100,
      y: ey + (Math.random() - 0.5) * 80,
      life: 0,
      maxLife: 48 + Math.floor(Math.random() * 20),
      maxR: 70 + Math.random() * 50,
      r: 0,
      sizeMult:
        PRE_PHASE2_EXPLOSION_SPRITE.sizeRandMin +
        Math.random() * (PRE_PHASE2_EXPLOSION_SPRITE.sizeRandMax - PRE_PHASE2_EXPLOSION_SPRITE.sizeRandMin)
    });
    if (prePhase2ExplosionSfxCooldown <= 0) {
      sndPrePhase2ExplosionRandom();
      prePhase2ExplosionSfxCooldown = 4 + Math.floor(Math.random() * 5);
    }
  }

  prePhase2Explosions.forEach(e => {
    e.life++;
    e.r = Math.min(e.maxR, e.r + 5 + e.life * 0.35);
  });

  prePhase2Explosions = prePhase2Explosions.filter(e => e.life < e.maxLife + 15);
  if (prePhase2Explosions.length > 42) {
    prePhase2Explosions = prePhase2Explosions.slice(-38);
  }

  if (enemy) {
    enemy.vx = 0;
    enemy.hitFlicker = 20;
  }
  if (player) player.vx = 0;

  if (prePhase2Timer >= PRE_PHASE2_DURATION) {
    bossImploding = false;
    prePhase2Explosions = [];
    stopPrePhase2ExplosionSfx();
    state = 'phase_transition';
    spawnPhaseTransition();
  }
}

function renderPrePhase2Explosions(ctx) {
  if (prePhase2ExplosionSprites.length === 0) return;

  prePhase2Explosions.forEach(e => {
    if (e.life < 0) return;
    const t = e.life / e.maxLife;
    const alpha = Math.max(0, 1 - t * 0.95);

    const frame = Math.min(
      PRE_PHASE2_EXPLOSION_SPRITE.count - 1,
      Math.floor(e.life / PRE_PHASE2_EXPLOSION_SPRITE.frameHold)
    );
    const sprite = prePhase2ExplosionSprites[frame];
    if (!sprite || !sprite.complete || sprite.naturalWidth === 0) return;

    const sm = typeof e.sizeMult === 'number' ? e.sizeMult : 1;
    const sizeFromRadius = Math.max(38, e.r * 1.25);
    const baseScale = (sizeFromRadius / Math.max(1, sprite.naturalWidth * 0.5)) * sm;
    const scale = Math.max(
      PRE_PHASE2_EXPLOSION_SPRITE.scaleMin,
      Math.min(PRE_PHASE2_EXPLOSION_SPRITE.scaleMax, baseScale)
    );
    const dw = sprite.naturalWidth * scale;
    const dh = sprite.naturalHeight * scale;

    ctx.save();
    ctx.globalAlpha = Math.min(1, 0.55 + alpha * 0.45);
    ctx.drawImage(sprite, e.x - dw / 2, e.y - dh / 2, dw, dh);
    ctx.restore();
  });
}

// =============================================================================
// PHASE TRANSITION — Fullscreen Cyberpunk Glitch Explosion
// =============================================================================

function spawnPhaseTransition() {
  stopPrePhase2ExplosionSfx();
  phaseTransition = {
    timer: 0,
    maxTimer: 150,
    flash: 1,
    glitchBars: [],
    sparks: [],
    dataStreams: [],
    shockwaves: [],
    hexGrid: [],
    warningText: 'DANGER',
    phase: 'explode',
    introPrepared: false
  };
  sndTerminalOverlaySfx();
  for (let i = 0; i < 30; i++) {
    phaseTransition.sparks.push({
      x: W / 2 + (Math.random() - 0.5) * 60,
      y: H / 2 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      size: 1 + Math.random() * 4,
      life: 40 + Math.random() * 80,
      color: Math.random() < 0.5 ? '#ff0044' : '#ff00ff'
    });
  }
  for (let i = 0; i < 15; i++) {
    phaseTransition.dataStreams.push({
      x: Math.random() * W,
      y: -Math.random() * H,
      speed: 2 + Math.random() * 5,
      chars: Array.from({ length: 8 + Math.floor(Math.random() * 12) }, () =>
        String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))
      ),
      alpha: 0.3 + Math.random() * 0.5
    });
  }
  for (let i = 0; i < 8; i++) {
    phaseTransition.hexGrid.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: 20 + Math.random() * 40,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05
    });
  }
  // Troca o fundo já no 1º frame da transição; o flash branco do renderPhaseTransition cobre o corte
  showBossPhase2Background = !!(bgImageP2Loaded && bgImageP2 && bgImageP2.complete);
}

function updatePhaseTransition() {
  if (!phaseTransition) return;
  phaseTransition.timer++;
  const t = phaseTransition.timer;

  if (t < 20) phaseTransition.flash = 1 - t / 20;
  else phaseTransition.flash = 0;

  // Generate glitch bars
  if (t % 3 === 0 && t < 100) {
    phaseTransition.glitchBars.push({
      y: Math.random() * H,
      h: 2 + Math.random() * 15,
      offset: (Math.random() - 0.5) * 40,
      alpha: 0.5 + Math.random() * 0.5,
      life: 5 + Math.random() * 10,
      color: Math.random() < 0.3 ? '#ff0044' : Math.random() < 0.6 ? '#00ffff' : '#ff00ff'
    });
  }
  phaseTransition.glitchBars.forEach(g => { g.life--; g.alpha *= 0.92; });
  phaseTransition.glitchBars = phaseTransition.glitchBars.filter(g => g.life > 0);

  // Shockwaves
  if (t === 5 || t === 25 || t === 50) {
    phaseTransition.shockwaves.push({ radius: 0, maxRadius: Math.max(W, H), alpha: 0.8 });
  }
  phaseTransition.shockwaves.forEach(s => {
    s.radius += 8;
    s.alpha *= 0.96;
  });
  phaseTransition.shockwaves = phaseTransition.shockwaves.filter(s => s.alpha > 0.02);

  // Sparks
  phaseTransition.sparks.forEach(s => {
    s.x += s.vx;
    s.y += s.vy;
    s.vx *= 0.98;
    s.vy *= 0.98;
    s.life--;
  });
  phaseTransition.sparks = phaseTransition.sparks.filter(s => s.life > 0);

  // Data streams (matrix rain)
  phaseTransition.dataStreams.forEach(d => {
    d.y += d.speed;
    if (d.y > H + 100) { d.y = -80; d.x = Math.random() * W; }
    if (t % 6 === 0) {
      const idx = Math.floor(Math.random() * d.chars.length);
      d.chars[idx] = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
    }
  });

  // Hexagons
  phaseTransition.hexGrid.forEach(h => { h.angle += h.rotSpeed; });

  // Warning text cycle
  if (t % 20 < 10) phaseTransition.warningText = '⚠ PHASE 2 ⚠';
  else phaseTransition.warningText = '⚠ DANGER ⚠';

  // Apply phase 2 changes at midpoint
  if (t === 75) {
    activatePhase2();
    spawnPhase2Intro();
    phaseTransition.introPrepared = true;
  }

  if (t >= phaseTransition.maxTimer) {
    stopTerminalOverlaySfx();
    phaseTransition = null;
    state = 'phase2_intro';
    sndPhase2FloatSfx();
  }
}

function renderPhaseTransition(ctx) {
  if (!phaseTransition) return;
  const pt = phaseTransition;
  const t = pt.timer;
  const progress = t / pt.maxTimer;
  const cx = W / 2;
  const cy = H / 2;

  // White flash
  if (pt.flash > 0) {
    ctx.save();
    ctx.globalAlpha = pt.flash;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Dark overlay building up then fading
  const overlayAlpha = t < 40 ? Math.min(0.85, t / 40) : Math.max(0, 0.85 - (t - 100) / 50);
  ctx.fillStyle = `rgba(0,0,8,${overlayAlpha})`;
  ctx.fillRect(0, 0, W, H);

  // Full-screen terminal layer for phase 2 boot.
  renderPhase2BootTerminal(ctx, t);

  // Shockwave rings
  pt.shockwaves.forEach(s => {
    ctx.save();
    ctx.strokeStyle = `rgba(255,0,100,${s.alpha})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx, cy, s.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(0,255,255,${s.alpha * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, s.radius * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  // Data streams (matrix rain)
  if (t < 120) {
    pt.dataStreams.forEach(d => {
      ctx.save();
      ctx.font = '10px monospace';
      d.chars.forEach((ch, i) => {
        const dy = d.y + i * 12;
        if (dy < 0 || dy > H) return;
        ctx.globalAlpha = d.alpha * (1 - i / d.chars.length) * Math.min(1, (120 - t) / 30);
        ctx.fillStyle = i === 0 ? '#ffffff' : '#ff0066';
        ctx.shadowColor = '#ff0066';
        ctx.shadowBlur = i === 0 ? 8 : 2;
        ctx.fillText(ch, d.x, dy);
      });
      ctx.restore();
    });
  }

  // Glitch bars
  pt.glitchBars.forEach(g => {
    ctx.save();
    ctx.globalAlpha = g.alpha;
    ctx.fillStyle = g.color;
    ctx.fillRect(g.offset, g.y, W, g.h);
    ctx.restore();
  });

  // Hexagonal grid
  if (t > 20 && t < 110) {
    const hexAlpha = Math.min(0.3, (t - 20) / 60) * Math.min(1, (110 - t) / 30);
    pt.hexGrid.forEach(h => {
      ctx.save();
      ctx.strokeStyle = `rgba(255,0,100,${hexAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 / 6) * i + h.angle;
        const px = h.x + Math.cos(a) * h.size;
        const py = h.y + Math.sin(a) * h.size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });
  }

  // Sparks
  pt.sparks.forEach(s => {
    ctx.save();
    ctx.globalAlpha = Math.min(1, s.life / 20);
    ctx.fillStyle = s.color;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 6;
    ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
    ctx.restore();
  });


  // Scanlines over everything
  if (t < 120) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 0; y < H; y += 2) {
      ctx.fillRect(0, y, W, 1);
    }
  }

  // Screen border flash
  if (t < 80) {
    const borderAlpha = 0.4 * (1 - t / 80);
    ctx.save();
    ctx.strokeStyle = `rgba(255,0,100,${borderAlpha})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 20;
    ctx.strokeRect(2, 2, W - 4, H - 4);
    ctx.restore();
  }
}

function activatePhase2() {
  bossPhase = 2;
  aiP2DashCooldown = 45;
  enemy.maxHealth = P2_HP + P2_PHASE2_HP_BONUS;
  enemy.health = enemy.maxHealth;
  enemy.w = Math.floor(50 * P2_PHASE2_SCALE);
  enemy.h = Math.floor(80 * P2_PHASE2_SCALE);
  enemy.y = GROUND_Y - enemy.h;
  enemy.attackBox.w = Math.floor(60 * P2_PHASE2_SCALE);
  enemy.attackBox.h = Math.floor(40 * P2_PHASE2_SCALE);
}

function spawnPhase2Intro() {
  phase2Intro = {
    timer: 0,
    duration: 120,
    floatAmp: 9,
    glowPulse: 0,
    hpFillStart: 6,
    hpFillDuration: 68
  };
  if (enemy) {
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.attacking = false;
    enemy.attackFrame = 0;
    enemy.currentAnim = 'idle';
    enemy.spriteFrame = 0;
    enemy.spriteTimer = 0;
    enemy.x = W / 2 - enemy.w / 2;
    enemy.y = GROUND_Y - enemy.h - 92;
    enemy.onGround = false;
    enemy.health = 1;
  }
  if (player) {
    player.vx = 0;
    player.dashing = false;
    player.dashStrikeActive = false;
    player.x = 100;
    player.y = GROUND_Y - player.h;
    player.onGround = true;
    player.currentAnim = 'idle';
  }
}

function updatePhase2Intro() {
  if (!phase2Intro || !enemy) return;
  phase2Intro.timer++;
  const t = phase2Intro.timer;
  const floatY = GROUND_Y - enemy.h - 92 + Math.sin(t * 0.14) * phase2Intro.floatAmp;
  phase2Intro.glowPulse = 0.5 + 0.5 * Math.sin(t * 0.2);

  enemy.vx = 0;
  enemy.vy = 0;
  enemy.x = W / 2 - enemy.w / 2;
  enemy.y = floatY;
  enemy.onGround = false;
  enemy.currentAnim = 'idle';

  // Keep sprite animation alive during intro without physics update.
  const def = getFighterSpriteDef(enemy);
  const idle = def?.animations?.idle;
  if (idle) {
    enemy.spriteTimer++;
    if (enemy.spriteTimer >= idle.speed) {
      enemy.spriteTimer = 0;
      enemy.spriteFrame = (enemy.spriteFrame + 1) % idle.count;
    }
  }
  if (player) {
    const pDef = getFighterSpriteDef(player);
    const pIdle = pDef?.animations?.idle;
    player.vx = 0;
    if (pIdle) {
      player.spriteTimer++;
      if (player.spriteTimer >= pIdle.speed) {
        player.spriteTimer = 0;
        player.spriteFrame = (player.spriteFrame + 1) % pIdle.count;
      }
    }
  }

  // Boss rebirth: refill HP bar during intro.
  const fillT = (t - phase2Intro.hpFillStart) / phase2Intro.hpFillDuration;
  const fillPct = Math.max(0, Math.min(1, fillT));
  enemy.health = Math.max(1, Math.floor(enemy.maxHealth * fillPct));

  if (t >= phase2Intro.duration) {
    enemy.health = enemy.maxHealth;
    enemy.y = GROUND_Y - enemy.h - 120;
    enemy.vy = 0;
    enemy.onGround = false;
    phase2Intro = null;
    state = 'playing';
  }
}

function renderPhase2IntroFX(ctx) {
  if (!phase2Intro || !enemy) return;
  const t = phase2Intro.timer;
  const ex = enemy.x + enemy.w / 2;
  const ey = enemy.y + enemy.h * 0.5;
  const pulse = phase2Intro.glowPulse || (0.5 + 0.5 * Math.sin(t * 0.2));

  ctx.save();
  // Aura bloom
  const aura = ctx.createRadialGradient(ex, ey, 8, ex, ey, 120);
  aura.addColorStop(0, `rgba(255,120,250,${0.35 + 0.18 * pulse})`);
  aura.addColorStop(0.5, `rgba(0,230,255,${0.18 + 0.14 * pulse})`);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(ex, ey, 130, 0, Math.PI * 2);
  ctx.fill();

  // Floating rings
  ctx.strokeStyle = `rgba(145,255,255,${0.24 + 0.2 * pulse})`;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = '#4cf7ff';
  ctx.shadowBlur = 12;
  for (let i = 0; i < 3; i++) {
    const r = 34 + ((t * 2.2 + i * 24) % 70);
    ctx.beginPath();
    ctx.arc(ex, ey, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Stronger interference after overlay ends (intro stage)
  if (Math.sin(t * 0.33) > 0.45) {
    ctx.globalAlpha = 0.12 + Math.random() * 0.12;
    ctx.fillStyle = Math.random() > 0.5 ? '#ff57d4' : '#4ff7ff';
    ctx.fillRect(0, 0, W, H);
  }
  if (Math.sin(t * 0.27) > 0.62) {
    const gy = (t * 7.5) % H;
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = Math.random() > 0.5 ? '#00eaff' : '#ff4dd7';
    ctx.fillRect(0, gy, W, 2);
  }
  ctx.restore();
}

function sndPhaseTransition() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;

  // Deep rumble
  const rumble = audioCtx.createOscillator();
  const rumbleGain = audioCtx.createGain();
  rumble.connect(rumbleGain);
  rumbleGain.connect(audioCtx.destination);
  rumble.type = 'sawtooth';
  rumble.frequency.setValueAtTime(60, t);
  rumble.frequency.exponentialRampToValueAtTime(25, t + 1.5);
  rumbleGain.gain.setValueAtTime(0.2, t);
  rumbleGain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
  rumble.start(t);
  rumble.stop(t + 1.5);

  // Rising alarm
  const alarm = audioCtx.createOscillator();
  const alarmGain = audioCtx.createGain();
  alarm.connect(alarmGain);
  alarmGain.connect(audioCtx.destination);
  alarm.type = 'square';
  alarm.frequency.setValueAtTime(200, t);
  alarm.frequency.exponentialRampToValueAtTime(800, t + 0.8);
  alarm.frequency.exponentialRampToValueAtTime(200, t + 1.6);
  alarmGain.gain.setValueAtTime(0.08, t);
  alarmGain.gain.linearRampToValueAtTime(0.12, t + 0.8);
  alarmGain.gain.exponentialRampToValueAtTime(0.01, t + 1.6);
  alarm.start(t);
  alarm.stop(t + 1.6);

  // Impact hit
  const impact = audioCtx.createOscillator();
  const impactGain = audioCtx.createGain();
  impact.connect(impactGain);
  impactGain.connect(audioCtx.destination);
  impact.type = 'sine';
  impact.frequency.setValueAtTime(100, t + 0.3);
  impact.frequency.exponentialRampToValueAtTime(30, t + 0.8);
  impactGain.gain.setValueAtTime(0, t);
  impactGain.gain.linearRampToValueAtTime(0.25, t + 0.3);
  impactGain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
  impact.start(t);
  impact.stop(t + 0.8);
}

function checkWinCondition() {
  if (enemy.health <= 0) {
    p1SuperFx = null;
    if (bossPhase === 1) {
      state = 'pre_phase2';
      spawnPrePhase2Sequence();
      return true;
    }

    // Phase 2: vitória só após último frame da morte + corpo no chão (vy parado).
    const eDef = getFighterSpriteDef(enemy);
    const deadAnim = eDef?.animations?.dead;
    if (deadAnim) {
      enemy.attacking = false;
      enemy.attackFrame = 0;
      const deadFramesDone =
        enemy.currentAnim === 'dead' && enemy.spriteFrame >= deadAnim.count - 1;
      const feetY = enemy.y + enemy.h;
      const grounded =
        enemy.onGround &&
        feetY >= GROUND_Y - 3 &&
        Math.abs(enemy.vy) < 0.35;
      if (!deadFramesDone || !grounded) return false;
    }

    enemy.vx = 0;
    enemy.vy = 0;
    state = 'won';
    victoryTimer = 0;
    sndTerminalOverlaySfx();
    return true;
  }
  
  if (player.health <= 0) {
    loseLife();
    return true;
  }
  
  if (battleTimer <= 0) {
    if (player.health >= enemy.health) {
      state = 'won';
      victoryTimer = 0;
      sndTerminalOverlaySfx();
    } else {
      loseLife();
    }
    return true;
  }
  
  return false;
}

// =============================================================================
// INPUT HANDLING
// =============================================================================

let gameFrameCount = 0;

function handleInput() {
  if (!_inputRef || state !== 'playing') return;
  if (player.stunTimer > 0) { player.vx = 0; return; }
  if (p1SuperFx) {
    prevButtonX = !!_inputRef.buttonX;
    return;
  }

  const input = _inputRef;
  const bPressed = !!input.buttonB;
  const upPressed = !!(input.up || input.buttonA);
  let consumedCyberJump = false;

  if (upPressed) {
    // Pequena janela para executar o combo sem frame perfeito.
    player.cyberJumpInputBuffer = 24;
  }

  const bxPressed = !!input.buttonX;
  if (bxPressed && !prevButtonX && superMeter >= SUPER_MAX) {
    if (tryFireP1Super()) {
      prevButtonX = true;
      return;
    }
  }
  prevButtonX = bxPressed;

  if (!player.dashing) {
    player.vx = 0;
    if (input.down && player.onGround) {
      player.triggerAnim('crouch');
    } else {
      if (input.left) player.vx = -PLAYER_SPEED;
      if (input.right) player.vx = PLAYER_SPEED;
    }
  }
  
  // Combo detection: back, back, punch → special
  const backPressed = player.facingRight ? input.left : input.right;
  if (backPressed && !player.prevBackPressed) {
    player.recordBack(gameFrameCount);
    player.recordBackFwd(gameFrameCount, 'back');
  }
  player.prevBackPressed = backPressed;
  
  // Combo detection: forward, forward → dash
  const fwdPressed = player.facingRight ? input.right : input.left;
  if (fwdPressed && !player.prevFwdPressed) {
    player.recordFwd(gameFrameCount);
    player.recordBackFwd(gameFrameCount, 'fwd');
    if (player.checkDashCombo(gameFrameCount)) {
      player.startDash();
      player.fwdBuffer = [];
    }
  }
  player.prevFwdPressed = fwdPressed;
  
  if (bPressed && (upPressed || player.cyberJumpInputBuffer > 0)) {
    consumedCyberJump = player.fireCyberJumpTrail();
  }

  if (upPressed && !consumedCyberJump) {
    player.jump();
  }
  
  if (bPressed && !prevButtonB) {
    if (consumedCyberJump) {
      // combo ja executado (↑ + soco): salto eletrico com rastro.
    } else if (player.startDashStrike()) {
      // two forward already triggered dash; action converts it to damaging cyber dash.
      player.fwdBuffer = [];
    } else if (input.down) {
      player.triggerAnim('crouch');
      player.fireGroundWave();
    } else if (player.checkCombo(gameFrameCount)) {
      player.fireSpecial();
      player.inputBuffer = [];
      player.bfBuffer = [];
    } else if (player.checkBurstCombo(gameFrameCount)) {
      player.fireBurst();
      player.bfBuffer = [];
      player.inputBuffer = [];
    } else {
      player.attack();
    }
  }
  prevButtonB = bPressed;
  
  gameFrameCount++;
}

// =============================================================================
// MAIN GAME INTERFACE
// =============================================================================

const luta = {
  id: 'luta',
  name: 'LUTA',
  difficulty: 4,
  
  init(canvasEl, inputRef) {
    _canvas = canvasEl;
    _inputRef = inputRef;
    state = 'idle';
    
    loadAllSprites();
    ensureIdleLogoLoaded();

    player = new Fighter(150, 300, 'Brawler-Girl', true);
    enemy = new Fighter(450, 300, 'Enemy-Punk', false);
    
    initBackground();
    initAudio();
  },
  
  update(dt) {
    updateTerminalOverlaySfxFade();
    updateFightBgmByState();
    updateBossCinematic();
    if (p2ShieldFlashTimer > 0) p2ShieldFlashTimer--;
    if (p2ShieldFailTimer > 0) p2ShieldFailTimer--;

    if (state === 'idle') {
      bgOffset++;
      // Advance sprite animation for idle display
      if (player) {
        player.vx = 0;
        const pDef = SPRITE_DEFS[player.charName].animations.idle;
        player.spriteTimer++;
        if (player.spriteTimer >= pDef.speed) {
          player.spriteTimer = 0;
          player.spriteFrame = (player.spriteFrame + 1) % pDef.count;
        }
      }
      if (enemy) {
        enemy.vx = 0;
        const eDef = SPRITE_DEFS[enemy.charName].animations.idle;
        enemy.spriteTimer++;
        if (enemy.spriteTimer >= eDef.speed) {
          enemy.spriteTimer = 0;
          enemy.spriteFrame = (enemy.spriteFrame + 1) % eDef.count;
        }
      }
      
      if (_inputRef) {
        const input = _inputRef;
        if (input.buttonA || input.buttonB || input.up || input.down || input.left || input.right) {
          startGame();
        }
      }
      return;
    }
    
    if (state === 'playing') {
      if (p1SuperFx) {
        updateP1Super();
        if (player) { player.vx = 0; player.dashing = false; player.dashStrikeActive = false; }
        if (enemy) enemy.vx = 0;
        player.update(dt);
        enemy.update(dt);
        checkWinCondition();
      } else {
      handleInput();
      
      player.update(dt);
      enemy.update(dt);

      if (player && enemy && !player.dashing) {
        const overlap = (player.x + player.w) - enemy.x;
        const overlapR = (enemy.x + enemy.w) - player.x;
        const minOverlap = Math.min(overlap, overlapR);
        if (overlap > 0 && overlapR > 0 && minOverlap > 0) {
          const push = minOverlap / 2 + 1;
          if (player.x < enemy.x) {
            player.x -= push;
            enemy.x += push;
          } else {
            player.x += push;
            enemy.x -= push;
          }
          if (player.x < 10) player.x = 10;
          if (player.x > W - player.w - 10) player.x = W - player.w - 10;
          if (enemy.x < 10) enemy.x = 10;
          if (enemy.x > W - enemy.w - 10) enemy.x = W - enemy.w - 10;
        }
      }
      
      updateEnemyAI(dt);
      
      if (checkHit(player, enemy) && !enemyBossDashIntangible()) {
        enemy.takeHit(scaleP1Damage(P1_ATTACK_DAMAGE));
        superMeter = Math.min(SUPER_MAX, superMeter + 8);
      }
      if (player.dashStrikeActive && !player.dashStrikeHitDone) {
        const pBox = { x: player.x + 8, y: player.y + 10, w: player.w - 16, h: player.h - 14 };
        const eBox = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
        if (checkCollision(pBox, eBox) && !enemyBossDashIntangible()) {
          enemy.takeHit(scaleP1Damage(DASH_STRIKE_DAMAGE));
          enemy.vx = (player.facingRight ? 1 : -1) * 7;
          player.dashStrikeHitDone = true;
          player.dashStrikeActive = false;
          player.dashing = false;
          superMeter = Math.min(SUPER_MAX, superMeter + 14);
        }
      }
      if (checkHit(enemy, player)) {
        const dmg = bossPhase >= 2 ? P2_PHASE2_DAMAGE : P2_ATTACK_DAMAGE;
        player.takeHit(dmg);
        superMeter = Math.min(SUPER_MAX, superMeter + 5);
      }
      if (
        bossPhase >= 2 &&
        enemy.dashing &&
        !enemy.dashStrikeActive &&
        !enemy.bossDashHitDone
      ) {
        const eBox = { x: enemy.x + 8, y: enemy.y + 10, w: enemy.w - 16, h: enemy.h - 16 };
        const pBox = { x: player.x + 8, y: player.y + 10, w: player.w - 16, h: player.h - 16 };
        if (checkCollision(eBox, pBox)) {
          player.takeHit(P2_BOSS_DASH_DAMAGE);
          enemy.bossDashHitDone = true;
          player.vx = enemy.dashDir * 6;
        }
      }

      projectiles.forEach(p => {
        p.update();
        if (!p.alive) return;
        if (p.exploding) return;
        const target = p.owner === player ? enemy : player;
        const pBox = p.getBox();
        if (p.owner === player && target === enemy && p2ShieldBlocksHit(pBox, p)) {
          p.alive = false;
          return;
        }
        const tBox = { x: target.x, y: target.y, w: target.w, h: target.h };
        if (
          p.owner === player &&
          target === enemy &&
          enemyBossDashIntangible()
        ) {
          return;
        }
        if (checkCollision(pBox, tBox)) {
          const projDmg = p.owner === enemy ? P2_RANGED_DAMAGE : scaleP1Damage(P1_SPECIAL_DAMAGE);
          target.takeHit(projDmg);
          if (p.owner === enemy) {
            p.exploding = true;
            p.explodeFrame = 0;
            p.explodeTick = 0;
          } else {
            p.alive = false;
          }
          if (p.owner === player) superMeter = Math.min(SUPER_MAX, superMeter + 12);
        }
      });

      energyFields.forEach(ef => ef.update());
      energyFields = energyFields.filter(ef => ef.alive);
      updateP1CyberJumpBolts();
      cyberGroundSurges.forEach(cs => cs.update());
      cyberGroundSurges.forEach(cs => {
        if (!cs.alive || cs.hitDone || !enemy || enemy.health <= 0) return;
        const sBox = cs.getBox();
        const eBox = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
        if (checkCollision(sBox, eBox) && !enemyBossDashIntangible()) {
          enemy.takeHit(scaleP1Damage(CYBER_GROUND_SURGE_DAMAGE));
          cs.hitDone = true;
          superMeter = Math.min(SUPER_MAX, superMeter + 9);
        }
      });
      cyberGroundSurges = cyberGroundSurges.filter(cs => cs.alive);
      projectiles = projectiles.filter(p => p.alive);
      groundWaves.forEach(gw => gw.update());
      groundWaves.forEach(gw => {
        if (!gw.alive || gw.hitDone || !enemy || enemy.health <= 0) return;
        const gBox = gw.getBox();
        const eBox = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
        if (checkCollision(gBox, eBox)) {
          if (!enemyBossDashIntangible()) {
            enemy.takeHit(scaleP1Damage(GROUND_WAVE_DAMAGE));
            gw.hitDone = true;
            superMeter = Math.min(SUPER_MAX, superMeter + 10);
          }
        }
      });
      groundWaves = groundWaves.filter(gw => gw.alive);

      bossTraps.forEach(bt => bt.update());
      bossTraps = bossTraps.filter(bt => bt.alive);

      bossPowers.forEach(bp => bp.update());
      bossPowers = bossPowers.filter(bp => bp.alive);
      
      timerFrame++;
      if (timerFrame >= 60) {
        timerFrame = 0;
        battleTimer--;
        if (battleTimer < 0) battleTimer = 0;
      }
      
      checkWinCondition();
      }
    }

    if (state === 'pre_phase2') {
      updatePrePhase2();
      if (player) {
        player.vx = 0;
        player.dashing = false;
      }
      if (enemy) enemy.vx = 0;
      if (player) player.update(dt);
      if (enemy) enemy.update(dt);
      return;
    }
    
    if (state === 'phase_transition') {
      bgOffset++;
      updatePhaseTransition();
      return;
    }

    if (state === 'phase2_intro') {
      bgOffset++;
      updatePhase2Intro();
      return;
    }

    if (state === 'dying') {
      bgOffset++;
      updateDeathExplosion();

      if (!deathExplosion || deathExplosion.timer > 60) {
        deathExplosion = null;
        if (p1Lives <= 0) {
          state = 'lost';
        } else {
          respawnPlayer();
          state = 'playing';
        }
      }
    }
    
    if (state === 'won') {
      bgOffset++;
      victoryTimer++;
      if (player) player.vx = 0;
      if (enemy) enemy.vx = 0;
      // Deixa o som do terminal tocar durante a animação e só depois faz fade.
      if (!terminalOverlayFinalFadeStarted && victoryTimer >= (VICTORY_CORPSE_PAUSE_FRAMES + 170)) {
        terminalOverlayFinalFadeStarted = true;
        startTerminalOverlayFadeOut(0, 42);
      }
    }
    
    if (state === 'lost') {
      bgOffset++;
      updateDeathExplosion();

      if (deathExplosion && deathExplosion.particles.length === 0) {
        deathExplosion = null;
      }

      if (_inputRef && (!deathExplosion || deathExplosion.timer > 60)) {
        const input = _inputRef;
        if (input.buttonA || input.buttonB || input.up || input.down || input.left || input.right) {
          deathExplosion = null;
          startGame();
        }
      }
    }
  },
  
  render(renderCtx) {
    if (state === 'idle') {
      this.renderIdle(renderCtx);
      return;
    }
    
    const preP2Shake = state === 'pre_phase2';
    const overclockShake = !!(p1SuperFx && state === 'playing');
    const bzkShake = berserkerScreenFxActive() && state !== 'phase_transition';
    const worldShake = bzkShake || preP2Shake || overclockShake;
    if (worldShake) {
      const shB = bzkShake ? getBerserkerScreenShake() : { x: 0, y: 0 };
      const shP = preP2Shake ? getPrePhase2ScreenShake() : { x: 0, y: 0 };
      const shO = overclockShake ? getOverclockScreenShake() : { x: 0, y: 0 };
      renderCtx.save();
      renderCtx.translate(Math.round(shB.x + shP.x + shO.x), Math.round(shB.y + shP.y + shO.y));
    }

    renderBackground(renderCtx);

    // Render boss traps (below fighters)
    bossTraps.forEach(bt => bt.render(renderCtx));

    // Render fighters
    if (enemy) enemy.render(renderCtx);
    renderBossPhase2ShieldPassive(renderCtx);
    renderP2Shield(renderCtx);
    if (player) player.render(renderCtx);

    // Render stun effect on player
    if (player && player.stunTimer > 0) {
      const sx = player.x + player.w / 2;
      const sy = player.y + 5;
      const stunAlpha = 0.3 + 0.3 * Math.sin(player.stunTimer * 0.3);
      renderCtx.save();
      renderCtx.strokeStyle = `rgba(255,0,100,${stunAlpha})`;
      renderCtx.lineWidth = 1;
      renderCtx.shadowColor = '#ff0066';
      renderCtx.shadowBlur = 6;
      for (let i = 0; i < 3; i++) {
        const r = 12 + i * 6;
        const a = player.stunTimer * 0.15 + i * 2;
        renderCtx.beginPath();
        renderCtx.arc(sx + Math.cos(a) * 4, sy + Math.sin(a) * 2, r, 0, Math.PI * 2);
        renderCtx.stroke();
      }
      // Electric zaps around player
      renderCtx.strokeStyle = `rgba(255,100,200,${0.4 + 0.3 * Math.sin(player.stunTimer * 0.5)})`;
      renderCtx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI * 2 / 4) * i + player.stunTimer * 0.2;
        const r1 = 8;
        const r2 = 18 + Math.random() * 8;
        renderCtx.beginPath();
        renderCtx.moveTo(sx + Math.cos(angle) * r1, sy + Math.sin(angle) * r1);
        const midX = sx + Math.cos(angle + 0.3) * (r1 + r2) / 2;
        const midY = sy + Math.sin(angle - 0.2) * (r1 + r2) / 2;
        renderCtx.lineTo(midX, midY);
        renderCtx.lineTo(sx + Math.cos(angle) * r2, sy + Math.sin(angle) * r2);
        renderCtx.stroke();
      }
      renderCtx.restore();
    }

    if (state === 'pre_phase2') {
      renderPrePhase2Explosions(renderCtx);
    }
    if (state === 'phase2_intro') {
      renderPhase2IntroFX(renderCtx);
    }
    
    // Render projectiles and boss powers
    projectiles.forEach(p => p.render(renderCtx));
    groundWaves.forEach(gw => gw.render(renderCtx));
    energyFields.forEach(ef => ef.render(renderCtx));
    renderP1CyberJumpBolts(renderCtx);
    cyberGroundSurges.forEach(cs => cs.render(renderCtx));
    bossPowers.forEach(bp => bp.render(renderCtx));
    renderBossCinematic(renderCtx);

    if (worldShake) {
      renderCtx.restore();
      if (bzkShake) renderBerserkerScreenGlitch(renderCtx);
      if (preP2Shake) renderPrePhase2ScreenGlitch(renderCtx);
    }

    // Phase transition overlay
    if (state === 'phase_transition') {
      renderPhaseTransition(renderCtx);
      return;
    }

    // Render HUD
    if (state === 'playing' || state === 'pre_phase2' || state === 'phase2_intro' || state === 'dying') {
      renderHUD(renderCtx);
    }

    if (p1SuperFx && state === 'playing') {
      renderP1Super(renderCtx);
    }
    
    // Dying explosion
    if (state === 'dying' && deathExplosion) {
      const bzkDie = isP1Berserker();
      if (bzkDie) {
        const sh = getBerserkerScreenShake();
        renderCtx.save();
        renderCtx.translate(Math.round(sh.x * 0.35), Math.round(sh.y * 0.35));
      }
      if (deathExplosion.timer < 6) {
        renderCtx.save();
        renderCtx.globalAlpha = 1 - deathExplosion.timer / 6;
        renderCtx.fillStyle = '#fff';
        renderCtx.fillRect(0, 0, W, H);
        renderCtx.restore();
      }
      renderDeathExplosion(renderCtx);
      
      if (deathExplosion.timer < 30) {
        renderCtx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let y = 0; y < H; y += 2) {
          renderCtx.fillRect(0, y, W, 1);
        }
      }
      if (bzkDie) {
        renderCtx.restore();
        renderBerserkerScreenGlitch(renderCtx);
      }
    }
    
    // Victory terminal screen — full-screen cyberpunk debrief.
    if (state === 'won') {
      renderBossDefeatTerminal(renderCtx);
    }
    
    // Game Over screen
    if (state === 'lost') {
      const expProgress = deathExplosion ? Math.min(1, deathExplosion.timer / 40) : 1;
      renderCtx.fillStyle = `rgba(0, 0, 0, ${0.8 * expProgress})`;
      renderCtx.fillRect(0, 0, W, H);

      // Flash on explosion start
      if (deathExplosion && deathExplosion.timer < 6) {
        renderCtx.save();
        renderCtx.globalAlpha = 1 - deathExplosion.timer / 6;
        renderCtx.fillStyle = '#fff';
        renderCtx.fillRect(0, 0, W, H);
        renderCtx.restore();
      }

      renderDeathExplosion(renderCtx);

      // Show text after explosion settles
      if (!deathExplosion || deathExplosion.timer > 50) {
        const textAlpha = deathExplosion ? Math.min(1, (deathExplosion.timer - 50) / 20) : 1;
        const t = bgOffset;
        const pulse = 0.7 + 0.3 * Math.sin(t * 0.08);

        renderCtx.save();
        renderCtx.globalAlpha = textAlpha;
        renderCtx.textAlign = 'center';

        // Glitch offset
        const glitchX = Math.sin(t * 0.3) > 0.9 ? (Math.random() - 0.5) * 6 : 0;

        // Chromatic aberration
        renderCtx.font = 'bold 52px monospace';
        renderCtx.globalAlpha = textAlpha * 0.25;
        renderCtx.fillStyle = '#ff0000';
        renderCtx.fillText('GAME OVER', W / 2 - 2 + glitchX, H / 2 - 20);
        renderCtx.fillStyle = '#0000ff';
        renderCtx.fillText('GAME OVER', W / 2 + 2 + glitchX, H / 2 - 20);

        renderCtx.globalAlpha = textAlpha;
        renderCtx.shadowColor = '#ff0033';
        renderCtx.shadowBlur = 20 * pulse;
        renderCtx.fillStyle = '#ff0033';
        renderCtx.fillText('GAME OVER', W / 2 + glitchX, H / 2 - 20);
        renderCtx.shadowBlur = 0;

        renderCtx.fillStyle = '#fff';
        renderCtx.font = '16px monospace';
        renderCtx.globalAlpha = textAlpha * (0.5 + 0.5 * Math.sin(t * 0.05));
        renderCtx.fillText('Press any button to retry', W / 2, H / 2 + 40);
        renderCtx.textAlign = 'left';
        renderCtx.restore();
      }

      // Scanlines during explosion
      if (deathExplosion && deathExplosion.timer < 30) {
        renderCtx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let y = 0; y < H; y += 2) {
          renderCtx.fillRect(0, y, W, 1);
        }
      }
    }
  },
  
  renderIdle(renderCtx) {
    const t = performance.now() * 0.001;
    const pulse = 0.55 + 0.45 * Math.sin(t * 2.2);
    const cx = W * 0.5;
    renderBackground(renderCtx);
    renderCtx.fillStyle = 'rgba(0,0,0,0.64)';
    renderCtx.fillRect(0, 0, W, H);

    const logo = ensureIdleFightLogoLoaded();
    if (logo.complete && logo.naturalWidth > 0) {
      const maxW = W * 1.08;
      const maxH = H * 0.86;
      const scale = Math.min(maxW / logo.naturalWidth, maxH / logo.naturalHeight);
      const lw = logo.naturalWidth * scale;
      const lh = logo.naturalHeight * scale;
      renderCtx.drawImage(logo, cx - lw * 0.5, H * 0.04, lw, lh);
    }

    renderCtx.textAlign = 'center';
    renderCtx.fillStyle = `rgba(186,230,253,${0.48 + 0.52 * pulse})`;
    renderCtx.font = '700 11px "Press Start 2P",monospace';
    renderCtx.fillText('PRESS START', cx, H * 0.86);
    renderCtx.textAlign = 'left';
  },
  
  getState() {
    return state;
  },
  
  reset() {
    stopTerminalOverlaySfx();
    stopPrePhase2ExplosionSfx();
    state = 'playing';
    battleTimer = 60;
    timerFrame = 0;
    gameFrameCount = 0;
    projectiles = [];
    energyFields = [];
    cyberJumpBolts = [];
    cyberGroundSurges = [];
    bossTraps = [];
    bossTrapTimer = 0;
    bossPowers = [];
    bossPowerTimer = 0;
    p1Lives = P1_MAX_LIVES;
    superMeter = 0;
    p1SuperFx = null;
    prevButtonX = false;
    showBossPhase2Background = false;
    bossPhase = 1;
    phaseTransition = null;
    
    player = new Fighter(150, 300, 'Brawler-Girl', true);
    enemy = new Fighter(450, 300, 'Enemy-Punk', false);
    
    initBackground();
  },
  
  destroy() {
    stopTerminalOverlaySfx();
    stopPrePhase2ExplosionSfx();
    stopFightBgm();
    // Keep canvas/input refs for totem orchestrator flow (destroy -> reset).
    player = null;
    enemy = null;
    state = 'idle';
    
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
  }
};

export default luta;
