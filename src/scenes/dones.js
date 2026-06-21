// Escena: Les Dones — igual que Albufera pero con tres bailarinas neón.
// Graves → mujer izquierda (magenta neón)
// Medios → mujer centro (lima neón)
// Agudos → mujer derecha (cian neón)

const SKY = [
  [12,  8, 28],
  [60, 20, 50],
  [160, 50, 25],
  [215, 95, 20],
  [240, 165, 35],
  [255, 210, 90],
];

function lerp(a, b, t) { return a + (b - a) * t; }

function skyColor(t) {
  t = Math.max(0, Math.min(1, t));
  const s = t * (SKY.length - 1);
  const i = Math.min(Math.floor(s), SKY.length - 2);
  const f = s - i;
  return SKY[i].map((c, k) => Math.round(lerp(c, SKY[i + 1][k], f)));
}

function rgba([r, g, b], a = 1) { return `rgba(${r},${g},${b},${a})`; }

// --- RELLENO DE AMPLITUD ---
function drawAmplitudeFill(ctx, W, H, ampS, brightness, t) {
  const fillH = ampS * H * 0.62;
  const baseY = H - fillH;
  const waveFreq  = 1.5 + brightness * 7;
  const waveAmpPx = 4 + brightness * 12;

  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(W, H);
  ctx.lineTo(W, baseY);
  for (let s = 120; s >= 0; s--) {
    const x = (s / 120) * W;
    const y = baseY + Math.sin((s / 120) * Math.PI * waveFreq + t * 1.8) * waveAmpPx;
    ctx.lineTo(x, y);
  }
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, baseY, 0, H);
  grad.addColorStop(0,   'rgba(20, 110, 200, 0.30)');
  grad.addColorStop(0.4, 'rgba(15,  80, 170, 0.50)');
  grad.addColorStop(1,   'rgba(8,   35,  90, 0.75)');
  ctx.fillStyle = grad;
  ctx.fill();
}

// --- PATO ---
function drawDuck(ctx, duck, ampS, W) {
  const { x, y, size: s, wing, opacity, dir = 1 } = duck;
  const ws = 1 + ampS * 1.2;

  const sunProx = Math.max(0, 1 - Math.abs(x / W - 0.76) * 2.2);
  const hue     = 36 + sunProx * 12;
  const light   = 30 + sunProx * 24;
  const bodyCol = `hsl(${hue}, 76%, ${light}%)`;
  const wingCol = `hsl(${hue + 8}, 84%, ${light + 14}%)`;
  const headCol = `hsl(${hue - 4}, 70%, ${light - 6}%)`;

  ctx.save();
  ctx.globalAlpha = opacity;
  // el pato siempre mira en su dirección de vuelo
  ctx.translate(x, y);
  if (dir < 0) ctx.scale(-1, 1);
  ctx.translate(-x, -y);

  ctx.fillStyle = bodyCol;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.46, s * 0.2, -0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = headCol;
  ctx.beginPath();
  ctx.ellipse(x + s * 0.48, y - s * 0.13, s * 0.16, s * 0.14, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `hsl(32, 90%, 55%)`;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.62, y - s * 0.15);
  ctx.lineTo(x + s * 0.82, y - s * 0.08);
  ctx.lineTo(x + s * 0.62, y - s * 0.03);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = wingCol;
  const wf = Math.sin(wing) * s * 0.28 * ws;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.12, y - s * 0.05);
  ctx.quadraticCurveTo(x - s * 0.08, y - s * 0.3 - wf, x - s * 0.38, y - s * 0.08 - wf * 0.4);
  ctx.quadraticCurveTo(x - s * 0.1,  y + s * 0.18,      x + s * 0.12, y - s * 0.05);
  ctx.fill();

  if (sunProx > 0.5) {
    ctx.globalAlpha = opacity * sunProx * 0.35;
    ctx.fillStyle   = `hsl(50, 100%, 80%)`;
    ctx.beginPath();
    ctx.ellipse(x + s * 0.08, y - s * 0.08, s * 0.12, s * 0.06, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// --- PEINADOS (solo trazo, sin relleno) ---

// Melenita bob: contorno exterior + 3 líneas de dirección del cabello.
function drawHairBob(ctx, bx, headCY, HEAD_R, phase, energy, lw) {
  const sway = Math.sin(phase * 0.65) * energy * HEAD_R * 0.22;
  const len  = HEAD_R * 2.0;

  ctx.lineWidth = lw * 1.1;
  ctx.beginPath();
  ctx.arc(bx + sway * 0.1, headCY, HEAD_R * 1.14, Math.PI * 0.97, Math.PI * 2.03, false);
  ctx.quadraticCurveTo(bx + HEAD_R * 1.32 + sway, headCY + len * 0.5,  bx + HEAD_R * 0.65 + sway, headCY + len);
  ctx.quadraticCurveTo(bx + sway * 0.3,            headCY + len * 1.10, bx - HEAD_R * 0.65 + sway * 0.2, headCY + len);
  ctx.quadraticCurveTo(bx - HEAD_R * 1.32,         headCY + len * 0.5,  bx, headCY);
  ctx.stroke();

  // líneas de textura que muestran la dirección del corte
  ctx.lineWidth = lw * 0.6;
  [-0.45, 0, 0.45].forEach(t => {
    ctx.beginPath();
    ctx.moveTo(bx + t * HEAD_R * 0.6, headCY - HEAD_R * 0.7);
    ctx.quadraticCurveTo(
      bx + t * HEAD_R * 0.8 + sway * 0.5, headCY + len * 0.45,
      bx + t * HEAD_R * 0.4 + sway * 0.8, headCY + len * 0.88
    );
    ctx.stroke();
  });
}

// Pelo largo con flequillo: mechones largos + flequillo recto.
function drawHairLongBangs(ctx, bx, headCY, HEAD_R, phase, energy, lw) {
  const blow    = Math.sin(phase * 0.7) * energy * HEAD_R * 0.45;
  const longLen = HEAD_R * 3.0; // hasta el hombro

  // mechones largos que caen
  ctx.lineWidth = lw * 0.9;
  [-0.72, -0.28, 0.28, 0.72].forEach(t => {
    ctx.beginPath();
    ctx.moveTo(bx + t * HEAD_R * 0.85, headCY - HEAD_R * 0.45);
    ctx.bezierCurveTo(
      bx + t * HEAD_R * 1.3  + blow * 0.3, headCY + longLen * 0.22,
      bx + t * HEAD_R * 1.05 + blow * 0.7, headCY + longLen * 0.6,
      bx + t * HEAD_R * 0.75 + blow,       headCY + longLen
    );
    ctx.stroke();
  });

  // flequillo: 4 líneas cortas que caen desde la coronilla sobre la frente
  ctx.lineWidth = lw * 0.8;
  [-0.55, -0.2, 0.2, 0.55].forEach(t => {
    ctx.beginPath();
    ctx.moveTo(bx + t * HEAD_R * 0.9, headCY - HEAD_R * 0.95);
    ctx.quadraticCurveTo(
      bx + t * HEAD_R * 0.6 + blow * 0.08, headCY - HEAD_R * 0.35,
      bx + t * HEAD_R * 0.5 + blow * 0.12, headCY - HEAD_R * 0.05
    );
    ctx.stroke();
  });
}

// Pixie: contorno corto + mechones en punta en la coronilla.
function drawHairPixie(ctx, bx, headCY, HEAD_R, phase, energy, lw) {
  const spike = Math.sin(phase * 2.5) * energy * HEAD_R * 0.09;

  ctx.lineWidth = lw * 1.0;
  ctx.beginPath();
  ctx.arc(bx, headCY - HEAD_R * 0.05, HEAD_R * 1.12, Math.PI * 0.88, Math.PI * 2.12, false);
  ctx.quadraticCurveTo(bx + HEAD_R * 0.45, headCY - HEAD_R * 0.55 + spike, bx, headCY - HEAD_R * 1.22 + spike);
  ctx.quadraticCurveTo(bx - HEAD_R * 0.45, headCY - HEAD_R * 0.55 + spike, bx - HEAD_R, headCY - HEAD_R * 0.1);
  ctx.stroke();

  // mechones en punta
  ctx.lineWidth = lw * 0.8;
  [-0.48, -0.15, 0.15, 0.48].forEach(da => {
    const tx = bx + Math.sin(da) * HEAD_R * 0.5;
    const ty = headCY - HEAD_R * 1.05;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + Math.sin(da) * HEAD_R * 0.25, ty - HEAD_R * 0.3 - spike);
    ctx.stroke();
  });
}

// --- BAILARINA (todo trazo, sin relleno) ---
// hairStyle: 0 = bob/melenita | 1 = largo con flequillo | 2 = pixie
function drawWoman(ctx, cx, baseY, energy, hexColor, phase, H, hairStyle) {
  const U = H * 0.30;

  const HEAD_R     = U * 0.11;
  const SHOULDER_W = U * 0.19;
  const WAIST_W    = U * 0.10;
  const HIP_W      = U * 0.17;
  const TORSO_H    = U * 0.26;
  const SKIRT_H    = U * 0.20;
  const LEG_H      = U * 0.38;
  const ARM_L      = U * 0.30;
  const lw         = Math.max(1.5, H * 0.0025); // grosor de pincel

  const bounce  = Math.abs(Math.sin(phase * 2.2)) * energy * U * 0.07;
  const hipSway = Math.sin(phase * 0.9)           * energy * U * 0.06;

  const bx = cx + hipSway;
  const by = baseY - bounce;

  const hipY      = by - LEG_H;
  const waistY    = hipY - SKIRT_H * 0.05;
  const shoulderY = waistY - TORSO_H;
  const headCY    = shoulderY - HEAD_R * 1.4;

  const armL = Math.sin(phase + 0.6) * (0.45 + energy * 1.4);
  const armR = Math.sin(phase - 0.6) * (0.45 + energy * 1.4);
  const legL = Math.sin(phase)             * (0.18 + energy * 0.55);
  const legR = Math.sin(phase + Math.PI)   * (0.18 + energy * 0.55);

  ctx.save();
  ctx.strokeStyle = hexColor;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  // PIERNAS
  ctx.lineWidth = lw * 1.1;

  const lKX = bx - HIP_W * 0.5 + Math.sin(legL) * LEG_H * 0.45;
  const lKY = hipY + LEG_H * 0.52;
  const lFX = lKX + Math.sin(legL * 0.6) * LEG_H * 0.38;
  ctx.beginPath();
  ctx.moveTo(bx - HIP_W * 0.5, hipY);
  ctx.quadraticCurveTo(lerp(bx - HIP_W * 0.5, lKX, 0.5), lKY, lKX, lKY);
  ctx.quadraticCurveTo(lerp(lKX, lFX, 0.5), lerp(lKY, by, 0.5), lFX, by);
  ctx.stroke();

  const rKX = bx + HIP_W * 0.5 + Math.sin(legR) * LEG_H * 0.45;
  const rKY = hipY + LEG_H * 0.52;
  const rFX = rKX + Math.sin(legR * 0.6) * LEG_H * 0.38;
  ctx.beginPath();
  ctx.moveTo(bx + HIP_W * 0.5, hipY);
  ctx.quadraticCurveTo(lerp(bx + HIP_W * 0.5, rKX, 0.5), rKY, rKX, rKY);
  ctx.quadraticCurveTo(lerp(rKX, rFX, 0.5), lerp(rKY, by, 0.5), rFX, by);
  ctx.stroke();

  // FALDA — contorno + pliegues internos
  const flare = 1 + energy * 1.4;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(bx - WAIST_W, waistY);
  ctx.bezierCurveTo(
    bx - HIP_W * flare,        waistY + SKIRT_H * 0.4,
    bx - HIP_W * flare * 0.8,  hipY   - SKIRT_H * 0.1,
    bx - HIP_W * flare * 0.55, hipY
  );
  ctx.quadraticCurveTo(bx, hipY + SKIRT_H * 0.18, bx + HIP_W * flare * 0.55, hipY);
  ctx.bezierCurveTo(
    bx + HIP_W * flare * 0.8,  hipY   - SKIRT_H * 0.1,
    bx + HIP_W * flare,        waistY + SKIRT_H * 0.4,
    bx + WAIST_W, waistY
  );
  ctx.stroke();
  // pliegues de falda
  ctx.lineWidth = lw * 0.55;
  [-0.35, 0, 0.35].forEach(t => {
    ctx.beginPath();
    ctx.moveTo(bx + t * WAIST_W * 1.2, waistY + SKIRT_H * 0.1);
    ctx.quadraticCurveTo(
      bx + t * HIP_W * flare * 0.7, (waistY + hipY) / 2,
      bx + t * HIP_W * flare * 0.5, hipY
    );
    ctx.stroke();
  });

  // TORSO — contorno de reloj de arena + cinturón + escote
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(bx - SHOULDER_W, shoulderY);
  ctx.bezierCurveTo(bx - SHOULDER_W * 0.65, shoulderY + TORSO_H * 0.3, bx - WAIST_W * 0.85, waistY - TORSO_H * 0.1, bx - WAIST_W, waistY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx + SHOULDER_W, shoulderY);
  ctx.bezierCurveTo(bx + SHOULDER_W * 0.65, shoulderY + TORSO_H * 0.3, bx + WAIST_W * 0.85, waistY - TORSO_H * 0.1, bx + WAIST_W, waistY);
  ctx.stroke();
  // escote en V
  ctx.lineWidth = lw * 0.8;
  ctx.beginPath();
  ctx.moveTo(bx - SHOULDER_W * 0.55, shoulderY);
  ctx.lineTo(bx, shoulderY + TORSO_H * 0.32);
  ctx.lineTo(bx + SHOULDER_W * 0.55, shoulderY);
  ctx.stroke();
  // curva de pecho (busto)
  ctx.lineWidth = lw * 0.6;
  ctx.beginPath();
  ctx.arc(bx - SHOULDER_W * 0.42, shoulderY + TORSO_H * 0.38, HEAD_R * 0.55, 0.1, Math.PI - 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(bx + SHOULDER_W * 0.42, shoulderY + TORSO_H * 0.38, HEAD_R * 0.55, 0.1, Math.PI - 0.1);
  ctx.stroke();
  // cinturón
  ctx.lineWidth = lw * 0.9;
  ctx.beginPath();
  ctx.moveTo(bx - WAIST_W * 1.1, waistY + SKIRT_H * 0.08);
  ctx.lineTo(bx + WAIST_W * 1.1, waistY + SKIRT_H * 0.08);
  ctx.stroke();

  // CUELLO
  ctx.lineWidth = lw * 0.8;
  ctx.beginPath();
  ctx.moveTo(bx - HEAD_R * 0.22, headCY + HEAD_R * 0.9);
  ctx.lineTo(bx - HEAD_R * 0.18, shoulderY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx + HEAD_R * 0.22, headCY + HEAD_R * 0.9);
  ctx.lineTo(bx + HEAD_R * 0.18, shoulderY);
  ctx.stroke();

  // HOMBROS — línea curva (no recta)
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(bx - SHOULDER_W, shoulderY);
  ctx.quadraticCurveTo(bx, shoulderY - HEAD_R * 0.15, bx + SHOULDER_W, shoulderY);
  ctx.stroke();

  // BRAZOS (dos segmentos: húmero + antebrazo con codo marcado)
  ctx.lineWidth = lw * 1.05;
  const laAngle = -Math.PI * 0.55 + armL;
  const lEX = bx - SHOULDER_W + Math.cos(laAngle) * ARM_L * 0.52;
  const lEY = shoulderY       + Math.sin(laAngle) * ARM_L * 0.52;
  const lHX = lEX + Math.cos(laAngle + 0.4) * ARM_L * 0.48;
  const lHY = lEY + Math.sin(laAngle + 0.4) * ARM_L * 0.48;
  ctx.beginPath();
  ctx.moveTo(bx - SHOULDER_W, shoulderY);
  ctx.quadraticCurveTo(lEX, lEY, lHX, lHY);
  ctx.stroke();
  // pequeño círculo en codo
  ctx.lineWidth = lw * 0.5;
  ctx.beginPath();
  ctx.arc(lEX, lEY, lw * 1.2, 0, Math.PI * 2);
  ctx.stroke();

  const raAngle = -Math.PI * 0.45 - armR;
  const rEX = bx + SHOULDER_W + Math.cos(raAngle) * ARM_L * 0.52;
  const rEY = shoulderY       + Math.sin(raAngle) * ARM_L * 0.52;
  const rHX = rEX + Math.cos(raAngle - 0.4) * ARM_L * 0.48;
  const rHY = rEY + Math.sin(raAngle - 0.4) * ARM_L * 0.48;
  ctx.lineWidth = lw * 1.05;
  ctx.beginPath();
  ctx.moveTo(bx + SHOULDER_W, shoulderY);
  ctx.quadraticCurveTo(rEX, rEY, rHX, rHY);
  ctx.stroke();
  ctx.lineWidth = lw * 0.5;
  ctx.beginPath();
  ctx.arc(rEX, rEY, lw * 1.2, 0, Math.PI * 2);
  ctx.stroke();

  // PELO
  ctx.lineWidth = lw;
  if (hairStyle === 0) drawHairBob(ctx, bx, headCY, HEAD_R, phase, energy, lw);
  if (hairStyle === 1) drawHairLongBangs(ctx, bx, headCY, HEAD_R, phase, energy, lw);
  if (hairStyle === 2) drawHairPixie(ctx, bx, headCY, HEAD_R, phase, energy, lw);

  // CABEZA — óvalo ligeramente más real
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(bx, headCY, HEAD_R * 0.88, HEAD_R, 0, 0, Math.PI * 2);
  ctx.stroke();

  // CARA — ojos y boca suaves
  ctx.lineWidth = lw * 0.55;
  // ojo izquierdo
  ctx.beginPath();
  ctx.arc(bx - HEAD_R * 0.30, headCY - HEAD_R * 0.08, HEAD_R * 0.09, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  // ojo derecho
  ctx.beginPath();
  ctx.arc(bx + HEAD_R * 0.30, headCY - HEAD_R * 0.08, HEAD_R * 0.09, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  // boca
  ctx.beginPath();
  ctx.arc(bx, headCY + HEAD_R * 0.28, HEAD_R * 0.22, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // glow neón suave detrás de la figura
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.10 + energy * 0.15;
  ctx.filter      = 'blur(14px)';
  ctx.strokeStyle = hexColor;
  ctx.lineWidth   = lw * 6;
  ctx.beginPath();
  ctx.moveTo(bx, headCY - HEAD_R);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.restore();
}

export const donesScene = {
  name: "Les Dones",

  setup() {
    this.volS    = 0.2;
    this.densS   = 0;
    this.ampS    = 0;
    this.sunS    = 0.5;
    this.beatEnv = 0;
    this.bassS   = 0;
    this.midS    = 0;
    this.trebleS = 0;

    this.flock = Array.from({ length: 12 }, () => {
      const dir = Math.random() < 0.5 ? 1 : -1;
      return {
        x:       Math.random(),
        y:       0.06 + Math.random() * 0.52,
        size:    34 + Math.random() * 24,
        speed:   (0.0004 + Math.random() * 0.0006) * dir,
        dir,
        wing:    Math.random() * Math.PI * 2,
        opacity: 0.5 + Math.random() * 0.45,
      };
    });
  },

  draw(ctx, signal, t) {
    const { width: W, height: H } = ctx.canvas;

    this.volS    = this.volS    * 0.94 + signal.volume  * 0.06;
    this.densS   = this.densS   * 0.90 + signal.density * 0.10;
    this.ampS    = this.ampS    * 0.88 + signal.volume  * 0.12;
    this.bassS   = this.bassS   * 0.82 + signal.bass    * 0.18;
    this.midS    = this.midS    * 0.82 + signal.mid     * 0.18;
    this.trebleS = this.trebleS * 0.82 + signal.treble  * 0.18;

    if (signal.beat) this.beatEnv = 1.0;
    this.beatEnv *= 0.82;

    const pitchNorm = signal.pitch > 0
      ? 1 - Math.min(1, (Math.log2(signal.pitch) - Math.log2(60)) / (Math.log2(1200) - Math.log2(60)))
      : this.sunS;
    this.sunS = this.sunS * 0.97 + pitchNorm * 0.03;

    // 1 · FONDO
    const skyT   = this.volS * 0.85 + 0.08;
    const cTop   = skyColor(skyT * 0.55);
    const cMid   = skyColor(skyT);
    const cBot   = skyColor(Math.min(1, skyT + 0.25));
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0,    rgba(cTop));
    bgGrad.addColorStop(0.55, rgba(cMid));
    bgGrad.addColorStop(0.78, rgba(cBot));
    bgGrad.addColorStop(1,    rgba([10, 18, 35]));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    const waterY = H * 0.76;
    const wGrad  = ctx.createLinearGradient(0, waterY, 0, H);
    wGrad.addColorStop(0, rgba(cBot, 0.55));
    wGrad.addColorStop(1, rgba([8, 18, 38], 0.85));
    ctx.fillStyle = wGrad;
    ctx.fillRect(0, waterY, W, H - waterY);

    ctx.strokeStyle = rgba([255, 255, 255], 0.08);
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, waterY);
    ctx.lineTo(W, waterY);
    ctx.stroke();

    // 2 · RELLENO AMPLITUD
    drawAmplitudeFill(ctx, W, H, this.ampS, signal.brightness, t);

    // 3 · SOL
    const sunX = W * 0.76;
    const sunY = H * 0.26;
    const sunR = 18 + this.sunS * 65;

    const glowC = skyColor(Math.min(1, skyT + 0.35));
    const glow  = ctx.createRadialGradient(sunX, sunY, sunR * 0.5, sunX, sunY, sunR * 3.5);
    glow.addColorStop(0, rgba(glowC, 0.45));
    glow.addColorStop(1, rgba(glowC, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - sunR * 4, sunY - sunR * 4, sunR * 8, sunR * 8);

    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fillStyle = rgba([255, 222, 80]);
    ctx.fill();

    if (this.beatEnv > 0.02) {
      const rayLen = this.beatEnv * 90;
      ctx.strokeStyle = rgba([255, 230, 80], this.beatEnv * 0.9);
      ctx.lineWidth   = 1.5 + this.beatEnv * 4;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(sunX + Math.cos(a) * (sunR + 3),          sunY + Math.sin(a) * (sunR + 3));
        ctx.lineTo(sunX + Math.cos(a) * (sunR + 3 + rayLen), sunY + Math.sin(a) * (sunR + 3 + rayLen));
        ctx.stroke();
      }
    }

    ctx.beginPath();
    ctx.ellipse(sunX, waterY + 14, sunR * 0.5, sunR * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgba([255, 200, 60], 0.25);
    ctx.fill();

    // 4 · TRES BAILARINAS
    // Graves → magenta  | hairStyle 0 = melenita (bob)
    // Medios → lima     | hairStyle 1 = largo con flequillo
    // Agudos → cian     | hairStyle 2 = pixie corto
    drawWoman(ctx, W * 0.20, waterY, this.bassS,   '#FF10F0', t * 1.1,        H, 0);
    drawWoman(ctx, W * 0.50, waterY, this.midS,    '#CCFF00', t * 1.0 + 1.0,  H, 1);
    drawWoman(ctx, W * 0.78, waterY, this.trebleS, '#00F5FF', t * 1.25 + 2.1, H, 2);

    // 5 · LÍNEA DE DENSIDAD
    const densY = H * 0.88 - this.densS * H * 0.14;
    ctx.strokeStyle = rgba([0, 0, 0], 0.72);
    ctx.lineWidth   = 2 + this.densS * 3;
    ctx.beginPath();
    ctx.moveTo(0, densY);
    ctx.lineTo(W, densY);
    ctx.stroke();

    // 6 · PATOS
    const wingSpeed = 0.10 + this.ampS * 0.22;
    this.flock.forEach(d => {
      d.x    += d.speed;
      d.wing += wingSpeed;
      if (d.x > 1.1) d.x = -0.1;
      if (d.x < -0.1) d.x = 1.1;
      drawDuck(ctx, { x: d.x * W, y: d.y * H, size: d.size, wing: d.wing, opacity: d.opacity }, this.ampS, W);
    });
  },
};
