// Escena: Crestes Color
// Como Crestes pero con:
// - Haz de luz desde la esquina superior derecha, intensidad = signal.brightness
// - Iluminación física por segmento: normal de la onda vs dirección de la luz
//   → flancos que miran al foco = brillantes; flancos opuestos = en sombra.
// Paleta base: azul oscuro (pico bajo) → cian → blanco/amarillo (pico alto).

import { crestesParams as P } from "../ui/crestesControls.js";

// Convierte "#rrggbb" → [r, g, b]
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Color base del pico × factor de iluminación
function peakColorLit(v, alpha, lit) {
  const hue = 220 - v * 180;           // azul → amarillo
  const sat = 70 + v * 30;
  const lig = Math.min(96, (12 + v * 78) * lit);
  return `hsla(${hue},${sat}%,${lig}%,${alpha})`;
}

// Dibuja el cono de luz desde la esquina superior derecha
function drawBeam(ctx, W, H, intensity) {
  const [r, g, b] = hexToRgb(P.beamColor);
  const c = (a) => `rgba(${r},${g},${b},${a})`;

  ctx.save();

  // Cono externo amplio (penumbra)
  const g1 = ctx.createRadialGradient(W, 0, 0, W, 0, W * 1.5);
  g1.addColorStop(0,    c(intensity * 0.55));
  g1.addColorStop(0.35, c(intensity * 0.20));
  g1.addColorStop(1,    `rgba(0,0,0,0)`);
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(-W * 0.15, H * 0.90);
  ctx.lineTo(W * 0.25,  H * 1.05);
  ctx.closePath();
  ctx.fillStyle = g1;
  ctx.fill();

  // Núcleo del haz (más estrecho y brillante)
  const g2 = ctx.createRadialGradient(W, 0, 0, W, 0, W * 0.95);
  g2.addColorStop(0,    c(intensity * 0.90));
  g2.addColorStop(0.20, c(intensity * 0.45));
  g2.addColorStop(1,    `rgba(0,0,0,0)`);
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W * 0.10, H * 0.85);
  ctx.lineTo(W * 0.50,  H * 1.05);
  ctx.closePath();
  ctx.fillStyle = g2;
  ctx.fill();

  // Punto de origen — destello en la esquina
  const g3 = ctx.createRadialGradient(W, 0, 0, W, 0, W * 0.18);
  g3.addColorStop(0,   c(intensity * 0.95));
  g3.addColorStop(0.4, c(intensity * 0.40));
  g3.addColorStop(1,   `rgba(0,0,0,0)`);
  ctx.beginPath();
  ctx.arc(W, 0, W * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = g3;
  ctx.fill();

  ctx.restore();
}

export const crestesColorScene = {
  name: "Crestes Color",

  setup() {
    this.history = [];
    this.tick    = 0;
  },

  draw(ctx, signal, t) {
    const { width: W, height: H } = ctx.canvas;
    const brightness = signal.brightness ?? 0;

    // Capturar espectro
    this.tick = (this.tick + 1) % Math.round(P.speed);
    if (this.tick === 0 && signal.freq?.length > 0) {
      const snap = new Uint8Array(signal.freq.length);
      snap.set(signal.freq);
      this.history.unshift({ freq: snap });
      const maxLines = Math.round(P.lines);
      if (this.history.length > maxLines) this.history.length = maxLines;
    }

    // Fondo
    ctx.fillStyle = P.bgColor;
    ctx.fillRect(0, 0, W, H);

    // Haz de luz — se dibuja ANTES de las ondas para que éstas lo "recorten"
    const beamIntensity = 0.08 + brightness * 0.55;
    drawBeam(ctx, W, H, beamIntensity);

    const N = this.history.length;
    if (N < 2) return;

    const yTop    = H * 0.50;
    const yBottom = H * 0.92;
    const padTop  = W * 0.12;
    const padBot  = W * 0.04;
    const ampTop  = H * 0.42 * P.amp;
    const ampBot  = H * 0.018 * P.amp;

    const maxBin = Math.floor(
      this.history[0].freq.length * Math.min(0.9, Math.max(0.1, P.freqRange))
    );
    const STEPS = 180;

    for (let i = 0; i < N; i++) {
      const p       = i / (N - 1);
      const pCurved = Math.pow(p, 1.4);

      const y      = yTop    + pCurved * (yBottom - yTop);
      const pad    = padTop  + pCurved * (padBot  - padTop);
      const xL     = pad;
      const xR     = W - pad;
      const lineW  = xR - xL;
      const ampMax = ampTop  + pCurved * (ampBot  - ampTop);
      const alpha  = 0.85 - p * 0.70;
      const lw     = 1.4  - p * 1.0;

      const { freq } = this.history[i];
      const dx_seg = lineW / STEPS; // paso horizontal constante por línea

      const sample = (j) => {
        const binIdx = Math.round(Math.pow(maxBin, j / STEPS));
        return freq[Math.min(binIdx, freq.length - 1)] / 255;
      };

      // 1 · Relleno negro — máscara para el algoritmo del pintor
      ctx.beginPath();
      ctx.moveTo(xL, y);
      for (let j = 0; j <= STEPS; j++) {
        ctx.lineTo(xL + (j / STEPS) * lineW, y - sample(j) * ampMax);
      }
      ctx.lineTo(xR, y);
      ctx.closePath();
      ctx.fillStyle = P.bgColor;
      ctx.fill();

      // 2 · Trazo con color + iluminación por segmento
      ctx.lineWidth = lw;
      ctx.lineCap   = "round";

      let prevX = xL;
      let prevY = y - sample(0) * ampMax;

      for (let j = 1; j <= STEPS; j++) {
        const v  = sample(j);
        const x  = xL + (j / STEPS) * lineW;
        const py = y - v * ampMax;

        // Normal de la superficie: el tramo va de (prevX,prevY) a (x,py).
        // Tangente = (dx_seg, dy). Normal "hacia arriba" = (dy, -dx_seg).
        const dy   = py - prevY;
        const nLen = Math.sqrt(dy * dy + dx_seg * dx_seg) || 1;
        const nxn  = dy / nLen;       // componente x de la normal
        const nyn  = -dx_seg / nLen;  // componente y (negativo = apunta hacia arriba)

        // Vector desde el punto de la onda hasta el foco de luz (W, 0)
        const midX = (prevX + x) * 0.5;
        const midY = (prevY + py) * 0.5;
        const lx   = W - midX;
        const ly   = 0 - midY;
        const lLen = Math.sqrt(lx * lx + ly * ly) || 1;
        const lxn  = lx / lLen;
        const lyn  = ly / lLen;

        // Luz difusa: producto escalar normal · dirección de luz
        const diffuse = Math.max(0, nxn * lxn + nyn * lyn);

        // lit: 0.12 de luz ambiente + difusa escalada por brightness
        const lit = 0.12 + diffuse * (0.60 + brightness * 1.10);

        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, py);
        ctx.strokeStyle = peakColorLit(v, alpha, lit);
        ctx.stroke();

        prevX = x;
        prevY = py;
      }
    }
  },
};
