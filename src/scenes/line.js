// Escena: osciloscopio.
// Muestra la forma de onda del momento presente ocupando toda la pantalla.
// La onda se normaliza por su pico real para llenar siempre la altura disponible.

import { params } from "../ui/controls.js";

export const lineScene = {
  name: "Osciloscopio",

  setup(ctx) {
    this.bright = 0.4;
    this.smoothed = null;
    this.peakEnv = 1; // envolvente del pico (para escalar la onda)
  },

  draw(ctx, signal, t) {
    const { width: W, height: H } = ctx.canvas;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    const wave = signal.wave;
    const n = wave.length;
    if (!n) return;

    // suavizado temporal
    if (!this.smoothed) this.smoothed = new Float32Array(wave);
    for (let i = 0; i < n; i++) {
      this.smoothed[i] = this.smoothed[i] * params.smooth + wave[i] * (1 - params.smooth);
    }

    const s = this.smoothed;

    // pico real del buffer suavizado (normalización dinámica)
    let peak = 0.01;
    for (let i = 0; i < n; i++) {
      const v = Math.abs((s[i] / 128) - 1);
      if (v > peak) peak = v;
    }
    // envolvente: sube rápido, baja lento → la onda no colapsa en silencios
    this.peakEnv = Math.max(this.peakEnv * 0.97, peak);

    this.bright = this.bright * 0.9 + signal.brightness * 0.1;
    const shift = this.bright * params.colorShift;
    const sat = 45 + signal.volume * 20; // saturación baja: colores apagados
    const mid = H / 2;
    // margen vertical pequeño para que no toque el borde
    const amp = (H / 2 - 8) * params.gain / this.peakEnv;

    const xAt = (i) => (i / (n - 1)) * W;
    const yAt = (i) => mid - ((s[i] / 128) - 1) * amp;
    const localAmp = (i) => Math.abs((s[i] / 128) - 1) / this.peakEnv;
    const hueAt = (i) => `hsl(${((i / n) * params.span + shift + localAmp(i) * params.ampColor) % 360}, ${sat}%, 55%)`;

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    for (let i = 1; i < n - 1; i += 1) {
      const sx = (xAt(i - 1) + xAt(i)) / 2;
      const sy = (yAt(i - 1) + yAt(i)) / 2;
      const ex = (xAt(i) + xAt(i + 1)) / 2;
      const ey = (yAt(i) + yAt(i + 1)) / 2;

      ctx.strokeStyle = hueAt(i);
      ctx.lineWidth = 2 + signal.volume * params.thickness;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(xAt(i), yAt(i), ex, ey);
      ctx.stroke();
    }
  },
};
