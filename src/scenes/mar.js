// Escena: Mar
// Fotografía real con agua animada mediante desplazamiento de franjas (wave warp).
// El cielo se queda estático. El agua (50% inferior) se desplaza fila a fila
// siguiendo una onda que viaja de arriba a abajo → el ojo lo lee como movimiento
// diagonal de olas de izquierda a derecha, igual que en la foto real.
//
// OPCIÓN C (futura): añadir public/mar-mask.png (blanco=agua, negro=resto)
// y definir MASK_SRC para desplazamiento pixel-accurate.

const IMG_SRC  = "/mar.jpg";
const MASK_SRC = null;       // Opción C: "/mar-mask.png"

// Frontera cielo/agua en la imagen (porcentaje de altura, 0=arriba, 1=abajo).
// Con tu foto el 50% inferior es agua:
const WATER_START = 0.50;

// Altura de cada franja en px. Más fino = más suave pero más lento.
// 3px es un buen equilibrio para 1080p.
const STRIP_H = 3;

export const marScene = {
  name: "Mar",

  setup() {
    this.img     = null;
    this.beatEnv = 0;
    this.bassS   = 0;
    this.midS    = 0;
    this.trebleS = 0;
    this.volS    = 0;

    const img = new Image();
    img.src = IMG_SRC;
    img.onload = () => { this.img = img; };
  },

  draw(ctx, signal, t) {
    const { width: W, height: H } = ctx.canvas;

    this.bassS   = this.bassS   * 0.84 + signal.bass   * 0.16;
    this.midS    = this.midS    * 0.84 + signal.mid    * 0.16;
    this.trebleS = this.trebleS * 0.84 + signal.treble * 0.16;
    this.volS    = this.volS    * 0.92 + signal.volume * 0.08;

    if (signal.beat) this.beatEnv = 1.0;
    this.beatEnv *= 0.84;

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, W, H);
    if (!this.img) return;

    // Escalar imagen en modo "cover"
    const iw = this.img.width, ih = this.img.height;
    const scale = Math.max(W / iw, H / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (W - dw) / 2, dy = (H - dh) / 2;

    // 1 · CIELO — dibujado sin tocar
    const waterCanvasY = dy + dh * WATER_START;
    const skyH = Math.max(0, waterCanvasY);
    if (skyH > 0) {
      ctx.drawImage(
        this.img,
        0, 0, iw, ih * WATER_START,           // fuente: mitad superior
        dx, dy, dw, dh * WATER_START           // destino: mismo trozo
      );
    }

    // 2 · AGUA — franja a franja con desplazamiento horizontal
    // Cada franja viaja con una fase distinta → el patrón de cresta viaja
    // de arriba a abajo → el ojo lo lee como ola diagonal izq→der.
    //
    // Amplitudes de desplazamiento horizontal y vertical por banda
    const ampBassH   = 6  + this.bassS   * 28;
    const ampMidH    = 3  + this.midS    * 12;
    const ampTrebleH = 1.5 + this.trebleS * 6;

    const ampBassV   = 2  + this.bassS   * 10;  // componente vertical
    const ampMidV    = 1  + this.midS    * 5;

    const waterCanvasH = H - waterCanvasY;
    const numStrips = Math.ceil(waterCanvasH / STRIP_H);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, waterCanvasY, W, waterCanvasH);
    ctx.clip();

    for (let s = 0; s < numStrips; s++) {
      // p: 0 = horizonte (arriba del agua), 1 = primer plano (abajo del agua)
      const p = s / numStrips;
      const energyP = 0.4 + p * 0.6;  // más movimiento cerca de la orilla

      // Desplazamiento HORIZONTAL — olas que viajan hacia abajo (ojo lo lee como diagonal)
      const offsetX =
        Math.sin(p * 5.5  - t * 1.10) * ampBassH   * energyP +
        Math.sin(p * 11.0 - t * 1.75) * ampMidH    * energyP +
        Math.sin(p * 20.0 - t * 2.60) * ampTrebleH * energyP;

      // Desplazamiento VERTICAL — qué fila de la imagen fuente leemos
      // Crea ondulación real: las filas se "comprimen" y "estiran" con la ola
      const offsetVpx =
        Math.sin(p * 3.5  - t * 0.90) * ampBassV  * energyP +
        Math.sin(p * 7.0  - t * 1.40) * ampMidV   * energyP;

      // Coordenadas en el canvas
      const destY = waterCanvasY + s * STRIP_H;
      const destH = Math.min(STRIP_H, H - destY);

      // Coordenadas en la imagen original (con offset vertical aplicado al source)
      const imgFrac = WATER_START + (s / numStrips) * (1 - WATER_START);
      const srcY    = Math.max(ih * WATER_START,
                      Math.min(ih * 0.99,
                        imgFrac * ih + (offsetVpx / dh) * ih
                      ));
      const srcH    = Math.max(0.5, (STRIP_H / dh) * ih);

      ctx.drawImage(
        this.img,
        0, srcY, iw, srcH,
        dx + offsetX, destY, dw, destH
      );
    }

    ctx.restore();
  },
};
