// Escena: propagación de onda en medio inhomogéneo.
//
// Física:
//   v(x) = 1 / (1 + k·x)          — velocidad decrece con x
//   λ(x) = v(x) / f                — longitud de onda se comprime
//   A(x) = A₀ · √(1+k·x) · e^-αx  — amplitud sube (energía) luego se disipa
//
// Melodía:
//   signal.pitch (Hz) → posición vertical del centro de la onda
//   signal.pitch (Hz) → nota musical (0–11) → color base
//
// Beat:
//   signal.beat → dispara un pulso de amplitud con ataque rápido y decaimiento suave

import { params } from "../ui/controls.js";

const STEPS = 600;
const LOG_LOW  = Math.log2(60);    // Do2 ≈ 65Hz, nota más grave que buscamos
const LOG_HIGH = Math.log2(1200);  // Re6 ≈ 1175Hz, nota más aguda

export const waveScene = {
  name: "Onda en medio inhomogéneo",

  setup(ctx) {
    this.fSmooth    = 0.8;
    this.kSmooth    = 2.0;
    this.pitchY     = 0;     // posición vertical suavizada
    this.noteHue    = 0;     // color de nota suavizado
    this.beatEnv    = 0;     // envolvente del beat (0–1)
  },

  draw(ctx, signal, t) {
    const { width: W, height: H } = ctx.canvas;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // --- beat: ataque instantáneo, decaimiento suave ---
    if (signal.beat) this.beatEnv = 1.0;
    this.beatEnv *= 0.88; // decae en ~15 frames

    // --- parámetros de onda ---
    const fTarget = 1.2 + signal.bass * 1.5; // menos ciclos en pantalla
    const kTarget = 1.0 + signal.treble * 5.0;
    this.fSmooth = this.fSmooth * 0.96 + fTarget * 0.04;
    this.kSmooth = this.kSmooth * 0.96 + kTarget * 0.04;

    const f    = this.fSmooth;
    const k    = this.kSmooth;
    const damp = 2.8 + (1 - signal.volume) * 1.5;

    // amplitud base: volumen + bajos + pulso de beat
    const beatBoost = this.beatEnv * 0.6;
    // densidad espectral controla la amplitud: mezcla densa = onda más alta
    const A0 = H * 0.12 * Math.min(2,
      (0.15 + (signal.density + signal.bass * 0.8 + beatBoost) * params.gain)
    );

    // --- pitch → posición vertical (escala logarítmica, como el oído) ---
    if (signal.pitch > 0) {
      const norm = (Math.log2(signal.pitch) - LOG_LOW) / (LOG_HIGH - LOG_LOW);
      const target = (0.5 - Math.min(1, Math.max(0, norm))) * H * 0.55;
      // sube rápido (nota nueva), baja lento (sustain)
      this.pitchY = this.pitchY * 0.92 + target * 0.08;
    }
    const mid = H / 2 + this.pitchY;

    // --- pitch → color de nota (círculo cromático: 12 notas × 30° = 360°) ---
    if (signal.pitch > 0) {
      const semitone = Math.round(12 * Math.log2(signal.pitch / 440));
      const note = ((semitone % 12) + 12) % 12; // 0=Do, 1=Do#… 11=Si
      const targetHue = note * 30;              // cada nota tiene 30° de arco iris
      // interpolación corta: busca el camino más corto en la rueda de color
      let diff = targetHue - this.noteHue;
      if (diff > 180)  diff -= 360;
      if (diff < -180) diff += 360;
      this.noteHue = (this.noteHue + diff * 0.06 + 360) % 360;
    }

    const sat = 45 + signal.volume * 20 + this.beatEnv * 20; // beat satura el color

    ctx.lineWidth = 1.5 + signal.volume * params.thickness;
    ctx.lineJoin  = "round";
    ctx.lineCap   = "round";

    let prevX = 0;
    let prevY = mid;

    for (let i = 0; i <= STEPS; i++) {
      const xn = i / STEPS;
      const x  = xn * W;

      const speed  = 1 / (1 + k * xn);
      const phaseX = 2 * Math.PI * f * (xn + k * xn * xn / 2);
      const phaseT = 2 * Math.PI * f * t;
      const phase  = phaseX - phaseT;

      const growth = Math.sqrt(1 + k * xn);
      const dissip = Math.exp(-damp * xn);
      const amp    = A0 * growth * dissip;

      const y = mid - amp * Math.sin(phase);

      // color: nota musical (base) + posición en la onda (spread pequeño)
      const spread = (1 - speed) * 40; // los picos comprimidos añaden matiz
      const hue = (this.noteHue + spread + 360) % 360;

      if (i > 0) {
        ctx.strokeStyle = `hsl(${hue}, ${sat}%, 52%)`;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      prevX = x;
      prevY = y;
    }
  },
};
