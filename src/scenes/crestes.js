// Escena: Crestes — Joy Division "Unknown Pleasures" en movimiento.
// Cada línea = espectro de frecuencias en un instante del tiempo.
// X: graves (izquierda) → medios (centro) → agudos (derecha).
// Y de cada línea: energía en esa frecuencia.
// Las líneas nuevas aparecen abajo; las antiguas suben y se atenúan.
// El 50% superior de la pantalla queda negro.

import { crestesParams as P } from "../ui/crestesControls.js";

export const crestesScene = {
  name: "Crestes",

  setup() {
    this.history = [];
    this.tick    = 0;
  },

  draw(ctx, signal, t) {
    const { width: W, height: H } = ctx.canvas;

    // Capturar espectro según velocidad elegida
    this.tick = (this.tick + 1) % Math.round(P.speed);
    if (this.tick === 0 && signal.freq && signal.freq.length > 0) {
      const snap = new Uint8Array(signal.freq.length);
      snap.set(signal.freq);
      this.history.unshift(snap);
      const maxLines = Math.round(P.lines);
      if (this.history.length > maxLines) this.history.length = maxLines;
    }

    // Fondo negro total
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const N = this.history.length;
    if (N < 2) return;

    // Zona de líneas: 50%–92% de la pantalla
    // Nuevas arriba (horizonte, picos grandes) → antiguas abajo (orilla, picos planos)
    const yTop    = H * 0.50;   // línea más nueva — horizonte
    const yBottom = H * 0.92;   // línea más vieja — orilla
    const padTop  = W * 0.12;   // margen lateral arriba (ligeramente más estrecho)
    const padBot  = W * 0.04;   // margen lateral abajo (más ancho, más cerca)
    const ampTop  = H * 0.42 * P.amp;   // picos grandes en el horizonte
    const ampBot  = H * 0.018 * P.amp;  // picos casi planos en la orilla

    const maxBin = Math.floor(this.history[0].length * Math.min(0.9, Math.max(0.1, P.freqRange)));
    const STEPS  = 220;

    // Dibujar de arriba hacia abajo:
    // la nueva (arriba, grande) se dibuja primero; las planas de abajo
    // se dibujan encima pero son tan bajas que no tapan los picos del horizonte.
    for (let i = 0; i < N; i++) {
      // p: 0 = más nueva (arriba/horizonte), 1 = más vieja (abajo/orilla)
      const p = i / (N - 1);

      // Perspectiva no lineal: más compresión cerca de la orilla
      const pCurved = Math.pow(p, 1.4);

      const y      = yTop    + pCurved * (yBottom - yTop);
      const pad    = padTop  + pCurved * (padBot  - padTop);
      const xL     = pad;
      const xR     = W - pad;
      const lineW  = xR - xL;
      const ampMax = ampTop  + pCurved * (ampBot  - ampTop);
      const alpha  = 0.85 - p * 0.70;   // brillante arriba, tenue abajo
      const lw     = 1.4  - p * 1.0;    // gruesa arriba, finísima abajo

      const freq = this.history[i];

      // Muestreo en escala logarítmica (más espacio visual para graves)
      const sample = (j) => {
        const logT   = j / STEPS;
        const binIdx = Math.round(Math.pow(maxBin, logT));
        return freq[Math.min(binIdx, freq.length - 1)] / 255;
      };

      // 1 · Relleno negro — oculta líneas más antiguas que quedan detrás
      ctx.beginPath();
      ctx.moveTo(xL, y);
      for (let j = 0; j <= STEPS; j++) {
        ctx.lineTo(xL + (j / STEPS) * lineW, y - sample(j) * ampMax);
      }
      ctx.lineTo(xR, y);
      ctx.closePath();
      ctx.fillStyle = "#000";
      ctx.fill();

      // 2 · Trazo blanco — los picos
      ctx.beginPath();
      ctx.moveTo(xL, y);
      for (let j = 0; j <= STEPS; j++) {
        ctx.lineTo(xL + (j / STEPS) * lineW, y - sample(j) * ampMax);
      }
      ctx.lineTo(xR, y);
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth   = lw;
      ctx.lineJoin    = "round";
      ctx.stroke();
    }
  },
};
