// Escena: Atardecer
// Muestra una fotografía de fondo con ondas de luz animadas sobre el mar.
//
// OPCIÓN A (activa): ondas superpuestas sobre la región del mar.
// OPCIÓN C (preparada): descomentar MASK_SRC y añadir la imagen de máscara en public/.
//   La máscara es una imagen en blanco y negro — blanco = mar, negro = resto.
//   Crear en Photoshop/Procreate pintando de blanco solo el agua.

const IMG_SRC  = "/atardecer.jpg";   // ← pon la foto en public/atardecer.jpg
const MASK_SRC = null;               // ← Opción C: "/atardecer-mask.png"

// Zona del mar en la foto original (porcentaje de altura 0-1).
// Ajusta estos valores si la imagen cambia.
const SEA_TOP    = 0.40;
const SEA_BOTTOM = 0.62;

export const atardecerScene = {
  name: "Atardecer",

  setup() {
    this.img      = null;
    this.maskData = null;   // para Opción C
    this.maskW    = 0;
    this.maskH    = 0;

    this.beatEnv = 0;
    this.bassS   = 0;
    this.midS    = 0;
    this.volS    = 0;

    // Cargar imagen principal
    const img = new Image();
    img.src = IMG_SRC;
    img.onload = () => { this.img = img; };

    // Cargar máscara (Opción C) — solo si está definida
    if (MASK_SRC) {
      const mImg = new Image();
      mImg.src = MASK_SRC;
      mImg.onload = () => {
        const mc   = document.createElement("canvas");
        mc.width   = mImg.width;
        mc.height  = mImg.height;
        const mctx = mc.getContext("2d");
        mctx.drawImage(mImg, 0, 0);
        this.maskData = mctx.getImageData(0, 0, mImg.width, mImg.height).data;
        this.maskW    = mImg.width;
        this.maskH    = mImg.height;
      };
    }
  },

  draw(ctx, signal, t) {
    const { width: W, height: H } = ctx.canvas;

    this.bassS = this.bassS * 0.84 + signal.bass   * 0.16;
    this.midS  = this.midS  * 0.84 + signal.mid    * 0.16;
    this.volS  = this.volS  * 0.92 + signal.volume * 0.08;

    if (signal.beat) this.beatEnv = 1.0;
    this.beatEnv *= 0.85;

    // Fondo negro mientras carga
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, W, H);
    if (!this.img) return;

    // Dibujar imagen en modo "cover" (sin distorsión, cubre toda la pantalla)
    const iw = this.img.width, ih = this.img.height;
    const scale = Math.max(W / iw, H / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (W - dw) / 2, dy = (H - dh) / 2;
    ctx.drawImage(this.img, dx, dy, dw, dh);

    // Coordenadas del mar en el canvas
    const seaTop    = dy + dh * SEA_TOP;
    const seaBottom = dy + dh * SEA_BOTTOM;

    if (this.maskData) {
      // OPCIÓN C — animación por máscara (pixel-accurate)
      this._drawWithMask(ctx, signal, t, W, H, dx, dy, dw, dh);
    } else {
      // OPCIÓN A — ondas de luz superpuestas
      this._drawOverlayWaves(ctx, t, W, seaTop, seaBottom);
    }

    // BEAT — destello cálido sobre el mar
    if (this.beatEnv > 0.02) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, seaTop, W, seaBottom - seaTop);
      ctx.clip();
      const g = ctx.createLinearGradient(0, seaTop, 0, seaBottom);
      g.addColorStop(0, `rgba(255, 220, 140, ${this.beatEnv * 0.55})`);
      g.addColorStop(1, `rgba(255, 160,  80, ${this.beatEnv * 0.30})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, seaTop, W, seaBottom - seaTop);
      ctx.restore();
    }
  },

  // OPCIÓN A: líneas de luz ondulantes sobre la región del mar
  _drawOverlayWaves(ctx, t, W, seaTop, seaBottom) {
    const seaH   = seaBottom - seaTop;
    const bassAmp = 4 + this.bassS * 22;   // altura de la ola en px
    const numLines = 6;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, seaTop, W, seaH);
    ctx.clip();

    for (let i = 0; i < numLines; i++) {
      const p      = i / (numLines - 1);            // 0 (arriba del mar) → 1 (abajo)
      const y0     = seaTop + seaH * (0.08 + p * 0.82);
      const freq   = 1.8 + i * 1.1;                 // ondas más densas hacia abajo
      const speed  = 0.35 + i * 0.12;
      const alpha  = (0.06 + this.volS * 0.20) * (1 - p * 0.4);
      const lw     = 1.2 + this.bassS * 3.5 * (1 - p * 0.5);

      // paleta cálida que recoge los rosas/dorados de la foto
      const r = Math.round(255);
      const g = Math.round(160 + p * 50);
      const b = Math.round(80  + p * 60);

      ctx.strokeStyle = `rgba(${r},${g},${b}, ${alpha})`;
      ctx.lineWidth   = lw;
      ctx.shadowColor = `rgba(${r},${g},${b}, ${alpha * 0.7})`;
      ctx.shadowBlur  = 10 + this.bassS * 14;
      ctx.lineCap     = "round";

      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const xn = x / W;
        // dos senos a frecuencias ligeramente distintas → movimiento más orgánico
        const y = y0
          + Math.sin(xn * Math.PI * 2 * freq        + t * speed)        * bassAmp
          + Math.sin(xn * Math.PI * 2 * freq * 1.7  + t * speed * 0.6)  * bassAmp * 0.3;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  },

  // OPCIÓN C: desplazamiento por máscara (pendiente de imagen de máscara)
  // Para activar: añade la máscara en public/atardecer-mask.png y define MASK_SRC arriba.
  _drawWithMask(ctx, signal, t, W, H, dx, dy, dw, dh) {
    // TODO: implementar cuando la máscara esté disponible.
    // La lógica será: para cada fila Y del canvas, calcular qué % de píxeles
    // en esa fila son "mar" según la máscara, y desplazar esa fila horizontalmente
    // por sin(Y * freq + t * speed) * bass * intensidad.
    // Por ahora cae a Opción A:
    const seaTop    = dy + dh * SEA_TOP;
    const seaBottom = dy + dh * SEA_BOTTOM;
    this._drawOverlayWaves(ctx, t, W, seaTop, seaBottom);
  },
};
