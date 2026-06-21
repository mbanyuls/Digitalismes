// Escena: Albufera de Valencia al atardecer.
// Fondo: degradado reactivo al volumen.
// Sol: tamaño según pitch, rayos en cada beat.
// Amplitud: relleno azul mar que sube desde abajo, borde oscila con brillo.
// Graves → árboles | Medios → flores | Agudos → palmeras (tamaño x2)
// Densidad: línea negra que sube/baja.
// Patos: 12 distribuidos por la pantalla.

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

// --- RELLENO DE AMPLITUD (azul mar, sube con amplitud, borde oscila con brillo) ---
function drawAmplitudeFill(ctx, W, H, ampS, brightness, t) {
  const maxFill = H * 0.62;
  const fillH   = ampS * maxFill;
  const baseY   = H - fillH;

  // frecuencia del borde superior cambia con el brillo espectral
  const waveFreq  = 1.5 + brightness * 7;
  const waveAmpPx = 4 + brightness * 12;

  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(W, H);
  ctx.lineTo(W, baseY);

  // borde superior ondulante de derecha a izquierda
  const steps = 120;
  for (let s = steps; s >= 0; s--) {
    const x = (s / steps) * W;
    const y = baseY + Math.sin((s / steps) * Math.PI * waveFreq + t * 1.8) * waveAmpPx;
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

// --- ÁRBOL (graves) ---
function drawTree(ctx, x, baseY, bass) {
  const h  = 76 + bass * 180;   // doble
  const cw = 36 + bass * 76;    // doble
  const trunkH = h * 0.38;
  const trunkW = 7 + bass * 4;

  ctx.fillStyle = rgba([60, 32, 12]);
  ctx.fillRect(x - trunkW / 2, baseY - trunkH, trunkW, trunkH);

  ctx.fillStyle = rgba([18, 58, 18], 0.92);
  [[0, 0.45, 0.9], [-0.42, 0.62, 0.7], [0.42, 0.62, 0.7], [0, 0.78, 0.72], [-0.2, 0.88, 0.55], [0.2, 0.88, 0.55]].forEach(([dx, dy, r]) => {
    ctx.beginPath();
    ctx.arc(x + dx * cw, baseY - trunkH - dy * h * 0.62, cw * r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// --- FLOR (medios) ---
function drawFlower(ctx, x, baseY, mid, t) {
  const r      = 20 + mid * 84;   // doble
  const petals = 6;
  const spin   = t * 0.15;

  // tallo
  ctx.strokeStyle = rgba([30, 80, 20], 0.9);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + 12, baseY - r * 1.2, x, baseY - r * 2.2);
  ctx.stroke();

  // pétalos
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2 + spin;
    ctx.save();
    ctx.translate(x + Math.cos(a) * r, baseY - r * 2.2 + Math.sin(a) * r);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.48, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgba([220, 100, 160], 0.88);
    ctx.fill();
    ctx.restore();
  }

  // centro
  ctx.beginPath();
  ctx.arc(x, baseY - r * 2.2, r * 0.36, 0, Math.PI * 2);
  ctx.fillStyle = rgba([255, 210, 50]);
  ctx.fill();
}

// --- PALMERA (agudos) — versión más realista ---
function drawPalm(ctx, x, baseY, treble, t) {
  const h    = 90 + treble * 190;  // doble
  const sway = Math.sin(t * 0.9) * treble * 10;

  // puntos de control del tronco
  const cpX  = x + sway * 0.4 + 15;
  const cpY  = baseY - h * 0.55;
  const tipX = x + sway + 10;
  const tipY = baseY - h;

  // tronco relleno con ligero ensanchamiento en la base
  const bW = 9, tW = 5;
  ctx.fillStyle = rgba([130, 90, 35]);
  ctx.beginPath();
  ctx.moveTo(x - bW, baseY);
  ctx.quadraticCurveTo(cpX - tW, cpY, tipX - tW, tipY);
  ctx.lineTo(tipX + tW, tipY);
  ctx.quadraticCurveTo(cpX + tW, cpY, x + bW, baseY);
  ctx.closePath();
  ctx.fill();

  // anillos del tronco (textura de palmera real)
  ctx.strokeStyle = rgba([95, 62, 18], 0.55);
  ctx.lineWidth = 1;
  for (let i = 1; i <= 10; i++) {
    const frac = i / 11;
    // punto sobre la curva de Bézier
    const bx = lerp(lerp(x, cpX, frac), lerp(cpX, tipX, frac), frac);
    const by = lerp(lerp(baseY, cpY, frac), lerp(cpY, tipY, frac), frac);
    const rw = lerp(bW, tW, frac);
    ctx.beginPath();
    ctx.ellipse(bx, by, rw, rw * 0.22, 0.08, 0, Math.PI * 2);
    ctx.stroke();
  }

  // cocos
  for (let i = 0; i < 4; i++) {
    const ca = (i / 4) * Math.PI + Math.PI * 0.25;
    ctx.beginPath();
    ctx.arc(tipX + Math.cos(ca) * 9, tipY + 14 + Math.sin(ca) * 5, 5, 0, Math.PI * 2);
    ctx.fillStyle = rgba([70, 42, 14]);
    ctx.fill();
  }

  // frondes con hojitas secundarias (pinnate)
  const frondLen = 45 + treble * 75;
  const fronds   = 9;
  for (let i = 0; i < fronds; i++) {
    const a    = (i / fronds) * Math.PI * 2 - Math.PI / 2 + sway * 0.035;
    const drop = Math.max(0, Math.sin(a + Math.PI / 2)) * 20; // las de abajo caen más
    const endX = tipX + Math.cos(a) * frondLen;
    const endY = tipY + Math.sin(a) * frondLen + drop;
    const midX = tipX + Math.cos(a) * frondLen * 0.45;
    const midY = tipY + Math.sin(a) * frondLen * 0.45 + drop * 0.5;

    // nervio central
    ctx.strokeStyle = rgba([22, 105, 28], 0.92);
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();

    // hojitas a ambos lados del nervio
    const leafCount = 8;
    for (let j = 1; j < leafCount; j++) {
      const frac = j / leafCount;
      // punto sobre la curva cuadrática
      const lx = lerp(lerp(tipX, midX, frac), lerp(midX, endX, frac), frac);
      const ly = lerp(lerp(tipY, midY, frac), lerp(midY, endY, frac), frac);
      const leafLen = frondLen * 0.18 * (1 - frac * 0.55);
      const perpA   = a + Math.PI / 2;

      ctx.strokeStyle = rgba([18, 95, 22], 0.72);
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(perpA) * leafLen, ly + Math.sin(perpA) * leafLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx - Math.cos(perpA) * leafLen, ly - Math.sin(perpA) * leafLen);
      ctx.stroke();
    }
  }
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
  ctx.translate(x, y);
  if (dir < 0) ctx.scale(-1, 1);
  ctx.translate(-x, -y);

  // cuerpo
  ctx.fillStyle = bodyCol;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.46, s * 0.2, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // cabeza
  ctx.fillStyle = headCol;
  ctx.beginPath();
  ctx.ellipse(x + s * 0.48, y - s * 0.13, s * 0.16, s * 0.14, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // pico
  ctx.fillStyle = `hsl(32, 90%, 55%)`;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.62, y - s * 0.15);
  ctx.lineTo(x + s * 0.82, y - s * 0.08);
  ctx.lineTo(x + s * 0.62, y - s * 0.03);
  ctx.closePath();
  ctx.fill();

  // ala (más brillante: toca la luz del sol)
  ctx.fillStyle = wingCol;
  const wf = Math.sin(wing) * s * 0.28 * ws;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.12, y - s * 0.05);
  ctx.quadraticCurveTo(x - s * 0.08, y - s * 0.3 - wf, x - s * 0.38, y - s * 0.08 - wf * 0.4);
  ctx.quadraticCurveTo(x - s * 0.1,  y + s * 0.18,      x + s * 0.12, y - s * 0.05);
  ctx.fill();

  // destello dorado en los patos más iluminados
  if (sunProx > 0.5) {
    ctx.globalAlpha = opacity * sunProx * 0.35;
    ctx.fillStyle   = `hsl(50, 100%, 80%)`;
    ctx.beginPath();
    ctx.ellipse(x + s * 0.08, y - s * 0.08, s * 0.12, s * 0.06, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export const albufScene = {
  name: "Albufera",

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
    this.bassS   = this.bassS   * 0.85 + signal.bass    * 0.15;
    this.midS    = this.midS    * 0.85 + signal.mid     * 0.15;
    this.trebleS = this.trebleS * 0.85 + signal.treble  * 0.15;

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

    // 2 · RELLENO AMPLITUD (azul mar, sobre el agua, bajo todo lo demás)
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

    // 4 · PLANTAS
    [0.07, 0.16, 0.25, 0.33].forEach((px, i) => {
      drawTree(ctx, W * px, waterY, Math.max(0, this.bassS * 1.4 - i * 0.08));
    });

    [0.44, 0.52, 0.60].forEach((px, i) => {
      drawFlower(ctx, W * px, waterY, Math.max(0, this.midS * 1.5 - i * 0.05), t + i);
    });

    [0.67, 0.76].forEach((px, i) => {
      drawPalm(ctx, W * px, waterY, Math.max(0, this.trebleS * 1.5 - i * 0.05), t + i * 0.5);
    });

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
