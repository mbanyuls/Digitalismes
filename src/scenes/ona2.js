// Escena: Ona 2
// Misma onda compuesta sinuosa que Ona (bass+mid+treble) pero sin desplazamiento lateral.
// El "t * velocidad" de Ona ha sido eliminado → la onda está anclada en el centro.
// La forma cambia con el sonido (amplitudes suben y bajan) sin ir a ningún lado.

export const ona2Scene = {
  name: "Ona 2",

  setup() {
    this.beatEnv = 0;
    this.pitchS  = 0.5;
    this.ampS    = 0;
    this.volS    = 0;
    this.bassS   = 0;
    this.midS    = 0;
    this.trebleS = 0;
  },

  draw(ctx, signal, t) {
    const { width: W, height: H } = ctx.canvas;

    this.volS    = this.volS    * 0.92 + signal.volume  * 0.08;
    this.ampS    = this.ampS    * 0.88 + signal.volume  * 0.12;
    this.bassS   = this.bassS   * 0.84 + signal.bass    * 0.16;
    this.midS    = this.midS    * 0.84 + signal.mid     * 0.16;
    this.trebleS = this.trebleS * 0.84 + signal.treble  * 0.16;

    const pn = signal.pitch > 0
      ? Math.min(1, (Math.log2(signal.pitch) - Math.log2(60)) / (Math.log2(1200) - Math.log2(60)))
      : this.pitchS;
    this.pitchS = this.pitchS * 0.97 + pn * 0.03;

    if (signal.beat) this.beatEnv = 1.0;
    this.beatEnv *= 0.86;

    const hue  = this.pitchS * 260;
    const wHue = (hue + 40) % 360;

    // 1 · FONDO NEGRO BASE
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // 2 · CAPA DE COLOR — pitch → tono, amplitud → opacidad
    ctx.fillStyle = `hsla(${hue}, 78%, 32%, ${0.06 + this.ampS * 0.82})`;
    ctx.fillRect(0, 0, W, H);

    // 3 · ONDA COMPUESTA — mismas frecuencias que Ona, sin componente de viaje
    // La onda ocupa el 60% central de la pantalla (igual que en Ona pero anclada)
    const x0 = W * 0.20;
    const x1 = W * 0.80;
    const drawW = x1 - x0;
    const cy = H / 2;

    const bassAmp = this.bassS   * H * 0.32;
    const midAmp  = this.midS    * H * 0.14;
    const trbAmp  = this.trebleS * H * 0.06;
    const lw      = 1.5 + this.volS * 11;

    // Sin "+ t * velocidad" → la onda no viaja; su forma respira con la música
    const waveY = (xn) =>
      cy
      - bassAmp * Math.sin(xn * Math.PI * 2 * 2.2)
      - midAmp  * Math.sin(xn * Math.PI * 2 * 7.0  + 1.1)
      - trbAmp  * Math.sin(xn * Math.PI * 2 * 22.0 + 2.3);

    const drawWave = (width, alpha) => {
      ctx.strokeStyle = `hsla(${wHue}, 88%, 68%, ${alpha})`;
      ctx.lineWidth   = width;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.beginPath();
      for (let i = 0; i <= drawW; i++) {
        const x = x0 + i;
        const y = waveY(i / drawW);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    drawWave(lw * 5, 0.07);
    drawWave(lw * 2, 0.25);
    drawWave(lw,     0.92);

    // 4 · DESTELLO DE BEAT
    if (this.beatEnv > 0.02) {
      const flash = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.78);
      flash.addColorStop(0,    `rgba(255,255,255, ${this.beatEnv * 0.92})`);
      flash.addColorStop(0.12, `hsla(${wHue}, 100%, 82%, ${this.beatEnv * 0.70})`);
      flash.addColorStop(0.40, `hsla(${wHue}, 90%,  55%, ${this.beatEnv * 0.28})`);
      flash.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = flash;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = `rgba(255,255,255, ${this.beatEnv * 0.85})`;
      ctx.lineWidth   = lw * 1.6;
      ctx.beginPath();
      for (let i = 0; i <= drawW; i++) {
        const x = x0 + i;
        const y = waveY(i / drawW);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  },
};
